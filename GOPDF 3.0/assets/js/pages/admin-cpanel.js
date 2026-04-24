import { apiRequest, digitsOnly, sanitizeText } from "../core/http.js?v=2026.04.20-131500";

const cpanelModule = document.getElementById("cpanel-admin-module");
const adminConsole = document.getElementById("cpanel-admin-console");
const feedback = document.getElementById("cpanelAdminFeedback");
const createForm = document.getElementById("cpanel-create-user-form");
const refreshBtn = document.getElementById("cpanelRefreshUsersBtn");
const createBtn = document.getElementById("cpanelCreateUserBtn");
const usersList = document.getElementById("cpanelAdminUsersList");

const tabButtons = [...document.querySelectorAll(".cpanel-admin-tab-btn")];
const paneUsers = document.getElementById("cpanelUsersPane");
const paneAccess = document.getElementById("cpanelAccessPane");
const paneBilling = document.getElementById("cpanelBillingPane");

const usersSearchInput = document.getElementById("cpanelUsersSearchInput");
const usersProfileFilter = document.getElementById("cpanelUsersProfileFilter");
const usersAccessFilter = document.getElementById("cpanelUsersAccessFilter");
const usersApplyFiltersBtn = document.getElementById("cpanelUsersApplyFiltersBtn");
const usersClearFiltersBtn = document.getElementById("cpanelUsersClearFiltersBtn");
const usersCountInfo = document.getElementById("cpanelUsersCountInfo");

const usersTotalKpi = document.getElementById("cpanelUsersTotalKpi");
const usersAdminsKpi = document.getElementById("cpanelUsersAdminsKpi");
const usersPremiumKpi = document.getElementById("cpanelUsersPremiumKpi");
const usersFreeKpi = document.getElementById("cpanelUsersFreeKpi");

const accessTotalKpi = document.getElementById("cpanelAccessTotalKpi");
const accessLoginSuccessKpi = document.getElementById("cpanelAccessLoginSuccessKpi");
const accessLoginDeniedKpi = document.getElementById("cpanelAccessLoginDeniedKpi");
const accessRegisterKpi = document.getElementById("cpanelAccessRegisterKpi");
const accessFlowList = document.getElementById("cpanelAdminAccessFlowList");
const accessUsersFilterInput = document.getElementById("cpanelAdminAccessUsersFilter");
const accessUsersList = document.getElementById("cpanelAdminAccessUsersList");
const accessCurrentUser = document.getElementById("cpanelAdminAccessCurrentUser");

const billingActiveKpi = document.getElementById("cpanelBillingActiveKpi");
const billingPendingKpi = document.getElementById("cpanelBillingPendingKpi");
const billingTrialsKpi = document.getElementById("cpanelBillingTrialsKpi");
const billingRevenueKpi = document.getElementById("cpanelBillingRevenueKpi");
const billingList = document.getElementById("cpanelAdminBillingList");

const createFields = {
  fullName: document.getElementById("cpanelCreateFullName"),
  email: document.getElementById("cpanelCreateEmail"),
  phone: document.getElementById("cpanelCreatePhone"),
  password: document.getElementById("cpanelCreatePassword"),
  accessLevel: document.getElementById("cpanelCreateAccessLevel"),
  trialDaysField: document.getElementById("cpanelCreateTrialDaysField"),
  trialDays: document.getElementById("cpanelCreateTrialDays")
};

const DEFAULT_TRIAL_DAYS = 7;
const DASHBOARD_RANGE_DAYS = 30;
const DASHBOARD_LIST_LIMIT = 80;
const VALID_TABS = ["users", "access", "billing"];

const state = {
  users: [],
  serverTotalForCurrentQuery: 0,
  dashboard: null,
  activeTab: "users",
  accessEvents: [],
  accessUsers: [],
  activeAccessUserKey: ""
};

function isAdminUser(user) {
  const role = String(user?.role || "").trim().toLowerCase();
  const accessLevel = String(user?.accessLevel || "").trim().toLowerCase();
  if (role === "admin") return true;
  if (accessLevel === "administrador") return true;
  return Boolean(user?.isAdmin);
}

function maskPhone(value) {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return sanitizeText(String(value));
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatDateTimeLocalInput(value) {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatCurrencyFromCents(amountCents, currency = "BRL") {
  const cents = Number(amountCents || 0);
  const code = String(currency || "BRL").toUpperCase();
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: code
    }).format(cents / 100);
  } catch {
    return `${code} ${(cents / 100).toFixed(2)}`;
  }
}

function statusTone(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "success" || normalized === "active") return "success";
  if (normalized === "denied" || normalized === "error" || normalized === "canceled" || normalized === "cancelled") return "error";
  if (normalized === "pending") return "warning";
  return "default";
}

function setFeedback(type, message) {
  if (!feedback) return;
  feedback.hidden = false;
  feedback.className = `cpanel-admin-feedback is-${type}`;
  feedback.textContent = message;
}

function clearFeedback() {
  if (!feedback) return;
  feedback.hidden = true;
  feedback.className = "cpanel-admin-feedback";
  feedback.textContent = "";
}

function setActiveTab(tabName) {
  const normalized = VALID_TABS.includes(tabName) ? tabName : "users";
  state.activeTab = normalized;

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === normalized;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.setAttribute("aria-expanded", isActive ? "true" : "false");
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  const panes = [
    { key: "users", element: paneUsers },
    { key: "access", element: paneAccess },
    { key: "billing", element: paneBilling }
  ];
  panes.forEach((pane) => {
    if (!pane.element) return;
    const isActive = pane.key === normalized;
    pane.element.hidden = !isActive;
    pane.element.classList.toggle("is-active", isActive);
    pane.element.setAttribute("aria-hidden", isActive ? "false" : "true");
  });
}

function setCreateTrialVisibility() {
  if (!createFields.accessLevel || !createFields.trialDaysField) return;
  const isPremium = String(createFields.accessLevel.value || "").toLowerCase() === "premium";
  createFields.trialDaysField.hidden = !isPremium;
  if (isPremium && createFields.trialDays && !createFields.trialDays.value) {
    createFields.trialDays.value = String(DEFAULT_TRIAL_DAYS);
  }
}

function resolveUserTrial(user) {
  const trial = user?.trial || user?.subscription?.trial || null;
  if (!trial || !trial.isTrial) return null;
  return trial;
}

function inferUserAccountType(user) {
  const accessLevel = String(user?.accessLevel || "").toLowerCase();
  if (accessLevel === "administrador" || Boolean(user?.isAdmin)) return "administrador";
  const trial = resolveUserTrial(user);
  if (trial && !trial.isExpired) return "teste_premium";
  if (accessLevel === "premium") return "premium";
  return "gratuito";
}

function accessLevelLabel(user) {
  const accountType = inferUserAccountType(user);
  if (accountType === "administrador") return "Administrador";
  if (accountType === "teste_premium") return "Premium por dias";
  if (accountType === "premium") return "Premium";
  return "Gratuito";
}

function roleLabel(user) {
  const role = String(user?.role || "").trim().toLowerCase();
  if (role === "admin") return "Administrador";
  return "Usuário";
}

function userActionLabel(action) {
  const normalized = String(action || "").trim().toLowerCase();
  if (normalized === "auth.login") return "Login";
  if (normalized === "auth.logout") return "Logout";
  if (normalized === "auth.register") return "Cadastro";
  if (normalized === "auth.oauth.login") return "Login social";
  if (normalized === "auth.oauth.register") return "Cadastro social";
  if (normalized === "auth.profile.update") return "Atualizacao de perfil";
  return sanitizeText(normalized || "evento");
}

function safeExternalUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) return "";
  return sanitizeText(value);
}

function applyUsersTypeFilter(users) {
  const selectedType = String(usersAccessFilter?.value || "all").toLowerCase();
  if (selectedType === "all") {
    return users;
  }
  return users.filter((user) => inferUserAccountType(user) === selectedType);
}

function updateUsersCountInfo(displayCount) {
  if (!usersCountInfo) return;
  const totalSystem = Number(state.dashboard?.userStats?.totalUsers || state.serverTotalForCurrentQuery || displayCount || 0);
  const totalQuery = Number(state.serverTotalForCurrentQuery || displayCount || 0);
  usersCountInfo.textContent = `Mostrando ${displayCount} usuário(s), de ${totalQuery} encontrado(s) na busca atual. Total cadastrado no sistema: ${totalSystem}.`;
}

function buildUsersHtml(users) {
  if (!Array.isArray(users) || users.length === 0) {
    return '<p class="cpanel-admin-empty">Nenhum usuário encontrado para o filtro selecionado.</p>';
  }

  return users.map((user) => {
    const trial = resolveUserTrial(user);
    const trialLabel = trial
      ? (trial.isExpired
        ? "Teste premium expirado"
        : `Teste premium ativo até ${sanitizeText(trial.endsAt || "")} (${Number(trial.daysLeft || 0)} dia(s) restante(s))`)
      : "Sem teste premium ativo";

    return `
      <article class="cpanel-admin-user-card" data-user-id="${Number(user.id || 0)}">
        <div class="cpanel-admin-user-top">
          <div>
            <strong>${sanitizeText(user.fullName || "Usuário")}</strong>
            <p>${sanitizeText(user.email || "")}</p>
          </div>
          <span class="cpanel-admin-user-badge">${accessLevelLabel(user)}</span>
        </div>
        <div class="cpanel-admin-user-meta">
          <span>Perfil: ${sanitizeText(roleLabel(user))}</span>
          <span>Telefone: ${sanitizeText(maskPhone(user.phone || "")) || "-"}</span>
          <span>${sanitizeText(trialLabel)}</span>
          <span>Cadastrado em: ${sanitizeText(formatDateTime(user.createdAt || ""))}</span>
        </div>
        <div class="cpanel-admin-user-controls">
          <label>
            <span>Tipo da conta</span>
            <select class="cpanel-admin-user-access">
              <option value="gratuito">Gratuito</option>
              <option value="premium">Premium permanente</option>
              <option value="teste_premium">Premium por dias</option>
              <option value="administrador">Administrador</option>
            </select>
          </label>
          <label class="cpanel-admin-user-trial-field" hidden>
            <span>Dias premium</span>
            <input class="cpanel-admin-user-trial-days" type="number" min="1" max="30" value="${Number(trial?.daysLeft || DEFAULT_TRIAL_DAYS)}">
          </label>
          <button type="button" class="cpanel-admin-user-save-btn">Aplicar</button>
        </div>
      </article>
    `;
  }).join("");
}

function hydrateUsersControls(users) {
  if (!usersList || !Array.isArray(users)) return;
  const cards = [...usersList.querySelectorAll(".cpanel-admin-user-card")];
  cards.forEach((card) => {
    const userId = Number(card.dataset.userId || 0);
    const user = users.find((item) => Number(item?.id || 0) === userId);
    if (!user) return;

    const accessSelect = card.querySelector(".cpanel-admin-user-access");
    const trialField = card.querySelector(".cpanel-admin-user-trial-field");
    const trialInput = card.querySelector(".cpanel-admin-user-trial-days");
    if (!accessSelect) return;

    accessSelect.value = inferUserAccountType(user);

    const toggleTrialField = () => {
      const isTrial = accessSelect.value === "teste_premium";
      if (trialField) trialField.hidden = !isTrial;
      if (isTrial && trialInput && !trialInput.value) {
        trialInput.value = String(DEFAULT_TRIAL_DAYS);
      }
    };

    accessSelect.addEventListener("change", toggleTrialField);
    toggleTrialField();
  });
}

function renderUsersFromState() {
  if (!usersList) return;
  const users = applyUsersTypeFilter(state.users);
  usersList.innerHTML = buildUsersHtml(users);
  hydrateUsersControls(users);
  updateUsersCountInfo(users.length);
}

async function loadUsers() {
  if (!usersList) return;

  usersList.innerHTML = '<p class="cpanel-admin-loading">Carregando usuários...</p>';

  const profile = String(usersProfileFilter?.value || "all").toLowerCase();
  const search = sanitizeText(usersSearchInput?.value || "").trim();
  const params = new URLSearchParams({
    profile,
    page: "1",
    limit: "200"
  });
  if (search) {
    params.set("q", search);
  }

  try {
    const payload = await apiRequest(`api/admin/users?${params.toString()}`);
    const users = Array.isArray(payload?.users) ? payload.users : [];
    state.users = users;
    state.serverTotalForCurrentQuery = Number(payload?.pagination?.total || users.length);
    renderUsersFromState();
  } catch (error) {
    usersList.innerHTML = `<p class="cpanel-admin-empty">${sanitizeText(error.message || "Não foi possível carregar os usuários.")}</p>`;
    state.users = [];
    state.serverTotalForCurrentQuery = 0;
    updateUsersCountInfo(0);
  }
}

function renderUsersKpis(userStats) {
  if (!userStats) return;
  if (usersTotalKpi) usersTotalKpi.textContent = String(Number(userStats.totalUsers || 0));
  if (usersAdminsKpi) usersAdminsKpi.textContent = String(Number(userStats.totalAdmins || 0));
  if (usersPremiumKpi) usersPremiumKpi.textContent = String(Number(userStats.totalPremium || 0));
  if (usersFreeKpi) usersFreeKpi.textContent = String(Number(userStats.totalFree || 0));
}

function renderAccessKpis(summary) {
  if (!summary) return;
  if (accessTotalKpi) accessTotalKpi.textContent = String(Number(summary.totalEvents || 0));
  if (accessLoginSuccessKpi) accessLoginSuccessKpi.textContent = String(Number(summary.loginSuccess || 0));
  if (accessLoginDeniedKpi) accessLoginDeniedKpi.textContent = String(Number(summary.loginDenied || 0));
  if (accessRegisterKpi) accessRegisterKpi.textContent = String(Number(summary.registerEvents || 0));
}

function renderBillingKpis(summary) {
  if (!summary) return;
  if (billingActiveKpi) billingActiveKpi.textContent = String(Number(summary.activeSubscriptions || 0));
  if (billingPendingKpi) billingPendingKpi.textContent = String(Number(summary.pendingSubscriptions || 0));
  if (billingTrialsKpi) billingTrialsKpi.textContent = String(Number(summary.activeTrials || 0));
  if (billingRevenueKpi) billingRevenueKpi.textContent = formatCurrencyFromCents(summary.activeRevenueCents || 0, "BRL");
}

function accessUserKeyFromEntry(entry) {
  const userId = Number(entry?.userId || 0);
  if (Number.isFinite(userId) && userId > 0) {
    return `id:${userId}`;
  }
  const email = sanitizeText(entry?.email || "").toLowerCase();
  if (email) {
    return `email:${email}`;
  }
  const fullName = sanitizeText(entry?.fullName || "").toLowerCase();
  if (fullName) {
    return `name:${fullName}`;
  }
  return "";
}

function buildAccessUsers(events) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const grouped = new Map();

  events.forEach((eventItem) => {
    const key = accessUserKeyFromEntry(eventItem);
    if (!key) return;

    const fullName = sanitizeText(eventItem.fullName || "");
    const email = sanitizeText(eventItem.email || "");
    const occurredAt = String(eventItem.createdAt || "");
    const parsedTime = Date.parse(occurredAt);
    const occurredTimestamp = Number.isFinite(parsedTime) ? parsedTime : 0;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        fullName,
        email,
        eventCount: 1,
        lastEventTimestamp: occurredTimestamp
      });
      return;
    }

    const current = grouped.get(key);
    current.eventCount += 1;
    if (occurredTimestamp > current.lastEventTimestamp) {
      current.lastEventTimestamp = occurredTimestamp;
    }
    if (!current.fullName && fullName) current.fullName = fullName;
    if (!current.email && email) current.email = email;
  });

  return [...grouped.values()].sort((left, right) => {
    if (right.lastEventTimestamp !== left.lastEventTimestamp) {
      return right.lastEventTimestamp - left.lastEventTimestamp;
    }
    const leftLabel = String(left.fullName || left.email || "").toLowerCase();
    const rightLabel = String(right.fullName || right.email || "").toLowerCase();
    return leftLabel.localeCompare(rightLabel, "pt-BR");
  });
}

function applyAccessUsersFilter(users) {
  const query = sanitizeText(accessUsersFilterInput?.value || "").toLowerCase();
  if (!query) return users;
  return users.filter((user) => {
    const name = String(user.fullName || "").toLowerCase();
    const email = String(user.email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });
}

function findAccessUserByKey(key) {
  if (!key) return null;
  return state.accessUsers.find((user) => user.key === key) || null;
}

function renderAccessUserHint(selectedUser, eventCount) {
  if (!accessCurrentUser) return;
  if (!selectedUser) {
    accessCurrentUser.textContent = "Selecione um usuário para visualizar o fluxo de acesso individual.";
    return;
  }
  const displayName = sanitizeText(selectedUser.fullName || selectedUser.email || "Usuário");
  accessCurrentUser.textContent = `Exibindo ${eventCount} evento(s) de acesso para ${displayName}.`;
}

function renderAccessUsersList(users) {
  if (!accessUsersList) return;
  if (!Array.isArray(users) || users.length === 0) {
    accessUsersList.innerHTML = '<p class="cpanel-admin-empty">Nenhum usuário com evento de acesso no periodo.</p>';
    return;
  }

  accessUsersList.innerHTML = users.map((user) => {
    const displayName = sanitizeText(user.fullName || user.email || "Usuário");
    const userEmail = sanitizeText(user.email || "");
    const encodedKey = encodeURIComponent(String(user.key || ""));
    const isActive = String(user.key) === String(state.activeAccessUserKey || "");
    return `
      <button type="button" class="cpanel-admin-access-user-btn${isActive ? " is-active" : ""}" data-access-user-key="${encodedKey}">
        <span class="cpanel-admin-access-user-name">${displayName}</span>
        ${userEmail ? `<span class="cpanel-admin-access-user-email">${userEmail}</span>` : ""}
        <span class="cpanel-admin-access-user-count">${Number(user.eventCount || 0)} evento(s)</span>
      </button>
    `;
  }).join("");
}

function renderAccessFlow(events, emptyMessage = "Nenhum evento de acesso encontrado no periodo.") {
  if (!accessFlowList) return;
  if (!Array.isArray(events) || events.length === 0) {
    accessFlowList.innerHTML = `<p class="cpanel-admin-empty">${sanitizeText(emptyMessage)}</p>`;
    return;
  }

  accessFlowList.innerHTML = events.map((eventItem) => {
    const actorName = sanitizeText(eventItem.fullName || eventItem.email || "Usuário não identificado");
    const actionLabel = sanitizeText(userActionLabel(eventItem.action));
    const status = sanitizeText(String(eventItem.status || "").toLowerCase() || "status");
    const statusClass = statusTone(status);
    const ipAddress = sanitizeText(eventItem.ipAddress || "-");
    const occurredAt = sanitizeText(formatDateTime(eventItem.createdAt || ""));

    return `
      <article class="cpanel-admin-timeline-item">
        <div class="cpanel-admin-timeline-top">
          <strong>${actionLabel} - ${actorName}</strong>
          <span class="cpanel-admin-status-badge is-${statusClass}">${status}</span>
        </div>
        <div class="cpanel-admin-timeline-meta">
          <span>Data: ${occurredAt}</span>
          <span>IP: ${ipAddress}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderAccessByActiveUser() {
  const hasUsers = Array.isArray(state.accessUsers) && state.accessUsers.length > 0;
  const selectedUser = findAccessUserByKey(state.activeAccessUserKey);

  if (!hasUsers) {
    renderAccessUserHint(null, 0);
    renderAccessFlow([], "Nenhum evento de acesso encontrado no periodo.");
    return;
  }

  if (!selectedUser) {
    renderAccessUserHint(null, 0);
    renderAccessFlow([], "Selecione um usuário para visualizar o fluxo de acesso.");
    return;
  }

  const filteredEvents = state.accessEvents.filter((eventItem) => accessUserKeyFromEntry(eventItem) === selectedUser.key);
  renderAccessUserHint(selectedUser, filteredEvents.length);
  renderAccessFlow(filteredEvents, "Nenhum evento de acesso encontrado para este usuário no periodo.");
}

function renderAccessUsersAndFlow() {
  const allUsers = Array.isArray(state.accessUsers) ? state.accessUsers : [];
  const visibleUsers = applyAccessUsersFilter(allUsers);
  const selectedVisible = visibleUsers.some((user) => user.key === state.activeAccessUserKey);
  if (!selectedVisible) {
    state.activeAccessUserKey = "";
  }
  renderAccessUsersList(visibleUsers);
  renderAccessByActiveUser();
}

function updateAccessState(events) {
  const safeEvents = Array.isArray(events) ? events : [];
  state.accessEvents = safeEvents;
  state.accessUsers = buildAccessUsers(safeEvents);
  if (!findAccessUserByKey(state.activeAccessUserKey)) {
    state.activeAccessUserKey = "";
  }
  renderAccessUsersAndFlow();
}

function renderBillingEntries(entries) {
  if (!billingList) return;
  if (!Array.isArray(entries) || entries.length === 0) {
    billingList.innerHTML = '<p class="cpanel-admin-empty">Nenhum registro de faturamento encontrado.</p>';
    return;
  }

  billingList.innerHTML = entries.map((entry) => {
    const subscriptionId = Number(entry.id || 0);
    const customerName = sanitizeText(entry.fullName || entry.email || "Usuário sem nome");
    const plan = sanitizeText(entry.planCode || "-");
    const status = sanitizeText(String(entry.status || "").toLowerCase() || "-");
    const statusClass = statusTone(status);
    const amount = formatCurrencyFromCents(entry.amountCents || 0, entry.currency || "BRL");
    const method = sanitizeText(entry.paymentMethod || "-");
    const updatedAt = sanitizeText(formatDateTime(entry.updatedAt || entry.createdAt || ""));
    const invoiceUrl = safeExternalUrl(entry.invoiceUrl || "");
    const invoiceHtml = invoiceUrl
      ? `<a class="cpanel-admin-billing-link" href="${invoiceUrl}" target="_blank" rel="noopener noreferrer">Abrir fatura</a>`
      : '<span>Sem fatura vinculada</span>';
    const trial = entry?.trial || null;
    const trialLabel = trial?.isTrial
      ? (trial.isExpired ? "Teste expirado" : `Teste ativo até ${sanitizeText(trial.endsAt || "")}`)
      : "Sem teste premium";
    const manual = entry?.manualValidation || null;
    const manualStatus = String(manual?.status || status || "pending").toLowerCase();
    const manualValidatedAt = sanitizeText(formatDateTime(manual?.validatedAt || ""));
    const manualAdmin = sanitizeText(manual?.adminUserName || "");
    const manualPaidAt = formatDateTimeLocalInput(manual?.paidAt || "");
    const manualTransactionId = sanitizeText(manual?.transactionId || "");
    const manualProofNote = sanitizeText(manual?.proofNote || "");
    const manualAmountDefault = Number.isFinite(Number(manual?.paidAmountCents))
      ? (Number(manual.paidAmountCents) / 100).toFixed(2).replace(".", ",")
      : "";
    const manualProofUrl = safeExternalUrl(manual?.proofFile?.url || "");
    const manualProofName = sanitizeText(manual?.proofFile?.originalName || "comprovante");
    const manualSummary = manual?.isManual
      ? `<span>Validação manual: ${sanitizeText(manualStatus)} em ${manualValidatedAt}${manualAdmin ? ` por ${manualAdmin}` : ""}</span>`
      : "<span>Sem validação manual registrada.</span>";
    const manualProofLink = manualProofUrl
      ? `<a class="cpanel-admin-billing-link" href="${manualProofUrl}" target="_blank" rel="noopener noreferrer">Abrir comprovante vinculado (${manualProofName})</a>`
      : "<span>Sem comprovante vinculado.</span>";

    return `
      <article class="cpanel-admin-timeline-item" data-subscription-id="${subscriptionId}">
        <div class="cpanel-admin-timeline-top">
          <strong>${customerName}</strong>
          <span class="cpanel-admin-status-badge is-${statusClass}">${status}</span>
        </div>
        <div class="cpanel-admin-timeline-meta">
          <span>Plano: ${plan}</span>
          <span>Valor: ${sanitizeText(amount)}</span>
          <span>Metodo: ${method}</span>
          <span>${sanitizeText(trialLabel)}</span>
          <span>Atualizado em: ${updatedAt}</span>
          ${invoiceHtml}
          ${manualSummary}
          ${manualProofLink}
        </div>
        <div class="cpanel-admin-billing-manual-box">
          <div class="cpanel-admin-billing-manual-grid">
            <label class="cpanel-admin-field">
              <span>Status manual</span>
              <select class="cpanel-admin-billing-manual-status">
                <option value="active" ${manualStatus === "active" ? "selected" : ""}>Pago</option>
                <option value="pending" ${manualStatus === "pending" ? "selected" : ""}>Pendente</option>
                <option value="past_due" ${manualStatus === "past_due" ? "selected" : ""}>Em atraso</option>
                <option value="canceled" ${manualStatus === "canceled" ? "selected" : ""}>Nao pago / cancelado</option>
              </select>
            </label>

            <label class="cpanel-admin-field">
              <span>Data do pagamento</span>
              <input class="cpanel-admin-billing-manual-paid-at" type="datetime-local" value="${manualPaidAt}">
            </label>

            <label class="cpanel-admin-field">
              <span>ID transacao/comprovante</span>
              <input class="cpanel-admin-billing-manual-transaction" type="text" maxlength="120" value="${manualTransactionId}" placeholder="Ex.: E1823...">
            </label>

            <label class="cpanel-admin-field">
              <span>Valor pago (R$)</span>
              <input class="cpanel-admin-billing-manual-amount" type="text" inputmode="decimal" value="${manualAmountDefault}" placeholder="18,00">
            </label>

            <label class="cpanel-admin-field">
              <span>Comprovante (JPG/PNG/WEBP/PDF)</span>
              <input class="cpanel-admin-billing-manual-proof-file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,application/pdf,image/jpeg,image/png,image/webp">
            </label>
          </div>

          <label class="cpanel-admin-field cpanel-admin-billing-manual-note">
            <span>Observacao administrativa</span>
            <textarea class="cpanel-admin-billing-manual-note-input" rows="2" maxlength="1200" placeholder="Ex.: pagamento confirmado via comprovante enviado pelo cliente.">${manualProofNote}</textarea>
          </label>

          <div class="cpanel-admin-billing-manual-actions">
            <button type="button" class="cpanel-admin-btn cpanel-admin-btn-primary cpanel-admin-billing-manual-save-btn">Salvar validacao manual</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderDashboard(payload) {
  const userStats = payload?.userStats || {};
  const accessSummary = payload?.accessFlow?.summary || {};
  const accessEvents = Array.isArray(payload?.accessFlow?.events) ? payload.accessFlow.events : [];
  const billingSummary = payload?.billing?.summary || {};
  const billingEntries = Array.isArray(payload?.billing?.entries) ? payload.billing.entries : [];

  renderUsersKpis(userStats);
  renderAccessKpis(accessSummary);
  renderBillingKpis(billingSummary);
  updateAccessState(accessEvents);
  renderBillingEntries(billingEntries);
}

async function loadDashboard() {
  try {
    const payload = await apiRequest(`api/admin/dashboard?rangeDays=${DASHBOARD_RANGE_DAYS}&limit=${DASHBOARD_LIST_LIMIT}`);
    state.dashboard = payload;
    renderDashboard(payload);
    renderUsersFromState();
  } catch (error) {
    updateAccessState([]);
    renderBillingEntries([]);
    if (usersTotalKpi) usersTotalKpi.textContent = String(Number(state.serverTotalForCurrentQuery || 0));
    if (usersAdminsKpi) usersAdminsKpi.textContent = "--";
    if (usersPremiumKpi) usersPremiumKpi.textContent = "--";
    if (usersFreeKpi) usersFreeKpi.textContent = "--";
    if (accessTotalKpi) accessTotalKpi.textContent = "--";
    if (accessLoginSuccessKpi) accessLoginSuccessKpi.textContent = "--";
    if (accessLoginDeniedKpi) accessLoginDeniedKpi.textContent = "--";
    if (accessRegisterKpi) accessRegisterKpi.textContent = "--";
    if (billingActiveKpi) billingActiveKpi.textContent = "--";
    if (billingPendingKpi) billingPendingKpi.textContent = "--";
    if (billingTrialsKpi) billingTrialsKpi.textContent = "--";
    if (billingRevenueKpi) billingRevenueKpi.textContent = "--";
    setFeedback("error", sanitizeText(error.message || "Não foi possível carregar fluxo de acesso e faturamento."));
  }
}

function buildCreatePayload() {
  const accessLevel = String(createFields.accessLevel?.value || "gratuito").toLowerCase();
  const trialDaysRaw = Number(createFields.trialDays?.value || 0);
  const payload = {
    fullName: sanitizeText(createFields.fullName?.value || ""),
    email: sanitizeText(createFields.email?.value || "").toLowerCase(),
    phone: digitsOnly(createFields.phone?.value || ""),
    password: String(createFields.password?.value || ""),
    accessLevel
  };
  if (accessLevel === "premium") {
    payload.trialDays = trialDaysRaw;
  }
  return payload;
}

function validateCreatePayload(payload) {
  if (!payload.fullName || payload.fullName.length < 6 || !payload.fullName.includes(" ")) {
    return "Informe nome completo valido.";
  }
  if (!payload.email || !payload.email.includes("@")) {
    return "Informe um email valido.";
  }
  if (!payload.phone || payload.phone.length < 10) {
    return "Informe telefone com DDD.";
  }
  if (!payload.password || payload.password.length < 8) {
    return "Senha inicial deve ter pelo menos 8 caracteres.";
  }
  if (payload.accessLevel === "premium") {
    const trialDays = Number(payload.trialDays || 0);
    if (!Number.isFinite(trialDays) || trialDays < 1) {
      return "Para conta premium, informe dias de uso do premium.";
    }
  }
  return null;
}

async function handleCreateUser(event) {
  event.preventDefault();
  clearFeedback();

  const payload = buildCreatePayload();
  const validationError = validateCreatePayload(payload);
  if (validationError) {
    setFeedback("error", validationError);
    return;
  }

  if (createBtn) {
    createBtn.disabled = true;
    createBtn.textContent = "Criando...";
  }
  if (refreshBtn) refreshBtn.disabled = true;

  try {
    const response = await apiRequest("api/admin/users-create", {
      method: "POST",
      body: payload
    });
    setFeedback("success", sanitizeText(response?.message || "Usuário criado com sucesso."));
    if (createForm) createForm.reset();
    if (createFields.trialDays) createFields.trialDays.value = String(DEFAULT_TRIAL_DAYS);
    setCreateTrialVisibility();
    await Promise.allSettled([loadUsers(), loadDashboard()]);
  } catch (error) {
    setFeedback("error", sanitizeText(error.message || "Não foi possível criar o usuário."));
  } finally {
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.textContent = "Criar usuário";
    }
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

async function handleApplyUserAccess(button) {
  if (!button) return;
  const card = button.closest(".cpanel-admin-user-card");
  if (!card) return;
  const userId = Number(card.dataset.userId || 0);
  if (!userId) return;

  const accessSelect = card.querySelector(".cpanel-admin-user-access");
  const trialInput = card.querySelector(".cpanel-admin-user-trial-days");
  const accessLevel = String(accessSelect?.value || "gratuito").toLowerCase();
  const trialDays = Number(trialInput?.value || 0);

  const body = { userId, accessLevel };
  if (accessLevel === "teste_premium") {
    body.trialDays = trialDays;
  }

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Aplicando...";

  try {
    const response = await apiRequest("api/admin/user-access", {
      method: "POST",
      body
    });
    setFeedback("success", sanitizeText(response?.message || "Perfil atualizado com sucesso."));
    await Promise.allSettled([loadUsers(), loadDashboard()]);
  } catch (error) {
    setFeedback("error", sanitizeText(error.message || "Não foi possível atualizar o perfil do usuário."));
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function handleBillingManualUpdate(button) {
  if (!button) return;
  const card = button.closest(".cpanel-admin-timeline-item");
  if (!card) return;

  const subscriptionId = Number(card.dataset.subscriptionId || 0);
  if (!subscriptionId) {
    setFeedback("error", "Assinatura inválida para validação manual.");
    return;
  }

  const statusSelect = card.querySelector(".cpanel-admin-billing-manual-status");
  const paidAtInput = card.querySelector(".cpanel-admin-billing-manual-paid-at");
  const transactionInput = card.querySelector(".cpanel-admin-billing-manual-transaction");
  const amountInput = card.querySelector(".cpanel-admin-billing-manual-amount");
  const noteInput = card.querySelector(".cpanel-admin-billing-manual-note-input");
  const proofInput = card.querySelector(".cpanel-admin-billing-manual-proof-file");

  const manualStatus = String(statusSelect?.value || "").toLowerCase();
  const paymentDate = String(paidAtInput?.value || "").trim();
  const transactionId = sanitizeText(transactionInput?.value || "");
  const paidAmount = sanitizeText(amountInput?.value || "");
  const proofNote = sanitizeText(noteInput?.value || "");
  const proofFile = proofInput?.files?.[0] || null;

  if (!["active", "pending", "past_due", "canceled"].includes(manualStatus)) {
    setFeedback("error", "Selecione um status manual válido.");
    return;
  }

  if (manualStatus === "active" && !proofFile && !transactionId && !proofNote) {
    setFeedback("error", "Para marcar como pago, anexe comprovante ou informe ID da transação/observação.");
    return;
  }

  const formData = new FormData();
  formData.append("subscriptionId", String(subscriptionId));
  formData.append("manualStatus", manualStatus);
  if (paymentDate) formData.append("paymentDate", paymentDate);
  if (transactionId) formData.append("transactionId", transactionId);
  if (paidAmount) formData.append("paidAmount", paidAmount);
  if (proofNote) formData.append("proofNote", proofNote);
  if (proofFile) formData.append("proofFile", proofFile, proofFile.name);

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Salvando...";

  try {
    const response = await apiRequest("api/admin/billing-manual-update", {
      method: "POST",
      body: formData
    });
    setFeedback("success", sanitizeText(response?.message || "Validação manual atualizada."));
    await Promise.allSettled([loadDashboard(), loadUsers()]);
  } catch (error) {
    setFeedback("error", sanitizeText(error.message || "Não foi possível salvar a validação manual."));
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function clearFilters() {
  if (usersSearchInput) usersSearchInput.value = "";
  if (usersProfileFilter) usersProfileFilter.value = "all";
  if (usersAccessFilter) usersAccessFilter.value = "all";
}

function bindEvents() {
  if (createFields.phone) {
    createFields.phone.addEventListener("input", () => {
      createFields.phone.value = maskPhone(createFields.phone.value);
    });
  }
  if (createFields.accessLevel) {
    createFields.accessLevel.addEventListener("change", setCreateTrialVisibility);
    setCreateTrialVisibility();
  }
  if (createForm) {
    createForm.addEventListener("submit", handleCreateUser);
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      clearFeedback();
      Promise.allSettled([loadUsers(), loadDashboard()]);
    });
  }
  if (usersList) {
    usersList.addEventListener("click", (event) => {
      const button = event.target.closest(".cpanel-admin-user-save-btn");
      if (!button) return;
      handleApplyUserAccess(button);
    });
  }
  if (billingList) {
    billingList.addEventListener("click", (event) => {
      const button = event.target.closest(".cpanel-admin-billing-manual-save-btn");
      if (!button) return;
      handleBillingManualUpdate(button);
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveTab(button.dataset.tab || "users");
    });

    button.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();

      const currentIndex = tabButtons.indexOf(button);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabButtons.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabButtons.length - 1;
      }

      const nextButton = tabButtons[nextIndex];
      if (!nextButton) return;
      setActiveTab(nextButton.dataset.tab || "users");
      nextButton.focus();
    });
  });

  if (usersApplyFiltersBtn) {
    usersApplyFiltersBtn.addEventListener("click", () => {
      clearFeedback();
      loadUsers();
    });
  }
  if (usersClearFiltersBtn) {
    usersClearFiltersBtn.addEventListener("click", () => {
      clearFilters();
      clearFeedback();
      loadUsers();
    });
  }
  if (usersSearchInput) {
    usersSearchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      clearFeedback();
      loadUsers();
    });
  }
  if (usersAccessFilter) {
    usersAccessFilter.addEventListener("change", () => {
      renderUsersFromState();
    });
  }
  if (accessUsersFilterInput) {
    accessUsersFilterInput.addEventListener("input", () => {
      renderAccessUsersAndFlow();
    });
  }
  if (accessUsersList) {
    accessUsersList.addEventListener("click", (event) => {
      const button = event.target.closest(".cpanel-admin-access-user-btn");
      if (!button) return;
      const encodedKey = String(button.dataset.accessUserKey || "");
      if (!encodedKey) return;
      try {
        state.activeAccessUserKey = decodeURIComponent(encodedKey);
      } catch {
        state.activeAccessUserKey = encodedKey;
      }
      renderAccessUsersAndFlow();
    });
  }
}

async function initAdminCpanel() {
  if (!cpanelModule || !adminConsole) return;

  try {
    const session = await apiRequest("api/auth/session");
    const isAdmin = Boolean(session?.authenticated) && isAdminUser(session?.user || {});
    if (!isAdmin) {
      cpanelModule.hidden = true;
      adminConsole.hidden = true;
      return;
    }

    cpanelModule.hidden = false;
    adminConsole.hidden = false;
    bindEvents();
    setActiveTab("users");
    await Promise.allSettled([loadUsers(), loadDashboard()]);
  } catch {
    cpanelModule.hidden = true;
    adminConsole.hidden = true;
  }
}

initAdminCpanel();
