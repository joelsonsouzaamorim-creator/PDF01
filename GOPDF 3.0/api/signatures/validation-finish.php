<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
$user = gopdf_require_auth();
gopdf_ensure_signature_validations_table();

$input = gopdf_json_input();
$validationId = (int) ($input["validationId"] ?? 0);
$fileSha256 = strtolower(trim((string) ($input["fileSha256"] ?? "")));
$rawStatus = strtolower(trim((string) ($input["icpStatus"] ?? "")));

$statusMap = [
    "approved" => "aprovado",
    "aprovado" => "aprovado",
    "rejected" => "reprovado",
    "reprovado" => "reprovado",
    "indeterminate" => "indeterminado",
    "indeterminado" => "indeterminado",
];

if (!array_key_exists($rawStatus, $statusMap)) {
    gopdf_fail("Status ICP-Brasil invalido. Use: aprovado, reprovado ou indeterminado.", 422);
}
$icpStatus = $statusMap[$rawStatus];

if ($validationId <= 0 && preg_match('/^[a-f0-9]{64}$/', $fileSha256) !== 1) {
    gopdf_fail("Informe validationId valido ou hash SHA-256 valido.", 422);
}

$itiProtocol = mb_substr(trim((string) ($input["itiProtocol"] ?? "")), 0, 120);
$itiReportUrl = mb_substr(trim((string) ($input["itiReportUrl"] ?? "")), 0, 255);
$notes = mb_substr(trim((string) ($input["notes"] ?? "")), 0, 4000);
$verifierUrl = mb_substr(trim((string) ($input["verifierUrl"] ?? "")), 0, 255);

if ($itiReportUrl !== "" && filter_var($itiReportUrl, FILTER_VALIDATE_URL) === false) {
    gopdf_fail("URL do relatorio ITI invalida.", 422);
}

if ($verifierUrl !== "" && filter_var($verifierUrl, FILTER_VALIDATE_URL) === false) {
    gopdf_fail("URL do verificador ITI invalida.", 422);
}

$pdo = gopdf_db();
$targetStmt = null;

if ($validationId > 0) {
    $targetStmt = $pdo->prepare(
        "SELECT id, user_id, file_name, file_sha256
         FROM signature_validations
         WHERE id = :id
           AND user_id = :user_id
         LIMIT 1"
    );
    $targetStmt->execute([
        "id" => $validationId,
        "user_id" => (int) $user["id"],
    ]);
} else {
    $targetStmt = $pdo->prepare(
        "SELECT id, user_id, file_name, file_sha256
         FROM signature_validations
         WHERE user_id = :user_id
           AND file_sha256 = :file_sha256
         ORDER BY id DESC
         LIMIT 1"
    );
    $targetStmt->execute([
        "user_id" => (int) $user["id"],
        "file_sha256" => $fileSha256,
    ]);
}

$target = $targetStmt ? ($targetStmt->fetch() ?: null) : null;
if (!$target) {
    gopdf_fail("Registro de validacao nao encontrado para este usuario.", 404);
}

$update = $pdo->prepare(
    "UPDATE signature_validations
     SET icp_status = :icp_status,
         iti_protocol = :iti_protocol,
         iti_report_url = :iti_report_url,
         iti_verifier_url = CASE WHEN :iti_verifier_url = '' THEN iti_verifier_url ELSE :iti_verifier_url END,
         notes = :notes,
         finished_at = CURRENT_TIMESTAMP
     WHERE id = :id
       AND user_id = :user_id"
);

$update->execute([
    "id" => (int) $target["id"],
    "user_id" => (int) $user["id"],
    "icp_status" => $icpStatus,
    "iti_protocol" => $itiProtocol !== "" ? $itiProtocol : null,
    "iti_report_url" => $itiReportUrl !== "" ? $itiReportUrl : null,
    "iti_verifier_url" => $verifierUrl,
    "notes" => $notes !== "" ? $notes : null,
]);

$resultStmt = $pdo->prepare(
    "SELECT id, file_name, file_sha256, local_signatures_count, local_has_byterange, local_has_pkcs7,
            local_summary_json, icp_status, iti_protocol, iti_report_url, iti_verifier_url, notes,
            finished_at, created_at, updated_at
     FROM signature_validations
     WHERE id = :id
       AND user_id = :user_id
     LIMIT 1"
);
$resultStmt->execute([
    "id" => (int) $target["id"],
    "user_id" => (int) $user["id"],
]);
$validation = $resultStmt->fetch();

if (!$validation) {
    gopdf_fail("Nao foi possivel carregar o registro atualizado.", 500);
}

gopdf_audit("signature.validation.finish", "success", (int) $user["id"], [
    "validationId" => (int) $validation["id"],
    "fileName" => (string) ($validation["file_name"] ?? ""),
    "fileSha256" => (string) ($validation["file_sha256"] ?? ""),
    "icpStatus" => (string) ($validation["icp_status"] ?? ""),
]);

gopdf_ok([
    "message" => "Validacao ICP-Brasil registrada com sucesso.",
    "validation" => [
        "id" => (int) $validation["id"],
        "fileName" => (string) ($validation["file_name"] ?? ""),
        "fileSha256" => (string) ($validation["file_sha256"] ?? ""),
        "localSignaturesCount" => (int) ($validation["local_signatures_count"] ?? 0),
        "localHasByteRange" => ((int) ($validation["local_has_byterange"] ?? 0)) === 1,
        "localHasPkcs7" => ((int) ($validation["local_has_pkcs7"] ?? 0)) === 1,
        "icpStatus" => (string) ($validation["icp_status"] ?? "pending"),
        "itiProtocol" => (string) ($validation["iti_protocol"] ?? ""),
        "itiReportUrl" => (string) ($validation["iti_report_url"] ?? ""),
        "itiVerifierUrl" => (string) ($validation["iti_verifier_url"] ?? ""),
        "notes" => (string) ($validation["notes"] ?? ""),
        "finishedAt" => $validation["finished_at"],
        "createdAt" => $validation["created_at"],
        "updatedAt" => $validation["updated_at"],
    ],
]);

