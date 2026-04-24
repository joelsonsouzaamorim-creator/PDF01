import { apiRequest, digitsOnly, sanitizeText } from "../core/http.js";

const form = document.getElementById("registerForm");
const feedback = document.getElementById("authFeedback");
const submitBtn = document.getElementById("registerSubmitBtn");
const phoneInput = document.getElementById("registerPhone");

const DEFAULT_NEXT_PATH = "index.html";
const PREMIUM_CHECKOUT_PATH = "assinatura-premium.html";

function normalizeNextPath(rawNext) {
  const next = sanitizeText(rawNext || "");
  if (!next) return DEFAULT_NEXT_PATH;
  if (next.startsWith("http://") || next.startsWith("https://") || next.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  const cleaned = next
    .replace(/^[./]+/, "")
    .replace(/\\/g, "/");

  if (!cleaned || cleaned.includes("..")) {
    return DEFAULT_NEXT_PATH;
  }

  return cleaned;
}

function getRequestedNextPath() {
  const params = new URLSearchParams(window.location.search);
  return normalizeNextPath(params.get("next") || DEFAULT_NEXT_PATH);
}

function canonicalPath(path) {
  return normalizeNextPath(path).split("?")[0].split("#")[0].toLowerCase();
}

function resolveRedirectPath(registerPayload) {
  const requestedNext = getRequestedNextPath();
  const accessLevel = String(registerPayload?.user?.accessLevel || "").trim().toLowerCase();
  const isPremium = accessLevel === "premium" || accessLevel === "administrador" || Boolean(registerPayload?.user?.isPremium);
  if (isPremium) {
    return DEFAULT_NEXT_PATH;
  }

  if (canonicalPath(requestedNext) === PREMIUM_CHECKOUT_PATH) {
    return PREMIUM_CHECKOUT_PATH;
  }

  return DEFAULT_NEXT_PATH;
}

function syncLoginLink() {
  const link = document.querySelector('.auth-alt a[href*="entrar.html"]');
  if (!link) return;
  const requestedNext = getRequestedNextPath();
  link.href = `entrar.html?next=${encodeURIComponent(requestedNext)}`;
}

function formatPhone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function setFeedback(type, message) {
  feedback.hidden = false;
  feedback.className = `auth-feedback is-${type}`;
  feedback.textContent = message;
}

phoneInput.addEventListener("input", () => {
  phoneInput.value = formatPhone(phoneInput.value);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  feedback.hidden = true;

  const fullName = sanitizeText(document.getElementById("registerName").value);
  const email = sanitizeText(document.getElementById("registerEmail").value).toLowerCase();
  const phone = formatPhone(phoneInput.value);
  const password = String(document.getElementById("registerPassword").value || "");
  const confirmPassword = String(document.getElementById("registerConfirmPassword").value || "");
  const acceptedTerms = document.getElementById("registerTerms").checked;

  if (!acceptedTerms) {
    setFeedback("error", "Você precisa aceitar os Termos e a Política de Privacidade.");
    submitBtn.disabled = false;
    return;
  }

  if (password !== confirmPassword) {
    setFeedback("error", "As senhas não coincidem.");
    submitBtn.disabled = false;
    return;
  }

  try {
    const payload = await apiRequest("api/auth/register", {
      method: "POST",
      body: { fullName, email, phone, password }
    });

    setFeedback("success", "Conta criada com sucesso. Redirecionando...");
    window.setTimeout(() => {
      window.location.href = resolveRedirectPath(payload);
    }, 700);
  } catch (error) {
    setFeedback("error", sanitizeText(error.message));
  } finally {
    submitBtn.disabled = false;
  }
});

syncLoginLink();
