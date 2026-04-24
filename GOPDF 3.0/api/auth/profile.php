<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("GET");
$user = gopdf_require_auth();
gopdf_ensure_user_profiles_table();

$defaults = [
    "documentType" => "",
    "documentNumber" => "",
    "addressZip" => "",
    "addressStreet" => "",
    "addressNumber" => "",
    "addressComplement" => "",
    "addressDistrict" => "",
    "addressCity" => "",
    "addressState" => "",
    "addressCountry" => "Brasil",
];

$stmt = gopdf_db()->prepare(
    "SELECT document_type, document_number, address_zip, address_street, address_number,
            address_complement, address_district, address_city, address_state, address_country
     FROM user_profiles
     WHERE user_id = :user_id
     LIMIT 1"
);
$stmt->execute(["user_id" => (int) $user["id"]]);
$row = $stmt->fetch() ?: [];

$profile = array_merge($defaults, [
    "documentType" => strtolower(trim((string) ($row["document_type"] ?? ""))),
    "documentNumber" => gopdf_digits_only((string) ($row["document_number"] ?? "")),
    "addressZip" => trim((string) ($row["address_zip"] ?? "")),
    "addressStreet" => trim((string) ($row["address_street"] ?? "")),
    "addressNumber" => trim((string) ($row["address_number"] ?? "")),
    "addressComplement" => trim((string) ($row["address_complement"] ?? "")),
    "addressDistrict" => trim((string) ($row["address_district"] ?? "")),
    "addressCity" => trim((string) ($row["address_city"] ?? "")),
    "addressState" => trim((string) ($row["address_state"] ?? "")),
    "addressCountry" => trim((string) ($row["address_country"] ?? "Brasil")),
]);

if ($profile["documentType"] === "" && $profile["documentNumber"] !== "") {
    $profile["documentType"] = strlen($profile["documentNumber"]) === 14 ? "cnpj" : "cpf";
}

$subscription = gopdf_latest_subscription_for_user((int) $user["id"]);

gopdf_ok([
    "authenticated" => true,
    "user" => gopdf_user_payload($user, $subscription),
    "subscription" => $subscription,
    "profile" => $profile,
]);
