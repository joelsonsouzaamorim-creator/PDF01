<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("GET");
gopdf_same_origin_check();
$adminUser = gopdf_require_admin();

$rangeDays = (int) ($_GET["rangeDays"] ?? 30);
if ($rangeDays < 1) {
    $rangeDays = 1;
}
if ($rangeDays > 90) {
    $rangeDays = 90;
}

$limit = (int) ($_GET["limit"] ?? 80);
if ($limit < 10) {
    $limit = 10;
}
if ($limit > 200) {
    $limit = 200;
}

$rangeStart = (new DateTimeImmutable("now"))->modify("-{$rangeDays} days")->format("Y-m-d H:i:s");
$pdo = gopdf_db();
$billingTracking = gopdf_sync_pending_subscriptions_from_asaas(25);

$roleExpr = "LOWER(TRIM(COALESCE(u.role, '')))";
$statusExpr = "LOWER(TRIM(COALESCE(s.status, '')))";
$trialEndsExpr = "STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(s.metadata_json, '$.trial_ends_at')), '%Y-%m-%d %H:%i:%s')";
$activeSubscriptionExpr = "({$statusExpr} = 'active' AND (JSON_EXTRACT(s.metadata_json, '$.trial_ends_at') IS NULL OR {$trialEndsExpr} IS NULL OR {$trialEndsExpr} >= NOW()))";

$latestSubscriptionJoin = "
LEFT JOIN (
    SELECT s1.user_id, s1.id, s1.plan_code, s1.cycle, s1.amount_cents, s1.currency, s1.payment_method,
           s1.status, s1.metadata_json, s1.activated_at, s1.created_at, s1.updated_at, s1.invoice_url
    FROM subscriptions s1
    INNER JOIN (
        SELECT user_id, MAX(id) AS max_id
        FROM subscriptions
        GROUP BY user_id
    ) latest ON latest.user_id = s1.user_id AND latest.max_id = s1.id
) s ON s.user_id = u.id";

$userStatsSql = "SELECT
    COUNT(*) AS total_users,
    SUM(CASE WHEN {$roleExpr} IN ('admin', 'administrator', 'administrador') THEN 1 ELSE 0 END) AS total_admins,
    SUM(CASE WHEN {$roleExpr} NOT IN ('admin', 'administrator', 'administrador') AND {$activeSubscriptionExpr} THEN 1 ELSE 0 END) AS total_premium,
    SUM(CASE WHEN {$roleExpr} NOT IN ('admin', 'administrator', 'administrador') AND NOT {$activeSubscriptionExpr} THEN 1 ELSE 0 END) AS total_free
FROM users u
{$latestSubscriptionJoin}";
$userStatsStmt = $pdo->query($userStatsSql);
$userStatsRow = $userStatsStmt ? ($userStatsStmt->fetch() ?: []) : [];

$accessSummaryStmt = $pdo->prepare(
    "SELECT
        COUNT(*) AS total_events,
        SUM(CASE WHEN action IN ('auth.login', 'auth.oauth.login') AND status = 'success' THEN 1 ELSE 0 END) AS login_success,
        SUM(CASE WHEN action IN ('auth.login', 'auth.oauth.login') AND status IN ('denied', 'error') THEN 1 ELSE 0 END) AS login_denied,
        SUM(CASE WHEN action IN ('auth.register', 'auth.oauth.register') AND status = 'success' THEN 1 ELSE 0 END) AS register_events
     FROM audit_logs
     WHERE created_at >= :range_start"
);
$accessSummaryStmt->execute([
    "range_start" => $rangeStart,
]);
$accessSummary = $accessSummaryStmt->fetch() ?: [];

$accessEventsStmt = $pdo->prepare(
    "SELECT
        l.id,
        l.user_id,
        l.action,
        l.status,
        l.ip_address,
        l.created_at,
        u.full_name,
        u.email
     FROM audit_logs l
     LEFT JOIN users u ON u.id = l.user_id
     WHERE l.created_at >= :range_start
       AND l.action IN ('auth.login', 'auth.logout', 'auth.register', 'auth.oauth.login', 'auth.oauth.register', 'auth.profile.update')
     ORDER BY l.id DESC
     LIMIT :limit"
);
$accessEventsStmt->bindValue(":range_start", $rangeStart, PDO::PARAM_STR);
$accessEventsStmt->bindValue(":limit", $limit, PDO::PARAM_INT);
$accessEventsStmt->execute();
$accessEventsRows = $accessEventsStmt->fetchAll();

$trialExpr = "(LOWER(TRIM(COALESCE(s.payment_method, ''))) = 'trial'
    OR LOWER(TRIM(COALESCE(s.cycle, ''))) = 'trial'
    OR LOWER(TRIM(COALESCE(s.plan_code, ''))) LIKE '%trial%')";
$billingSummarySql = "SELECT
    COUNT(*) AS total_subscriptions,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'active' THEN 1 ELSE 0 END) AS active_subscriptions,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'pending' THEN 1 ELSE 0 END) AS pending_subscriptions,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'active' AND {$trialExpr} THEN 1 ELSE 0 END) AS active_trials,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(s.status, ''))) = 'active' AND NOT {$trialExpr} THEN s.amount_cents ELSE 0 END) AS active_revenue_cents
FROM subscriptions s";
$billingSummaryStmt = $pdo->query($billingSummarySql);
$billingSummaryRow = $billingSummaryStmt ? ($billingSummaryStmt->fetch() ?: []) : [];

$billingEntriesStmt = $pdo->prepare(
    "SELECT
        s.id,
        s.user_id,
        s.plan_code,
        s.cycle,
        s.amount_cents,
        s.currency,
        s.payment_method,
        s.status,
        s.invoice_url,
        s.metadata_json,
        s.created_at,
        s.updated_at,
        s.activated_at,
        u.full_name,
        u.email
     FROM subscriptions s
     LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.id DESC
     LIMIT :limit"
);
$billingEntriesStmt->bindValue(":limit", $limit, PDO::PARAM_INT);
$billingEntriesStmt->execute();
$billingRows = $billingEntriesStmt->fetchAll();

$accessEvents = [];
foreach ($accessEventsRows as $row) {
    $accessEvents[] = [
        "id" => (int) ($row["id"] ?? 0),
        "userId" => $row["user_id"] !== null ? (int) $row["user_id"] : null,
        "fullName" => (string) ($row["full_name"] ?? ""),
        "email" => (string) ($row["email"] ?? ""),
        "action" => (string) ($row["action"] ?? ""),
        "status" => strtolower(trim((string) ($row["status"] ?? ""))),
        "ipAddress" => (string) ($row["ip_address"] ?? ""),
        "createdAt" => $row["created_at"],
    ];
}

$billingEntries = [];
foreach ($billingRows as $row) {
    $metadata = gopdf_subscription_metadata([
        "metadata_json" => $row["metadata_json"] ?? null,
    ]);
    $manualRaw = $metadata["manual_validation"] ?? null;
    $manualValidation = null;

    if (is_array($manualRaw)) {
        $proofFileRaw = $manualRaw["proofFile"] ?? null;
        if (!is_array($proofFileRaw)) {
            $proofFileRaw = [];
        }

        $proofPath = trim((string) ($proofFileRaw["path"] ?? ""));
        $proofUrl = trim((string) ($proofFileRaw["url"] ?? ""));
        if ($proofUrl === "" && $proofPath !== "") {
            $proofUrl = gopdf_app_url_for_path($proofPath);
        }

        $manualValidation = [
            "isManual" => true,
            "status" => strtolower(trim((string) ($manualRaw["status"] ?? ""))),
            "validatedAt" => (string) ($manualRaw["validatedAt"] ?? ""),
            "adminUserId" => isset($manualRaw["adminUserId"]) ? (int) $manualRaw["adminUserId"] : null,
            "adminUserName" => (string) ($manualRaw["adminUserName"] ?? ""),
            "targetUserId" => isset($manualRaw["targetUserId"]) ? (int) $manualRaw["targetUserId"] : null,
            "targetUserName" => (string) ($manualRaw["targetUserName"] ?? ""),
            "proofNote" => (string) ($manualRaw["proofNote"] ?? ""),
            "transactionId" => (string) ($manualRaw["transactionId"] ?? ""),
            "paidAt" => (string) ($manualRaw["paidAt"] ?? ""),
            "paidAmountCents" => isset($manualRaw["paidAmountCents"]) ? (int) $manualRaw["paidAmountCents"] : null,
            "proofFile" => [
                "path" => $proofPath,
                "url" => $proofUrl,
                "originalName" => (string) ($proofFileRaw["originalName"] ?? ""),
                "mimeType" => (string) ($proofFileRaw["mimeType"] ?? ""),
                "sizeBytes" => isset($proofFileRaw["sizeBytes"]) ? (int) $proofFileRaw["sizeBytes"] : null,
            ],
        ];
    }

    $trial = gopdf_subscription_trial_info([
        "payment_method" => (string) ($row["payment_method"] ?? ""),
        "cycle" => (string) ($row["cycle"] ?? ""),
        "plan_code" => (string) ($row["plan_code"] ?? ""),
        "metadata_json" => $row["metadata_json"] ?? null,
        "status" => strtolower(trim((string) ($row["status"] ?? ""))),
    ]);

    $billingEntries[] = [
        "id" => (int) ($row["id"] ?? 0),
        "userId" => (int) ($row["user_id"] ?? 0),
        "fullName" => (string) ($row["full_name"] ?? ""),
        "email" => (string) ($row["email"] ?? ""),
        "planCode" => (string) ($row["plan_code"] ?? ""),
        "cycle" => (string) ($row["cycle"] ?? ""),
        "amountCents" => (int) ($row["amount_cents"] ?? 0),
        "currency" => (string) ($row["currency"] ?? "BRL"),
        "paymentMethod" => (string) ($row["payment_method"] ?? ""),
        "status" => strtolower(trim((string) ($row["status"] ?? ""))),
        "invoiceUrl" => (string) ($row["invoice_url"] ?? ""),
        "createdAt" => $row["created_at"],
        "updatedAt" => $row["updated_at"],
        "activatedAt" => $row["activated_at"],
        "manualValidation" => $manualValidation,
        "trial" => $trial,
    ];
}

gopdf_audit("admin.dashboard.read", "success", (int) ($adminUser["id"] ?? 0), [
    "rangeDays" => $rangeDays,
    "limit" => $limit,
]);

gopdf_ok([
    "rangeDays" => $rangeDays,
    "generatedAt" => date(DATE_ATOM),
    "userStats" => [
        "totalUsers" => (int) ($userStatsRow["total_users"] ?? 0),
        "totalAdmins" => (int) ($userStatsRow["total_admins"] ?? 0),
        "totalPremium" => (int) ($userStatsRow["total_premium"] ?? 0),
        "totalFree" => (int) ($userStatsRow["total_free"] ?? 0),
    ],
    "accessFlow" => [
        "summary" => [
            "totalEvents" => (int) ($accessSummary["total_events"] ?? 0),
            "loginSuccess" => (int) ($accessSummary["login_success"] ?? 0),
            "loginDenied" => (int) ($accessSummary["login_denied"] ?? 0),
            "registerEvents" => (int) ($accessSummary["register_events"] ?? 0),
        ],
        "events" => $accessEvents,
    ],
    "billing" => [
        "summary" => [
            "totalSubscriptions" => (int) ($billingSummaryRow["total_subscriptions"] ?? 0),
            "activeSubscriptions" => (int) ($billingSummaryRow["active_subscriptions"] ?? 0),
            "pendingSubscriptions" => (int) ($billingSummaryRow["pending_subscriptions"] ?? 0),
            "activeTrials" => (int) ($billingSummaryRow["active_trials"] ?? 0),
            "activeRevenueCents" => (int) ($billingSummaryRow["active_revenue_cents"] ?? 0),
        ],
        "tracking" => $billingTracking,
        "entries" => $billingEntries,
    ],
]);
