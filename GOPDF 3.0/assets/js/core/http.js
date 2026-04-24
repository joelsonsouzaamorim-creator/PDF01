const JSON_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json"
};

export async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const mergedHeaders = {
    ...(isFormData ? { "Accept": "application/json" } : JSON_HEADERS),
    ...(options.headers || {})
  };

  const requestOptions = {
    method: "GET",
    credentials: "include",
    headers: mergedHeaders,
    ...options
  };

  if (isFormData) {
    requestOptions.body = options.body;
  } else if (options.body && typeof options.body !== "string") {
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, requestOptions);
  const text = await response.text();

  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_) {
    payload = { ok: false, message: "Resposta inválida da API." };
  }

  if (!response.ok || payload.ok === false) {
    const message = payload.message || "Falha ao processar a solicitação.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

export function sanitizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}
