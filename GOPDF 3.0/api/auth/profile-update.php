<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
$user = gopdf_require_auth();
gopdf_ensure_user_profiles_table();

$input = gopdf_json_input();

$fullName = trim((string) ($input["fullName"] ?? ""));
$email = strtolower(trim((string) ($input["email"] ?? "")));
$phone = gopdf_digits_only((string) ($input["phone"] ?? ""));

if (mb_strlen($fullName) < 6 || !str_contains($fullName, " ")) {
    gopdf_fail("Informe um nome completo valido.");
}
if (!gopdf_email_valid($email)) {
    gopdf_fail("Informe um email valido.");
}
if (strlen($phone) < 10) {
    gopdf_fail("Informe um telefone com DDD.");
}

$documentType = strtolower(trim((string) ($input["documentType"] ?? "")));
$documentNumber = gopdf_digits_only((string) ($input["documentNumber"] ?? ""));
if (!in_array($documentType, ["", "cpf", "cnpj"], true)) {
    gopdf_fail("Tipo de documento invalido.");
}
if ($documentNumber !== "" && !in_array(strlen($documentNumber), [11, 14], true)) {
    gopdf_fail("CPF/CNPJ invalido.");
}
if ($documentNumber === "" && $documentType !== "") {
    gopdf_fail("Informe o numero do documento.");
}
if ($documentNumber !== "" && $documentType === "") {
    $documentType = strlen($documentNumber) === 14 ? "cnpj" : "cpf";
}
if ($documentType === "cpf" && $documentNumber !== "" && strlen($documentNumber) !== 11) {
    gopdf_fail("CPF invalido.");
}
if ($documentType === "cnpj" && $documentNumber !== "" && strlen($documentNumber) !== 14) {
    gopdf_fail("CNPJ invalido.");
}

$toNullable = static function ($value, int $maxLength): ?string {
    $text = trim((string) $value);
    if ($text === "") {
        return null;
    }
    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength);
    }
    return $text;
};

$profileData = [
    "document_type" => $documentType !== "" ? $documentType : null,
    "document_number" => $documentNumber !== "" ? $documentNumber : null,
    "address_zip" => $toNullable($input["addressZip"] ?? "", 20),
    "address_street" => $toNullable($input["addressStreet"] ?? "", 160),
    "address_number" => $toNullable($input["addressNumber"] ?? "", 30),
    "address_complement" => $toNullable($input["addressComplement"] ?? "", 120),
    "address_district" => $toNullable($input["addressDistrict"] ?? "", 120),
    "address_city" => $toNullable($input["addressCity"] ?? "", 120),
    "address_state" => $toNullable($input["addressState"] ?? "", 40),
    "address_country" => $toNullable($input["addressCountry"] ?? "Brasil", 80),
];
if ($profileData["address_country"] === null) {
    $profileData["address_country"] = "Brasil";
}

$currentPassword = (string) ($input["currentPassword"] ?? "");
$newPassword = (string) ($input["newPassword"] ?? "");
$confirmNewPassword = (string) ($input["confirmNewPassword"] ?? "");
$wantsPasswordChange = $currentPassword !== "" || $newPassword !== "" || $confirmNewPassword !== "";

if ($wantsPasswordChange) {
    if ($currentPassword === "" || $newPassword === "" || $confirmNewPassword === "") {
        gopdf_fail("Para alterar a senha, preencha senha atual, nova senha e confirmacao.");
    }
    if (strlen($newPassword) < 8) {
        gopdf_fail("A nova senha deve ter pelo menos 8 caracteres.");
    }
    if (!hash_equals($newPassword, $confirmNewPassword)) {
        gopdf_fail("A confirmacao da nova senha nao confere.");
    }
}

$pdo = gopdf_db();
$userId = (int) $user["id"];
$newPasswordHash = null;
$originalUser = null;
$originalProfile = [];
$emailNotificationEnabled = gopdf_profile_update_email_enabled();
$emailNotificationSent = null;
$changedSummary = [];

try {
    $emailCheck = $pdo->prepare("SELECT id FROM users WHERE email = :email AND id <> :id LIMIT 1");
    $emailCheck->execute([
        "email" => $email,
        "id" => $userId,
    ]);
    if ($emailCheck->fetch()) {
        gopdf_fail("Ja existe outra conta com esse email.", 409);
    }

    $originalUserStmt = $pdo->prepare(
        "SELECT id, full_name, email, phone, password_hash
         FROM users
         WHERE id = :id
         LIMIT 1"
    );
    $originalUserStmt->execute(["id" => $userId]);
    $originalUser = $originalUserStmt->fetch();
    if (!$originalUser) {
        gopdf_fail("Usuario nao encontrado.", 404);
    }

    $originalProfileStmt = $pdo->prepare(
        "SELECT document_type, document_number, address_zip, address_street, address_number,
                address_complement, address_district, address_city, address_state, address_country
         FROM user_profiles
         WHERE user_id = :user_id
         LIMIT 1"
    );
    $originalProfileStmt->execute(["user_id" => $userId]);
    $originalProfile = $originalProfileStmt->fetch() ?: [];

    if ($wantsPasswordChange) {
        $passwordHash = (string) ($originalUser["password_hash"] ?? "");
        if ($passwordHash === "" || !password_verify($currentPassword, $passwordHash)) {
            gopdf_fail("Senha atual invalida.", 422);
        }

        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        if ($newPasswordHash === false) {
            gopdf_fail("Nao foi possivel atualizar a senha.", 500);
        }
    }

    $pdo->beginTransaction();

    $updateUser = $pdo->prepare(
        "UPDATE users
         SET full_name = :full_name,
             email = :email,
             phone = :phone
         WHERE id = :id"
    );
    $updateUser->execute([
        "full_name" => $fullName,
        "email" => $email,
        "phone" => $phone,
        "id" => $userId,
    ]);

    if ($newPasswordHash !== null) {
        $updatePassword = $pdo->prepare("UPDATE users SET password_hash = :password_hash WHERE id = :id");
        $updatePassword->execute([
            "password_hash" => $newPasswordHash,
            "id" => $userId,
        ]);
    }

    $upsertProfile = $pdo->prepare(
        "INSERT INTO user_profiles (
            user_id, document_type, document_number, address_zip, address_street, address_number,
            address_complement, address_district, address_city, address_state, address_country
        ) VALUES (
            :user_id, :document_type, :document_number, :address_zip, :address_street, :address_number,
            :address_complement, :address_district, :address_city, :address_state, :address_country
        )
        ON DUPLICATE KEY UPDATE
            document_type = VALUES(document_type),
            document_number = VALUES(document_number),
            address_zip = VALUES(address_zip),
            address_street = VALUES(address_street),
            address_number = VALUES(address_number),
            address_complement = VALUES(address_complement),
            address_district = VALUES(address_district),
            address_city = VALUES(address_city),
            address_state = VALUES(address_state),
            address_country = VALUES(address_country)"
    );
    $upsertProfile->execute([
        "user_id" => $userId,
        "document_type" => $profileData["document_type"],
        "document_number" => $profileData["document_number"],
        "address_zip" => $profileData["address_zip"],
        "address_street" => $profileData["address_street"],
        "address_number" => $profileData["address_number"],
        "address_complement" => $profileData["address_complement"],
        "address_district" => $profileData["address_district"],
        "address_city" => $profileData["address_city"],
        "address_state" => $profileData["address_state"],
        "address_country" => $profileData["address_country"],
    ]);

    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    gopdf_audit("auth.profile.update", "error", $userId, [
        "error" => $error->getMessage(),
    ]);
    gopdf_fail("Nao foi possivel atualizar o perfil.", 500);
}

$updatedUser = gopdf_current_user();
if (!$updatedUser) {
    gopdf_fail("Sessao invalida apos atualizacao.", 401);
}

$subscription = gopdf_latest_subscription_for_user((int) $updatedUser["id"]);

$profileStmt = $pdo->prepare(
    "SELECT document_type, document_number, address_zip, address_street, address_number,
            address_complement, address_district, address_city, address_state, address_country
     FROM user_profiles
     WHERE user_id = :user_id
     LIMIT 1"
);
$profileStmt->execute(["user_id" => (int) $updatedUser["id"]]);
$profileRow = $profileStmt->fetch() ?: [];

$profile = [
    "documentType" => strtolower(trim((string) ($profileRow["document_type"] ?? ""))),
    "documentNumber" => gopdf_digits_only((string) ($profileRow["document_number"] ?? "")),
    "addressZip" => trim((string) ($profileRow["address_zip"] ?? "")),
    "addressStreet" => trim((string) ($profileRow["address_street"] ?? "")),
    "addressNumber" => trim((string) ($profileRow["address_number"] ?? "")),
    "addressComplement" => trim((string) ($profileRow["address_complement"] ?? "")),
    "addressDistrict" => trim((string) ($profileRow["address_district"] ?? "")),
    "addressCity" => trim((string) ($profileRow["address_city"] ?? "")),
    "addressState" => trim((string) ($profileRow["address_state"] ?? "")),
    "addressCountry" => trim((string) ($profileRow["address_country"] ?? "Brasil")),
];

if ($profile["documentType"] === "" && $profile["documentNumber"] !== "") {
    $profile["documentType"] = strlen($profile["documentNumber"]) === 14 ? "cnpj" : "cpf";
}

$toComparable = static function ($value): string {
    return trim((string) ($value ?? ""));
};

$maskDigits = static function (string $value): string {
    $digits = gopdf_digits_only($value);
    if ($digits === "") {
        return "nao informado";
    }
    if (strlen($digits) <= 4) {
        return str_repeat("*", strlen($digits));
    }
    return str_repeat("*", strlen($digits) - 4) . substr($digits, -4);
};

$formatForEmail = static function (string $key, string $value) use ($maskDigits): string {
    if (trim($value) === "") {
        return "nao informado";
    }
    if ($key === "phone" || $key === "document_number") {
        return $maskDigits($value);
    }
    if ($key === "document_type") {
        return strtoupper($value);
    }
    return $value;
};

$fieldLabels = [
    "full_name" => "Nome completo",
    "email" => "Email",
    "phone" => "Telefone",
    "document_type" => "Tipo de documento",
    "document_number" => "Documento",
    "address_zip" => "CEP",
    "address_street" => "Rua",
    "address_number" => "Numero",
    "address_complement" => "Complemento",
    "address_district" => "Bairro",
    "address_city" => "Cidade",
    "address_state" => "Estado",
    "address_country" => "Pais",
];

$beforeComparable = [
    "full_name" => $toComparable($originalUser["full_name"] ?? ""),
    "email" => strtolower($toComparable($originalUser["email"] ?? "")),
    "phone" => gopdf_digits_only((string) ($originalUser["phone"] ?? "")),
    "document_type" => strtolower($toComparable($originalProfile["document_type"] ?? "")),
    "document_number" => gopdf_digits_only((string) ($originalProfile["document_number"] ?? "")),
    "address_zip" => $toComparable($originalProfile["address_zip"] ?? ""),
    "address_street" => $toComparable($originalProfile["address_street"] ?? ""),
    "address_number" => $toComparable($originalProfile["address_number"] ?? ""),
    "address_complement" => $toComparable($originalProfile["address_complement"] ?? ""),
    "address_district" => $toComparable($originalProfile["address_district"] ?? ""),
    "address_city" => $toComparable($originalProfile["address_city"] ?? ""),
    "address_state" => $toComparable($originalProfile["address_state"] ?? ""),
    "address_country" => $toComparable($originalProfile["address_country"] ?? ""),
];

$afterComparable = [
    "full_name" => $toComparable($updatedUser["full_name"] ?? ""),
    "email" => strtolower($toComparable($updatedUser["email"] ?? "")),
    "phone" => gopdf_digits_only((string) ($updatedUser["phone"] ?? "")),
    "document_type" => strtolower($toComparable($profileRow["document_type"] ?? "")),
    "document_number" => gopdf_digits_only((string) ($profileRow["document_number"] ?? "")),
    "address_zip" => $toComparable($profileRow["address_zip"] ?? ""),
    "address_street" => $toComparable($profileRow["address_street"] ?? ""),
    "address_number" => $toComparable($profileRow["address_number"] ?? ""),
    "address_complement" => $toComparable($profileRow["address_complement"] ?? ""),
    "address_district" => $toComparable($profileRow["address_district"] ?? ""),
    "address_city" => $toComparable($profileRow["address_city"] ?? ""),
    "address_state" => $toComparable($profileRow["address_state"] ?? ""),
    "address_country" => $toComparable($profileRow["address_country"] ?? ""),
];

foreach ($fieldLabels as $key => $label) {
    if (($beforeComparable[$key] ?? "") === ($afterComparable[$key] ?? "")) {
        continue;
    }

    $beforeText = $formatForEmail($key, (string) ($beforeComparable[$key] ?? ""));
    $afterText = $formatForEmail($key, (string) ($afterComparable[$key] ?? ""));
    $changedSummary[] = $label . ": " . $beforeText . " -> " . $afterText;
}

if ($newPasswordHash !== null) {
    $changedSummary[] = "Senha: alterada.";
}

$notificationTargets = [];
$possibleTargets = [
    (string) ($originalUser["email"] ?? ""),
    (string) ($updatedUser["email"] ?? ""),
];
foreach ($possibleTargets as $possibleEmail) {
    $normalizedEmail = strtolower(trim($possibleEmail));
    if (gopdf_email_valid($normalizedEmail)) {
        $notificationTargets[$normalizedEmail] = $normalizedEmail;
    }
}
$notificationTargets = array_values($notificationTargets);

if ($emailNotificationEnabled && !empty($changedSummary) && !empty($notificationTargets)) {
    $emailNotificationSent = gopdf_send_profile_update_notification_email(
        $notificationTargets,
        (string) ($updatedUser["full_name"] ?? $fullName),
        $changedSummary
    );
    gopdf_audit(
        "auth.profile.update.email_notification",
        $emailNotificationSent ? "success" : "warning",
        (int) $updatedUser["id"],
        [
            "targets" => $notificationTargets,
            "changedFields" => count($changedSummary),
        ]
    );
} elseif (!$emailNotificationEnabled) {
    gopdf_audit("auth.profile.update.email_notification", "skipped", (int) $updatedUser["id"], [
        "reason" => "disabled_by_config",
    ]);
} elseif (empty($changedSummary)) {
    gopdf_audit("auth.profile.update.email_notification", "skipped", (int) $updatedUser["id"], [
        "reason" => "no_changes_detected",
    ]);
} else {
    gopdf_audit("auth.profile.update.email_notification", "warning", (int) $updatedUser["id"], [
        "reason" => "no_valid_recipient",
    ]);
}

gopdf_audit("auth.profile.update", "success", (int) $updatedUser["id"], [
    "passwordChanged" => $newPasswordHash !== null,
    "changedFields" => count($changedSummary),
]);

gopdf_ok([
    "message" => "Perfil atualizado com sucesso.",
    "emailNotificationEnabled" => $emailNotificationEnabled,
    "emailNotificationSent" => $emailNotificationSent,
    "changedFields" => count($changedSummary),
    "user" => gopdf_user_payload($updatedUser, $subscription),
    "subscription" => $subscription,
    "profile" => $profile,
]);
