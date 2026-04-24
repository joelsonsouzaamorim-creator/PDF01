import { apiRequest, digitsOnly, sanitizeText } from "../core/http.js";

const form = document.getElementById("profileForm");
const feedback = document.getElementById("profileFeedback");
const saveBtn = document.getElementById("profileSaveBtn");
const logoutBtn = document.getElementById("profileLogoutBtn");
const accessBadge = document.getElementById("profileAccessBadge");
const accessDetail = document.getElementById("profileAccessDetail");
const upgradeBlock = document.getElementById("profileUpgradeBlock");
const upgradeText = document.getElementById("profileUpgradeText");
const upgradeBtn = document.getElementById("profileUpgradeBtn");
const profileCard = document.querySelector(".profile-card");
const moduleSwitch = document.getElementById("profileModuleSwitch");
const moduleButtons = moduleSwitch ? [...moduleSwitch.querySelectorAll(".profile-module-btn")] : [];
const adminModule = document.getElementById("cpanel-admin-module");
const sidePremiumCard = document.getElementById("profileSidePremiumCard");
const sidePremiumKicker = document.getElementById("profileSidePremiumKicker");
const sidePremiumTitle = document.getElementById("profileSidePremiumTitle");
const sidePremiumText = document.getElementById("profileSidePremiumText");
const sidePremiumActions = document.getElementById("profileSidePremiumActions");
const PREMIUM_CHECKOUT_PATH = "assinatura-premium.html";
const DEFAULT_UPGRADE_TEXT = "Deseja acessar todos os recursos? Atualize para o Premium.";
const DEFAULT_SIDE_KICKER = "Mais recursos";
const DEFAULT_SIDE_TITLE = "Quer liberar ferramentas premium?";
const DEFAULT_SIDE_TEXT = "Acesse todas as funções avancadas e aumente sua produtividade no GoPDF.";

let adminModuleEnabled = false;

const fields = {
  fullName: document.getElementById("profileFullName"),
  email: document.getElementById("profileEmail"),
  phone: document.getElementById("profilePhone"),
  documentType: document.getElementById("profileDocumentType"),
  documentNumber: document.getElementById("profileDocumentNumber"),
  addressZip: document.getElementById("profileAddressZip"),
  addressStreet: document.getElementById("profileAddressStreet"),
  addressNumber: document.getElementById("profileAddressNumber"),
  addressComplement: document.getElementById("profileAddressComplement"),
  addressDistrict: document.getElementById("profileAddressDistrict"),
  addressCity: document.getElementById("profileAddressCity"),
  addressState: document.getElementById("profileAddressState"),
  addressCountry: document.getElementById("profileAddressCountry"),
  currentPassword: document.getElementById("profileCurrentPassword"),
  newPassword: document.getElementById("profileNewPassword"),
  confirmNewPassword: document.getElementById("profileConfirmPassword")
};

function setFeedback(type, message) {
  feedback.hidden = false;
  feedback.className = `auth-feedback is-${type}`;
  feedback.textContent = message;
}

function clearFeedback() {
  feedback.hidden = true;
  feedback.className = "auth-feedback";
  feedback.textContent = "";
}

function setSaveLoading(loading) {
  if (!saveBtn) return;
  if (loading) {
    saveBtn.disabled = true;
    saveBtn.dataset.originalText = saveBtn.dataset.originalText || saveBtn.textContent || "";
    saveBtn.textContent = "Salvando...";
    return;
  }
  saveBtn.disabled = false;
  if (saveBtn.dataset.originalText) {
    saveBtn.textContent = saveBtn.dataset.originalText;
  }
}

function formatPhone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDocument(value, explicitType = "") {
  const digits = digitsOnly(value).slice(0, 14);
  const type = String(explicitType || "").toLowerCase();
  const useCnpj = type === "cnpj" || (type !== "cpf" && digits.length > 11);

  if (!useCnpj) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function clearPasswordFields() {
  fields.currentPassword.value = "";
  fields.newPassword.value = "";
  fields.confirmNewPassword.value = "";
}

function deriveAccessLevel(user, subscription) {
  const accessLevel = String(user?.accessLevel || "").trim().toLowerCase();
  const role = String(user?.role || "").trim().toLowerCase();
  if (accessLevel === "administrador" || role === "admin" || Boolean(user?.isAdmin)) {
    return "administrador";
  }
  if (accessLevel === "premium" || Boolean(user?.isPremium) || String(subscription?.status || "").toLowerCase() === "active") {
    return "premium";
  }
  return "gratuito";
}

function setModuleView(view) {
  const targetView = view === "admin" && adminModuleEnabled ? "admin" : "account";
  if (profileCard) {
    profileCard.dataset.moduleView = targetView;
  }
  moduleButtons.forEach((button) => {
    const isActive = button.dataset.view === targetView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function syncModuleSwitch(accessLevel) {
  adminModuleEnabled = accessLevel === "administrador";
  if (moduleSwitch) {
    moduleSwitch.hidden = !adminModuleEnabled;
  }
  if (!adminModuleEnabled && adminModule) {
    adminModule.hidden = true;
  }
  setModuleView("account");
}

function renderUpgradeState(accessLevel) {
  if (!upgradeBlock || !upgradeText || !upgradeBtn) return;

  upgradeBlock.hidden = false;
  if (accessLevel === "gratuito") {
    upgradeText.textContent = DEFAULT_UPGRADE_TEXT;
    upgradeBtn.hidden = false;
    return;
  }

  upgradeBtn.hidden = true;
  if (accessLevel === "administrador") {
    upgradeText.textContent = "Conta administradora ativa. Seus recursos premium já estao liberados.";
    return;
  }
  upgradeText.textContent = "Seu plano premium já esta ativo. Nenhum upgrade adicional e necessario.";
}

function renderSidePremiumState(accessLevel) {
  if (!sidePremiumCard || !sidePremiumKicker || !sidePremiumTitle || !sidePremiumText || !sidePremiumActions) return;

  if (accessLevel === "gratuito") {
    sidePremiumCard.classList.remove("is-informative");
    sidePremiumKicker.textContent = DEFAULT_SIDE_KICKER;
    sidePremiumTitle.textContent = DEFAULT_SIDE_TITLE;
    sidePremiumText.textContent = DEFAULT_SIDE_TEXT;
    sidePremiumActions.hidden = false;
    return;
  }

  sidePremiumCard.classList.add("is-informative");
  sidePremiumKicker.textContent = "Status do plano";
  sidePremiumActions.hidden = true;

  if (accessLevel === "administrador") {
    sidePremiumTitle.textContent = "Acesso administrativo ativo";
    sidePremiumText.textContent = "Sua conta já possui privilegios de administrador e recursos premium liberados.";
    return;
  }

  sidePremiumTitle.textContent = "Plano premium ativo";
  sidePremiumText.textContent = "Sua assinatura premium já esta em vigor e os recursos avancados estao disponiveis.";
}

function renderAccessInfo(user, subscription) {
  const accessLevel = deriveAccessLevel(user, subscription);
  accessBadge.classList.remove("is-gratuito", "is-premium", "is-administrador");

  if (accessLevel === "administrador") {
    accessBadge.classList.add("is-administrador");
    accessBadge.textContent = "Conta administrador";
    accessDetail.textContent = "Seu acesso esta liberado com privilegios administrativos.";
  } else if (accessLevel === "premium") {
    accessBadge.classList.add("is-premium");
    accessBadge.textContent = "Plano premium";
    accessDetail.textContent = "Conta premium ativa. Recursos avancados liberados.";
  } else {
    accessBadge.classList.add("is-gratuito");
    accessBadge.textContent = "Plano gratuito";
    accessDetail.textContent = "Conta gratuita ativa. Você pode atualizar para premium quando quiser.";
  }

  renderUpgradeState(accessLevel);
  renderSidePremiumState(accessLevel);
  syncModuleSwitch(accessLevel);
}

function fillForm(payload) {
  const user = payload?.user || {};
  const profile = payload?.profile || {};
  const subscription = payload?.subscription || null;

  fields.fullName.value = user.fullName || "";
  fields.email.value = user.email || "";
  fields.phone.value = formatPhone(user.phone || "");

  fields.documentType.value = String(profile.documentType || "").toLowerCase();
  fields.documentNumber.value = formatDocument(profile.documentNumber || "", fields.documentType.value);
  fields.addressZip.value = profile.addressZip || "";
  fields.addressStreet.value = profile.addressStreet || "";
  fields.addressNumber.value = profile.addressNumber || "";
  fields.addressComplement.value = profile.addressComplement || "";
  fields.addressDistrict.value = profile.addressDistrict || "";
  fields.addressCity.value = profile.addressCity || "";
  fields.addressState.value = profile.addressState || "";
  fields.addressCountry.value = profile.addressCountry || "Brasil";

  clearPasswordFields();
  renderAccessInfo(user, subscription);
}

function buildPayload() {
  return {
    fullName: sanitizeText(fields.fullName.value),
    email: sanitizeText(fields.email.value).toLowerCase(),
    phone: digitsOnly(fields.phone.value),
    documentType: sanitizeText(fields.documentType.value).toLowerCase(),
    documentNumber: digitsOnly(fields.documentNumber.value),
    addressZip: sanitizeText(fields.addressZip.value),
    addressStreet: sanitizeText(fields.addressStreet.value),
    addressNumber: sanitizeText(fields.addressNumber.value),
    addressComplement: sanitizeText(fields.addressComplement.value),
    addressDistrict: sanitizeText(fields.addressDistrict.value),
    addressCity: sanitizeText(fields.addressCity.value),
    addressState: sanitizeText(fields.addressState.value),
    addressCountry: sanitizeText(fields.addressCountry.value),
    currentPassword: String(fields.currentPassword.value || ""),
    newPassword: String(fields.newPassword.value || ""),
    confirmNewPassword: String(fields.confirmNewPassword.value || "")
  };
}

function validatePasswordFields(payload) {
  const wantsChange = payload.currentPassword || payload.newPassword || payload.confirmNewPassword;
  if (!wantsChange) return null;
  if (!payload.currentPassword || !payload.newPassword || !payload.confirmNewPassword) {
    return "Para trocar a senha, preencha senha atual, nova senha e confirmacao.";
  }
  if (payload.newPassword.length < 8) {
    return "A nova senha deve ter pelo menos 8 caracteres.";
  }
  if (payload.newPassword !== payload.confirmNewPassword) {
    return "A confirmacao da nova senha não confere.";
  }
  return null;
}

async function loadProfile() {
  clearFeedback();
  try {
    const payload = await apiRequest("api/auth/profile");
    fillForm(payload);
  } catch (error) {
    if (Number(error?.status || 0) === 401) {
      window.location.href = "entrar.html?next=perfil.html";
      return;
    }
    setFeedback("error", sanitizeText(error.message || "Não foi possível carregar o perfil."));
  }
}

async function saveProfile(event) {
  event.preventDefault();
  clearFeedback();
  const payload = buildPayload();
  const passwordError = validatePasswordFields(payload);
  if (passwordError) {
    setFeedback("error", passwordError);
    return;
  }

  setSaveLoading(true);
  try {
    const response = await apiRequest("api/auth/profile-update", {
      method: "POST",
      body: payload
    });
    fillForm(response);
    setFeedback("success", sanitizeText(response.message || "Perfil atualizado com sucesso."));
  } catch (error) {
    setFeedback("error", sanitizeText(error.message || "Não foi possível salvar as alteracoes."));
  } finally {
    setSaveLoading(false);
  }
}

async function logoutUser() {
  if (!logoutBtn) return;
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Saindo...";
  try {
    await apiRequest("api/auth/logout", { method: "POST" });
    window.location.href = "entrar.html?next=index.html";
  } catch (_) {
    logoutBtn.disabled = false;
    logoutBtn.textContent = "Sair da conta";
    setFeedback("error", "Não foi possível finalizar a sessao.");
  }
}

function bindEvents() {
  form.addEventListener("submit", saveProfile);
  fields.phone.addEventListener("input", () => {
    fields.phone.value = formatPhone(fields.phone.value);
  });
  fields.documentNumber.addEventListener("input", () => {
    fields.documentNumber.value = formatDocument(fields.documentNumber.value, fields.documentType.value);
  });
  fields.documentType.addEventListener("change", () => {
    fields.documentNumber.value = formatDocument(fields.documentNumber.value, fields.documentType.value);
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser();
    });
  }

  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", () => {
      window.location.href = `${PREMIUM_CHECKOUT_PATH}?from=perfil`;
    });
  }

  moduleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setModuleView(button.dataset.view || "account");
    });
  });
}

bindEvents();
loadProfile();
