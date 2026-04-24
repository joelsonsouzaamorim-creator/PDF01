<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
$adminUser = gopdf_require_admin();

$input = gopdf_json_input();
$userId = (int) ($input["userId"] ?? 0);
$accessLevel = strtolower(trim((string) ($input["accessLevel"] ?? "")));

$config = gopdf_config();
$minTrialDays = max(1, (int) ($config["admin_trial_min_days"] ?? 1));
$maxTrialDays = max($minTrialDays, (int) ($config["admin_trial_max_days"] ?? 30));
$trialDaysRaw = $input["trialDays"] ?? null;
$trialDays = is_numeric($trialDaysRaw) ? (int) $trialDaysRaw : 0;

$allowedAccessLevels = ["administrador", "premium", "gratuito", "teste_premium"];
if ($userId <= 0) {
    gopdf_fail("Informe um userId valido.", 422);
}
if (!in_array($accessLevel, $allowedAccessLevels, true)) {
    gopdf_fail("Tipo de usuario invalido. Use: administrador, premium, gratuito ou teste_premium.", 422);
}
if ($userId === (int) ($adminUser["id"] ?? 0) && $accessLevel !== "administrador") {
    gopdf_fail("Nao e permitido remover o proprio acesso de administrador.", 422);
}
if ($accessLevel === "teste_premium" && ($trialDays < $minTrialDays || $trialDays > $maxTrialDays)) {
    gopdf_fail("Informe trialDays entre {$minTrialDays} e {$maxTrialDays}.", 422);
}

$pdo = gopdf_db();

$targetStmt = $pdo->prepare(
    "SELECT id, full_name, email, phone, role
     FROM users
     WHERE id = :id
     LIMIT 1"
);
$targetStmt->execute(["id" => $userId]);
$targetUser = $targetStmt->fetch();
if (!$targetUser) {
    gopdf_fail("Usuario nao encontrado.", 404);
}

$beforeSubscription = gopdf_latest_subscription_for_user($userId);
$beforeAccessLevel = gopdf_user_access_level($targetUser, $beforeSubscription);

if ($accessLevel === "teste_premium") {
    if ($beforeAccessLevel !== "gratuito") {
        gopdf_fail("O teste premium so pode ser concedido para conta atualmente gratuita.", 422);
    }
    if (gopdf_normalize_role((string) ($targetUser["role"] ?? "")) === "admin") {
        gopdf_fail("Nao e permitido conceder teste premium para administrador.", 422);
    }
}

try {
    $pdo->beginTransaction();

    if ($accessLevel === "administrador") {
        $setAdmin = $pdo->prepare("UPDATE users SET role = 'admin' WHERE id = :id");
        $setAdmin->execute(["id" => $userId]);
    } elseif ($accessLevel === "premium") {
        $setUserRole = $pdo->prepare("UPDATE users SET role = 'user' WHERE id = :id");
        $setUserRole->execute(["id" => $userId]);

        $latestSubscriptionStmt = $pdo->prepare(
            "SELECT id, plan_code, cycle, payment_method
             FROM subscriptions
             WHERE user_id = :user_id
             ORDER BY id DESC
             LIMIT 1"
        );
        $latestSubscriptionStmt->execute(["user_id" => $userId]);
        $latestSubscription = $latestSubscriptionStmt->fetch();

        if ($latestSubscription) {
            $latestPaymentMethod = strtolower(trim((string) ($latestSubscription["payment_method"] ?? "")));
            $latestCycle = strtolower(trim((string) ($latestSubscription["cycle"] ?? "")));
            $latestPlanCode = strtolower(trim((string) ($latestSubscription["plan_code"] ?? "")));
            $latestIsTrial = $latestPaymentMethod === "trial" || $latestCycle === "trial" || str_contains($latestPlanCode, "trial");

            if ($latestIsTrial) {
                $activateSubscription = $pdo->prepare(
                    "UPDATE subscriptions
                     SET status = 'active',
                         plan_code = 'manual-premium',
                         cycle = :cycle,
                         payment_method = 'manual',
                         metadata_json = NULL,
                         activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP)
                     WHERE id = :id"
                );
                $activateSubscription->execute([
                    "cycle" => (string) ($config["premium_cycle"] ?? "monthly"),
                    "id" => (int) ($latestSubscription["id"] ?? 0),
                ]);
            } else {
                $activateSubscription = $pdo->prepare(
                    "UPDATE subscriptions
                     SET status = 'active',
                         activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP)
                     WHERE id = :id"
                );
                $activateSubscription->execute([
                    "id" => (int) ($latestSubscription["id"] ?? 0),
                ]);
            }
        } else {
            $manualReference = "manual-access-" . $userId . "-" . date("YmdHis") . "-" . bin2hex(random_bytes(4));
            $manualAmountCents = (int) round(((float) ($config["premium_amount_brl"] ?? 18.0)) * 100);
            if ($manualAmountCents < 0) {
                $manualAmountCents = 0;
            }

            $insertSubscription = $pdo->prepare(
                "INSERT INTO subscriptions (
                    user_id, plan_code, cycle, amount_cents, currency, payment_method, status,
                    external_reference, metadata_json, activated_at
                ) VALUES (
                    :user_id, :plan_code, :cycle, :amount_cents, 'BRL', 'manual', 'active',
                    :external_reference, NULL, CURRENT_TIMESTAMP
                )"
            );
            $insertSubscription->execute([
                "user_id" => $userId,
                "plan_code" => "manual-premium",
                "cycle" => (string) ($config["premium_cycle"] ?? "monthly"),
                "amount_cents" => $manualAmountCents,
                "external_reference" => $manualReference,
            ]);
        }
    } elseif ($accessLevel === "teste_premium") {
        $setUserRole = $pdo->prepare("UPDATE users SET role = 'user' WHERE id = :id");
        $setUserRole->execute(["id" => $userId]);

        $deactivatePreviousActive = $pdo->prepare(
            "UPDATE subscriptions
             SET status = 'canceled'
             WHERE user_id = :user_id
               AND LOWER(TRIM(COALESCE(status, ''))) = 'active'"
        );
        $deactivatePreviousActive->execute(["user_id" => $userId]);

        $trialStartAt = date("Y-m-d H:i:s");
        $trialEndAt = (new DateTimeImmutable("now"))->modify("+" . $trialDays . " days")->format("Y-m-d H:i:s");
        $trialReference = "trial-access-" . $userId . "-" . date("YmdHis") . "-" . bin2hex(random_bytes(4));
        $trialMetadata = [
            "is_trial" => true,
            "trial_days" => $trialDays,
            "trial_starts_at" => $trialStartAt,
            "trial_ends_at" => $trialEndAt,
            "granted_by_admin_id" => (int) ($adminUser["id"] ?? 0),
        ];

        $insertTrialSubscription = $pdo->prepare(
            "INSERT INTO subscriptions (
                user_id, plan_code, cycle, amount_cents, currency, payment_method, status,
                external_reference, metadata_json, activated_at
            ) VALUES (
                :user_id, :plan_code, :cycle, 0, 'BRL', 'trial', 'active',
                :external_reference, :metadata_json, CURRENT_TIMESTAMP
            )"
        );
        $insertTrialSubscription->execute([
            "user_id" => $userId,
            "plan_code" => "premium-trial",
            "cycle" => "trial",
            "external_reference" => $trialReference,
            "metadata_json" => json_encode($trialMetadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    } else { // gratuito
        $setUserRole = $pdo->prepare("UPDATE users SET role = 'user' WHERE id = :id");
        $setUserRole->execute(["id" => $userId]);

        $deactivatePremium = $pdo->prepare(
            "UPDATE subscriptions
             SET status = 'canceled'
             WHERE user_id = :user_id
               AND LOWER(TRIM(COALESCE(status, ''))) = 'active'"
        );
        $deactivatePremium->execute(["user_id" => $userId]);
    }

    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    gopdf_audit("admin.user.access.update", "error", (int) ($adminUser["id"] ?? 0), [
        "targetUserId" => $userId,
        "requestedAccessLevel" => $accessLevel,
        "trialDays" => $accessLevel === "teste_premium" ? $trialDays : null,
        "error" => $error->getMessage(),
    ]);
    gopdf_fail("Nao foi possivel atualizar o tipo de usuario.", 500);
}

$updatedStmt = $pdo->prepare(
    "SELECT id, full_name, email, phone, role
     FROM users
     WHERE id = :id
     LIMIT 1"
);
$updatedStmt->execute(["id" => $userId]);
$updatedUser = $updatedStmt->fetch();
if (!$updatedUser) {
    gopdf_fail("Usuario nao encontrado apos atualizacao.", 404);
}

$updatedSubscription = gopdf_latest_subscription_for_user($userId);
$updatedAccessLevel = gopdf_user_access_level($updatedUser, $updatedSubscription);

gopdf_audit("admin.user.access.update", "success", (int) ($adminUser["id"] ?? 0), [
    "targetUserId" => $userId,
    "beforeAccessLevel" => $beforeAccessLevel,
    "requestedAccessLevel" => $accessLevel,
    "updatedAccessLevel" => $updatedAccessLevel,
    "trialDays" => $accessLevel === "teste_premium" ? $trialDays : null,
    "trial" => gopdf_subscription_trial_info($updatedSubscription),
]);

gopdf_ok([
    "message" => "Tipo de usuario atualizado com sucesso.",
    "requestedAccessLevel" => $accessLevel,
    "updatedAccessLevel" => $updatedAccessLevel,
    "trialDays" => $accessLevel === "teste_premium" ? $trialDays : null,
    "trial" => gopdf_subscription_trial_info($updatedSubscription),
    "user" => gopdf_user_payload($updatedUser, $updatedSubscription),
]);
