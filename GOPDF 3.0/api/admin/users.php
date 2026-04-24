<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("GET");
gopdf_same_origin_check();
$adminUser = gopdf_require_admin();

$profile = strtolower(trim((string) ($_GET["profile"] ?? "all")));
$allowedProfiles = ["all", "administrador", "premium", "gratuito"];
if (!in_array($profile, $allowedProfiles, true)) {
    gopdf_fail("Perfil invalido. Use: administrador, premium, gratuito ou all.", 422);
}

$page = max(1, (int) ($_GET["page"] ?? 1));
$limit = (int) ($_GET["limit"] ?? 50);
if ($limit < 1) {
    $limit = 1;
}
if ($limit > 200) {
    $limit = 200;
}
$offset = ($page - 1) * $limit;

$search = mb_substr(trim((string) ($_GET["q"] ?? "")), 0, 120);

$roleExpr = "LOWER(TRIM(COALESCE(u.role, '')))";
$statusExpr = "LOWER(TRIM(COALESCE(s.status, '')))";
$trialEndsExpr = "STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(s.metadata_json, '$.trial_ends_at')), '%Y-%m-%d %H:%i:%s')";
$activeSubscriptionExpr = "({$statusExpr} = 'active' AND (JSON_EXTRACT(s.metadata_json, '$.trial_ends_at') IS NULL OR {$trialEndsExpr} IS NULL OR {$trialEndsExpr} >= NOW()))";
$where = "1=1";
$params = [];

switch ($profile) {
    case "administrador":
        $where .= " AND {$roleExpr} IN ('admin', 'administrator', 'administrador')";
        break;

    case "premium":
        $where .= " AND {$roleExpr} NOT IN ('admin', 'administrator', 'administrador')
                    AND {$activeSubscriptionExpr}";
        break;

    case "gratuito":
        $where .= " AND {$roleExpr} NOT IN ('admin', 'administrator', 'administrador')
                    AND NOT {$activeSubscriptionExpr}";
        break;
}

if ($search !== "") {
    $where .= " AND (u.full_name LIKE :search OR u.email LIKE :search OR u.phone LIKE :search)";
    $params["search"] = "%" . $search . "%";
}

$latestSubscriptionJoin = "
LEFT JOIN (
    SELECT s1.user_id, s1.id, s1.plan_code, s1.cycle, s1.amount_cents, s1.currency, s1.payment_method,
           s1.status, s1.metadata_json, s1.activated_at, s1.created_at, s1.updated_at
    FROM subscriptions s1
    INNER JOIN (
        SELECT user_id, MAX(id) AS max_id
        FROM subscriptions
        GROUP BY user_id
    ) latest ON latest.user_id = s1.user_id AND latest.max_id = s1.id
) s ON s.user_id = u.id";

$pdo = gopdf_db();

$countSql = "SELECT COUNT(*) AS total
             FROM users u
             {$latestSubscriptionJoin}
             WHERE {$where}";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int) (($countStmt->fetch()["total"] ?? 0));

$listSql = "SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                u.created_at,
                u.updated_at,
                s.id AS subscription_id,
                s.plan_code,
                s.cycle,
                s.amount_cents,
                s.currency,
                s.payment_method,
                s.status AS subscription_status,
                s.metadata_json,
                s.activated_at,
                s.created_at AS subscription_created_at,
                s.updated_at AS subscription_updated_at
            FROM users u
            {$latestSubscriptionJoin}
            WHERE {$where}
            ORDER BY u.id DESC
            LIMIT :limit OFFSET :offset";

$listStmt = $pdo->prepare($listSql);
if (array_key_exists("search", $params)) {
    $listStmt->bindValue(":search", (string) $params["search"], PDO::PARAM_STR);
}
$listStmt->bindValue(":limit", $limit, PDO::PARAM_INT);
$listStmt->bindValue(":offset", $offset, PDO::PARAM_INT);
$listStmt->execute();
$rows = $listStmt->fetchAll();

$users = [];
foreach ($rows as $row) {
    $subscription = null;
    if ($row["subscription_id"] !== null) {
        $subscription = [
            "id" => (int) $row["subscription_id"],
            "planCode" => (string) ($row["plan_code"] ?? ""),
            "cycle" => (string) ($row["cycle"] ?? ""),
            "amountCents" => (int) ($row["amount_cents"] ?? 0),
            "currency" => (string) ($row["currency"] ?? "BRL"),
            "paymentMethod" => (string) ($row["payment_method"] ?? ""),
            "status" => strtolower(trim((string) ($row["subscription_status"] ?? ""))),
            "metadata_json" => $row["metadata_json"] ?? null,
            "activatedAt" => $row["activated_at"],
            "createdAt" => $row["subscription_created_at"],
            "updatedAt" => $row["subscription_updated_at"],
            "trial" => gopdf_subscription_trial_info([
                "payment_method" => (string) ($row["payment_method"] ?? ""),
                "cycle" => (string) ($row["cycle"] ?? ""),
                "plan_code" => (string) ($row["plan_code"] ?? ""),
                "metadata_json" => $row["metadata_json"] ?? null,
                "status" => strtolower(trim((string) ($row["subscription_status"] ?? ""))),
            ]),
        ];
    }

    $userPayload = gopdf_user_payload([
        "id" => (int) $row["id"],
        "full_name" => (string) ($row["full_name"] ?? ""),
        "email" => (string) ($row["email"] ?? ""),
        "phone" => (string) ($row["phone"] ?? ""),
        "role" => (string) ($row["role"] ?? "user"),
    ], $subscription);

    $users[] = array_merge($userPayload, [
        "createdAt" => $row["created_at"],
        "updatedAt" => $row["updated_at"],
        "subscription" => $subscription,
    ]);
}

$pages = $total === 0 ? 0 : (int) ceil($total / $limit);

gopdf_audit("admin.users.list", "success", (int) ($adminUser["id"] ?? 0), [
    "profile" => $profile,
    "page" => $page,
    "limit" => $limit,
    "search" => $search !== "" ? $search : null,
    "total" => $total,
]);

gopdf_ok([
    "profile" => $profile,
    "pagination" => [
        "page" => $page,
        "limit" => $limit,
        "pages" => $pages,
        "total" => $total,
    ],
    "users" => $users,
]);

