<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_same_origin_check();
$user = gopdf_require_auth();

$input = gopdf_json_input();
$method = strtolower(trim((string) ($input["method"] ?? "pix")));
if (!in_array($method, ["pix", "card"], true)) {
    gopdf_fail("Método de pagamento inválido.", 422);
}

$planCode = trim((string) ($input["planCode"] ?? gopdf_config()["premium_plan_code"]));
$amount = (float) ($input["amount"] ?? gopdf_config()["premium_amount_brl"]);
$cycle = trim((string) ($input["cycle"] ?? gopdf_config()["premium_cycle"]));

if ($amount <= 0) {
    gopdf_fail("Valor da assinatura inválido.", 422);
}

$pdo = gopdf_db();

$activeStmt = $pdo->prepare(
    "SELECT id FROM subscriptions
     WHERE user_id = :user_id
       AND status = 'active'
     LIMIT 1"
);
$activeStmt->execute(["user_id" => (int) $user["id"]]);
if ($activeStmt->fetch()) {
    gopdf_fail("Você já possui uma assinatura ativa.", 409);
}

$pendingStmt = $pdo->prepare(
    "SELECT id, status, asaas_payment_id, invoice_url, pix_copy_paste, pix_qr_code_url, updated_at
     FROM subscriptions
     WHERE user_id = :user_id
       AND status = 'pending'
     ORDER BY id DESC
     LIMIT 1"
);
$pendingStmt->execute(["user_id" => (int) $user["id"]]);
$pending = $pendingStmt->fetch();

if ($pending) {
    $syncResult = gopdf_sync_subscription_status_from_asaas_payment((int) $pending["id"]);

    $refreshPendingStmt = $pdo->prepare(
        "SELECT id, status, asaas_payment_id, invoice_url, pix_copy_paste, pix_qr_code_url, updated_at
         FROM subscriptions
         WHERE id = :id
         LIMIT 1"
    );
    $refreshPendingStmt->execute([
        "id" => (int) $pending["id"],
    ]);
    $refreshedPending = $refreshPendingStmt->fetch();
    if ($refreshedPending) {
        $pending = $refreshedPending;
    }

    $pendingStatus = strtolower(trim((string) ($pending["status"] ?? "pending")));
    if ($pendingStatus === "active") {
        gopdf_ok([
            "message" => "Pagamento identificado e assinatura já ativada para esta conta.",
            "subscription" => [
                "id" => (int) $pending["id"],
                "status" => "active",
            ],
            "payment" => [
                "paymentId" => $pending["asaas_payment_id"],
                "invoiceUrl" => $pending["invoice_url"],
                "pixCopyPaste" => $pending["pix_copy_paste"],
                "pixQrCodeUrl" => $pending["pix_qr_code_url"],
            ],
            "tracking" => [
                "checked" => (bool) ($syncResult["checked"] ?? false),
                "providerStatus" => $syncResult["providerStatus"] ?? null,
            ],
        ]);
    }

    if ($pendingStatus === "pending") {
        gopdf_ok([
            "message" => "Já existe uma cobrança pendente em aberto para essa conta.",
            "subscription" => [
                "id" => (int) $pending["id"],
                "status" => "pending",
            ],
            "payment" => [
                "paymentId" => $pending["asaas_payment_id"],
                "invoiceUrl" => $pending["invoice_url"],
                "pixCopyPaste" => $pending["pix_copy_paste"],
                "pixQrCodeUrl" => $pending["pix_qr_code_url"],
            ],
            "tracking" => [
                "checked" => (bool) ($syncResult["checked"] ?? false),
                "providerStatus" => $syncResult["providerStatus"] ?? null,
            ],
        ]);
    }
}

$document = gopdf_digits_only((string) ($input["document"] ?? ""));
if (!in_array(strlen($document), [11, 14], true)) {
    gopdf_fail("Informe um CPF ou CNPJ válido para criar a cobrança.", 422);
}

$customerId = (string) ($user["asaas_customer_id"] ?? "");

try {
    $customerPayload = [
        "name" => (string) $user["full_name"],
        "email" => (string) $user["email"],
        "phone" => gopdf_digits_only((string) $user["phone"]),
        "mobilePhone" => gopdf_digits_only((string) $user["phone"]),
        "cpfCnpj" => $document,
        "externalReference" => "user-" . (int) $user["id"],
    ];

    if ($customerId === "") {
        $customerResponse = gopdf_asaas_request("POST", "/customers", $customerPayload);
        $customerId = (string) ($customerResponse["id"] ?? "");
        if ($customerId === "") {
            throw new RuntimeException("Não foi possível registrar o cliente no Asaas.");
        }

        $userUpdate = $pdo->prepare("UPDATE users SET asaas_customer_id = :customer_id WHERE id = :id");
        $userUpdate->execute([
            "customer_id" => $customerId,
            "id" => (int) $user["id"],
        ]);
    } else {
        // Tenta atualizar o cliente existente com CPF/CNPJ.
        try {
            gopdf_asaas_request("POST", "/customers/" . rawurlencode($customerId), $customerPayload);
        } catch (Throwable $updateError) {
            // Alguns cenários antigos podem ter cadastro incompleto no Asaas.
            // Nesse caso, cria um novo cliente válido e passa a usar esse id.
            $customerResponse = gopdf_asaas_request("POST", "/customers", $customerPayload);
            $newCustomerId = (string) ($customerResponse["id"] ?? "");
            if ($newCustomerId === "") {
                throw new RuntimeException("Não foi possível atualizar os dados do cliente no Asaas.");
            }
            $customerId = $newCustomerId;

            $userUpdate = $pdo->prepare("UPDATE users SET asaas_customer_id = :customer_id WHERE id = :id");
            $userUpdate->execute([
                "customer_id" => $customerId,
                "id" => (int) $user["id"],
            ]);
        }
    }

    $externalReference = sprintf(
        "sub-%d-%s",
        (int) $user["id"],
        bin2hex(random_bytes(6))
    );
    $dueDate = (new DateTimeImmutable("+1 day"))->format("Y-m-d");
    $billingType = $method === "pix" ? "PIX" : "UNDEFINED";

    $paymentPayload = [
        "customer" => $customerId,
        "billingType" => $billingType,
        "value" => $amount,
        "dueDate" => $dueDate,
        "description" => "Assinatura Gopdf Premium",
        "externalReference" => $externalReference,
    ];

    $paymentResponse = gopdf_asaas_request("POST", "/payments", $paymentPayload);

    $paymentId = (string) ($paymentResponse["id"] ?? "");
    $invoiceUrl = (string) ($paymentResponse["invoiceUrl"] ?? "");
    $providerStatus = (string) ($paymentResponse["status"] ?? "PENDING");
    $resolvedStatus = gopdf_map_asaas_payment_status_to_subscription_status($providerStatus);
    $status = $resolvedStatus ?? "pending";
    $pixCopyPaste = null;
    $pixQrCodeUrl = null;
    $pixPayload = null;

    if ($paymentId === "") {
        throw new RuntimeException("O Asaas não retornou o identificador da cobrança.");
    }

    if ($method === "pix") {
        $pixPayload = gopdf_asaas_request("GET", "/payments/" . rawurlencode($paymentId) . "/pixQrCode");
        $pixCopyPaste = (string) ($pixPayload["payload"] ?? "");
        $pixQrCodeUrl = (string) ($pixPayload["encodedImage"] ?? "");
    }

    $insert = $pdo->prepare(
        "INSERT INTO subscriptions (
            user_id, plan_code, cycle, amount_cents, currency, payment_method, status,
            asaas_customer_id, asaas_payment_id, external_reference, invoice_url, pix_copy_paste, pix_qr_code_url, metadata_json
        ) VALUES (
            :user_id, :plan_code, :cycle, :amount_cents, 'BRL', :payment_method, :status,
            :asaas_customer_id, :asaas_payment_id, :external_reference, :invoice_url, :pix_copy_paste, :pix_qr_code_url, :metadata_json
        )"
    );
    $insert->execute([
        "user_id" => (int) $user["id"],
        "plan_code" => $planCode,
        "cycle" => $cycle,
        "amount_cents" => (int) round($amount * 100),
        "payment_method" => $method,
        "status" => $status,
        "asaas_customer_id" => $customerId,
        "asaas_payment_id" => $paymentId,
        "external_reference" => $externalReference,
        "invoice_url" => $invoiceUrl,
        "pix_copy_paste" => $pixCopyPaste ?: null,
        "pix_qr_code_url" => $pixQrCodeUrl ?: null,
        "metadata_json" => json_encode(
            ["paymentResponse" => $paymentResponse, "pixResponse" => $pixPayload],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        ),
    ]);
    $subscriptionId = (int) $pdo->lastInsertId();

    gopdf_audit("subscription.create", "success", (int) $user["id"], [
        "subscriptionId" => $subscriptionId,
        "method" => $method,
        "paymentId" => $paymentId,
    ]);

    gopdf_ok([
        "message" => "Cobrança criada com sucesso.",
        "subscription" => [
            "id" => $subscriptionId,
            "status" => $status,
            "planCode" => $planCode,
            "cycle" => $cycle,
            "amount" => $amount,
        ],
        "payment" => [
            "method" => $method,
            "paymentId" => $paymentId,
            "invoiceUrl" => $invoiceUrl,
            "pixCopyPaste" => $pixCopyPaste,
            "pixQrCodeUrl" => $pixQrCodeUrl,
            "status" => $providerStatus,
        ],
    ], 201);
} catch (Throwable $error) {
    gopdf_audit("subscription.create", "error", (int) $user["id"], [
        "method" => $method,
        "error" => $error->getMessage(),
    ]);
    gopdf_fail("Não foi possível criar a cobrança: " . $error->getMessage(), 502);
}
