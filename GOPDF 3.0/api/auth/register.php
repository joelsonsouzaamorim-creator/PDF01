<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
gopdf_start_session();

$input = gopdf_json_input();
$fullName = trim((string) ($input["fullName"] ?? ""));
$email = strtolower(trim((string) ($input["email"] ?? "")));
$phone = gopdf_digits_only((string) ($input["phone"] ?? ""));
$password = (string) ($input["password"] ?? "");

if (mb_strlen($fullName) < 6 || !str_contains($fullName, " ")) {
    gopdf_fail("Informe o nome completo para criar a conta.");
}

if (!gopdf_email_valid($email)) {
    gopdf_fail("Informe um email válido.");
}

if (strlen($phone) < 10) {
    gopdf_fail("Informe um telefone com DDD.");
}

if (strlen($password) < 8) {
    gopdf_fail("Use uma senha com pelo menos 8 caracteres.");
}

$pdo = gopdf_db();

$check = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
$check->execute(["email" => $email]);
if ($check->fetch()) {
    gopdf_fail("Já existe uma conta com esse email.", 409);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
if ($passwordHash === false) {
    gopdf_fail("Não foi possível proteger a senha.", 500);
}

$insert = $pdo->prepare(
    "INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES (:full_name, :email, :phone, :password_hash, 'user')"
);
$insert->execute([
    "full_name" => $fullName,
    "email" => $email,
    "phone" => $phone,
    "password_hash" => $passwordHash,
]);

$userId = (int) $pdo->lastInsertId();
gopdf_login_user($userId);
gopdf_audit("auth.register", "success", $userId, ["email" => $email]);

$emailConfirmationEnabled = gopdf_account_confirmation_email_enabled();
$emailConfirmationSent = null;
if ($emailConfirmationEnabled) {
    $emailConfirmationSent = gopdf_send_account_confirmation_email($email, $fullName);
    gopdf_audit(
        "auth.register.email_confirmation",
        $emailConfirmationSent ? "success" : "warning",
        $userId,
        ["email" => $email]
    );
} else {
    gopdf_audit("auth.register.email_confirmation", "skipped", $userId, [
        "email" => $email,
        "reason" => "disabled_by_config",
    ]);
}

$userPayload = gopdf_user_payload([
    "id" => $userId,
    "full_name" => $fullName,
    "email" => $email,
    "phone" => $phone,
    "role" => "user",
]);

gopdf_ok([
    "message" => "Conta criada com sucesso.",
    "emailConfirmationEnabled" => $emailConfirmationEnabled,
    "emailConfirmationSent" => $emailConfirmationSent,
    "user" => $userPayload,
]);
