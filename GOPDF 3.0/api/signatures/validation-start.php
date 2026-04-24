<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
$user = gopdf_require_auth();
gopdf_ensure_signature_validations_table();

$input = gopdf_json_input();
$fileName = mb_substr(trim((string) ($input["fileName"] ?? "")), 0, 255);
$fileSha256 = strtolower(trim((string) ($input["fileSha256"] ?? "")));

if ($fileName === "") {
    gopdf_fail("Informe o nome do arquivo.", 422);
}

if (preg_match('/^[a-f0-9]{64}$/', $fileSha256) !== 1) {
    gopdf_fail("Hash SHA-256 invalido.", 422);
}

$verifierUrl = trim((string) ($input["verifierUrl"] ?? "https://verificador.iti.gov.br/"));
if ($verifierUrl === "") {
    $verifierUrl = "https://verificador.iti.gov.br/";
}
if (filter_var($verifierUrl, FILTER_VALIDATE_URL) === false) {
    gopdf_fail("URL do verificador ITI invalida.", 422);
}
$verifierUrl = mb_substr($verifierUrl, 0, 255);

$summaryInput = $input["localSummary"] ?? [];
if (!is_array($summaryInput)) {
    $summaryInput = [];
}

$signatureCount = max(0, (int) ($summaryInput["signatureCount"] ?? 0));
$hasByteRange = !empty($summaryInput["hasByteRange"]) ? 1 : 0;
$hasPkcs7 = (!empty($summaryInput["hasPkcs7"]) || !empty($summaryInput["hasCades"])) ? 1 : 0;

$summaryPayload = [
    "signatureCount" => $signatureCount,
    "hasByteRange" => $hasByteRange === 1,
    "hasPkcs7" => $hasPkcs7 === 1,
    "subfiltersCount" => max(0, (int) ($summaryInput["subfiltersCount"] ?? 0)),
    "byteRangesCount" => max(0, (int) ($summaryInput["byteRangesCount"] ?? 0)),
    "detectedAt" => date(DATE_ATOM),
];

$insert = gopdf_db()->prepare(
    "INSERT INTO signature_validations (
        user_id, file_name, file_sha256, local_signatures_count, local_has_byterange,
        local_has_pkcs7, local_summary_json, icp_status, iti_verifier_url
    ) VALUES (
        :user_id, :file_name, :file_sha256, :local_signatures_count, :local_has_byterange,
        :local_has_pkcs7, :local_summary_json, 'pending', :iti_verifier_url
    )"
);

$insert->execute([
    "user_id" => (int) $user["id"],
    "file_name" => $fileName,
    "file_sha256" => $fileSha256,
    "local_signatures_count" => $signatureCount,
    "local_has_byterange" => $hasByteRange,
    "local_has_pkcs7" => $hasPkcs7,
    "local_summary_json" => json_encode($summaryPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    "iti_verifier_url" => $verifierUrl,
]);

$validationId = (int) gopdf_db()->lastInsertId();

gopdf_audit("signature.validation.start", "success", (int) $user["id"], [
    "validationId" => $validationId,
    "fileName" => $fileName,
    "fileSha256" => $fileSha256,
    "signatureCount" => $signatureCount,
]);

gopdf_ok([
    "message" => "Validacao ICP-Brasil iniciada.",
    "validation" => [
        "id" => $validationId,
        "fileName" => $fileName,
        "fileSha256" => $fileSha256,
        "icpStatus" => "pending",
        "itiVerifierUrl" => $verifierUrl,
        "createdAt" => date("Y-m-d H:i:s"),
    ],
], 201);

