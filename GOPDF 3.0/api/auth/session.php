<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("GET");
$user = gopdf_current_user();

if (!$user) {
    gopdf_ok([
        "authenticated" => false,
        "user" => null,
    ]);
}

$subscription = gopdf_latest_subscription_for_user((int) $user["id"]);

gopdf_ok([
    "authenticated" => true,
    "user" => gopdf_user_payload($user, $subscription),
    "subscription" => $subscription,
]);
