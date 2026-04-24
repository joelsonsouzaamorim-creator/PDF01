<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
gopdf_start_session();

$input = gopdf_json_input();
$email = strtolower(trim((string) ($input["email"] ?? "")));
$password = (string) ($input["password"] ?? "");

if (!gopdf_email_valid($email) || $password === "") {
    gopdf_fail("Credenciais inválidas.", 422);
}

$stmt = gopdf_db()->prepare(
    "SELECT id, full_name, email, phone, role, password_hash
     FROM users
     WHERE email = :email
     LIMIT 1"
);
$stmt->execute(["email" => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, (string) $user["password_hash"])) {
    gopdf_audit("auth.login", "denied", null, ["email" => $email]);
    gopdf_fail("Email ou senha inválidos.", 401);
}

$userId = (int) $user["id"];
gopdf_login_user($userId);
gopdf_audit("auth.login", "success", $userId);
$subscription = gopdf_latest_subscription_for_user($userId);

gopdf_ok([
    "message" => "Login realizado com sucesso.",
    "user" => gopdf_user_payload($user, $subscription),
]);
