<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
$adminUser = gopdf_require_admin();

$input = gopdf_json_input();
$fullName = trim((string) ($input["fullName"] ?? ""));
$email = strtolower(trim((string) ($input["email"] ?? "")));
$phone = gopdf_digits_only((string) ($input["phone"] ?? ""));
$password = (string) ($input["password"] ?? "");
$accessLevel = strtolower(trim((string) ($input["accessLevel"] ?? "gratuito")));

$config = gopdf_config();
$minTrialDays = max(1, (int) ($config["admin_trial_min_days"] ?? 1));
$maxTrialDays = max($minTrialDays, (int) ($config["admin_trial_max_days"] ?? 30));
$trialDaysRaw = $input["trialDays"] ?? null;
$trialDays = is_numeric($trialDaysRaw) ? (int) $trialDaysRaw : 0;

if (mb_strlen($fullName) < 6 || !str_contains($fullName, " ")) {
    gopdf_fail("Informe o nome completo para criar a conta.");
}
if (!gopdf_email_valid($email)) {
    gopdf_fail("Informe um email valido.");
}
if (strlen($phone) < 10) {
    gopdf_fail("Informe um telefone com DDD.");
}
if (strlen($password) < 8) {
    gopdf_fail("Use uma senha com pelo menos 8 caracteres.");
}

$allowedAccessLevels = ["gratuito", "premium", "administrador"];
if (!in_array($accessLevel, $allowedAccessLevels, true)) {
    gopdf_fail("Tipo de conta invalido. Use: gratuito, premium ou administrador.", 422);
}
if ($accessLevel === "premium" && ($trialDays < $minTrialDays || $trialDays > $maxTrialDays)) {
    gopdf_fail("Para conta premium informe trialDays entre {$minTrialDays} e {$maxTrialDays}.", 422);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
if ($passwordHash === false) {
    gopdf_fail("Nao foi possivel proteger a senha.", 500);
}

$pdo = gopdf_db();
$subscription = null;

try {
    $emailCheck = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $emailCheck->execute(["email" => $email]);
    if ($emailCheck->fetch()) {
        gopdf_fail("Ja existe uma conta com esse email.", 409);
    }

    $pdo->beginTransaction();

    $role = $accessLevel === "administrador" ? "admin" : "user";
    $insertUser = $pdo->prepare(
        "INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES (:full_name, :email, :phone, :password_hash, :role)"
    );
    $insertUser->execute([
        "full_name" => $fullName,
        "email" => $email,
        "phone" => $phone,
        "password_hash" => $passwordHash,
        "role" => $role,
    ]);

    $userId = (int) $pdo->lastInsertId();

    if ($accessLevel === "premium") {
        $trialStartAt = date("Y-m-d H:i:s");
        $trialEndAt = (new DateTimeImmutable("now"))->modify("+" . $trialDays . " days")->format("Y-m-d H:i:s");
        $trialReference = "trial-create-" . $userId . "-" . date("YmdHis") . "-" . bin2hex(random_bytes(4));
        $trialMetadata = [
            "is_trial" => true,
            "trial_days" => $trialDays,
            "trial_starts_at" => $trialStartAt,
            "trial_ends_at" => $trialEndAt,
            "granted_by_admin_id" => (int) ($adminUser["id"] ?? 0),
            "created_by_admin" => true,
        ];

        $insertSubscription = $pdo->prepare(
            "INSERT INTO subscriptions (
                user_id, plan_code, cycle, amount_cents, currency, payment_method, status,
                external_reference, metadata_json, activated_at
            ) VALUES (
                :user_id, :plan_code, :cycle, 0, 'BRL', 'trial', 'active',
                :external_reference, :metadata_json, CURRENT_TIMESTAMP
            )"
        );
        $insertSubscription->execute([
            "user_id" => $userId,
            "plan_code" => "premium-trial",
            "cycle" => "trial",
            "external_reference" => $trialReference,
            "metadata_json" => json_encode($trialMetadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }

    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    gopdf_audit("admin.users.create", "error", (int) ($adminUser["id"] ?? 0), [
        "email" => $email,
        "accessLevel" => $accessLevel,
        "trialDays" => $accessLevel === "premium" ? $trialDays : null,
        "error" => $error->getMessage(),
    ]);
    gopdf_fail("Nao foi possivel criar o usuario.", 500);
}

$userStmt = $pdo->prepare(
    "SELECT id, full_name, email, phone, role
     FROM users
     WHERE email = :email
     LIMIT 1"
);
$userStmt->execute(["email" => $email]);
$createdUser = $userStmt->fetch();
if (!$createdUser) {
    gopdf_fail("Usuario criado, mas nao foi possivel carregar os dados.", 500);
}

$createdUserId = (int) ($createdUser["id"] ?? 0);
$subscription = gopdf_latest_subscription_for_user($createdUserId);

$emailConfirmationEnabled = gopdf_account_confirmation_email_enabled();
$emailConfirmationSent = null;
if ($emailConfirmationEnabled) {
    $emailConfirmationSent = gopdf_send_account_confirmation_email((string) ($createdUser["email"] ?? $email), (string) ($createdUser["full_name"] ?? $fullName));
    gopdf_audit(
        "admin.users.create.email_confirmation",
        $emailConfirmationSent ? "success" : "warning",
        (int) ($adminUser["id"] ?? 0),
        ["createdUserId" => $createdUserId, "email" => (string) ($createdUser["email"] ?? $email)]
    );
}

gopdf_audit("admin.users.create", "success", (int) ($adminUser["id"] ?? 0), [
    "createdUserId" => $createdUserId,
    "email" => (string) ($createdUser["email"] ?? $email),
    "requestedAccessLevel" => $accessLevel,
    "updatedAccessLevel" => gopdf_user_access_level($createdUser, $subscription),
    "trialDays" => $accessLevel === "premium" ? $trialDays : null,
    "trial" => gopdf_subscription_trial_info($subscription),
]);

gopdf_ok([
    "message" => "Usuario criado com sucesso.",
    "requestedAccessLevel" => $accessLevel,
    "trialDays" => $accessLevel === "premium" ? $trialDays : null,
    "emailConfirmationEnabled" => $emailConfirmationEnabled,
    "emailConfirmationSent" => $emailConfirmationSent,
    "user" => gopdf_user_payload($createdUser, $subscription),
    "subscription" => $subscription,
    "trial" => gopdf_subscription_trial_info($subscription),
]);
