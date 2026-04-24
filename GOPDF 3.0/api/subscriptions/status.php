<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("GET");
$user = gopdf_require_auth();

$stmt = gopdf_db()->prepare(
    "SELECT id, plan_code, cycle, amount_cents, currency, payment_method, status, metadata_json, activated_at,
            asaas_payment_id, invoice_url, pix_copy_paste, pix_qr_code_url, created_at, updated_at
     FROM subscriptions
     WHERE user_id = :user_id
     ORDER BY id DESC
     LIMIT 1"
);
$stmt->execute(["user_id" => (int) $user["id"]]);
$subscription = $stmt->fetch() ?: null;

$tracking = null;
if ($subscription) {
    $normalizedStatus = strtolower(trim((string) ($subscription["status"] ?? "")));
    if (in_array($normalizedStatus, ["pending", "past_due"], true)) {
        $sync = gopdf_sync_subscription_status_from_asaas_payment((int) ($subscription["id"] ?? 0));
        $tracking = [
            "checked" => (bool) ($sync["checked"] ?? false),
            "updated" => (bool) ($sync["updated"] ?? false),
            "providerStatus" => $sync["providerStatus"] ?? null,
            "error" => $sync["error"] ?? null,
        ];

        if (!empty($sync["updated"])) {
            $refreshStmt = gopdf_db()->prepare(
                "SELECT id, plan_code, cycle, amount_cents, currency, payment_method, status, metadata_json, activated_at,
                        asaas_payment_id, invoice_url, pix_copy_paste, pix_qr_code_url, created_at, updated_at
                 FROM subscriptions
                 WHERE id = :id
                 LIMIT 1"
            );
            $refreshStmt->execute(["id" => (int) $subscription["id"]]);
            $subscription = $refreshStmt->fetch() ?: $subscription;
        }
    }
}

$accessLevel = gopdf_user_access_level($user, $subscription);

if (!$subscription) {
    gopdf_ok([
        "hasSubscription" => false,
        "subscription" => null,
        "accessLevel" => $accessLevel,
        "isAdmin" => $accessLevel === "administrador",
    ]);
}

gopdf_ok([
    "hasSubscription" => true,
    "subscription" => $subscription,
    "trial" => gopdf_subscription_trial_info($subscription),
    "tracking" => $tracking,
    "accessLevel" => $accessLevel,
    "isAdmin" => $accessLevel === "administrador",
]);
