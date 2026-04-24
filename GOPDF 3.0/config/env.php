<?php
declare(strict_types=1);

if (!function_exists("gopdf_load_env")) {
    function gopdf_load_env(string $path): void
    {
        if (!is_file($path) || !is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === "" || str_starts_with($line, "#")) {
                continue;
            }

            [$rawKey, $rawValue] = array_pad(explode("=", $line, 2), 2, "");
            $key = trim($rawKey);
            $value = trim($rawValue);

            if ($key === "" || getenv($key) !== false) {
                continue;
            }

            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            putenv($key . "=" . $value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

gopdf_load_env(dirname(__DIR__) . DIRECTORY_SEPARATOR . ".env");
