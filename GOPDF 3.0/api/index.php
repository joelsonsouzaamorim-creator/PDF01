<?php
declare(strict_types=1);

require_once __DIR__ . "/_bootstrap.php";

gopdf_ok([
    "service" => "gopdf-api",
    "status" => "up",
    "environment" => gopdf_config()["app_env"],
    "timestamp" => date(DATE_ATOM),
]);
