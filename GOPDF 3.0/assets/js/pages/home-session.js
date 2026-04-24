import { apiRequest, sanitizeText } from "../core/http.js";

const loginBtn = document.getElementById("topbar-login-entry");
const registerBtn = document.getElementById("topbar-request-entry");
const profileBtn = document.getElementById("topbar-profile-entry");
const logoutBtn = document.getElementById("topbar-logout-entry");
const cpanelAdminModule = document.getElementById("cpanel-admin-module");

function isAdminUser(user) {
  const role = String(user?.role || "").trim().toLowerCase();
  const accessLevel = String(user?.accessLevel || "").trim().toLowerCase();
  if (role === "admin") return true;
  if (accessLevel === "administrador") return true;
  return Boolean(user?.isAdmin);
}

function profileTypeLabel(user) {
  const accessLevel = String(user?.accessLevel || "").trim().toLowerCase();
  const role = String(user?.role || "").trim().toLowerCase();
  if (accessLevel === "administrador" || role === "admin" || Boolean(user?.isAdmin)) {
    return "Administrador";
  }
  if (accessLevel === "premium" || Boolean(user?.isPremium)) {
    return "Premium";
  }
  return "Gratuito";
}

function setCpanelModuleVisible(visible) {
  if (!cpanelAdminModule) return;
  cpanelAdminModule.hidden = !visible;
}

function setGuestView() {
  if (loginBtn) loginBtn.style.display = "inline-flex";
  if (registerBtn) registerBtn.style.display = "inline-flex";
  if (profileBtn) {
    profileBtn.style.display = "none";
    profileBtn.textContent = "Meu perfil";
  }
  if (logoutBtn) logoutBtn.style.display = "none";
  setCpanelModuleVisible(false);
}

function setAuthenticatedView(user) {
  if (loginBtn) loginBtn.style.display = "none";
  if (registerBtn) registerBtn.style.display = "none";
  if (profileBtn) {
    const firstName = sanitizeText(String(user?.fullName || "").split(" ")[0] || "");
    const typeLabel = profileTypeLabel(user);
    profileBtn.textContent = firstName ? `Perfil (${firstName}) - ${typeLabel}` : `Meu perfil - ${typeLabel}`;
    profileBtn.style.display = "inline-flex";
  }
  if (logoutBtn) logoutBtn.style.display = "inline-flex";
  setCpanelModuleVisible(isAdminUser(user));
}

async function refreshHomeSessionState() {
  try {
    const payload = await apiRequest("api/auth/session");
    if (payload?.authenticated) {
      setAuthenticatedView(payload.user || {});
      return;
    }
    setGuestView();
  } catch (_) {
    setGuestView();
  }
}

async function logoutUser() {
  if (!logoutBtn) return;
  logoutBtn.disabled = true;
  const previousText = logoutBtn.textContent;
  logoutBtn.textContent = "Saindo...";
  try {
    await apiRequest("api/auth/logout", { method: "POST" });
    window.location.href = "index.html";
  } catch (_) {
    logoutBtn.textContent = previousText;
    logoutBtn.disabled = false;
    setGuestView();
  }
}

function bindEvents() {
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser();
    });
  }
}

function init() {
  if (!loginBtn && !registerBtn && !profileBtn && !logoutBtn && !cpanelAdminModule) {
    return;
  }
  bindEvents();
  refreshHomeSessionState();
}

init();
