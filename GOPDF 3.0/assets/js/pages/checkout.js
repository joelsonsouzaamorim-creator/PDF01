import { apiRequest, digitsOnly, sanitizeText } from "../core/http.js";

const form = document.getElementById("premiumCheckoutForm");
const methodButtons = Array.from(document.querySelectorAll(".checkout-method-btn"));
const pixPanel = document.getElementById("checkoutPanelPix");
const cardPanel = document.getElementById("checkoutPanelCard");
const pixFeedback = document.getElementById("pixFeedback");
const cardFeedback = document.getElementById("cardFeedback");
const statusCard = document.getElementById("subscriptionStatus");
const authBox = document.getElementById("checkoutAuthGate");

const inputs = {
  name: document.getElementById("checkoutName"),
  email: document.getElementById("checkoutEmail"),
  phone: document.getElementById("checkoutPhone"),
  document: document.getElementById("checkoutDocument")
};

const controls = {
  copyPixBtn: document.getElementById("copyPixBtn"),
  pixConfirmBtn: document.getElementById("pixConfirmBtn"),
  cardConfirmBtn: document.getElementById("cardConfirmBtn"),
  cardOpenBtn: document.getElementById("cardOpenBtn"),
  pixKeyDisplay: document.getElementById("pixKeyDisplay")
};

const planButtons = Array.from(document.querySelectorAll(".checkout-plan-btn"));
const planView = {
  price: document.getElementById("checkoutPlanPrice"),
  caption: document.getElementById("checkoutPlanCaption"),
  summary: document.getElementById("checkoutPlanSummary")
};

const PLAN_OPTIONS = Object.freeze({
  monthly: {
    key: "monthly",
    code: "gopdf-premium-monthly",
    cycle: "monthly",
    amount: 18,
    priceHtml: "R$ 18,00 <small>/ mês</small>",
    caption: "Assinatura mensal para equipes que precisam de fluxo profissional, segurança e rastreabilidade.",
    summary: "Mensal: R$ 18,00 por usuário/mês."
  },
  annual: {
    key: "annual",
    code: "gopdf-premium-annual",
    cycle: "annual",
    amount: 172.8,
    priceHtml: "R$ 172,80 <small>/ ano</small>",
    caption: "Assinatura anual com 20% OFF para equipes que buscam economia com previsibilidade.",
    summary: "Anual: R$ 172,80 por usuário/ano (equivale a R$ 14,40/mês)."
  }
});

const PIX_KEY_FALLBACK = "pagamento@gopdf.com.br";
let selectedMethod = "pix";
let selectedPlan = "monthly";
let userSession = null;
let statusTimer = null;
let isCreatingPayment = false;

function isAdminSession(sessionPayload) {
  const accessLevel = String(sessionPayload?.user?.accessLevel || "").trim().toLowerCase();
  const role = String(sessionPayload?.user?.role || "").trim().toLowerCase();
  return accessLevel === "administrador" || role === "admin" || Boolean(sessionPayload?.user?.isAdmin);
}

function getPlanOption(planKey) {
  return PLAN_OPTIONS[planKey] || PLAN_OPTIONS.monthly;
}

function switchPlan(nextPlan) {
  selectedPlan = nextPlan === "annual" ? "annual" : "monthly";
  const plan = getPlanOption(selectedPlan);

  planButtons.forEach((button) => {
    const active = (button.dataset.plan || "monthly") === selectedPlan;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  if (planView.price) {
    planView.price.innerHTML = plan.priceHtml;
  }
  if (planView.caption) {
    planView.caption.textContent = plan.caption;
  }
  if (planView.summary) {
    planView.summary.textContent = plan.summary;
  }
}

function setFeedback(target, type, message) {
  target.hidden = false;
  target.className = `checkout-feedback is-${type}`;
  target.innerHTML = message;
}

function clearFeedback() {
  [pixFeedback, cardFeedback].forEach((box) => {
    box.hidden = true;
    box.className = "checkout-feedback";
    box.textContent = "";
  });
}

function setCardCheckoutLink(url) {
  const safeUrl = sanitizeText(url || "");
  if (!controls.cardOpenBtn) return;
  if (!safeUrl) {
    controls.cardOpenBtn.hidden = true;
    controls.cardOpenBtn.removeAttribute("href");
    return;
  }
  controls.cardOpenBtn.href = safeUrl;
  controls.cardOpenBtn.hidden = false;
}

function setButtonLoading(button, loading) {
  if (!button) return;

  if (loading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent || "";
    }
    button.disabled = true;
    button.classList.add("is-loading");
    button.textContent = button.dataset.loadingText || "Processando...";
    return;
  }

  button.classList.remove("is-loading");
  button.disabled = false;
  if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
}

function switchMethod(nextMethod) {
  selectedMethod = nextMethod === "card" ? "card" : "pix";
  const pixActive = selectedMethod === "pix";
  clearFeedback();

  methodButtons.forEach((button) => {
    const active = button.dataset.method === selectedMethod;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  pixPanel.hidden = !pixActive;
  cardPanel.hidden = pixActive;
  pixPanel.classList.toggle("is-active", pixActive);
  cardPanel.classList.toggle("is-active", !pixActive);
}

function formatPhone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDocument(value) {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function allDigitsEqual(value) {
  return /^(\d)\1+$/.test(value);
}

function isValidCpf(value) {
  if (value.length !== 11 || allDigitsEqual(value)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(value[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(value[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(value[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(value[10]);
}

function isValidCnpj(value) {
  if (value.length !== 14 || allDigitsEqual(value)) return false;

  const calcDigit = (base, factors) => {
    let sum = 0;
    for (let i = 0; i < factors.length; i += 1) {
      sum += Number(base[i]) * factors[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const digit1 = calcDigit(value, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit1 !== Number(value[12])) return false;

  const digit2 = calcDigit(value, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digit2 === Number(value[13]);
}

function isValidDocument(value) {
  if (value.length === 11) return isValidCpf(value);
  if (value.length === 14) return isValidCnpj(value);
  return false;
}

function setFormEnabled(enabled) {
  form.querySelectorAll("input, button").forEach((element) => {
    if (element.id === "copyPixBtn") return;
    element.disabled = !enabled;
  });
}

function renderAuthGate(sessionPayload) {
  const authenticated = Boolean(sessionPayload?.authenticated);
  setFormEnabled(authenticated);

  if (authenticated) {
    authBox.hidden = true;
    const user = sessionPayload.user || {};
    inputs.name.value = user.fullName || "";
    inputs.email.value = user.email || "";
    inputs.phone.value = formatPhone(user.phone || "");
    const sessionDocument = digitsOnly(user.document || "");
    const currentDocument = digitsOnly(inputs.document.value || "");
    if (sessionDocument && sessionDocument !== currentDocument) {
      inputs.document.value = formatDocument(sessionDocument);
    }
    return;
  }

  authBox.hidden = false;
  setCardCheckoutLink("");
  authBox.innerHTML = `
    <strong>Faça login para contratar o Premium com segurança.</strong>
    <span>Seu cadastro e assinatura agora usam sessão autenticada e confirmação por webhook.</span>
    <div class="checkout-auth-actions">
      <a class="info-cta-btn primary" href="entrar.html?next=assinatura-premium.html">Entrar</a>
      <a class="info-cta-btn secondary" href="cadastro.html?next=assinatura-premium.html">Criar conta</a>
    </div>
  `;
}

function renderSubscriptionStatus(subscriptionPayload) {
  if (isAdminSession(userSession)) {
    statusCard.className = "checkout-status-card is-active";
    statusCard.innerHTML = `
      <strong>Acesso de administrador ativo</strong>
      <span>Seu perfil de administrador já possui acesso completo aos recursos premium.</span>
      <small>Não é necessário gerar cobrança para este usuário.</small>
    `;
    return;
  }

  const subscription = subscriptionPayload?.subscription;
  const subscriptionCycle = String(subscription?.cycle || "").trim().toLowerCase();
  if (subscriptionCycle === "annual" || subscriptionCycle === "yearly") {
    switchPlan("annual");
  } else if (subscriptionCycle === "monthly") {
    switchPlan("monthly");
  }

  if (!subscriptionPayload?.hasSubscription || !subscription) {
    statusCard.className = "checkout-status-card";
    statusCard.innerHTML = "<strong>Assinatura ainda não ativada</strong><span>Conclua a autenticação e gere a cobrança para liberar o Premium após confirmação de pagamento.</span>";
    return;
  }

  const status = String(subscription.status || "pending").toLowerCase();
  if (status === "active") {
    const cycleLabel = subscriptionCycle === "annual" || subscriptionCycle === "yearly" ? "anual" : "mensal";
    const amountCents = Number(subscription.amount_cents || 0);
    const amountLabel = Number.isFinite(amountCents) && amountCents > 0
      ? (amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "-";
    const paymentLabel = sanitizeText(subscription.payment_method || "-");
    const activatedAtLabel = sanitizeText(subscription.activated_at || "-");

    statusCard.className = "checkout-status-card is-active";
    statusCard.innerHTML = `
      <strong>Assinatura premium ativa</strong>
      <span>Seu acesso está liberado para este usuário autenticado.</span>
      <small>Plano ${cycleLabel} (${amountLabel}) - Pagamento: ${paymentLabel} - Ativada em ${activatedAtLabel}</small>
    `;
    return;
  }

  statusCard.className = "checkout-status-card";
  statusCard.innerHTML = `
    <strong>Assinatura pendente de confirmação</strong>
    <span>Finalize o pagamento para ativar o plano automaticamente.</span>
    <small>Status atual: ${status}</small>
  `;
}
async function refreshSessionAndStatus() {
  try {
    const sessionPayload = await apiRequest("api/auth/session");
    userSession = sessionPayload;
    renderAuthGate(sessionPayload);
    if (sessionPayload.authenticated) {
      if (isAdminSession(sessionPayload)) {
        renderSubscriptionStatus({ hasSubscription: false });
      } else {
        const subscriptionPayload = await apiRequest("api/subscriptions/status");
        renderSubscriptionStatus(subscriptionPayload);
      }
    } else {
      renderSubscriptionStatus({ hasSubscription: false });
    }
  } catch (error) {
    renderAuthGate({ authenticated: false });
    renderSubscriptionStatus({ hasSubscription: false });
    setFeedback(pixFeedback, "warning", sanitizeText(error.message));
  }
}

async function createSubscription(method) {
  const plan = getPlanOption(selectedPlan);
  const document = digitsOnly(inputs.document.value || "");
  const body = {
    method,
    planCode: plan.code,
    amount: plan.amount,
    cycle: plan.cycle,
    document
  };

  const payload = await apiRequest("api/subscriptions/create", {
    method: "POST",
    body
  });

  return payload;
}

function renderPaymentPayload(payload) {
  const payment = payload?.payment || {};
  const subscriptionStatus = String(payload?.subscription?.status || "").trim().toLowerCase();
  const invoiceUrl = sanitizeText(payment.invoiceUrl || "");
  const pixCode = sanitizeText(payment.pixCopyPaste || "");
  const pixImageRaw = sanitizeText(payment.pixQrCodeUrl || "");

  if (controls.pixKeyDisplay) {
    controls.pixKeyDisplay.textContent = pixCode || PIX_KEY_FALLBACK;
  }

  if (subscriptionStatus === "active") {
    const activeMessage = `
      Pagamento validado com sucesso.
      <br>Assinatura premium ativa para este usuário.
      ${invoiceUrl ? `<br><a href="${invoiceUrl}" target="_blank" rel="noopener noreferrer">Abrir comprovante/cobrança</a>` : ""}
    `;

    if (selectedMethod === "pix") {
      setFeedback(pixFeedback, "success", activeMessage);
    } else {
      setFeedback(cardFeedback, "success", activeMessage);
      setCardCheckoutLink(invoiceUrl);
    }
    return;
  }

  if (selectedMethod === "pix") {
    const imageSource = pixImageRaw && !pixImageRaw.startsWith("data:")
      ? `data:image/png;base64,${pixImageRaw}`
      : pixImageRaw;

    setFeedback(
      pixFeedback,
      "success",
      `
      Cobrança Pix criada com sucesso. 
      ${pixCode ? `<br><strong>Copia e cola:</strong> <code>${pixCode}</code>` : ""}
      ${imageSource ? `<br><img src="${imageSource}" alt="QR Code Pix da cobrança premium" class="checkout-pix-image">` : ""}
      ${invoiceUrl ? `<br><a href="${invoiceUrl}" target="_blank" rel="noopener noreferrer">Abrir cobrança no Asaas</a>` : ""}
      `
    );
    return;
  }

  setFeedback(
    cardFeedback,
    "success",
    `
    Checkout de cartão criado com sucesso.
    ${invoiceUrl ? "<br>Se uma nova aba não abrir automaticamente, use o botão <strong>Abrir checkout seguro</strong>." : ""}
    ${invoiceUrl ? `<br><a href="${invoiceUrl}" target="_blank" rel="noopener noreferrer">Abrir checkout do Asaas em nova aba</a>` : ""}
    `
  );

  setCardCheckoutLink(invoiceUrl);

  if (invoiceUrl) {
    const checkoutWindow = window.open(invoiceUrl, "_blank", "noopener,noreferrer");
    if (!checkoutWindow) {
      setFeedback(
        cardFeedback,
        "warning",
        `O navegador bloqueou a abertura automática da aba. Use o botão <strong>Abrir checkout seguro</strong> para continuar.`
      );
    }
  }
}

async function handlePayment(method) {
  clearFeedback();
  const feedbackTarget = method === "pix" ? pixFeedback : cardFeedback;
  if (isCreatingPayment) {
    return;
  }

  if (!userSession?.authenticated) {
    setFeedback(feedbackTarget, "warning", "Faça login antes de gerar a cobrança.");
    return;
  }

  if (isAdminSession(userSession)) {
    setFeedback(feedbackTarget, "warning", "Perfil administrador já possui acesso premium e não precisa de assinatura.");
    return;
  }

  const documentDigits = digitsOnly(inputs.document.value || "");
  inputs.document.value = formatDocument(documentDigits);
  if (!isValidDocument(documentDigits)) {
    setFeedback(feedbackTarget, "warning", "Informe um CPF ou CNPJ válido para gerar a cobrança no Asaas.");
    return;
  }

  const actionButton = method === "pix" ? controls.pixConfirmBtn : controls.cardConfirmBtn;
  isCreatingPayment = true;
  setButtonLoading(actionButton, true);

  try {
    const payload = await createSubscription(method);
    renderPaymentPayload(payload);
    await refreshSessionAndStatus();
  } catch (error) {
    try {
      await refreshSessionAndStatus();
    } catch (_) {
      // Ignora erro secundário para manter feedback principal.
    }
    const message = sanitizeText(error.message || "Não foi possível gerar a cobrança.");
    setFeedback(method === "pix" ? pixFeedback : cardFeedback, "error", message);
  } finally {
    setButtonLoading(actionButton, false);
    isCreatingPayment = false;
  }
}

async function copyPixCode() {
  const value = sanitizeText(controls.pixKeyDisplay?.textContent || PIX_KEY_FALLBACK);
  try {
    await navigator.clipboard.writeText(value);
    setFeedback(pixFeedback, "success", "Código Pix copiado com sucesso.");
  } catch (_) {
    setFeedback(pixFeedback, "warning", "Não foi possível copiar automaticamente. Copie manualmente o código exibido.");
  }
}

function bindEvents() {
  planButtons.forEach((button) => {
    button.addEventListener("click", () => switchPlan(button.dataset.plan || "monthly"));
  });

  methodButtons.forEach((button) => {
    button.addEventListener("click", () => switchMethod(button.dataset.method || "pix"));
  });

  inputs.phone.addEventListener("input", () => {
    inputs.phone.value = formatPhone(inputs.phone.value);
  });
  inputs.document.addEventListener("input", () => {
    inputs.document.value = formatDocument(inputs.document.value);
  });

  controls.copyPixBtn?.addEventListener("click", copyPixCode);
  controls.pixConfirmBtn?.addEventListener("click", () => handlePayment("pix"));
  controls.cardConfirmBtn?.addEventListener("click", () => handlePayment("card"));
}

function startStatusPolling() {
  if (statusTimer) {
    clearInterval(statusTimer);
  }
  statusTimer = window.setInterval(() => {
    refreshSessionAndStatus();
  }, 20000);
}

bindEvents();
switchPlan("monthly");
switchMethod("pix");
refreshSessionAndStatus();
startStatusPolling();



