<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . "/_bootstrap.php";

gopdf_require_method("GET");
gopdf_start_session();

function gopdf_oauth_callback_message(string $raw, string $fallback): string
{
    $message = trim(preg_replace('/\s+/', ' ', $raw) ?? "");
    if ($message === "") {
        return $fallback;
    }
    return mb_substr($message, 0, 180);
}

function gopdf_oauth_callback_redirect_error(string $provider, string $next, string $message): void
{
    $redirectPath = gopdf_append_query_params("entrar.html", [
        "next" => $next,
        "auth" => "social-error",
        "provider" => $provider !== "" ? $provider : "social",
        "message" => gopdf_oauth_callback_message($message, "Falha no login social."),
    ]);
    gopdf_redirect($redirectPath);
}

function gopdf_oauth_callback_redirect_success(string $provider, string $next): void
{
    $redirectPath = gopdf_append_query_params($next, [
        "auth" => "social-ok",
        "provider" => $provider,
    ]);
    gopdf_redirect($redirectPath);
}

function gopdf_oauth_provider_callback_config(string $provider): ?array
{
    $config = gopdf_config();

    if ($provider === "google") {
        $clientId = trim((string) $config["google_oauth_client_id"]);
        $clientSecret = trim((string) $config["google_oauth_client_secret"]);
        if ($clientId === "" || $clientSecret === "") {
            return null;
        }

        return [
            "client_id" => $clientId,
            "client_secret" => $clientSecret,
            "token_url" => "https://oauth2.googleapis.com/token",
            "profile_url" => "https://openidconnect.googleapis.com/v1/userinfo",
            "profile_mode" => "google",
        ];
    }

    if ($provider === "microsoft") {
        $clientId = trim((string) $config["microsoft_oauth_client_id"]);
        $clientSecret = trim((string) $config["microsoft_oauth_client_secret"]);
        if ($clientId === "" || $clientSecret === "") {
            return null;
        }

        $tenant = trim((string) $config["microsoft_oauth_tenant"]);
        if ($tenant === "") {
            $tenant = "common";
        }

        return [
            "client_id" => $clientId,
            "client_secret" => $clientSecret,
            "token_url" => "https://login.microsoftonline.com/" . rawurlencode($tenant) . "/oauth2/v2.0/token",
            "profile_url" => "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName",
            "profile_mode" => "microsoft",
        ];
    }

    return null;
}

function gopdf_oauth_http_post_form(string $url, array $payload): array
{
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException("Falha ao iniciar conexao OAuth.");
    }

    $body = http_build_query($payload);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => [
            "Accept: application/json",
            "Content-Type: application/x-www-form-urlencoded",
        ],
        CURLOPT_TIMEOUT => 25,
    ]);

    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        throw new RuntimeException("Falha de comunicacao OAuth: " . $curlError);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException("Resposta invalida do provedor OAuth.");
    }

    if ($httpCode >= 400) {
        $description = (string) ($decoded["error_description"] ?? "");
        $error = (string) ($decoded["error"] ?? "");
        if ($description !== "") {
            throw new RuntimeException($description);
        }
        if ($error !== "") {
            throw new RuntimeException($error);
        }
        throw new RuntimeException("Falha ao validar autenticacao social.");
    }

    return $decoded;
}

function gopdf_oauth_http_get_json(string $url, array $headers = []): array
{
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException("Falha ao iniciar requisicao de perfil OAuth.");
    }

    $finalHeaders = array_merge(["Accept: application/json"], $headers);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $finalHeaders,
        CURLOPT_TIMEOUT => 25,
    ]);

    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        throw new RuntimeException("Falha ao buscar perfil social: " . $curlError);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException("Resposta invalida ao obter perfil social.");
    }

    if ($httpCode >= 400) {
        $message = (string) ($decoded["error_description"] ?? $decoded["error"]["message"] ?? $decoded["error"] ?? "");
        if ($message === "") {
            $message = "Falha ao consultar dados do perfil social.";
        }
        throw new RuntimeException($message);
    }

    return $decoded;
}

function gopdf_oauth_profile_from_provider(string $provider, string $accessToken, array $providerConfig): array
{
    $profile = gopdf_oauth_http_get_json($providerConfig["profile_url"], [
        "Authorization: Bearer " . $accessToken,
    ]);

    if ($provider === "google") {
        $email = strtolower(trim((string) ($profile["email"] ?? "")));
        $fullName = trim((string) ($profile["name"] ?? ""));
        $subject = trim((string) ($profile["sub"] ?? ""));
        $verified = (bool) ($profile["email_verified"] ?? false);

        if ($email === "" || !$verified) {
            throw new RuntimeException("A conta Google precisa ter email verificado.");
        }

        return [
            "email" => $email,
            "full_name" => $fullName,
            "subject" => $subject,
        ];
    }

    if ($provider === "microsoft") {
        $mail = trim((string) ($profile["mail"] ?? ""));
        $upn = trim((string) ($profile["userPrincipalName"] ?? ""));
        $email = strtolower($mail !== "" ? $mail : $upn);
        $fullName = trim((string) ($profile["displayName"] ?? ""));
        $subject = trim((string) ($profile["id"] ?? ""));

        if ($email === "") {
            throw new RuntimeException("Nao foi possivel obter email da conta Microsoft.");
        }

        return [
            "email" => $email,
            "full_name" => $fullName,
            "subject" => $subject,
        ];
    }

    throw new RuntimeException("Provedor social nao suportado.");
}

$state = trim((string) ($_GET["state"] ?? ""));
$oauthCode = trim((string) ($_GET["code"] ?? ""));
$oauthError = trim((string) ($_GET["error"] ?? ""));
$oauthErrorDescription = trim((string) ($_GET["error_description"] ?? ""));

$pendingRaw = $_SESSION["oauth_pending"] ?? [];
$pending = is_array($pendingRaw) ? $pendingRaw : [];

$statePayload = null;
if ($state !== "" && isset($pending[$state]) && is_array($pending[$state])) {
    $statePayload = $pending[$state];
}

if ($state !== "" && isset($pending[$state])) {
    unset($pending[$state]);
    $_SESSION["oauth_pending"] = $pending;
}

$provider = strtolower(trim((string) ($statePayload["provider"] ?? "")));
$next = gopdf_normalize_next_path((string) ($statePayload["next"] ?? "index.html"), "index.html");
$createdAt = (int) ($statePayload["created_at"] ?? 0);
$stateExpired = $createdAt <= 0 || (time() - $createdAt) > 900;

if (!in_array($provider, ["google", "microsoft"], true) || $state === "" || !$statePayload || $stateExpired) {
    gopdf_oauth_callback_redirect_error($provider, $next, "Sessao de login social expirada. Tente novamente.");
}

if ($oauthError !== "") {
    $message = $oauthErrorDescription !== ""
        ? $oauthErrorDescription
        : ("Autenticacao cancelada: " . $oauthError);
    gopdf_audit("auth.oauth.login", "denied", null, [
        "provider" => $provider,
        "error" => $oauthError,
    ]);
    gopdf_oauth_callback_redirect_error($provider, $next, $message);
}

if ($oauthCode === "") {
    gopdf_oauth_callback_redirect_error($provider, $next, "Codigo de autorizacao ausente.");
}

$providerConfig = gopdf_oauth_provider_callback_config($provider);
if (!$providerConfig) {
    gopdf_oauth_callback_redirect_error(
        $provider,
        $next,
        "Login social temporariamente indisponivel para este provedor."
    );
}

try {
    $tokenPayload = gopdf_oauth_http_post_form($providerConfig["token_url"], [
        "code" => $oauthCode,
        "client_id" => $providerConfig["client_id"],
        "client_secret" => $providerConfig["client_secret"],
        "redirect_uri" => gopdf_oauth_callback_url(),
        "grant_type" => "authorization_code",
    ]);

    $accessToken = trim((string) ($tokenPayload["access_token"] ?? ""));
    if ($accessToken === "") {
        throw new RuntimeException("Provedor social nao retornou token de acesso.");
    }

    $socialProfile = gopdf_oauth_profile_from_provider($provider, $accessToken, $providerConfig);
    $email = strtolower(trim((string) ($socialProfile["email"] ?? "")));
    $fullName = trim((string) ($socialProfile["full_name"] ?? ""));
    $subject = trim((string) ($socialProfile["subject"] ?? ""));

    if (!gopdf_email_valid($email)) {
        throw new RuntimeException("Email da conta social invalido.");
    }

    if ($fullName === "") {
        $nameFromEmail = explode("@", $email)[0] ?? "Usuario GoPDF";
        $fullName = trim((string) $nameFromEmail);
    }
    if ($fullName === "") {
        $fullName = "Usuario GoPDF";
    }

    $pdo = gopdf_db();
    $check = $pdo->prepare(
        "SELECT id, full_name, email, phone, role
         FROM users
         WHERE email = :email
         LIMIT 1"
    );
    $check->execute(["email" => $email]);
    $user = $check->fetch();
    $isNewUser = false;

    if (!$user) {
        $generatedPassword = bin2hex(random_bytes(24));
        $passwordHash = password_hash($generatedPassword, PASSWORD_DEFAULT);
        if ($passwordHash === false) {
            throw new RuntimeException("Nao foi possivel preparar a conta social.");
        }

        $insert = $pdo->prepare(
            "INSERT INTO users (full_name, email, phone, password_hash, role)
             VALUES (:full_name, :email, :phone, :password_hash, 'user')"
        );
        $insert->execute([
            "full_name" => $fullName,
            "email" => $email,
            "phone" => "",
            "password_hash" => $passwordHash,
        ]);

        $userId = (int) $pdo->lastInsertId();
        $user = [
            "id" => $userId,
            "full_name" => $fullName,
            "email" => $email,
            "phone" => "",
            "role" => "user",
        ];
        $isNewUser = true;
    } else {
        $userId = (int) ($user["id"] ?? 0);
        if ($userId <= 0) {
            throw new RuntimeException("Conta social sem identificador valido.");
        }

        $currentName = trim((string) ($user["full_name"] ?? ""));
        if ($currentName === "" && $fullName !== "") {
            $update = $pdo->prepare("UPDATE users SET full_name = :full_name WHERE id = :id LIMIT 1");
            $update->execute([
                "full_name" => $fullName,
                "id" => $userId,
            ]);
            $user["full_name"] = $fullName;
        }
    }

    $userId = (int) ($user["id"] ?? 0);
    if ($userId <= 0) {
        throw new RuntimeException("Nao foi possivel concluir o login social.");
    }

    gopdf_login_user($userId);
    gopdf_audit($isNewUser ? "auth.oauth.register" : "auth.oauth.login", "success", $userId, [
        "provider" => $provider,
        "email" => $email,
        "subject" => $subject,
    ]);

    gopdf_oauth_callback_redirect_success($provider, $next);
} catch (Throwable $error) {
    gopdf_audit("auth.oauth.login", "denied", null, [
        "provider" => $provider,
        "error" => $error->getMessage(),
    ]);
    gopdf_oauth_callback_redirect_error($provider, $next, $error->getMessage());
}
