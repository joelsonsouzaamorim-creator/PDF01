import { apiRequest, sanitizeText } from "../core/http.js";

const form = document.getElementById("loginForm");
const feedback = document.getElementById("authFeedback");
const submitBtn = document.getElementById("loginSubmitBtn");
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

function userHasPremiumAccess(user) {
  const accessLevel = String(user?.accessLevel || "").trim().toLowerCase();
  const role = String(user?.role || "").trim().toLowerCase();
  if (accessLevel === "premium" || accessLevel === "administrador") return true;
  if (role === "admin") return true;
  return Boolean(user?.isPremium) || Boolean(user?.isAdmin);
}

function resolveAccountType(user) {
  const accessLevel = String(user?.accessLevel || "").trim().toLowerCase();
  const role = String(user?.role || "").trim().toLowerCase();

  if (accessLevel === "administrador" || role === "admin" || Boolean(user?.isAdmin)) {
    return "administrador";
  }
  if (accessLevel === "premium" || Boolean(user?.isPremium)) {
    return "premium";
  }
  return "gratuito";
}

function accountTypeMessage(user) {
  const accountType = resolveAccountType(user);
  if (accountType === "administrador") {
    return "Conta administrador detectada. Redirecionando...";
  }
  if (accountType === "premium") {
    return "Conta premium detectada. Redirecionando...";
  }
  return "Conta gratuita detectada. Redirecionando...";
}

function resolveRedirectPath(loginPayload) {
  const requestedNext = getRequestedNextPath();
  if (userHasPremiumAccess(loginPayload?.user)) {
    return DEFAULT_NEXT_PATH;
  }

  if (canonicalPath(requestedNext) === PREMIUM_CHECKOUT_PATH) {
    return PREMIUM_CHECKOUT_PATH;
  }

  return DEFAULT_NEXT_PATH;
}

function syncRegisterLink() {
  const link = document.querySelector('.auth-alt a[href*="cadastro.html"]');
  if (!link) return;
  const requestedNext = getRequestedNextPath();
  link.href = `cadastro.html?next=${encodeURIComponent(requestedNext)}`;
}

function setFeedback(type, message) {
  feedback.hidden = false;
  feedback.className = `auth-feedback is-${type}`;
  feedback.textContent = message;
}

async function redirectIfAlreadyAuthenticated() {
  try {
    const sessionPayload = await apiRequest("api/auth/session");
    if (!sessionPayload?.authenticated || !sessionPayload?.user) return;

    setFeedback("success", `Você já esta logado. ${accountTypeMessage(sessionPayload.user)}`);
    submitBtn.disabled = true;
    window.setTimeout(() => {
      window.location.href = resolveRedirectPath(sessionPayload);
    }, 1000);
  } catch {
    // Sessao ausente ou erro de rede: segue fluxo normal da tela de login.
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  feedback.hidden = true;

  const email = sanitizeText(document.getElementById("loginEmail").value).toLowerCase();
  const password = String(document.getElementById("loginPassword").value || "");

  try {
    const payload = await apiRequest("api/auth/login", {
      method: "POST",
      body: { email, password }
    });
    setFeedback("success", `Login realizado com sucesso. ${accountTypeMessage(payload?.user)}`);
    window.setTimeout(() => {
      window.location.href = resolveRedirectPath(payload);
    }, 1000);
  } catch (error) {
    setFeedback("error", sanitizeText(error.message));
  } finally {
    submitBtn.disabled = false;
  }
});

syncRegisterLink();
redirectIfAlreadyAuthenticated();
