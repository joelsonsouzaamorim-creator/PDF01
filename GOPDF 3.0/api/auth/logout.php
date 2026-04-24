<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();

$user = gopdf_current_user();
gopdf_logout_user();
gopdf_audit("auth.logout", "success", $user ? (int) $user["id"] : null);

gopdf_ok(["message" => "Sessão encerrada com sucesso."]);
