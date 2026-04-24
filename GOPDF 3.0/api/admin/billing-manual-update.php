<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
$adminUser = gopdf_require_admin();

$input = $_POST;
if (!is_array($input) || empty($input)) {
    $input = gopdf_json_input();
}

$subscriptionId = (int) ($input["subscriptionId"] ?? 0);
$manualStatus = strtolower(trim((string) ($input["manualStatus"] ?? "")));
$paymentDateRaw = trim((string) ($input["paymentDate"] ?? ""));
$transactionId = trim((string) ($input["transactionId"] ?? ""));
$proofNote = trim((string) ($input["proofNote"] ?? ""));
$paidAmountRaw = trim((string) ($input["paidAmount"] ?? ""));

$allowedStatuses = ["active", "pending", "past_due", "canceled"];
if ($subscriptionId <= 0) {
    gopdf_fail("Informe um subscriptionId valido.", 422);
}
if (!in_array($manualStatus, $allowedStatuses, true)) {
    gopdf_fail("Status manual invalido. Use active, pending, past_due ou canceled.", 422);
}

$transactionId = mb_substr($transactionId, 0, 120);
$proofNote = mb_substr($proofNote, 0, 1200);

$paidAt = null;
if ($paymentDateRaw !== "") {
    $paymentDateNormalized = str_replace("T", " ", $paymentDateRaw);
    try {
        $paidAt = (new DateTimeImmutable($paymentDateNormalized))->format("Y-m-d H:i:s");
    } catch (Throwable $error) {
        gopdf_fail("Data de pagamento invalida. Use um formato valido.", 422);
    }
}

$paidAmountCents = null;
if ($paidAmountRaw !== "") {
    $normalizedAmount = str_replace(["R$", "r$", " "], "", $paidAmountRaw);
    $normalizedAmount = str_replace(".", "", $normalizedAmount);
    $normalizedAmount = str_replace(",", ".", $normalizedAmount);
    $normalizedAmount = preg_replace('/[^0-9.\-]/', "", $normalizedAmount) ?? "";
    if ($normalizedAmount === "" || !is_numeric($normalizedAmount)) {
        gopdf_fail("Valor pago invalido.", 422);
    }

    $paidAmountFloat = (float) $normalizedAmount;
    if ($paidAmountFloat < 0) {
        gopdf_fail("Valor pago nao pode ser negativo.", 422);
    }
    $paidAmountCents = (int) round($paidAmountFloat * 100);
}

$proofFile = $_FILES["proofFile"] ?? null;
$hasProofFile = is_array($proofFile)
    && ((int) ($proofFile["error"] ?? UPLOAD_ERR_NO_FILE)) !== UPLOAD_ERR_NO_FILE;

if ($manualStatus === "active" && !$hasProofFile && $transactionId === "" && $proofNote === "") {
    gopdf_fail("Para marcar como pago, anexe comprovante ou informe ID da transacao/observacao.", 422);
}

$pdo = gopdf_db();
$subscriptionStmt = $pdo->prepare(
    "SELECT s.id, s.user_id, s.status, s.plan_code, s.amount_cents, s.currency, s.payment_method, s.metadata_json,
            u.full_name, u.email
     FROM subscriptions s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = :id
     LIMIT 1"
);
$subscriptionStmt->execute(["id" => $subscriptionId]);
$subscription = $subscriptionStmt->fetch();

if (!$subscription) {
    gopdf_fail("Assinatura nao encontrada.", 404);
}

$metadata = gopdf_subscription_metadata([
    "metadata_json" => $subscription["metadata_json"] ?? null,
]);
$existingManual = $metadata["manual_validation"] ?? null;
if (!is_array($existingManual)) {
    $existingManual = [];
}

$uploadedProof = null;
if ($hasProofFile) {
    $uploadError = (int) ($proofFile["error"] ?? UPLOAD_ERR_NO_FILE);
    if (in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        gopdf_fail("Comprovante excede o tamanho maximo permitido (8 MB).", 422);
    }
    if ($uploadError !== UPLOAD_ERR_OK) {
        gopdf_fail("Falha no envio do comprovante. Tente novamente.", 422);
    }

    $tmpPath = (string) ($proofFile["tmp_name"] ?? "");
    if ($tmpPath === "" || !is_uploaded_file($tmpPath)) {
        gopdf_fail("Arquivo de comprovante invalido.", 422);
    }

    $sizeBytes = (int) ($proofFile["size"] ?? 0);
    if ($sizeBytes <= 0 || $sizeBytes > (8 * 1024 * 1024)) {
        gopdf_fail("Comprovante deve ter ate 8 MB.", 422);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = $finfo ? (string) finfo_file($finfo, $tmpPath) : "";
    if ($finfo) {
        finfo_close($finfo);
    }

    $allowedMimeMap = [
        "image/jpeg" => ".jpg",
        "image/png" => ".png",
        "image/webp" => ".webp",
        "application/pdf" => ".pdf",
    ];

    $extension = $allowedMimeMap[$mimeType] ?? "";
    if ($extension === "") {
        gopdf_fail("Formato de comprovante nao suportado. Use JPG, PNG, WEBP ou PDF.", 422);
    }

    $proofDirRelative = "uploads/payment-proofs";
    $proofDirAbsolute = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . str_replace("/", DIRECTORY_SEPARATOR, $proofDirRelative);
    if (!is_dir($proofDirAbsolute)) {
        if (!mkdir($proofDirAbsolute, 0755, true) && !is_dir($proofDirAbsolute)) {
            gopdf_fail("Nao foi possivel preparar diretorio de comprovantes no servidor.", 500);
        }
    }

    $storedFileName = sprintf(
        "proof-sub-%d-%s-%s%s",
        $subscriptionId,
        date("YmdHis"),
        bin2hex(random_bytes(5)),
        $extension
    );
    $targetAbsolutePath = $proofDirAbsolute . DIRECTORY_SEPARATOR . $storedFileName;
    if (!move_uploaded_file($tmpPath, $targetAbsolutePath)) {
        gopdf_fail("Nao foi possivel salvar o comprovante no servidor.", 500);
    }

    $relativePath = $proofDirRelative . "/" . $storedFileName;
    $uploadedProof = [
        "path" => $relativePath,
        "url" => gopdf_app_url_for_path($relativePath),
        "originalName" => mb_substr((string) ($proofFile["name"] ?? "comprovante"), 0, 180),
        "mimeType" => $mimeType,
        "sizeBytes" => $sizeBytes,
    ];
}

$proofSnapshot = null;
if ($uploadedProof !== null) {
    $proofSnapshot = $uploadedProof;
} elseif (isset($existingManual["proofFile"]) && is_array($existingManual["proofFile"])) {
    $proofSnapshot = $existingManual["proofFile"];
}

$validatedAt = date("Y-m-d H:i:s");
$manualValidation = [
    "isManual" => true,
    "status" => $manualStatus,
    "validatedAt" => $validatedAt,
    "adminUserId" => (int) ($adminUser["id"] ?? 0),
    "adminUserName" => (string) ($adminUser["full_name"] ?? ""),
    "targetUserId" => (int) ($subscription["user_id"] ?? 0),
    "targetUserName" => (string) ($subscription["full_name"] ?? ""),
    "proofNote" => $proofNote !== "" ? $proofNote : null,
    "transactionId" => $transactionId !== "" ? $transactionId : null,
    "paidAt" => $paidAt,
    "paidAmountCents" => $paidAmountCents,
    "proofFile" => $proofSnapshot,
];

$history = $metadata["manual_validation_history"] ?? [];
if (!is_array($history)) {
    $history = [];
}
$history[] = [
    "status" => $manualStatus,
    "validatedAt" => $validatedAt,
    "adminUserId" => (int) ($adminUser["id"] ?? 0),
    "adminUserName" => (string) ($adminUser["full_name"] ?? ""),
    "proofNote" => $proofNote !== "" ? $proofNote : null,
    "transactionId" => $transactionId !== "" ? $transactionId : null,
    "paidAt" => $paidAt,
    "paidAmountCents" => $paidAmountCents,
    "proofFilePath" => is_array($proofSnapshot) ? ($proofSnapshot["path"] ?? null) : null,
];
if (count($history) > 20) {
    $history = array_slice($history, -20);
}

$metadata["manual_validation"] = $manualValidation;
$metadata["manual_validation_history"] = $history;

try {
    $updateStmt = $pdo->prepare(
        "UPDATE subscriptions
         SET status = :status,
             metadata_json = :metadata_json,
             activated_at = CASE WHEN :status = 'active' AND activated_at IS NULL THEN CURRENT_TIMESTAMP ELSE activated_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id"
    );
    $updateStmt->execute([
        "status" => $manualStatus,
        "metadata_json" => json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        "id" => $subscriptionId,
    ]);
} catch (Throwable $error) {
    gopdf_audit("admin.billing.manual.update", "error", (int) ($adminUser["id"] ?? 0), [
        "subscriptionId" => $subscriptionId,
        "manualStatus" => $manualStatus,
        "targetUserId" => (int) ($subscription["user_id"] ?? 0),
        "error" => $error->getMessage(),
    ]);
    gopdf_fail("Nao foi possivel atualizar a validacao manual do pagamento.", 500);
}

gopdf_audit("admin.billing.manual.update", "success", (int) ($adminUser["id"] ?? 0), [
    "subscriptionId" => $subscriptionId,
    "manualStatus" => $manualStatus,
    "targetUserId" => (int) ($subscription["user_id"] ?? 0),
    "hasProofFile" => $uploadedProof !== null,
    "transactionId" => $transactionId !== "" ? $transactionId : null,
]);

gopdf_ok([
    "message" => "Validacao manual de pagamento atualizada com sucesso.",
    "subscriptionId" => $subscriptionId,
    "status" => $manualStatus,
    "manualValidation" => $manualValidation,
]);
