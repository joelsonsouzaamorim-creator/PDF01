<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/config/env.php";

function gopdf_env(string $key, ?string $fallback = null): ?string
{
    $value = getenv($key);
    if ($value === false || $value === null || $value === "") {
        return $fallback;
    }
    return (string) $value;
}

function gopdf_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $appEnv = gopdf_env("APP_ENV", "production");
    $appUrl = rtrim((string) gopdf_env("APP_URL", "https://example.com"), "/");
    $timezone = (string) gopdf_env("APP_TIMEZONE", "America/Rio_Branco");

    $config = [
        "app_env" => $appEnv,
        "app_url" => $appUrl,
        "app_allowed_origins" => (string) gopdf_env("APP_ALLOWED_ORIGINS", ""),
        "app_timezone" => $timezone,
        "db_host" => (string) gopdf_env("DB_HOST", "127.0.0.1"),
        "db_port" => (string) gopdf_env("DB_PORT", "3306"),
        "db_name" => (string) gopdf_env("DB_NAME", "gopdf"),
        "db_user" => (string) gopdf_env("DB_USER", "root"),
        "db_password" => (string) gopdf_env("DB_PASSWORD", ""),
        "session_name" => (string) gopdf_env("SESSION_NAME", "gopdf_sid"),
        "session_secret" => (string) gopdf_env("SESSION_SECRET", "change-this-secret"),
        "asaas_api_key" => (string) gopdf_env("ASAAS_API_KEY", ""),
        "asaas_api_base" => (string) gopdf_env(
            "ASAAS_API_BASE",
            $appEnv === "production"
                ? "https://api.asaas.com/v3"
                : "https://sandbox.asaas.com/api/v3"
        ),
        "asaas_webhook_secret" => (string) gopdf_env("ASAAS_WEBHOOK_SECRET", ""),
        "premium_plan_code" => (string) gopdf_env("PREMIUM_PLAN_CODE", "gopdf-premium-monthly"),
        "premium_amount_brl" => (float) gopdf_env("PREMIUM_AMOUNT_BRL", "18.00"),
        "premium_cycle" => (string) gopdf_env("PREMIUM_CYCLE", "monthly"),
        "admin_trial_min_days" => (int) gopdf_env("ADMIN_TRIAL_MIN_DAYS", "1"),
        "admin_trial_max_days" => (int) gopdf_env("ADMIN_TRIAL_MAX_DAYS", "30"),
        "oauth_callback_url" => (string) gopdf_env("OAUTH_CALLBACK_URL", ""),
        "google_oauth_client_id" => (string) gopdf_env("GOOGLE_OAUTH_CLIENT_ID", ""),
        "google_oauth_client_secret" => (string) gopdf_env("GOOGLE_OAUTH_CLIENT_SECRET", ""),
        "microsoft_oauth_client_id" => (string) gopdf_env("MICROSOFT_OAUTH_CLIENT_ID", ""),
        "microsoft_oauth_client_secret" => (string) gopdf_env("MICROSOFT_OAUTH_CLIENT_SECRET", ""),
        "microsoft_oauth_tenant" => (string) gopdf_env("MICROSOFT_OAUTH_TENANT", "common"),
        "mail_confirmation_enabled" => (string) gopdf_env("MAIL_CONFIRMATION_ENABLED", "1"),
        "mail_profile_update_enabled" => (string) gopdf_env("MAIL_PROFILE_UPDATE_ENABLED", "1"),
        "mail_from_name" => (string) gopdf_env("MAIL_FROM_NAME", "GoPDF"),
        "mail_from_address" => (string) gopdf_env("MAIL_FROM_ADDRESS", ""),
        "mail_reply_to" => (string) gopdf_env("MAIL_REPLY_TO", ""),
    ];

    date_default_timezone_set($timezone);
    return $config;
}

function gopdf_start_session(): void
{
    $config = gopdf_config();
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $isHttps = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off");
    session_name($config["session_name"]);
    session_set_cookie_params([
        "lifetime" => 60 * 60 * 12,
        "path" => "/",
        "domain" => "",
        "secure" => $isHttps,
        "httponly" => true,
        "samesite" => "Lax",
    ]);
    session_start();
}

function gopdf_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function gopdf_fail(string $message, int $status = 400, array $extra = []): void
{
    gopdf_json_response(array_merge([
        "ok" => false,
        "message" => $message,
    ], $extra), $status);
}

function gopdf_ok(array $data = [], int $status = 200): void
{
    gopdf_json_response(array_merge(["ok" => true], $data), $status);
}

function gopdf_require_method(string $method): void
{
    if (strtoupper($_SERVER["REQUEST_METHOD"] ?? "GET") !== strtoupper($method)) {
        gopdf_fail("Método não permitido.", 405);
    }
}

function gopdf_request_origin(): ?string
{
    $host = trim((string) ($_SERVER["HTTP_HOST"] ?? ""));
    if ($host === "") {
        return null;
    }

    $scheme = "";
    $forwardedProto = (string) ($_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "");
    if ($forwardedProto !== "") {
        $scheme = strtolower(trim((string) explode(",", $forwardedProto)[0]));
    }

    if ($scheme !== "http" && $scheme !== "https") {
        $requestScheme = strtolower(trim((string) ($_SERVER["REQUEST_SCHEME"] ?? "")));
        if ($requestScheme === "http" || $requestScheme === "https") {
            $scheme = $requestScheme;
        }
    }

    if ($scheme !== "http" && $scheme !== "https") {
        $https = strtolower((string) ($_SERVER["HTTPS"] ?? ""));
        $scheme = ($https !== "" && $https !== "off") ? "https" : "http";
    }

    return $scheme . "://" . $host;
}

function gopdf_same_origin_check(): void
{
    $origin = $_SERVER["HTTP_ORIGIN"] ?? "";
    if ($origin === "") {
        return;
    }

    $normalize = static function (string $url): string {
        return rtrim(strtolower(trim($url)), "/");
    };

    $originNormalized = $normalize($origin);
    $allowedOrigins = [$normalize((string) gopdf_config()["app_url"])];

    $requestOrigin = gopdf_request_origin();
    if ($requestOrigin !== null) {
        $allowedOrigins[] = $normalize($requestOrigin);
    }

    $extra = trim((string) gopdf_config()["app_allowed_origins"]);
    if ($extra !== "") {
        foreach (explode(",", $extra) as $item) {
            $item = $normalize($item);
            if ($item !== "") {
                $allowedOrigins[] = $item;
            }
        }
    }

    // Aceita automaticamente variacoes com/sem www para as origens conhecidas.
    foreach ($allowedOrigins as $baseOrigin) {
        $host = parse_url($baseOrigin, PHP_URL_HOST);
        $scheme = parse_url($baseOrigin, PHP_URL_SCHEME);
        $port = parse_url($baseOrigin, PHP_URL_PORT);
        if (!is_string($host) || $host === "" || !is_string($scheme) || $scheme === "") {
            continue;
        }

        $portSuffix = is_int($port) ? ":" . $port : "";
        if (str_starts_with($host, "www.")) {
            $allowedOrigins[] = $normalize($scheme . "://" . substr($host, 4) . $portSuffix);
        } else {
            $allowedOrigins[] = $normalize($scheme . "://www." . $host . $portSuffix);
        }
    }

    $allowedOrigins = array_values(array_unique($allowedOrigins));
    if (in_array($originNormalized, $allowedOrigins, true)) {
        return;
    }

    // Fallback: em alguns hosts/proxies, o esquema pode variar (http/https),
    // mas manter o mesmo host ja garante a mesma origem pratica da aplicacao.
    $originHost = parse_url($originNormalized, PHP_URL_HOST);
    if (is_string($originHost) && $originHost !== "") {
        foreach ($allowedOrigins as $allowedOrigin) {
            $allowedHost = parse_url($allowedOrigin, PHP_URL_HOST);
            if (is_string($allowedHost) && strtolower($allowedHost) === strtolower($originHost)) {
                return;
            }
        }
    }

    gopdf_fail("Origem não autorizada.", 403, [
        "allowedOrigins" => gopdf_config()["app_env"] === "production" ? null : $allowedOrigins,
        "origin" => gopdf_config()["app_env"] === "production" ? null : $originNormalized,
    ]);
}

function gopdf_json_input(): array
{
    $raw = file_get_contents("php://input");
    if ($raw === false || trim($raw) === "") {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        gopdf_fail("JSON inválido.", 422);
    }
    return $decoded;
}

function gopdf_normalize_next_path(string $rawNext, string $fallback = "index.html"): string
{
    $next = trim($rawNext);
    if ($next === "") {
        return $fallback;
    }

    if (preg_match('/^[a-z][a-z0-9+\-.]*:/i', $next) === 1 || str_starts_with($next, "//")) {
        return $fallback;
    }

    $parts = parse_url($next);
    if ($parts === false) {
        return $fallback;
    }

    $path = (string) ($parts["path"] ?? "");
    $path = str_replace("\\", "/", $path);
    $path = ltrim($path, "/");
    $path = preg_replace('/^(?:\.\/)+/', "", $path) ?? $path;
    if ($path === "") {
        $path = $fallback;
    }

    if (str_contains($path, "..")) {
        return $fallback;
    }

    $query = (string) ($parts["query"] ?? "");
    return $query !== "" ? ($path . "?" . $query) : $path;
}

function gopdf_app_url_for_path(string $path): string
{
    if (preg_match('/^https?:\/\//i', $path) === 1) {
        return $path;
    }

    $base = rtrim((string) gopdf_config()["app_url"], "/");
    $cleanPath = ltrim($path, "/");
    return $base . "/" . $cleanPath;
}

function gopdf_redirect(string $path, int $status = 302): void
{
    header("Location: " . gopdf_app_url_for_path($path), true, $status);
    exit;
}

function gopdf_append_query_params(string $path, array $params): string
{
    $segments = parse_url($path);
    if ($segments === false) {
        return $path;
    }

    $basePath = (string) ($segments["path"] ?? "");
    $query = [];
    if (!empty($segments["query"])) {
        parse_str((string) $segments["query"], $query);
    }

    foreach ($params as $key => $value) {
        if ($value === null || $value === "") {
            continue;
        }
        $query[(string) $key] = (string) $value;
    }

    $queryString = http_build_query($query);
    if ($queryString === "") {
        return $basePath;
    }

    return $basePath . "?" . $queryString;
}

function gopdf_oauth_callback_url(): string
{
    $configured = trim((string) gopdf_config()["oauth_callback_url"]);
    if ($configured !== "") {
        return $configured;
    }
    return rtrim((string) gopdf_config()["app_url"], "/") . "/api/auth/oauth/callback";
}

function gopdf_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = gopdf_config();
    $dsn = sprintf(
        "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
        $config["db_host"],
        $config["db_port"],
        $config["db_name"]
    );

    try {
        $pdo = new PDO($dsn, $config["db_user"], $config["db_password"], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $error) {
        gopdf_fail("Falha ao conectar no banco de dados.", 500, [
            "error" => gopdf_config()["app_env"] === "production" ? null : $error->getMessage(),
        ]);
    }

    return $pdo;
}

function gopdf_ensure_user_profiles_table(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    gopdf_db()->exec(
        "CREATE TABLE IF NOT EXISTS user_profiles (
            user_id BIGINT UNSIGNED NOT NULL,
            document_type VARCHAR(10) NULL,
            document_number VARCHAR(20) NULL,
            address_zip VARCHAR(20) NULL,
            address_street VARCHAR(160) NULL,
            address_number VARCHAR(30) NULL,
            address_complement VARCHAR(120) NULL,
            address_district VARCHAR(120) NULL,
            address_city VARCHAR(120) NULL,
            address_state VARCHAR(40) NULL,
            address_country VARCHAR(80) NULL DEFAULT 'Brasil',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id),
            KEY idx_user_profiles_document_number (document_number),
            CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $ensured = true;
}

function gopdf_ensure_signature_validations_table(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    gopdf_db()->exec(
        "CREATE TABLE IF NOT EXISTS signature_validations (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_sha256 CHAR(64) NOT NULL,
            local_signatures_count INT UNSIGNED NOT NULL DEFAULT 0,
            local_has_byterange TINYINT(1) NOT NULL DEFAULT 0,
            local_has_pkcs7 TINYINT(1) NOT NULL DEFAULT 0,
            local_summary_json JSON NULL,
            icp_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            iti_protocol VARCHAR(120) NULL,
            iti_report_url VARCHAR(255) NULL,
            iti_verifier_url VARCHAR(255) NULL,
            notes TEXT NULL,
            finished_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_signature_validations_user_id (user_id),
            KEY idx_signature_validations_sha (file_sha256),
            KEY idx_signature_validations_status (icp_status),
            CONSTRAINT fk_signature_validations_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $ensured = true;
}

function gopdf_email_valid(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function gopdf_account_confirmation_email_enabled(): bool
{
    $raw = strtolower(trim((string) (gopdf_config()["mail_confirmation_enabled"] ?? "1")));
    return !in_array($raw, ["0", "false", "off", "no", "nao"], true);
}

function gopdf_profile_update_email_enabled(): bool
{
    $raw = strtolower(trim((string) (gopdf_config()["mail_profile_update_enabled"] ?? "1")));
    return !in_array($raw, ["0", "false", "off", "no", "nao"], true);
}

function gopdf_mail_header_value(string $value, int $maxLength = 190): string
{
    $clean = str_replace(["\r", "\n"], "", trim($value));
    $clean = str_replace('"', "'", $clean);
    return mb_substr($clean, 0, $maxLength);
}

function gopdf_default_mail_from_address(): string
{
    $host = parse_url((string) (gopdf_config()["app_url"] ?? ""), PHP_URL_HOST);
    if (!is_string($host) || trim($host) === "") {
        return "no-reply@localhost";
    }

    $host = strtolower(trim($host));
    if (str_starts_with($host, "www.")) {
        $host = substr($host, 4);
    }

    return "no-reply@" . $host;
}

function gopdf_send_account_confirmation_email(string $toEmail, string $fullName): bool
{
    if (!function_exists("mail")) {
        return false;
    }

    $toEmail = strtolower(trim($toEmail));
    if (!gopdf_email_valid($toEmail)) {
        return false;
    }

    $config = gopdf_config();
    $appName = gopdf_mail_header_value((string) ($config["mail_from_name"] ?? "GoPDF"), 120);
    if ($appName === "") {
        $appName = "GoPDF";
    }

    $fromAddress = strtolower(trim((string) ($config["mail_from_address"] ?? "")));
    if (!gopdf_email_valid($fromAddress)) {
        $fromAddress = gopdf_default_mail_from_address();
    }
    $fromAddress = gopdf_mail_header_value($fromAddress, 190);

    $replyTo = strtolower(trim((string) ($config["mail_reply_to"] ?? "")));
    if (!gopdf_email_valid($replyTo)) {
        $replyTo = "";
    }
    $replyTo = gopdf_mail_header_value($replyTo, 190);

    $displayName = trim($fullName) !== "" ? trim($fullName) : "cliente";
    $displayName = gopdf_mail_header_value($displayName, 120);
    $createdAt = date("Y-m-d H:i:s");
    $loginUrl = gopdf_app_url_for_path("entrar.html");
    $homeUrl = gopdf_app_url_for_path("index.html");

    $subject = "Confirmacao de criacao de conta - " . $appName;
    $body = implode("\r\n", [
        "Ola " . $displayName . ",",
        "",
        "Sua conta foi criada com sucesso no " . $appName . ".",
        "Data de criacao: " . $createdAt . " (" . ((string) ($config["app_timezone"] ?? "UTC")) . ")",
        "Email cadastrado: " . $toEmail,
        "",
        "Links de acesso:",
        "- Login: " . $loginUrl,
        "- Home: " . $homeUrl,
        "",
        "Se voce nao reconhece este cadastro, responda este email.",
        "",
        "Equipe " . $appName,
    ]);

    $headers = [
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "From: \"" . $appName . "\" <" . $fromAddress . ">",
    ];

    if ($replyTo !== "") {
        $headers[] = "Reply-To: " . $replyTo;
    }
    $headers[] = "X-Mailer: PHP/" . PHP_VERSION;

    return @mail($toEmail, $subject, $body, implode("\r\n", $headers));
}

function gopdf_send_profile_update_notification_email(array $recipientEmails, string $fullName, array $changedItems): bool
{
    if (!function_exists("mail")) {
        return false;
    }

    $validRecipients = [];
    foreach ($recipientEmails as $recipient) {
        $email = strtolower(trim((string) $recipient));
        if (gopdf_email_valid($email)) {
            $validRecipients[$email] = $email;
        }
    }
    $validRecipients = array_values($validRecipients);

    if (empty($validRecipients)) {
        return false;
    }

    $normalizedChanges = [];
    foreach ($changedItems as $item) {
        $line = gopdf_mail_header_value((string) $item, 220);
        if ($line !== "") {
            $normalizedChanges[] = $line;
        }
    }
    if (empty($normalizedChanges)) {
        $normalizedChanges[] = "Dados do cadastro atualizados.";
    }

    $config = gopdf_config();
    $appName = gopdf_mail_header_value((string) ($config["mail_from_name"] ?? "GoPDF"), 120);
    if ($appName === "") {
        $appName = "GoPDF";
    }

    $fromAddress = strtolower(trim((string) ($config["mail_from_address"] ?? "")));
    if (!gopdf_email_valid($fromAddress)) {
        $fromAddress = gopdf_default_mail_from_address();
    }
    $fromAddress = gopdf_mail_header_value($fromAddress, 190);

    $replyTo = strtolower(trim((string) ($config["mail_reply_to"] ?? "")));
    if (!gopdf_email_valid($replyTo)) {
        $replyTo = "";
    }
    $replyTo = gopdf_mail_header_value($replyTo, 190);

    $displayName = trim($fullName) !== "" ? trim($fullName) : "cliente";
    $displayName = gopdf_mail_header_value($displayName, 120);
    $changedAt = date("Y-m-d H:i:s");
    $profileUrl = gopdf_app_url_for_path("perfil.html");

    $subject = "Alteracao no cadastro - " . $appName;
    $bodyLines = [
        "Ola " . $displayName . ",",
        "",
        "Identificamos alteracoes no seu cadastro na plataforma " . $appName . ".",
        "Data da alteracao: " . $changedAt . " (" . ((string) ($config["app_timezone"] ?? "UTC")) . ")",
        "",
        "Alteracoes detectadas:",
    ];

    foreach ($normalizedChanges as $change) {
        $bodyLines[] = "- " . $change;
    }

    $bodyLines[] = "";
    $bodyLines[] = "Se voce nao reconhece essa alteracao, altere sua senha imediatamente.";
    $bodyLines[] = "Acesse: " . $profileUrl;
    $bodyLines[] = "";
    $bodyLines[] = "Equipe " . $appName;

    $headers = [
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "From: \"" . $appName . "\" <" . $fromAddress . ">",
    ];
    if ($replyTo !== "") {
        $headers[] = "Reply-To: " . $replyTo;
    }
    $headers[] = "X-Mailer: PHP/" . PHP_VERSION;

    $headersRaw = implode("\r\n", $headers);
    $body = implode("\r\n", $bodyLines);

    $allSent = true;
    foreach ($validRecipients as $recipientEmail) {
        $sent = @mail($recipientEmail, $subject, $body, $headersRaw);
        if (!$sent) {
            $allSent = false;
        }
    }

    return $allSent;
}

function gopdf_digits_only(string $value): string
{
    return preg_replace("/\D+/", "", $value) ?? "";
}

function gopdf_client_ip(): string
{
    return (string) ($_SERVER["REMOTE_ADDR"] ?? "0.0.0.0");
}

function gopdf_user_agent(): string
{
    $value = (string) ($_SERVER["HTTP_USER_AGENT"] ?? "unknown");
    return mb_substr($value, 0, 255);
}

function gopdf_normalize_role(string $role): string
{
    $normalized = strtolower(trim($role));
    if (
        $normalized === "admin" ||
        $normalized === "administrator" ||
        $normalized === "administrador"
    ) {
        return "admin";
    }

    return "user";
}

function gopdf_latest_subscription_for_user(int $userId): ?array
{
    $stmt = gopdf_db()->prepare(
        "SELECT id, plan_code, cycle, amount_cents, currency, payment_method, status, metadata_json, activated_at, created_at, updated_at
         FROM subscriptions
         WHERE user_id = :user_id
         ORDER BY id DESC
         LIMIT 1"
    );
    $stmt->execute(["user_id" => $userId]);
    $subscription = $stmt->fetch();
    return $subscription ?: null;
}

function gopdf_subscription_metadata(?array $subscription): array
{
    if (!$subscription) {
        return [];
    }

    $raw = $subscription["metadata_json"] ?? $subscription["metadataJson"] ?? null;
    if (is_array($raw)) {
        return $raw;
    }
    if (!is_string($raw) || trim($raw) === "") {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function gopdf_subscription_is_trial(?array $subscription): bool
{
    if (!$subscription) {
        return false;
    }

    $metadata = gopdf_subscription_metadata($subscription);
    $metaIsTrial = $metadata["is_trial"] ?? $metadata["isTrial"] ?? null;
    if (is_bool($metaIsTrial) && $metaIsTrial) {
        return true;
    }

    $paymentMethod = strtolower(trim((string) ($subscription["payment_method"] ?? $subscription["paymentMethod"] ?? "")));
    $cycle = strtolower(trim((string) ($subscription["cycle"] ?? "")));
    $planCode = strtolower(trim((string) ($subscription["plan_code"] ?? $subscription["planCode"] ?? "")));

    return $paymentMethod === "trial" || $cycle === "trial" || str_contains($planCode, "trial");
}

function gopdf_subscription_trial_ends_timestamp(?array $subscription): ?int
{
    if (!$subscription) {
        return null;
    }

    $metadata = gopdf_subscription_metadata($subscription);
    $raw = $metadata["trial_ends_at"] ?? $metadata["trialEndsAt"] ?? null;
    if (!is_string($raw) || trim($raw) === "") {
        return null;
    }

    $timestamp = strtotime($raw);
    if ($timestamp === false) {
        return null;
    }

    return $timestamp;
}

function gopdf_subscription_trial_info(?array $subscription): ?array
{
    if (!gopdf_subscription_is_trial($subscription)) {
        return null;
    }

    $endsAtTimestamp = gopdf_subscription_trial_ends_timestamp($subscription);
    if ($endsAtTimestamp === null) {
        return [
            "isTrial" => true,
            "endsAt" => null,
            "isExpired" => false,
            "daysLeft" => null,
        ];
    }

    $secondsLeft = $endsAtTimestamp - time();
    return [
        "isTrial" => true,
        "endsAt" => date("Y-m-d H:i:s", $endsAtTimestamp),
        "isExpired" => $secondsLeft < 0,
        "daysLeft" => $secondsLeft > 0 ? (int) ceil($secondsLeft / 86400) : 0,
    ];
}

function gopdf_subscription_is_active(?array $subscription): bool
{
    if (!$subscription) {
        return false;
    }

    if (strtolower(trim((string) ($subscription["status"] ?? ""))) !== "active") {
        return false;
    }

    $trialInfo = gopdf_subscription_trial_info($subscription);
    if ($trialInfo && ($trialInfo["isExpired"] ?? false)) {
        return false;
    }

    return true;
}

function gopdf_user_access_level(array $user, ?array $subscription = null): string
{
    $role = gopdf_normalize_role((string) ($user["role"] ?? ""));
    if ($role === "admin") {
        return "administrador";
    }

    if (gopdf_subscription_is_active($subscription)) {
        return "premium";
    }

    return "gratuito";
}

function gopdf_user_payload(array $user, ?array $subscription = null): array
{
    $role = gopdf_normalize_role((string) ($user["role"] ?? ""));
    $accessLevel = gopdf_user_access_level($user, $subscription);
    $trial = gopdf_subscription_trial_info($subscription);

    return [
        "id" => (int) ($user["id"] ?? 0),
        "fullName" => (string) ($user["full_name"] ?? ""),
        "email" => (string) ($user["email"] ?? ""),
        "phone" => (string) ($user["phone"] ?? ""),
        "role" => $role,
        "accessLevel" => $accessLevel,
        "isAdmin" => $role === "admin",
        "isPremium" => in_array($accessLevel, ["premium", "administrador"], true),
        "isFree" => $accessLevel === "gratuito",
        "trial" => $trial,
    ];
}

function gopdf_current_user(): ?array
{
    gopdf_start_session();
    $userId = $_SESSION["user_id"] ?? null;
    if (!is_int($userId) && !ctype_digit((string) $userId)) {
        return null;
    }

    $stmt = gopdf_db()->prepare("SELECT id, full_name, email, phone, role, asaas_customer_id, created_at, updated_at FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(["id" => (int) $userId]);
    $user = $stmt->fetch();
    if (!$user) {
        return null;
    }
    $user["role"] = gopdf_normalize_role((string) ($user["role"] ?? ""));
    return $user;
}

function gopdf_require_auth(): array
{
    $user = gopdf_current_user();
    if (!$user) {
        gopdf_fail("Sessão não autenticada.", 401);
    }
    return $user;
}

function gopdf_require_admin(): array
{
    $user = gopdf_require_auth();
    $isAdmin = gopdf_normalize_role((string) ($user["role"] ?? "")) === "admin";
    if (!$isAdmin) {
        gopdf_audit("admin.access", "denied", (int) ($user["id"] ?? 0), [
            "path" => (string) ($_SERVER["REQUEST_URI"] ?? ""),
        ]);
        gopdf_fail("Acesso restrito ao administrador.", 403);
    }
    return $user;
}
function gopdf_login_user(int $userId): void
{
    gopdf_start_session();
    session_regenerate_id(true);
    $_SESSION["user_id"] = $userId;
    $_SESSION["auth_at"] = time();
}

function gopdf_logout_user(): void
{
    gopdf_start_session();
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), "", [
            "expires" => time() - 42000,
            "path" => $params["path"],
            "domain" => $params["domain"] ?? "",
            "secure" => (bool) ($params["secure"] ?? false),
            "httponly" => (bool) ($params["httponly"] ?? true),
            "samesite" => $params["samesite"] ?? "Lax",
        ]);
    }
    session_destroy();
}

function gopdf_audit(
    string $action,
    string $status,
    ?int $userId = null,
    array $context = []
): void {
    try {
        $stmt = gopdf_db()->prepare(
            "INSERT INTO audit_logs (user_id, action, status, context_json, ip_address, user_agent)
             VALUES (:user_id, :action, :status, :context_json, :ip_address, :user_agent)"
        );
        $stmt->execute([
            "user_id" => $userId,
            "action" => $action,
            "status" => $status,
            "context_json" => json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            "ip_address" => gopdf_client_ip(),
            "user_agent" => gopdf_user_agent(),
        ]);
    } catch (Throwable $error) {
        // Não interrompe o fluxo por falha de auditoria.
    }
}

function gopdf_asaas_request(string $method, string $path, ?array $payload = null): array
{
    $config = gopdf_config();
    if ($config["asaas_api_key"] === "") {
        throw new RuntimeException("ASAAS_API_KEY não configurada.");
    }

    $url = rtrim($config["asaas_api_base"], "/") . "/" . ltrim($path, "/");
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException("Não foi possível iniciar requisição para o Asaas.");
    }

    $headers = [
        "Accept: application/json",
        "Content-Type: application/json",
        "access_token: " . $config["asaas_api_key"],
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);

    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    $raw = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        throw new RuntimeException("Falha na comunicação com o Asaas: " . $curlError);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException("Resposta inválida do Asaas.");
    }

    if ($httpCode >= 400) {
        $message = "Erro no Asaas.";
        if (!empty($decoded["errors"][0]["description"])) {
            $message = (string) $decoded["errors"][0]["description"];
        } elseif (!empty($decoded["message"])) {
            $message = (string) $decoded["message"];
        }
        throw new RuntimeException($message);
    }

    return $decoded;
}

function gopdf_require_webhook_secret(): void
{
    $expected = gopdf_config()["asaas_webhook_secret"];
    if ($expected === "") {
        return;
    }

    $provided = (string) (
        $_SERVER["HTTP_X_ASAAS_WEBHOOK_SECRET"] ??
        $_SERVER["HTTP_ASAAS_ACCESS_TOKEN"] ??
        $_GET["token"] ??
        ""
    );

    if (!hash_equals($expected, $provided)) {
        gopdf_fail("Webhook não autorizado.", 401);
    }
}

function gopdf_payment_event_signature(array $payload): string
{
    $event = (string) ($payload["event"] ?? "unknown");
    $paymentId = (string) ($payload["payment"]["id"] ?? $payload["payment"]["paymentId"] ?? "");
    $createdAt = (string) ($payload["payment"]["dateCreated"] ?? $payload["dateCreated"] ?? gmdate("c"));
    return hash("sha256", $event . "|" . $paymentId . "|" . $createdAt);
}

function gopdf_map_asaas_payment_status_to_subscription_status(?string $asaasStatus): ?string
{
    $normalized = strtoupper(trim((string) $asaasStatus));
    if ($normalized === "") {
        return null;
    }

    if (in_array($normalized, ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"], true)) {
        return "active";
    }

    if (in_array($normalized, ["PENDING", "AWAITING_RISK_ANALYSIS"], true)) {
        return "pending";
    }

    if (in_array($normalized, ["OVERDUE", "DUNNING_REQUESTED"], true)) {
        return "past_due";
    }

    if (in_array($normalized, [
        "DELETED",
        "REFUNDED",
        "REFUND_REQUESTED",
        "CHARGEBACK_REQUESTED",
        "CHARGEBACK_DISPUTE",
        "AWAITING_CHARGEBACK_REVERSAL",
    ], true)) {
        return "canceled";
    }

    return null;
}

function gopdf_map_asaas_event_to_subscription_status(string $event, ?string $paymentStatus = null): ?string
{
    $mappedFromPaymentStatus = gopdf_map_asaas_payment_status_to_subscription_status($paymentStatus);
    if ($mappedFromPaymentStatus !== null) {
        return $mappedFromPaymentStatus;
    }

    $normalized = strtoupper(trim($event));
    if ($normalized === "") {
        return null;
    }

    if (in_array($normalized, [
        "PAYMENT_RECEIVED",
        "PAYMENT_CONFIRMED",
        "PAYMENT_RECEIVED_IN_CASH",
        "PAYMENT_DUNNING_RECEIVED",
    ], true)) {
        return "active";
    }

    if (in_array($normalized, [
        "PAYMENT_CREATED",
        "PAYMENT_BANK_SLIP_VIEWED",
        "PAYMENT_AWAITING_RISK_ANALYSIS",
        "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
    ], true)) {
        return "pending";
    }

    if (in_array($normalized, ["PAYMENT_OVERDUE", "PAYMENT_DUNNING_REQUESTED"], true)) {
        return "past_due";
    }

    if (in_array($normalized, [
        "PAYMENT_DELETED",
        "PAYMENT_REFUNDED",
        "PAYMENT_REFUND_IN_PROGRESS",
        "PAYMENT_CHARGEBACK_REQUESTED",
        "PAYMENT_CHARGEBACK_DISPUTE",
        "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
    ], true)) {
        return "canceled";
    }

    return null;
}

function gopdf_resolve_subscription_status_transition(string $currentStatus, string $candidateStatus): string
{
    $current = strtolower(trim($currentStatus));
    $candidate = strtolower(trim($candidateStatus));

    if ($candidate === "") {
        return $current;
    }

    // Avoid accidental rollback when the provider sends a generic update after confirmation.
    if ($current === "active" && in_array($candidate, ["pending", "past_due"], true)) {
        return "active";
    }

    if ($current === "canceled" && in_array($candidate, ["pending", "past_due"], true)) {
        return "canceled";
    }

    return $candidate;
}

function gopdf_sync_subscription_status_from_asaas_payment(int $subscriptionId): array
{
    $result = [
        "subscriptionId" => $subscriptionId,
        "checked" => false,
        "updated" => false,
        "statusBefore" => null,
        "statusAfter" => null,
        "providerStatus" => null,
        "error" => null,
    ];

    if ($subscriptionId <= 0) {
        $result["error"] = "invalid_subscription_id";
        return $result;
    }

    $pdo = gopdf_db();
    $fetch = $pdo->prepare(
        "SELECT id, status, activated_at, asaas_payment_id
         FROM subscriptions
         WHERE id = :id
         LIMIT 1"
    );
    $fetch->execute(["id" => $subscriptionId]);
    $subscription = $fetch->fetch();
    if (!$subscription) {
        $result["error"] = "subscription_not_found";
        return $result;
    }

    $paymentId = trim((string) ($subscription["asaas_payment_id"] ?? ""));
    if ($paymentId === "") {
        $result["error"] = "missing_payment_id";
        return $result;
    }

    $statusBefore = strtolower(trim((string) ($subscription["status"] ?? "")));
    $result["statusBefore"] = $statusBefore;

    try {
        $paymentPayload = gopdf_asaas_request("GET", "/payments/" . rawurlencode($paymentId));
        $providerStatus = strtoupper(trim((string) ($paymentPayload["status"] ?? "")));
        $result["providerStatus"] = $providerStatus !== "" ? $providerStatus : null;
        $result["checked"] = true;

        $candidateStatus = gopdf_map_asaas_payment_status_to_subscription_status($providerStatus);
        if ($candidateStatus === null) {
            $result["statusAfter"] = $statusBefore;
            return $result;
        }

        $nextStatus = gopdf_resolve_subscription_status_transition($statusBefore, $candidateStatus);
        $result["statusAfter"] = $nextStatus;

        $activatedAtRaw = $subscription["activated_at"] ?? null;
        $needsActivationStamp = $nextStatus === "active" && (!is_string($activatedAtRaw) || trim($activatedAtRaw) === "");
        if ($nextStatus === $statusBefore && !$needsActivationStamp) {
            return $result;
        }

        $update = $pdo->prepare(
            "UPDATE subscriptions
             SET status = :status,
                 activated_at = CASE WHEN :status = 'active' AND activated_at IS NULL THEN CURRENT_TIMESTAMP ELSE activated_at END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id"
        );
        $update->execute([
            "status" => $nextStatus,
            "id" => $subscriptionId,
        ]);
        $result["updated"] = $update->rowCount() > 0;

        return $result;
    } catch (Throwable $error) {
        $result["error"] = $error->getMessage();
        return $result;
    }
}

function gopdf_sync_pending_subscriptions_from_asaas(int $limit = 20): array
{
    $limit = max(1, min($limit, 80));
    $summary = [
        "scheduled" => 0,
        "checked" => 0,
        "updated" => 0,
        "errors" => 0,
        "activated" => 0,
    ];

    $pdo = gopdf_db();
    $stmt = $pdo->prepare(
        "SELECT id
         FROM subscriptions
         WHERE LOWER(TRIM(COALESCE(status, ''))) IN ('pending', 'past_due')
           AND COALESCE(TRIM(asaas_payment_id), '') <> ''
         ORDER BY updated_at ASC, id ASC
         LIMIT :limit"
    );
    $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll() ?: [];
    $summary["scheduled"] = count($rows);

    foreach ($rows as $row) {
        $subscriptionId = (int) ($row["id"] ?? 0);
        if ($subscriptionId <= 0) {
            continue;
        }

        $syncResult = gopdf_sync_subscription_status_from_asaas_payment($subscriptionId);
        if (!empty($syncResult["checked"])) {
            $summary["checked"] += 1;
        }
        if (!empty($syncResult["updated"])) {
            $summary["updated"] += 1;
        }
        if (($syncResult["statusAfter"] ?? null) === "active") {
            $summary["activated"] += 1;
        }
        if (!empty($syncResult["error"])) {
            $summary["errors"] += 1;
        }
    }

    return $summary;
}

