<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . "/_bootstrap.php";

gopdf_require_method("GET");
gopdf_start_session();

function gopdf_oauth_start_redirect_error(string $provider, string $next, string $message): void
{
    $redirectPath = gopdf_append_query_params("entrar.html", [
        "next" => $next,
        "auth" => "social-error",
        "provider" => $provider !== "" ? $provider : "social",
        "message" => $message,
    ]);
    gopdf_redirect($redirectPath);
}

function gopdf_oauth_provider_start_config(string $provider): ?array
{
    $config = gopdf_config();
    if ($provider === "google") {
        $clientId = trim((string) $config["google_oauth_client_id"]);
        $clientSecret = trim((string) $config["google_oauth_client_secret"]);
        if ($clientId === "" || $clientSecret === "") {
            return null;
        }

        return [
            "authorize_url" => "https://accounts.google.com/o/oauth2/v2/auth",
            "query" => [
                "client_id" => $clientId,
                "redirect_uri" => gopdf_oauth_callback_url(),
                "response_type" => "code",
                "scope" => "openid email profile",
                "prompt" => "select_account",
                "include_granted_scopes" => "true",
            ],
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
            "authorize_url" => "https://login.microsoftonline.com/" . rawurlencode($tenant) . "/oauth2/v2.0/authorize",
            "query" => [
                "client_id" => $clientId,
                "redirect_uri" => gopdf_oauth_callback_url(),
                "response_type" => "code",
                "response_mode" => "query",
                "scope" => "openid profile email User.Read",
                "prompt" => "select_account",
            ],
        ];
    }

    return null;
}

$provider = strtolower(trim((string) ($_GET["provider"] ?? "")));
$next = gopdf_normalize_next_path((string) ($_GET["next"] ?? "index.html"), "index.html");

if (!in_array($provider, ["google", "microsoft"], true)) {
    gopdf_oauth_start_redirect_error($provider, $next, "Provedor social invalido.");
}

$providerConfig = gopdf_oauth_provider_start_config($provider);
if (!$providerConfig) {
    gopdf_oauth_start_redirect_error(
        $provider,
        $next,
        "Login social temporariamente indisponivel para este provedor."
    );
}

try {
    $state = bin2hex(random_bytes(24));
} catch (Throwable $error) {
    gopdf_oauth_start_redirect_error($provider, $next, "Falha ao iniciar autenticacao social.");
}

$now = time();
$pendingRaw = $_SESSION["oauth_pending"] ?? [];
$pending = [];
if (is_array($pendingRaw)) {
    foreach ($pendingRaw as $stateKey => $statePayload) {
        if (!is_string($stateKey) || !is_array($statePayload)) {
            continue;
        }
        $createdAt = (int) ($statePayload["created_at"] ?? 0);
        if ($createdAt > 0 && ($now - $createdAt) <= 900) {
            $pending[$stateKey] = $statePayload;
        }
    }
}

$pending[$state] = [
    "provider" => $provider,
    "next" => $next,
    "created_at" => $now,
];
$_SESSION["oauth_pending"] = $pending;

$query = $providerConfig["query"];
$query["state"] = $state;
$authorizationUrl = $providerConfig["authorize_url"] . "?" . http_build_query($query);
header("Location: " . $authorizationUrl, true, 302);
exit;
