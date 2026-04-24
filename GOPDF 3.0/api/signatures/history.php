<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("GET");
gopdf_same_origin_check();
$user = gopdf_require_auth();
gopdf_ensure_signature_validations_table();

$limit = (int) ($_GET["limit"] ?? 10);
if ($limit < 1) {
    $limit = 1;
}
if ($limit > 100) {
    $limit = 100;
}

$status = strtolower(trim((string) ($_GET["status"] ?? "")));
$allowedStatus = ["pending", "aprovado", "reprovado", "indeterminado"];
$hasStatusFilter = in_array($status, $allowedStatus, true);

$sql = "SELECT id, file_name, file_sha256, local_signatures_count, local_has_byterange, local_has_pkcs7,
               local_summary_json, icp_status, iti_protocol, iti_report_url, iti_verifier_url, notes,
               finished_at, created_at, updated_at
        FROM signature_validations
        WHERE user_id = :user_id";
if ($hasStatusFilter) {
    $sql .= " AND icp_status = :icp_status";
}
$sql .= " ORDER BY id DESC LIMIT :limit";

$stmt = gopdf_db()->prepare($sql);
$stmt->bindValue(":user_id", (int) $user["id"], PDO::PARAM_INT);
if ($hasStatusFilter) {
    $stmt->bindValue(":icp_status", $status, PDO::PARAM_STR);
}
$stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll();

$history = [];
foreach ($rows as $row) {
    $history[] = [
        "id" => (int) ($row["id"] ?? 0),
        "fileName" => (string) ($row["file_name"] ?? ""),
        "fileSha256" => (string) ($row["file_sha256"] ?? ""),
        "localSignaturesCount" => (int) ($row["local_signatures_count"] ?? 0),
        "localHasByteRange" => ((int) ($row["local_has_byterange"] ?? 0)) === 1,
        "localHasPkcs7" => ((int) ($row["local_has_pkcs7"] ?? 0)) === 1,
        "localSummaryJson" => $row["local_summary_json"],
        "icpStatus" => (string) ($row["icp_status"] ?? "pending"),
        "itiProtocol" => (string) ($row["iti_protocol"] ?? ""),
        "itiReportUrl" => (string) ($row["iti_report_url"] ?? ""),
        "itiVerifierUrl" => (string) ($row["iti_verifier_url"] ?? ""),
        "notes" => (string) ($row["notes"] ?? ""),
        "finishedAt" => $row["finished_at"],
        "createdAt" => $row["created_at"],
        "updatedAt" => $row["updated_at"],
    ];
}

gopdf_ok([
    "statusFilter" => $hasStatusFilter ? $status : null,
    "limit" => $limit,
    "history" => $history,
]);

