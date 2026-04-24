<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . "/_bootstrap.php";

gopdf_require_method("POST");
gopdf_require_webhook_secret();

$raw = file_get_contents("php://input");
if ($raw === false || trim($raw) === "") {
    gopdf_fail("Payload do webhook vazio.", 422);
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    gopdf_fail("Payload inválido.", 422);
}

$event = (string) ($payload["event"] ?? "UNKNOWN");
$paymentId = (string) ($payload["payment"]["id"] ?? $payload["payment"]["paymentId"] ?? "");
$providerStatus = (string) ($payload["payment"]["status"] ?? "");
$signature = gopdf_payment_event_signature($payload);

$pdo = gopdf_db();

try {
    $insertEvent = $pdo->prepare(
        "INSERT INTO payment_events (source, source_event_signature, event_type, payment_id, payload_json)
         VALUES ('asaas', :signature, :event_type, :payment_id, :payload_json)"
    );
    $insertEvent->execute([
        "signature" => $signature,
        "event_type" => $event,
        "payment_id" => $paymentId !== "" ? $paymentId : null,
        "payload_json" => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
} catch (Throwable $error) {
    // Evento duplicado => idempotência.
    gopdf_ok([
        "message" => "Evento já processado.",
        "event" => $event,
    ]);
}

$nextStatus = gopdf_map_asaas_event_to_subscription_status($event, $providerStatus);
$appliedStatus = null;
$updatedRows = 0;
$currentStatus = null;

if ($paymentId !== "" && $nextStatus !== null) {
    $lookup = $pdo->prepare(
        "SELECT id, status, activated_at
         FROM subscriptions
         WHERE asaas_payment_id = :payment_id
         LIMIT 1"
    );
    $lookup->execute([
        "payment_id" => $paymentId,
    ]);
    $subscription = $lookup->fetch();

    if ($subscription) {
        $currentStatus = strtolower(trim((string) ($subscription["status"] ?? "")));
        $appliedStatus = gopdf_resolve_subscription_status_transition($currentStatus, $nextStatus);

        $activatedAtRaw = $subscription["activated_at"] ?? null;
        $needsActivationStamp = $appliedStatus === "active" && (!is_string($activatedAtRaw) || trim($activatedAtRaw) === "");
        if ($appliedStatus !== $currentStatus || $needsActivationStamp) {
            $update = $pdo->prepare(
                "UPDATE subscriptions
                 SET status = :status,
                     activated_at = CASE WHEN :status = 'active' AND activated_at IS NULL THEN CURRENT_TIMESTAMP ELSE activated_at END,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id"
            );
            $update->execute([
                "status" => $appliedStatus,
                "id" => (int) $subscription["id"],
            ]);
            $updatedRows = $update->rowCount();
        }
    }
}

gopdf_audit("payments.webhook.asaas", "success", null, [
    "event" => $event,
    "paymentId" => $paymentId,
    "providerStatus" => $providerStatus,
    "statusCandidate" => $nextStatus,
    "currentStatus" => $currentStatus,
    "statusApplied" => $appliedStatus,
    "updatedRows" => $updatedRows,
]);

gopdf_ok([
    "message" => "Webhook processado com sucesso.",
    "event" => $event,
    "paymentId" => $paymentId,
    "providerStatus" => $providerStatus,
    "statusCandidate" => $nextStatus,
    "statusApplied" => $appliedStatus,
    "updatedRows" => $updatedRows,
]);
