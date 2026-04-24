// ===================== ESTADO GLOBAL DE RESULTADOS =====================
// Guarda bytes prontos em memória para permitir baixar ou enviar para outra ferramenta

let resultadoJuntarBytes=null
let resultadoJuntarNome=""
let resultadosDividirList=[]   // [{bytes, nome}]
let resultadosCompactarList=[] // [{bytes, nome}]
let imagensPdfLista=[]
let imagemPdfItemSeq=0
let resultadoImagemPdfBytes=null
let resultadoImagemPdfNome=""
let avisoConfirmacaoPastaExibido=false
let pastaArquivoArrastandoInfo=null
const ordemPaginasPorArquivo=new WeakMap()
let modalPaginasEstado={file:null, ordem:[], itens:new Map(), total:0}
let modalPaginaArrastandoPos=null

const versaoAplicacao="v2026.04.16-112118"
const dataHoraVersaoAplicacao="16/04/2026 11:21:18"
const anoAplicacao="2026"

// Ao registrar novas melhorias, mantenha `titulo`, `texto` e preferencialmente
// `dataHora` e `versao` para que o painel mostre o histórico completo.
const historicoAtualizacoes=[
  {
    titulo:"Correção do travamento de rolagem da página",
    texto:"A navegação entre home e ferramentas agora fecha quaisquer overlays pendentes automaticamente e remove o bloqueio de scroll do body, evitando a página presa após abrir painéis.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Navegacao da landing estabilizada em todas as telas",
    texto:"Os botoes do topo e os filtros da home agora funcionam mesmo quando o usuario ja entrou em uma ferramenta: o sistema retorna para a landing e direciona para a secao correta sem travar a navegacao.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Correção dos botões da landing e do acesso do usuário",
    texto:"Os botões principais da home foram alinhados ao comportamento esperado: Entrar agora abre a aba correta de login, o cadastro institucional deixa de fechar sozinho e os filtros de ferramentas passam a direcionar melhor a navegação na grade.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Home institucional redesenhada",
    texto:"A página principal recebeu um redesenho completo com topo mais sóbrio, hero corporativo, cards editoriais para as ferramentas, seções institucionais e novo rodapé alinhado à referência visual enviada.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Checkout premium com Pix e cartão",
    texto:"O plano premium agora conta com uma página própria de contratação, exigindo cadastro prévio com nome completo, email e telefone com DDD antes do pagamento por Pix ou cartão de crédito.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Rodapé ancorado no final da página",
    texto:"A estrutura da página principal foi ajustada para manter o rodapé no final da tela inteira, inclusive quando houver pouco conteúdo visível.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Home ajustada para destacar o plano Premium",
    texto:"A apresentação principal do site foi revisada para deixar claro que o GoPDF oferece recursos gratuitos e também conta com um plano Premium para uso mais profissional.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Landing page premium reforçada",
    texto:"A página Premium recebeu uma estrutura mais próxima de uma landing page de assinatura, com comparação de valor, benefícios, FAQ curta e fechamento comercial mais forte.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Refinamento comercial das páginas institucionais",
    texto:"As páginas Premium, Equipe e Contato receberam um segundo passe visual com mais destaque comercial, seções de valor, passos de ação e comunicação institucional mais forte.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Páginas institucionais de rodapé",
    texto:"Os atalhos Premium, Equipe e Contato do rodapé agora abrem páginas próprias com layout dedicado para planos, equipe do sistema e contatos da empresa.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Modal de acesso estabilizado",
    texto:"A sobreposição da área do usuário recebeu uma camada de fundo mais limpa e um painel mais sólido, reduzindo a sensação de tela desfocada ou desconfigurada ao abrir login e cadastro.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Encadeamento de tarefas entre PDFs",
    texto:"As telas de resultado passaram a oferecer próximas etapas com o mesmo PDF gerado, permitindo seguir direto para compactar, reorganizar, dividir, assinar ou OCR sem novo upload.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Home interativa e cadastro revisado",
    texto:"O logo principal agora retorna para a pagina inicial, as categorias da home filtram as ferramentas correspondentes e o cadastro do usuario recebeu validacoes e campos mais consistentes.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Painel lateral mais estavel",
    texto:"A area do usuario passou a funcionar como sobreposicao lateral com fundo de apoio, reduzindo a sensacao de pagina desconfigurada ao abrir cadastro e atualizacoes.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Refinamento visual da área do usuário",
    texto:"O painel de cadastro recebeu nova hierarquia visual, guias compactas, campos mais elegantes e ações fixadas de forma mais confortável no uso.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Cadastro interativo e textos corrigidos",
    texto:"A área do usuário recebeu correção de textos, foco automático nos campos e um fluxo mais direto para registrar nome completo, email e senha no próprio painel.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Formulario direto na area do usuario",
    texto:"A area do usuario agora abre o cadastro no proprio painel, exibindo diretamente os campos de nome completo, email e senha ao usar Registre-se.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Preparacao para publicacao no HostGator",
    texto:"O projeto recebeu arquivos auxiliares para publicacao estatica no cPanel, incluindo configuracao basica de UTF-8 e um pacote limpo para upload do site.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Inicialização local simplificada",
    texto:"Foram adicionados arquivos auxiliares para abrir o site localmente com um clique, facilitando o início do projeto no navegador sem precisar de build.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Tela externa de cadastro redesenhada",
    texto:"O botão Registre-se agora abre uma página de cadastro mais limpa e profissional, com visual inspirado na referência enviada e fluxo local integrado ao perfil do usuário.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Correção de textos e acentuação",
    texto:"Os textos visíveis do site foram revisados para corrigir acentos, termos em português e mensagens exibidas nas áreas de cadastro, rodapé, painéis e ferramentas.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Cadastro do usuário em nova aba",
    texto:"A opção Registre-se agora abre uma janela ou aba dedicada para preencher o cadastro, enquanto a página principal passa a atualizar o perfil salvo automaticamente quando possível.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Layout redesenhado com base na referência iLovePDF",
    texto:"O topo, a apresentação principal e a grade de ferramentas foram reorganizados com inspiração na referência visual enviada, priorizando leitura centralizada, navegação superior limpa e cards mais uniformes.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Redesenho profissional do hero e do topo",
    texto:"O layout principal foi reorganizado com hierarquia visual mais executiva, CTAs mais claros, indicadores de confiança e um painel lateral de produto mais sofisticado.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Marca d'água global mais sutil",
    texto:"A presença visual da arte de fundo foi suavizada para deixar a página mais leve e valorizar melhor a leitura das ferramentas e dos painéis.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Marca d'água institucional em toda a página",
    texto:"A arte principal do GoPDF passou a funcionar como marca d'água fixa em toda a experiência, reforçando a identidade visual sem comprometer a leitura das ferramentas.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Identidade visual profissional renovada",
    texto:"O site recebeu um cabeçalho mais institucional, novo ícone oficial incorporado à marca, cards refinados, banner premium ajustado e rodapé mais forte com carimbo de versão e atualização.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Hero institucional e controle de versão",
    texto:"A imagem oficial do GoPDF foi integrada à página inicial e a versão do site passou a aparecer no topo, no destaque principal, no rodapé e no painel de atualizações.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Compactação por meta em MB",
    texto:"Agora o usuário pode informar o tamanho desejado por arquivo em MB e o sistema tenta chegar o mais perto possível dessa meta.",
    dataHora:dataHoraVersaoAplicacao,
    versao:versaoAplicacao
  },
  {
    titulo:"Ferramentas liberadas no menu",
    texto:"As ferramentas de compactar, OCR, conversões, assinatura, reorganização, edital e PowerPoint agora podem ser abertas diretamente pela tela inicial."
  },
  {
    titulo:"Organização de folhas dentro do PDF",
    texto:"Ao abrir um PDF pela miniatura, agora você pode arrastar as páginas para definir a ordem antes de juntar ou dividir."
  },
  {
    titulo:"Seleção de pasta com ZIP integrado",
    texto:"Compactados encontrados dentro da pasta principal agora entram na mesma pasta escolhida, em vez de aparecer separados."
  },
  {
    titulo:"Ordenação por arrastar nas pastas",
    texto:"Os PDFs dentro das pastas do Juntar PDF agora podem ser reorganizados por arrastar as miniaturas."
  },
  {
    titulo:"Tela de progresso centralizada",
    texto:"Juntar PDF e Dividir PDF ganharam uma tela dedicada de progresso com resultado central e botão de download."
  },
  {
    titulo:"Botão voltar no processamento",
    texto:"A tela de progresso agora permite voltar para a ferramenta sem perder o andamento."
  },
  {
    titulo:"Compactar PDF com aviso mais claro",
    texto:"A ferramenta de compactação voltou ao menu com comunicação mais honesta sobre o fluxo de compressão usado hoje."
  },
  {
    titulo:"Layout mais profissional",
    texto:"Topo, cards, áreas de upload, barra fixa e estados visuais receberam refinamento mais corporativo."
  },
  {
    titulo:"Assinatura visual preservada",
    texto:"Juntar, dividir e agrupar pastas tentam manter a aparência da assinatura visível nos PDFs editados."
  },
  {
    titulo:"Suporte a ZIP, RAR e 7Z",
    texto:"Arquivos compactados passaram a ser aceitos nos fluxos de juntar e juntar pastas."
  },
  {
    titulo:"Miniaturas menores e mais limpas",
    texto:"As miniaturas foram reduzidas e as pastas ganharam um visual expandido mais organizado."
  },
  {
    titulo:"Progresso mais intuitivo",
    texto:"A barra de progresso ficou mais suave, com etapas mais claras e finalização menos brusca."
  }
]
const historicoAtualizacoesVersao=versaoAplicacao
const chaveAtualizacoesLidas="pdflicita_pro_updates_read_version"
const chaveUsuarioPerfil="GoPDF_user_profile_v1"
let usuarioPerfil=null
let usuarioModoEdicao=false
let usuarioAbaAtiva="register-inline"
let janelaAreaUsuarioRef=null


// ===================== NAVEGAÇÃO =====================

function atualizarAtalhosTopo(mostrar){
  const atalhos=document.getElementById("topbar-shortcuts")
  if(!atalhos) return
  atalhos.style.display=mostrar ? "flex" : "none"
}

function atualizarAreaMarketing(mostrar){
  const area=document.getElementById("marketing-footer")
  if(!area) return
  area.style.display=mostrar ? "block" : "none"
}

function paginaAtualEhHome(){
  const path=String(window.location.pathname || "").toLowerCase()
  return path==="/" || path.endsWith("/index.html")
}

function atualizarBannerHome(mostrar){
  const banner=document.querySelector(".topbar-cover")
  if(!banner) return
  const exibir=Boolean(mostrar) && paginaAtualEhHome()
  banner.style.display=exibir ? "grid" : "none"
  banner.setAttribute("aria-hidden", exibir ? "false" : "true")
}

function inicializarAcessibilidadeLanding(){
  const cards=[...document.querySelectorAll("#home-tools-grid .tool-card")]
  cards.forEach((card)=>{
    card.setAttribute("role","button")
    card.setAttribute("tabindex","0")
    if(!card.getAttribute("aria-label")){
      const titulo=card.querySelector("h3")?.textContent?.trim() || "Abrir ferramenta"
      card.setAttribute("aria-label",`${titulo}. Abrir ferramenta.`)
    }
    if(card.dataset.a11yReady==="true") return
    card.dataset.a11yReady="true"
    card.addEventListener("keydown",(event)=>{
      if(event.key==="Enter" || event.key===" "){
        event.preventDefault()
        card.click()
      }
    })
  })
}

function processarRetornoAuthSocial(){
  const params=new URLSearchParams(window.location.search || "")
  const auth=String(params.get("auth") || "").trim().toLowerCase()
  if(auth!=="social-ok" && auth!=="social-error") return

  const provider=String(params.get("provider") || "").trim().toLowerCase()
  const providerLabel=nomeProvedorSocial(provider)
  const mensagemApi=String(params.get("message") || "").trim()

  if(auth==="social-ok"){
    mostrarSucesso(`Acesso com ${providerLabel} concluido com sucesso.`)
  }else{
    mostrarErro(mensagemApi || `Nao foi possivel entrar com ${providerLabel}.`)
  }

  params.delete("auth")
  params.delete("provider")
  params.delete("message")
  const queryLimpa=params.toString()
  const novaUrl=`${window.location.pathname}${queryLimpa ? "?" + queryLimpa : ""}${window.location.hash || ""}`
  window.history.replaceState({}, "", novaUrl)
}

inicializarMetaAplicacao()
inicializarPainelAtualizacoes()
inicializarAreaUsuario()
inicializarAcessibilidadeLanding()
atualizarBannerHome(true)
filtrarFerramentasHome("todas", {scroll:false})
processarRetornoAuthSocial()

function sincronizarSobreposicoes(){
  const userPanel=document.getElementById("user-panel")
  const updatesPanel=document.getElementById("updates-panel")
  const backdrop=document.getElementById("overlay-backdrop")
  const algumaAberta=(userPanel && userPanel.style.display==="block") || (updatesPanel && updatesPanel.style.display==="block")

  document.body.classList.toggle("overlay-open", Boolean(algumaAberta))

  if(backdrop){
    backdrop.classList.toggle("is-visible", Boolean(algumaAberta))
  }
}

function fecharSobreposicoesGlobais({fecharUsuario=true, fecharAtualizacoes=true}={}){
  const userBtn=document.getElementById("user-toggle")
  const userPanel=document.getElementById("user-panel")
  const updatesBtn=document.getElementById("updates-toggle")
  const updatesPanel=document.getElementById("updates-panel")
  const usuarioEstavaAberto=Boolean(userPanel && userPanel.style.display==="block")

  if(fecharUsuario && userPanel){
    userPanel.style.display="none"
    if(userBtn) userBtn.setAttribute("aria-expanded","false")
    if(usuarioPerfil) usuarioModoEdicao=false
    if(!usuarioPerfil) usuarioAbaAtiva="register-inline"
    if(usuarioEstavaAberto && typeof renderizarAreaUsuario==="function"){
      renderizarAreaUsuario()
    }
  }

  if(fecharAtualizacoes && updatesPanel){
    updatesPanel.style.display="none"
    if(updatesBtn) updatesBtn.setAttribute("aria-expanded","false")
  }

  sincronizarSobreposicoes()
}

function normalizarRegistroAtualizacao(item){
  return {
    ...item,
    dataHora:item?.dataHora || dataHoraVersaoAplicacao,
    versao:item?.versao || versaoAplicacao
  }
}

function inicializarMetaAplicacao(){
  const versionChip=document.getElementById("app-version-chip")
  const heroVersion=document.getElementById("hero-version")
  const heroUpdated=document.getElementById("hero-updated")
  const panelVersion=document.getElementById("updates-panel-version")
  const footerCopy=document.getElementById("footer-copy")
  const footerVersionPill=document.getElementById("footer-version-pill")
  const footerUpdatedPill=document.getElementById("footer-updated-pill")

  if(versionChip) versionChip.textContent=versaoAplicacao
  if(heroVersion) heroVersion.textContent="Versão "+versaoAplicacao
  if(heroUpdated) heroUpdated.textContent="Atualizado em "+dataHoraVersaoAplicacao
  if(panelVersion) panelVersion.textContent="Versão atual "+versaoAplicacao
  if(footerVersionPill) footerVersionPill.textContent="Versão "+versaoAplicacao
  if(footerUpdatedPill) footerUpdatedPill.textContent="Atualizado em "+dataHoraVersaoAplicacao
  if(footerCopy) footerCopy.textContent=`© ${anoAplicacao} GoPDF. Versão ${versaoAplicacao}. Atualizado em ${dataHoraVersaoAplicacao}.`
}

function inicializarPainelAtualizacoes(){
  const btn=document.getElementById("updates-toggle")
  const painel=document.getElementById("updates-panel")
  const backdrop=document.getElementById("overlay-backdrop")
  const lista=document.getElementById("updates-list")
  const count=document.getElementById("updates-count")
  const badge=document.getElementById("updates-panel-badge")
  const userBtn=document.getElementById("user-toggle")
  const userPanel=document.getElementById("user-panel")
  if(!btn || !painel || !lista || !count || !badge) return

  lista.innerHTML=""
  historicoAtualizacoes.forEach((item, idx)=>{
    const registro=normalizarRegistroAtualizacao(item)
    const card=document.createElement("div")
    card.className="update-item"
    card.innerHTML=`
      <div class="update-item-head">
        <div class="update-item-title">${String(idx+1).padStart(2,"0")} • ${escaparHtml(registro.titulo)}</div>
        <span class="update-item-version">${escaparHtml(registro.versao)}</span>
      </div>
      <div class="update-item-meta">${escaparHtml(registro.dataHora)}</div>
      <div class="update-item-text">${escaparHtml(registro.texto)}</div>
    `
    lista.appendChild(card)
  })

  const atualizarEstadoBadge=()=>{
    const lido=localStorage.getItem(chaveAtualizacoesLidas)===historicoAtualizacoesVersao
    count.textContent=lido ? "0" : String(historicoAtualizacoes.length)
    badge.textContent=historicoAtualizacoes.length+" itens"
    btn.classList.toggle("is-read", lido)
    count.classList.toggle("is-zero", lido)
  }

  const marcarAtualizacoesComoLidas=()=>{
    try{
      localStorage.setItem(chaveAtualizacoesLidas, historicoAtualizacoesVersao)
    }catch(e){}
    atualizarEstadoBadge()
  }

  atualizarEstadoBadge()

  btn.onclick=(e)=>{
    e.stopPropagation()
    const aberto=painel.style.display==="block"
    painel.style.display=aberto ? "none" : "block"
    btn.setAttribute("aria-expanded", aberto ? "false" : "true")
    if(!aberto){
      if(userPanel) userPanel.style.display="none"
      if(userBtn) userBtn.setAttribute("aria-expanded","false")
      if(usuarioPerfil) usuarioModoEdicao=false
      marcarAtualizacoesComoLidas()
    }
    sincronizarSobreposicoes()
  }

  painel.addEventListener("click",(e)=>e.stopPropagation())
  document.addEventListener("click",()=>{
    painel.style.display="none"
    btn.setAttribute("aria-expanded","false")
    sincronizarSobreposicoes()
  })
  if(backdrop){
    backdrop.addEventListener("click",()=>{
      painel.style.display="none"
      btn.setAttribute("aria-expanded","false")
      sincronizarSobreposicoes()
    })
  }
}

function carregarUsuarioSalvo(){
  try{
    const bruto=localStorage.getItem(chaveUsuarioPerfil)
    if(!bruto) return null
    const perfil=JSON.parse(bruto)
    if(!perfil || typeof perfil!=="object") return null
    if(!perfil.nome || !perfil.email) return null
    return perfil
  }catch(e){
    return null
  }
}

function salvarUsuarioLocal(perfil){
  try{
    localStorage.setItem(chaveUsuarioPerfil, JSON.stringify(perfil))
    return true
  }catch(e){
    return false
  }
}

function removerUsuarioLocal(){
  try{
    localStorage.removeItem(chaveUsuarioPerfil)
  }catch(e){}
}

function obterIniciaisUsuario(texto){
  const base=String(texto||"U").trim()
  if(!base) return "U"
  const partes=base.split(/\s+/).filter(Boolean)
  if(partes.length===1) return partes[0].slice(0,2).toUpperCase()
  return (partes[0][0]+partes[partes.length-1][0]).toUpperCase()
}

function validarEmailCadastro(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||"").trim())
}

async function gerarHashSenhaLocal(texto){
  const valor=String(texto||"")
  if(window.crypto?.subtle && typeof TextEncoder!=="undefined"){
    const bytes=new TextEncoder().encode(valor)
    const digest=await window.crypto.subtle.digest("SHA-256", bytes)
    return Array.from(new Uint8Array(digest)).map((b)=>b.toString(16).padStart(2,"0")).join("")
  }
  try{
    return btoa(unescape(encodeURIComponent(valor)))
  }catch(e){
    return valor
  }
}

function limparCamposLoginUsuario(){
  const email=document.getElementById("user-login-email")
  const senha=document.getElementById("user-login-password")
  if(email) email.value=""
  if(senha) senha.value=""
}

function normalizarTextoCadastro(valor){
  return String(valor||"")
    .replace(/\s+/g," ")
    .trim()
}

function normalizarNomeCadastro(valor){
  return normalizarTextoCadastro(valor)
    .replace(/[\u0000-\u001f]/g, "")
}

function atualizarCamposCadastroUsuario(){
  const password=document.getElementById("user-password")
  const confirmPassword=document.getElementById("user-password-confirm")
  const confirmField=confirmPassword?.closest(".user-field")
  const termsRow=document.querySelector(".user-terms")
  const submitBtn=document.getElementById("user-submit-btn")
  if(!password || !confirmPassword || !confirmField || !termsRow || !submitBtn) return

  const exibindoNovoCadastro=!usuarioPerfil
  const exibindoConfirmacao=exibindoNovoCadastro || password.value.length>0 || confirmPassword.value.length>0

  confirmField.style.display=exibindoConfirmacao ? "block" : "none"
  termsRow.style.display=exibindoNovoCadastro ? "flex" : "none"
  confirmPassword.required=exibindoConfirmacao
  submitBtn.disabled=false
}

function filtrarFerramentasHome(categoria="todas", {scroll=true}={}){
  const grade=document.getElementById("home-tools-grid")
  if(!grade) return

  const cards=[...grade.querySelectorAll(".tool-card")]
  const filtros=[...document.querySelectorAll(".hero-category-pill[data-filter]")]
  const vazio=document.getElementById("home-tools-empty")
  let visiveis=0

  cards.forEach((card)=>{
    const categorias=String(card.dataset.toolCategory||"todas")
      .split(/\s+/)
      .filter(Boolean)
    const exibir=categoria==="todas" || categorias.includes(categoria)
    card.classList.toggle("is-hidden", !exibir)
    card.setAttribute("aria-hidden", exibir ? "false" : "true")
    if(exibir) visiveis+=1
  })

  filtros.forEach((filtro)=>{
    const ativo=filtro.dataset.filter===categoria
    filtro.classList.toggle("is-active", ativo)
    filtro.setAttribute("aria-pressed", ativo ? "true" : "false")
  })

  if(vazio){
    vazio.style.display=visiveis===0 ? "block" : "none"
  }

  if(scroll){
    requestAnimationFrame(()=>{
      grade.scrollIntoView({behavior:"smooth", block:"start"})
    })
  }
}

function garantirLandingVisivel(){
  const menu=document.getElementById("menu-principal")
  if(!menu) return
  if(menu.style.display==="none"){
    voltarMenu()
  }
}

function abrirCategoriaHome(categoria="todas"){
  garantirLandingVisivel()
  filtrarFerramentasHome(categoria, {scroll:true})
  requestAnimationFrame(()=>{
    const primeiroVisivel=document.querySelector("#home-tools-grid .tool-card:not(.is-hidden)")
    primeiroVisivel?.focus()
  })
}

function rolarParaSecao(id){
  const secoesHome=new Set([
    "menu-principal",
    "home-tools-grid",
    "home-flow",
    "home-sectors",
    "home-security",
    "home-plans",
    "home-signup",
    "home-faq"
  ])
  if(secoesHome.has(id)){
    garantirLandingVisivel()
  }
  const secao=document.getElementById(id)
  if(!secao) return
  secao.scrollIntoView({behavior:"smooth", block:"start"})
}

function abrirSolicitacaoAcesso(event){
  event?.preventDefault?.()
  event?.stopPropagation?.()
  garantirLandingVisivel()
  rolarParaSecao("home-signup")
  requestAnimationFrame(()=>{
    document.getElementById("home-signup-email")?.focus()
  })
}

function abrirLoginUsuario(event){
  event?.preventDefault?.()
  event?.stopPropagation?.()
  abrirPainelUsuario({aba:"login"})
}

function abrirCadastroUsuario(event){
  event?.preventDefault?.()
  event?.stopPropagation?.()
  abrirPainelUsuario({aba:"register-inline", editar:Boolean(usuarioPerfil)})
}

function abrirCadastroInstitucionalHome(event){
  event?.preventDefault?.()
  event?.stopPropagation?.()
  const emailHome=document.getElementById("home-signup-email")
  const senhaHome=document.getElementById("home-signup-password")
  abrirPainelUsuario({aba:"register-inline", editar:Boolean(usuarioPerfil)})
  requestAnimationFrame(()=>{
    const nome=document.getElementById("user-name")
    const email=document.getElementById("user-email")
    const senha=document.getElementById("user-password")
    const confirmar=document.getElementById("user-password-confirm")
    if(emailHome && email && emailHome.value.trim()) email.value=emailHome.value.trim()
    if(senhaHome && senha && senhaHome.value.trim()){
      senha.value=senhaHome.value.trim()
      if(confirmar) confirmar.value=senhaHome.value.trim()
    }
    if(nome && !nome.value.trim()){
      nome.focus()
    }else if(email && !email.value.trim()){
      email.focus()
    }else if(senha){
      senha.focus()
    }
    atualizarCamposCadastroUsuario()
  })
}

function normalizarItensResultadoPdf(itens){
  if(!Array.isArray(itens)) return []
  return itens
    .filter(item=>item && item.bytes)
    .map((item, indice)=>{
      const bytes=item.bytes instanceof Uint8Array ? item.bytes : new Uint8Array(item.bytes)
      const nome=String(item.nome || `resultado_${indice+1}.pdf`).trim() || `resultado_${indice+1}.pdf`
      return {bytes, nome}
    })
}

function limparOrigemResultadoPdf(origem){
  const mapa={
    juntar:"limparJuntar",
    "juntar-pastas":"limparJuntar",
    dividir:"limparDividir",
    ocr:"limparOCR",
    compactar:"limparCompactar",
    imagempdf:"limparImagemPDF",
    tradutor:"limparTradutorPDF",
    wordpdf:"limparWordPDF",
    excelpdf:"limparExcelPDF",
    reorganizar:"limparReorganizarPDF",
    assinar:"limparAssinarPDF",
    juntarpastas:"limparJuntarPastas",
    powerpoint:"limparPowerPointPDF"
  }
  const nomeFuncao=mapa[origem]
  const fn=nomeFuncao ? window[nomeFuncao] : null
  if(typeof fn==="function"){
    try{ fn() }catch(err){ console.warn("Nao foi possivel limpar a origem do resultado:", origem, err) }
  }
}

function limparDestinoResultadoPdf(destino){
  const mapa={
    juntar:"limparJuntar",
    compactar:"limparCompactar",
    ocr:"limparOCR",
    tradutor:"limparTradutorPDF",
    dividir:"limparDividir",
    reorganizar:"limparReorganizarPDF",
    assinar:"limparAssinarPDF"
  }
  const nomeFuncao=mapa[destino]
  const fn=nomeFuncao ? window[nomeFuncao] : null
  if(typeof fn==="function"){
    try{ fn() }catch(err){ console.warn("Nao foi possivel preparar a ferramenta de destino:", destino, err) }
  }
}

function abrirDestinoComArquivosResultado(destino, itens){
  const arquivos=normalizarItensResultadoPdf(itens).map(item=>bytesParaFile(item.bytes, item.nome))
  if(arquivos.length===0) return
  limparDestinoResultadoPdf(destino)

  if(destino==="juntar"){
    abrirUnificador(arquivos)
    return
  }

  if(destino==="compactar"){
    abrirCompactar(arquivos)
    return
  }

  if(destino==="ocr"){
    ocultarTudo()
    document.getElementById("ocr-section").style.display="block"
    atualizarAtalhosTopo(true)
    carregarFilesNoOCR(arquivos)
    return
  }

  if(destino==="tradutor"){
    const principalTraducao=arquivos[0]
    if(principalTraducao){
      abrirTraducaoPremium(principalTraducao)
    }
    return
  }

  const principal=arquivos[0]
  if(!principal) return

  if(destino==="dividir"){
    abrirDividir(principal)
    return
  }

  if(destino==="reorganizar"){
    abrirReorganizarPDF(principal)
    return
  }

  if(destino==="assinar"){
    abrirAssinarPDF(principal)
  }
}

function encadearResultadoPdf(origem, destino, itens){
  const normalizados=normalizarItensResultadoPdf(itens)
  if(normalizados.length===0) return
  limparOrigemResultadoPdf(origem)
  abrirDestinoComArquivosResultado(destino, normalizados)
}

function obterAcoesEncadeamentoResultado(itens, opcoes={}){
  const lista=normalizarItensResultadoPdf(itens)
  if(lista.length===0) return []

  const ocultar=new Set(opcoes.ocultarDestinos || [])
  const multiplos=lista.length>1
  const catalogo=[
    {
      id:"compactar",
      titulo:multiplos ? "Compactar arquivos gerados" : "Compactar este PDF",
      texto:"Reduza o tamanho mantendo o resultado já pronto.",
      permitir:true
    },
    {
      id:"tradutor",
      titulo:"Traduzir PDF",
      texto:"Envie o resultado para traducao automatica em outro idioma.",
      permitir:!multiplos
    },
    {
      id:"reorganizar",
      titulo:"Reorganizar páginas",
      texto:"Abra a ordem das páginas e gere uma nova versão.",
      permitir:!multiplos
    },
    {
      id:"dividir",
      titulo:"Dividir PDF",
      texto:"Separe o documento por páginas, pares, ímpares ou blocos.",
      permitir:!multiplos
    },
    {
      id:"assinar",
      titulo:"Assinar digitalmente",
      texto:"Envie o mesmo PDF para assinatura com certificado A1.",
      permitir:!multiplos
    },
    {
      id:"ocr",
      titulo:multiplos ? "Aplicar OCR nos arquivos" : "Gerar PDF pesquisável",
      texto:"Reconheça texto no resultado sem carregar tudo de novo.",
      permitir:true
    },
    {
      id:"juntar",
      titulo:"Juntar em um PDF",
      texto:"Reunir novamente os arquivos gerados em um único documento.",
      permitir:multiplos
    }
  ]

  return catalogo.filter(acao=>acao.permitir && !ocultar.has(acao.id))
}

function obterAreaAcoesResultado(container){
  if(!container) return null

  const nomesClasse=["resultado-acoes","resultado-ações","resultado-ações"]
  for(const nome of nomesClasse){
    const encontrado=container.getElementsByClassName(nome)[0]
    if(encontrado) return encontrado
  }

  const filhoDireto=Array.from(container.children || []).find((elemento)=>{
    const classes=Array.from(elemento?.classList || [])
    return classes.some((nome)=>String(nome||"").startsWith("resultado-a"))
  })
  return filhoDireto || container
}

function renderizarEncadeamentoResultado(containerId, origem, itens, opcoes={}){
  const container=document.getElementById(containerId)
  if(!container) return

  container.querySelectorAll(".resultado-followup-card").forEach((elemento)=>elemento.remove())

  const normalizados=normalizarItensResultadoPdf(itens)
  const acoes=obterAcoesEncadeamentoResultado(normalizados, opcoes)
  if(normalizados.length===0 || acoes.length===0) return

  const ancora=obterAreaAcoesResultado(container) || container
  const card=document.createElement("div")
  card.className="resultado-followup-card"

  const head=document.createElement("div")
  head.className="resultado-followup-head"

  const titulo=document.createElement("strong")
  titulo.className="resultado-followup-title"
  titulo.textContent="Próximo passo com este resultado"
  head.appendChild(titulo)

  const texto=document.createElement("p")
  texto.className="resultado-followup-text"
  texto.textContent=normalizados.length>1
    ? "Os arquivos gerados já podem seguir para outra ferramenta sem novo upload."
    : "O PDF gerado já pode seguir direto para outra etapa do fluxo."
  head.appendChild(texto)

  const grid=document.createElement("div")
  grid.className="resultado-followup-grid"

  acoes.forEach((acao)=>{
    const botao=document.createElement("button")
    botao.type="button"
    botao.className="resultado-followup-btn"
    botao.innerHTML=`<span class="resultado-followup-btn-title">${acao.titulo}</span><span class="resultado-followup-btn-text">${acao.texto}</span>`
    botao.onclick=()=>encadearResultadoPdf(origem, acao.id, normalizados)
    grid.appendChild(botao)
  })

  card.appendChild(head)
  card.appendChild(grid)
  ancora.appendChild(card)
}

function ativarAbaUsuario(aba){
  usuarioAbaAtiva=aba==="login" ? "login" : "register-inline"
  renderizarAreaUsuario()
}

function abrirTraducaoPremium(fileParaCarregar){
  ocultarTudo()
  document.getElementById("tradutor-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar) carregarFileNoTradutor(fileParaCarregar)
}

function mostrarFerramentaIndisponivel(nome, detalhe="Essa funcionalidade está no roadmap de evolução técnica."){
  fecharPainelUsuario()
  mostrarAviso(`${nome}: ${detalhe}`)
}

function nomeProvedorSocial(provedor){
  const nomes={
    google:"Google",
    microsoft:"Microsoft",
    apple:"Apple"
  }
  return nomes[provedor] || "Social"
}

function normalizarNextPathSocial(rawNext){
  const next=String(rawNext || "").trim()
  if(!next) return "index.html"
  if(next.startsWith("http://") || next.startsWith("https://") || next.startsWith("//")) return "index.html"

  const cleaned=next
    .replace(/^[./]+/, "")
    .replace(/\\/g, "/")

  if(!cleaned || cleaned.includes("..")) return "index.html"
  return cleaned
}

function obterNextPathAtualSocial(){
  const pathnameAtual=String(window.location.pathname || "").split("/").pop() || "index.html"
  const queryAtual=String(window.location.search || "")
  const pathComQuery=`${pathnameAtual}${queryAtual}`
  return normalizarNextPathSocial(pathComQuery)
}

function iniciarCadastroSocial(provedor, nextPath){
  const provider=String(provedor || "").trim().toLowerCase()
  if(provider!=="google" && provider!=="microsoft"){
    mostrarAviso(`${nomeProvedorSocial(provider)} ainda nao esta disponivel no momento.`)
    return
  }

  const next=normalizarNextPathSocial(nextPath || obterNextPathAtualSocial())
  const url=new URL("api/auth/oauth/start", window.location.href)
  url.searchParams.set("provider", provider)
  url.searchParams.set("next", next)
  window.location.href=url.toString()
}

function acionarLoginSocialUsuario(provedor){
  const providerRaw=String(provedor || "").trim().toLowerCase()
  const providerMap={
    facebook:"google",
    sso:"apple"
  }
  const provider=providerMap[providerRaw] || providerRaw
  if(provider==="apple"){
    mostrarAviso("Login com Apple sera liberado em breve.")
    return
  }
  iniciarCadastroSocial(provider)
}
function obterResumoPerfilUsuario(perfil){
  if(!perfil) return "Seus dados ficam salvos apenas neste navegador."
  const partes=[]
  if(perfil.cargo) partes.push(perfil.cargo)
  if(perfil.empresa) partes.push(perfil.empresa)
  if(perfil.senhaHash) partes.push("Senha local protegida")
  return partes.join(" | ") || "Cadastro salvo neste navegador."
}

function limparCamposSenhaUsuario(){
  const senha=document.getElementById("user-password")
  const confirmar=document.getElementById("user-password-confirm")
  if(senha) senha.value=""
  if(confirmar) confirmar.value=""
}

function preencherFormularioUsuario(perfil){
  const nome=document.getElementById("user-name")
  const email=document.getElementById("user-email")
  const empresa=document.getElementById("user-company")
  const cargo=document.getElementById("user-role")
  if(nome) nome.value=perfil?.nome||""
  if(email) email.value=perfil?.email||""
  if(empresa) empresa.value=perfil?.empresa||""
  if(cargo) cargo.value=perfil?.cargo||""
  limparCamposSenhaUsuario()
}

function limparFormularioUsuario(){
  const form=document.getElementById("user-register-form")
  if(form) form.reset()
  limparCamposSenhaUsuario()
}

function focarFormularioUsuario(aba=usuarioAbaAtiva){
  const panel=document.getElementById("user-panel")
  const campo=aba==="login"
    ? document.getElementById("user-login-email")
    : document.getElementById("user-name")

  if(panel) panel.scrollTop=0
  requestAnimationFrame(()=>{
    if(campo && typeof campo.focus==="function"){
      campo.focus()
    }
  })
}

function sincronizarPerfilUsuarioLocal(){
  usuarioPerfil=carregarUsuarioSalvo()
  usuarioModoEdicao=false
  usuarioAbaAtiva=usuarioPerfil ? "register" : "register-inline"
  renderizarAreaUsuario()
}

function abrirCadastroUsuarioEmNovaJanela({editar=false}={}){
  const url=new URL("cadastro.html", window.location.href)
  url.searchParams.set("modo", editar ? "editar" : "register")
  const largura=Math.min(720, Math.max(560, Math.round(window.innerWidth*0.58)))
  const altura=Math.min(920, Math.max(720, Math.round(window.innerHeight*0.86)))
  const esquerda=Math.max(0, Math.round((window.screen.width-largura)/2))
  const topo=Math.max(0, Math.round((window.screen.height-altura)/2))
  const recursos=`popup=yes,width=${largura},height=${altura},left=${esquerda},top=${topo},resizable=yes,scrollbars=yes`
  const novaJanela=window.open(url.toString(), "_blank", recursos)

  if(novaJanela && !novaJanela.closed){
    janelaAreaUsuarioRef=novaJanela
    try{ novaJanela.focus() }catch(e){}
    return true
  }

  mostrarAviso("O navegador bloqueou a nova aba de cadastro. Libere pop-ups para abrir a janela separada.")
  return false
}

function renderizarAreaUsuario(){
  const btnAvatar=document.getElementById("user-toggle-avatar")
  const btnSubtitle=document.getElementById("user-toggle-subtitle")
  const panelSubtitle=document.getElementById("user-panel-subtitle")
  const badge=document.getElementById("user-panel-badge")
  const summaryAvatar=document.getElementById("user-summary-avatar")
  const summaryName=document.getElementById("user-summary-name")
  const summaryEmail=document.getElementById("user-summary-email")
  const summaryMeta=document.getElementById("user-summary-meta")
  const summaryCard=document.getElementById("user-summary")
  const authShell=document.getElementById("user-auth-shell")
  const loginForm=document.getElementById("user-login-form")
  const registerForm=document.getElementById("user-register-form")
  const registerExternal=document.getElementById("user-register-external")
  const socialAuth=document.getElementById("user-social-auth")
  const loginTab=document.getElementById("user-tab-login")
  const registerTab=document.getElementById("user-tab-register")
  const submitBtn=document.getElementById("user-submit-btn")
  const cancelBtn=document.getElementById("user-cancel-btn")
  const profileActions=document.getElementById("user-profile-actions")
  const password=document.getElementById("user-password")
  const confirmPassword=document.getElementById("user-password-confirm")
  const termsInput=document.getElementById("user-terms")
  if(!btnAvatar || !btnSubtitle || !panelSubtitle || !badge || !summaryAvatar || !summaryName || !summaryEmail || !summaryMeta || !summaryCard || !authShell || !loginForm || !registerForm || !registerExternal || !socialAuth || !loginTab || !registerTab || !submitBtn || !cancelBtn || !profileActions || !password || !confirmPassword){
    return
  }

  const baseTexto=usuarioPerfil?.nome || usuarioPerfil?.email || "U"
  const iniciais=obterIniciaisUsuario(baseTexto)
  btnAvatar.textContent=iniciais
  summaryAvatar.textContent=iniciais
  loginTab.classList.toggle("active", usuarioAbaAtiva==="login")
  registerTab.classList.toggle("active", usuarioAbaAtiva!=="login")

  if(usuarioPerfil && !usuarioModoEdicao && usuarioAbaAtiva!=="login"){
    btnSubtitle.textContent=usuarioPerfil.nome
    summaryName.textContent=usuarioPerfil.nome
    summaryEmail.textContent=usuarioPerfil.email
    summaryMeta.textContent=obterResumoPerfilUsuario(usuarioPerfil)
    badge.textContent="Cadastro salvo"
    panelSubtitle.textContent="Seu perfil local está pronto para uso neste navegador."
    summaryCard.style.display="flex"
    authShell.style.display="none"
    socialAuth.style.display="none"
    loginForm.style.display="none"
    registerForm.style.display="none"
    registerExternal.style.display="none"
    profileActions.style.display="flex"
    cancelBtn.style.display="none"
    atualizarCamposCadastroUsuario()
    return
  }

  authShell.style.display="block"
  profileActions.style.display="none"
  summaryCard.style.display="none"
  registerExternal.style.display="none"

  if(usuarioAbaAtiva==="login"){
    btnSubtitle.textContent=usuarioPerfil?.nome || "Entrar"
    summaryName.textContent=usuarioPerfil?.nome || "Acesso local"
    summaryEmail.textContent=usuarioPerfil?.email || "Entre com o email do seu cadastro"
    summaryMeta.textContent=usuarioPerfil
      ? "Use seu email e senha local para confirmar o acesso neste navegador."
      : "Ainda não existe cadastro salvo. Crie sua conta para ativar o acesso local."
    badge.textContent=usuarioPerfil ? "Entrar" : "Sem cadastro"
    panelSubtitle.textContent=usuarioPerfil
      ? "Digite seus dados para acessar o perfil salvo neste navegador."
      : "Não encontramos um cadastro local. Use a aba de registro para criar sua conta."
    socialAuth.style.display="grid"
    loginForm.style.display="block"
    registerForm.style.display="none"
    cancelBtn.style.display="none"
    atualizarCamposCadastroUsuario()
    return
  }

  if(usuarioAbaAtiva==="register-inline"){
    btnSubtitle.textContent=usuarioPerfil?.nome || "Fa\u00e7a seu cadastro"
    summaryName.textContent=usuarioPerfil ? usuarioPerfil.nome : "Crie sua conta"
    summaryEmail.textContent=usuarioPerfil?.email || "Digite seu nome completo, email e senha"
    summaryMeta.textContent=usuarioPerfil
      ? "Atualize seus dados diretamente neste painel."
      : "Preencha nome completo, email e senha para criar seu acesso local neste navegador."
    badge.textContent=usuarioModoEdicao ? "Editando" : (usuarioPerfil ? "Cadastro salvo" : "Sem cadastro")
    panelSubtitle.textContent="O cadastro agora \u00e9 preenchido neste mesmo painel."
    socialAuth.style.display="grid"
    loginForm.style.display="none"
    registerForm.style.display="block"
    submitBtn.textContent=usuarioPerfil ? "Salvar cadastro" : "Cadastrar"
    cancelBtn.style.display=usuarioPerfil ? "inline-flex" : "none"
    password.required=!usuarioPerfil
    password.placeholder=usuarioPerfil ? "Nova senha (opcional)" : "M\u00ednimo de 6 caracteres"
    confirmPassword.placeholder=usuarioPerfil ? "Repita a nova senha" : "Repita a senha"
    if(termsInput && !usuarioPerfil) termsInput.checked=false
    atualizarCamposCadastroUsuario()
    return
  }

  btnSubtitle.textContent=usuarioPerfil?.nome || "Fa\u00e7a seu cadastro"
  summaryName.textContent=usuarioPerfil ? usuarioPerfil.nome : "Crie sua conta"
  summaryEmail.textContent=usuarioPerfil?.email || "Digite seu nome completo, email e senha"
  summaryMeta.textContent=usuarioPerfil
    ? "Atualize seus dados diretamente neste painel."
    : "Preencha nome completo, email e senha para criar seu acesso local neste navegador."
  badge.textContent=usuarioPerfil ? "Cadastro salvo" : "Sem cadastro"
  panelSubtitle.textContent=usuarioPerfil
    ? "Edite seu cadastro neste mesmo painel."
    : "Clique em Registre-se para abrir o formul\u00e1rio aqui mesmo."
  socialAuth.style.display="grid"
  loginForm.style.display="none"
  registerForm.style.display="block"
  submitBtn.textContent=usuarioPerfil ? "Salvar cadastro" : "Cadastrar"
  cancelBtn.style.display=usuarioPerfil ? "inline-flex" : "none"
  password.required=!usuarioPerfil
  password.placeholder=usuarioPerfil ? "Nova senha (opcional)" : "M\u00ednimo de 6 caracteres"
  confirmPassword.placeholder=usuarioPerfil ? "Repita a nova senha" : "Repita a senha"
  atualizarCamposCadastroUsuario()
}

function abrirPainelUsuario({editar=false, aba=null}={}){
  const btn=document.getElementById("user-toggle")
  const panel=document.getElementById("user-panel")
  const updatesBtn=document.getElementById("updates-toggle")
  const updatesPanel=document.getElementById("updates-panel")
  if(!btn || !panel) return
  if(aba==="login"){
    usuarioModoEdicao=false
    usuarioAbaAtiva="login"
    limparCamposLoginUsuario()
  }else if(aba==="register-inline"){
    usuarioAbaAtiva="register-inline"
    if(usuarioPerfil){
      usuarioModoEdicao=true
      preencherFormularioUsuario(usuarioPerfil)
    }else{
      usuarioModoEdicao=false
      limparFormularioUsuario()
    }
  }else if(editar && usuarioPerfil){
    usuarioModoEdicao=true
    usuarioAbaAtiva="register-inline"
    preencherFormularioUsuario(usuarioPerfil)
  }else if(!usuarioPerfil){
    usuarioAbaAtiva="register-inline"
    limparFormularioUsuario()
  }
  renderizarAreaUsuario()
  panel.style.display="block"
  btn.setAttribute("aria-expanded","true")
  if(updatesPanel) updatesPanel.style.display="none"
  if(updatesBtn) updatesBtn.setAttribute("aria-expanded","false")
  sincronizarSobreposicoes()
  focarFormularioUsuario(usuarioAbaAtiva)
}

function fecharPainelUsuario(){
  const btn=document.getElementById("user-toggle")
  const panel=document.getElementById("user-panel")
  if(panel) panel.style.display="none"
  if(btn) btn.setAttribute("aria-expanded","false")
  if(usuarioPerfil) usuarioModoEdicao=false
  if(!usuarioPerfil) usuarioAbaAtiva="register-inline"
  renderizarAreaUsuario()
  sincronizarSobreposicoes()
}

function inicializarAreaUsuario(){
  const btn=document.getElementById("user-toggle")
  const panel=document.getElementById("user-panel")
  const backdrop=document.getElementById("overlay-backdrop")
  const loginForm=document.getElementById("user-login-form")
  const form=document.getElementById("user-register-form")
  const openRegisterPageBtn=document.getElementById("user-open-register-page-btn")
  const loginTab=document.getElementById("user-tab-login")
  const registerTab=document.getElementById("user-tab-register")
  const facebookBtn=document.getElementById("user-facebook-btn")
  const googleBtn=document.getElementById("user-google-btn")
  const ssoBtn=document.getElementById("user-sso-btn")
  const linkLogin=document.getElementById("user-link-login")
  const linkRegister=document.getElementById("user-link-register")
  const editBtn=document.getElementById("user-edit-btn")
  const cancelBtn=document.getElementById("user-cancel-btn")
  const removeBtn=document.getElementById("user-remove-btn")
  if(!btn || !panel || !loginForm || !form || !openRegisterPageBtn || !loginTab || !registerTab || !facebookBtn || !googleBtn || !ssoBtn || !editBtn || !cancelBtn || !removeBtn) return

  usuarioPerfil=carregarUsuarioSalvo()
  const companyField=document.getElementById("user-company")?.closest(".user-field")
  const roleField=document.getElementById("user-role")?.closest(".user-field")
  if(companyField) companyField.style.display="none"
  if(roleField) roleField.style.display="none"
  renderizarAreaUsuario()

  btn.onclick=(e)=>{
    e.stopPropagation()
    const aberto=panel.style.display==="block"
    if(aberto){
      fecharPainelUsuario()
    }else{
      abrirPainelUsuario()
    }
  }

  panel.addEventListener("click",(e)=>e.stopPropagation())
  document.addEventListener("click",(event)=>{
    const alvo=event.target
    if(!(alvo instanceof Element)){
      fecharPainelUsuario()
      return
    }
    const clicouEmAcionador=Boolean(alvo.closest("[data-user-panel-trigger]"))
    if(clicouEmAcionador) return
    fecharPainelUsuario()
  })
  if(backdrop){
    backdrop.addEventListener("click",()=>fecharPainelUsuario())
  }

  loginTab.onclick=()=>{
    ativarAbaUsuario("login")
    focarFormularioUsuario("login")
  }
  registerTab.onclick=(e)=>{
    e.preventDefault()
    usuarioModoEdicao=Boolean(usuarioPerfil)
    usuarioAbaAtiva="register-inline"
    if(usuarioPerfil) preencherFormularioUsuario(usuarioPerfil)
    else limparFormularioUsuario()
    renderizarAreaUsuario()
    focarFormularioUsuario("register-inline")
  }
  if(linkLogin){
    linkLogin.onclick=()=>{
      ativarAbaUsuario("login")
      focarFormularioUsuario("login")
    }
  }
  if(linkRegister){
    linkRegister.onclick=()=>{
      usuarioModoEdicao=Boolean(usuarioPerfil)
      usuarioAbaAtiva="register-inline"
      if(usuarioPerfil) preencherFormularioUsuario(usuarioPerfil)
      else limparFormularioUsuario()
      renderizarAreaUsuario()
      focarFormularioUsuario("register-inline")
    }
  }
  openRegisterPageBtn.onclick=()=>{
    usuarioModoEdicao=Boolean(usuarioPerfil)
    usuarioAbaAtiva="register-inline"
    if(usuarioPerfil) preencherFormularioUsuario(usuarioPerfil)
    else limparFormularioUsuario()
    renderizarAreaUsuario()
    focarFormularioUsuario("register-inline")
  }
  facebookBtn.onclick=()=>acionarLoginSocialUsuario("google")
  googleBtn.onclick=()=>acionarLoginSocialUsuario("microsoft")
  ssoBtn.onclick=()=>acionarLoginSocialUsuario("apple")

  document.getElementById("user-password")?.addEventListener("input", atualizarCamposCadastroUsuario)
  document.getElementById("user-password-confirm")?.addEventListener("input", atualizarCamposCadastroUsuario)

  editBtn.onclick=()=>{
    abrirPainelUsuario({editar:true})
    usuarioAbaAtiva="register-inline"
    renderizarAreaUsuario()
    focarFormularioUsuario("register-inline")
  }

  cancelBtn.onclick=()=>{
    usuarioModoEdicao=false
    usuarioAbaAtiva=usuarioPerfil ? "register" : "register-inline"
    limparCamposSenhaUsuario()
    renderizarAreaUsuario()
  }

  removeBtn.onclick=()=>{
    if(!usuarioPerfil) return
    const confirmar=confirm('Deseja remover o cadastro salvo neste navegador?')
    if(!confirmar) return
    removerUsuarioLocal()
    usuarioPerfil=null
    usuarioModoEdicao=false
    limparFormularioUsuario()
    renderizarAreaUsuario()
    abrirPainelUsuario()
    mostrarSucesso("Cadastro removido deste navegador.")
  }

  window.addEventListener("storage",(event)=>{
    if(event.key && event.key!==chaveUsuarioPerfil) return
    sincronizarPerfilUsuarioLocal()
  })

  window.addEventListener("message",(event)=>{
    if(!event?.data || event.data.type!=="GoPDF-user-profile-updated") return
    sincronizarPerfilUsuarioLocal()
    mostrarSucesso("Cadastro atualizado com sucesso.")
  })

  loginForm.addEventListener("submit",async(e)=>{
    e.preventDefault()
    const email=String(document.getElementById("user-login-email")?.value||"").trim().toLowerCase()
    const senha=String(document.getElementById("user-login-password")?.value||"")

    if(!usuarioPerfil){
      usuarioAbaAtiva="register-inline"
      renderizarAreaUsuario()
      mostrarAviso("Nenhum cadastro local foi encontrado. Use a aba Registre-se.")
      focarFormularioUsuario("register-inline")
      return
    }

    if(!validarEmailCadastro(email)){
      mostrarAviso("Informe um email válido para entrar.")
      return
    }

    if(email!==String(usuarioPerfil.email||"").trim().toLowerCase()){
      mostrarErro("Este email não corresponde ao cadastro salvo neste navegador.")
      return
    }

    if(!usuarioPerfil.senhaHash){
      usuarioModoEdicao=true
      usuarioAbaAtiva="register-inline"
      preencherFormularioUsuario(usuarioPerfil)
      renderizarAreaUsuario()
      mostrarAviso("Atualize seu cadastro para ativar o login local com senha.")
      focarFormularioUsuario("register-inline")
      return
    }

    const senhaHash=await gerarHashSenhaLocal(senha)
    if(senhaHash!==usuarioPerfil.senhaHash){
      mostrarErro("Senha incorreta. Tente novamente.")
      return
    }

    limparCamposLoginUsuario()
    usuarioModoEdicao=false
    usuarioAbaAtiva="register"
    renderizarAreaUsuario()
    mostrarSucesso("Perfil local acessado com sucesso.")
  })

  form.addEventListener("submit",async(e)=>{
    e.preventDefault()

    const nome=normalizarNomeCadastro(document.getElementById("user-name")?.value)
    const email=String(document.getElementById("user-email")?.value||"").trim().toLowerCase()
    const empresa=normalizarTextoCadastro(document.getElementById("user-company")?.value)
    const cargo=normalizarTextoCadastro(document.getElementById("user-role")?.value)
    const senha=String(document.getElementById("user-password")?.value||"")
    const confirmarSenha=String(document.getElementById("user-password-confirm")?.value||senha)
    const aceitouTermos=Boolean(document.getElementById("user-terms")?.checked)
    const senhaObrigatoria=!usuarioPerfil
    const senhaEmEdicao=senha.length>0 || confirmarSenha.length>0

    if(nome.length<3){
      mostrarAviso("Informe um nome completo válido.")
      return
    }

    if(!validarEmailCadastro(email)){
      mostrarAviso("Informe um email válido para concluir o cadastro.")
      return
    }

    if(!usuarioPerfil && !aceitouTermos){
      mostrarAviso("Aceite os Termos de Uso e a Política de Privacidade para continuar.")
      return
    }

    if(senhaObrigatoria || senhaEmEdicao){
      if(senha.length<6){
        mostrarAviso("A senha precisa ter pelo menos 6 caracteres.")
        return
      }
      if(senha!==confirmarSenha){
        mostrarAviso("As senhas não coincidem.")
        return
      }
    }

    const agora=new Date().toISOString()
    const senhaHash=senhaObrigatoria || senhaEmEdicao
      ? await gerarHashSenhaLocal(senha)
      : (usuarioPerfil?.senhaHash || "")
    const perfilAtualizado={
      nome,
      email,
      empresa,
      cargo,
      criadoEm:usuarioPerfil?.criadoEm || agora,
      atualizadoEm:agora,
      senhaHash,
      senhaDefinida:Boolean(senhaHash),
      senhaAtualizadaEm:senhaObrigatoria || senhaEmEdicao ? agora : (usuarioPerfil?.senhaAtualizadaEm || "")
    }

    const salvo=salvarUsuarioLocal(perfilAtualizado)
    if(!salvo){
      mostrarErro("Não foi possível salvar o cadastro neste navegador.")
      return
    }

    usuarioPerfil=perfilAtualizado
    usuarioModoEdicao=false
    usuarioAbaAtiva="register"
    preencherFormularioUsuario(usuarioPerfil)
    limparCamposLoginUsuario()
    renderizarAreaUsuario()
    mostrarSucesso("Cadastro salvo com sucesso.")
  })
}

function abrirUnificador(filesParaCarregar){
  ocultarTudo()
  document.getElementById("unificador").style.display="block"
  atualizarAtalhosTopo(true)
  if(filesParaCarregar && filesParaCarregar.length>0){
    carregarFilesNoJuntar(filesParaCarregar)
  }
}

function abrirDividir(fileParaCarregar){
  ocultarTudo()
  document.getElementById("dividir-pdf").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar){
    carregarFileNoDividir(fileParaCarregar)
  }
}

function abrirOCR(fileParaCarregar){
  ocultarTudo()
  document.getElementById("ocr-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar){
    carregarFilesNoOCR([fileParaCarregar])
  }
}

function abrirCompactar(filesParaCarregar){
  ocultarTudo()
  document.getElementById("compactar-section").style.display="block"
  ocultarProgressoCompactar()
  atualizarAtalhosTopo(true)
  if(filesParaCarregar && filesParaCarregar.length>0){
    carregarFilesNoCompactar(filesParaCarregar)
  }
}

function abrirImagemParaPDF(filesParaCarregar){
  ocultarTudo()
  document.getElementById("imagempdf-section").style.display="block"
  ocultarProgressoImagemPDF()
  atualizarAtalhosTopo(true)
  if(filesParaCarregar && filesParaCarregar.length>0){
    carregarFilesNoImagemPDF(filesParaCarregar)
  }
}

function abrirConverter(fileParaCarregar){
  ocultarTudo()
  document.getElementById("converter-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar){
    carregarFileNoConverter(fileParaCarregar)
  }
}

function abrirJuntarPastas(){
  ocultarTudo()
  document.getElementById("juntarpastas-section").style.display="block"
  configurarInterfaceJuntarPastas()
  atualizarAtalhosTopo(true)
  detectarPlanoJuntarPastas()
}

function configurarInterfaceJuntarPastas(){
  const secao=document.getElementById("juntarpastas-section")
  if(!secao) return

  const btnCompactado=document.getElementById("btn-add-compactado")
  if(btnCompactado){
    btnCompactado.textContent="+ Adicionar Pasta Compactada"
    btnCompactado.classList.add("primary","btn-compactado")
    btnCompactado.classList.remove("atalho")
  }

  let hint=secao.querySelector(".pastas-adicionar-hint")
  if(!hint){
    hint=document.createElement("p")
    hint.className="pastas-adicionar-hint"
    const alvo=document.getElementById("pastas-adicionar-btn")
    if(alvo?.parentNode){
      alvo.parentNode.insertBefore(hint, alvo.nextSibling)
    }
  }

  aplicarDescricaoPlanoJuntarPastas()
  atualizarInfoJuntarPastas()
}

function abrirWordParaPDF(fileParaCarregar){
  ocultarTudo()
  document.getElementById("wordpdf-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar) carregarFileNoWordPDF(fileParaCarregar)
}

function abrirExcelParaPDF(fileParaCarregar){
  ocultarTudo()
  document.getElementById("excelpdf-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar) carregarFileNoExcelPDF(fileParaCarregar)
}

function abrirExcelParaWord(fileParaCarregar){
  ocultarTudo()
  document.getElementById("excelword-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar) carregarFileNoExcelWord(fileParaCarregar)
}

function abrirReorganizarPDF(fileParaCarregar){
  ocultarTudo()
  document.getElementById("reorganizar-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar) carregarFileNoReorganizar(fileParaCarregar)
}

function abrirAssinarPDF(fileParaCarregar){
  ocultarTudo()
  document.getElementById("assinar-section").style.display="block"
  atualizarAtalhosTopo(true)
  atualizarModoAssinaturaUI()
  if(fileParaCarregar) carregarPdfParaAssinatura(fileParaCarregar)
}

function abrirEditalPDF(fileParaCarregar){
  ocultarTudo()
  document.getElementById("edital-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar) carregarEditalPDF(fileParaCarregar)
}

function abrirPowerPointParaPDF(fileParaCarregar){
  ocultarTudo()
  document.getElementById("powerpoint-section").style.display="block"
  atualizarAtalhosTopo(true)
  if(fileParaCarregar) carregarPowerPointArquivo(fileParaCarregar)
}

function ocultarTudo(){
  fecharSobreposicoesGlobais()
  document.getElementById("menu-principal").style.display="none"
  atualizarBannerHome(false)
  document.getElementById("unificador").style.display="none"
  document.getElementById("dividir-pdf").style.display="none"
  document.getElementById("ocr-section").style.display="none"
  document.getElementById("compactar-section").style.display="none"
  document.getElementById("imagempdf-section").style.display="none"
  document.getElementById("converter-section").style.display="none"
  document.getElementById("tradutor-section").style.display="none"
  document.getElementById("wordpdf-section").style.display="none"
  document.getElementById("excelpdf-section").style.display="none"
  document.getElementById("excelword-section").style.display="none"
  document.getElementById("reorganizar-section").style.display="none"
  document.getElementById("assinar-section").style.display="none"
  document.getElementById("edital-section").style.display="none"
  document.getElementById("powerpoint-section").style.display="none"
  document.getElementById("juntarpastas-section").style.display="none"
  atualizarAreaMarketing(false)
}

function limparEstadosAoVoltarMenu(){
  try{ limparJuntar() }catch(e){}
  try{ limparDividir() }catch(e){}
  try{ limparOCR() }catch(e){}
  try{ limparCompactar() }catch(e){}
  try{ limparImagemPDF() }catch(e){}
  try{ limparConverter() }catch(e){}
  try{ limparTradutorPDF() }catch(e){}
  try{ limparWordPDF() }catch(e){}
  try{ limparExcelPDF() }catch(e){}
  try{ limparExcelWord() }catch(e){}
  try{ limparReorganizarPDF() }catch(e){}
  try{ limparAssinarPDF() }catch(e){}
  try{ limparEditalPDF() }catch(e){}
  try{ limparPowerPointPDF() }catch(e){}
  try{ limparJuntarPastas() }catch(e){}
}

function voltarMenu(){
  fecharSobreposicoesGlobais()
  limparEstadosAoVoltarMenu()
  document.getElementById("menu-principal").style.display="block"
  atualizarBannerHome(true)
  document.getElementById("unificador").style.display="none"
  document.getElementById("dividir-pdf").style.display="none"
  document.getElementById("ocr-section").style.display="none"
  document.getElementById("compactar-section").style.display="none"
  document.getElementById("imagempdf-section").style.display="none"
  document.getElementById("converter-section").style.display="none"
  document.getElementById("tradutor-section").style.display="none"
  document.getElementById("wordpdf-section").style.display="none"
  document.getElementById("excelpdf-section").style.display="none"
  document.getElementById("excelword-section").style.display="none"
  document.getElementById("reorganizar-section").style.display="none"
  document.getElementById("assinar-section").style.display="none"
  document.getElementById("edital-section").style.display="none"
  document.getElementById("powerpoint-section").style.display="none"
  document.getElementById("juntarpastas-section").style.display="none"
  atualizarAreaMarketing(true)
  atualizarAtalhosTopo(false)
  filtrarFerramentasHome("todas", {scroll:false})
}

function irParaHome(){
  fecharSobreposicoesGlobais()
  voltarMenu()
  filtrarFerramentasHome("todas", {scroll:false})
  requestAnimationFrame(()=>{
    window.scrollTo({top:0, behavior:"smooth"})
  })
}

function irParaFerramenta(destino){
  limparEstadosAoVoltarMenu()
  if(destino==="juntar") abrirUnificador()
  else if(destino==="dividir") abrirDividir()
  else if(destino==="compactar") abrirCompactar()
  else if(destino==="imagempdf") abrirImagemParaPDF()
  else if(destino==="traduzir") abrirTraducaoPremium()
  else if(destino==="reorganizar") abrirReorganizarPDF()
}
// ===================== UTILIDADES =====================

function bytesParaFile(bytes, nome){
  const blob=new Blob([bytes],{type:"application/pdf"})
  return new File([blob], nome, {type:"application/pdf"})
}

function baixarArquivo(bytes, nome){
  const blob=new Blob([bytes],{type:"application/pdf"})
  baixarBlob(blob, nome)
}

function baixarBlob(blob, nome){
  const link=document.createElement("a")
  const url=URL.createObjectURL(blob)
  link.href=url
  link.download=nome
  link.click()
  setTimeout(()=>URL.revokeObjectURL(url), 1500)
}

async function baixarColecaoResultados(itens, nomeZip){
  if(!Array.isArray(itens) || itens.length===0) return
  if(itens.length===1){
    baixarArquivo(itens[0].bytes, itens[0].nome)
    return
  }
  const JSZip=await carregarJSZip()
  const zip=new JSZip()
  for(const item of itens){
    zip.file(item.nome, item.bytes)
  }
  const blob=await zip.generateAsync({type:"blob"})
  baixarBlob(blob, nomeZip)
}

async function iniciarDownloadAutomatico(onDownload, mensagem){
  if(typeof onDownload!=="function") return
  let erroFinal=null
  try{
    await onDownload()
    if(mensagem) mostrarSucesso(mensagem+" Se o navegador bloquear, use o botão de download.")
    return
  }catch(erro){
    erroFinal=erro
  }

  try{
    await esperar(260)
    await onDownload()
    if(mensagem) mostrarSucesso(mensagem+" Se o navegador bloquear, use o botão de download.")
  }catch(erro){
    erroFinal=erro
    console.error(erroFinal)
    mostrarAviso("O processamento foi concluído, mas o download automático não pôde ser iniciado. Use o botão de download.")
  }
}

function normalizarNomeArquivoBase(nome, fallback="arquivo_unificado"){
  const limpo=String(nome||"")
    .trim()
    .replace(/\.pdf$/i,"")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g," ")
    .replace(/\s+/g," ")
    .replace(/\.+$/g,"")
    .trim()
  return limpo || fallback
}

function aplicarCaixaPorModelo(modelo, texto){
  if(!modelo) return texto
  if(modelo===modelo.toUpperCase()) return texto.toUpperCase()
  if(modelo===modelo.toLowerCase()) return texto.toLowerCase()
  if(modelo[0]===modelo[0].toUpperCase() && modelo.slice(1)===modelo.slice(1).toLowerCase()){
    return texto.charAt(0).toUpperCase()+texto.slice(1).toLowerCase()
  }
  return texto
}

function normalizarRotuloVisualPortugues(texto){
  let base=String(texto||"").normalize("NFKC")
  if(!base) return ""

  const mapaAcentos=[
    ["HABILITACAO","HABILITAÇÃO"],
    ["COMERCIO","COMÉRCIO"],
    ["SERVICOS","SERVIÇOS"],
    ["SERVICO","SERVIÇO"],
    ["DISTRIBUICAO","DISTRIBUIÇÃO"],
    ["DISTRIBUICOES","DISTRIBUIÇÕES"],
    ["INDUSTRIA","INDÚSTRIA"],
    ["ADMINISTRACAO","ADMINISTRAÇÃO"],
    ["ORGANIZACAO","ORGANIZAÇÃO"],
    ["INSCRICAO","INSCRIÇÃO"]
  ]

  mapaAcentos.forEach(([semAcento, comAcento])=>{
    const regex=new RegExp(`\\b${semAcento}\\b`, "gi")
    base=base.replace(regex, (encontrado)=>aplicarCaixaPorModelo(encontrado, comAcento))
  })

  return base
}

function normalizarNomeSaidaPdf(baseNome, fallback="arquivo_unificado"){
  const nomeVisual=normalizarRotuloVisualPortugues(baseNome)
  return normalizarNomeArquivoBase(nomeVisual, fallback)+".pdf"
}

function obterNomeBaseSaidaJuntar(fallback="arquivo_unificado"){
  const input=document.getElementById("finalFileName")
  const nomeManual=normalizarNomeArquivoBase(input?.value, "")
  if(nomeManual) return nomeManual
  if(pastasJuntar.length===1 && arquivos.length===0){
    return normalizarNomeArquivoBase(pastasJuntar[0]?.nomePasta, fallback)
  }
  if(arquivos.length===1 && pastasJuntar.length===0){
    return normalizarNomeArquivoBase(nomeBaseSemExtensao(arquivos[0]?.name), fallback)
  }
  return fallback
}

function normalizarTextoParaPdf(texto){
  return String(texto??"")
    .replace(/\u00a0/g," ")
    .replace(/[\u2018\u2019]/g,"'")
    .replace(/[\u201c\u201d]/g,'"')
    .replace(/[\u2013\u2014]/g,"-")
    .replace(/\u2022/g,"-")
    .replace(/\u2026/g,"...")
    .replace(/[\u200b-\u200d\ufeff]/g,"")
    .replace(/[^\n\r\t\x20-\x7e\xa0-\xff]/g,"")
}

function sugerirNomeSaidaJuntar(){
  const input=document.getElementById("finalFileName")
  if(!input || input.value.trim()) return
  if(pastasJuntar.length===1 && arquivos.length===0){
    input.value=normalizarNomeArquivoBase(pastasJuntar[0].nomePasta,"arquivo_unificado")
    return
  }
  if(arquivos.length===1 && pastasJuntar.length===0){
    input.value=normalizarNomeArquivoBase(nomeBaseSemExtensao(arquivos[0].name),"arquivo_unificado")
    return
  }
  if((arquivos.length>1 || pastasJuntar.length>1) && !input.value.trim()){
    input.value="arquivo_unificado"
  }
}

async function carregarPdfPreservandoAssinaturaVisual(bytes){
  const pdf=await PDFLib.PDFDocument.load(bytes)
  try{
    const form=pdf.getForm()
    form.flatten()
  }catch(e){}
  return pdf
}

async function renderizarCapa(file){
  const arrayBuffer=await file.arrayBuffer()
  const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise
  const page=await pdf.getPage(1)
  const viewport=page.getViewport({scale:0.4})
  const canvas=document.createElement("canvas")
  canvas.width=viewport.width
  canvas.height=viewport.height
  await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise
  return {canvas, totalPaginas:pdf.numPages}
}

async function renderizarCapaNoCanvas(file, canvasEl){
  const arrayBuffer=await file.arrayBuffer()
  const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise
  const page=await pdf.getPage(1)
  const viewport=page.getViewport({scale:0.5})
  canvasEl.width=viewport.width
  canvasEl.height=viewport.height
  await page.render({canvasContext:canvasEl.getContext("2d"),viewport}).promise
  return pdf.numPages
}

function ordemPaginasNatural(totalPaginas){
  return Array.from({length:totalPaginas}, (_,idx)=>idx)
}

function obterOrdemPaginasArquivo(file, totalPaginas){
  const ordemSalva=ordemPaginasPorArquivo.get(file)
  if(!Array.isArray(ordemSalva) || ordemSalva.length!==totalPaginas){
    return ordemPaginasNatural(totalPaginas)
  }
  const unicos=new Set(ordemSalva)
  if(unicos.size!==totalPaginas) return ordemPaginasNatural(totalPaginas)
  return [...ordemSalva]
}

function ordemPaginasEhPersonalizada(ordem){
  return ordem.some((paginaIdx, posicao)=>paginaIdx!==posicao)
}

function salvarOrdemPaginasArquivo(file, ordem){
  if(!file) return
  if(!ordemPaginasEhPersonalizada(ordem)){
    ordemPaginasPorArquivo.delete(file)
    return
  }
  ordemPaginasPorArquivo.set(file, [...ordem])
}

async function recriarPdfComOrdemAplicada(pdf, file){
  if(!file) return pdf
  const ordem=obterOrdemPaginasArquivo(file, pdf.getPageCount())
  if(!ordemPaginasEhPersonalizada(ordem)) return pdf
  const novoPdf=await PDFLib.PDFDocument.create()
  const paginas=await novoPdf.copyPages(pdf, ordem)
  paginas.forEach(pagina=>novoPdf.addPage(pagina))
  return novoPdf
}

function garantirFerramentasModalPaginas(){
  const box=document.querySelector("#modal-paginas .modal-box")
  const grid=document.getElementById("modal-paginas-grid")
  if(!box || !grid) return {}

  let toolbar=document.getElementById("modal-paginas-toolbar")
  if(!toolbar){
    toolbar=document.createElement("div")
    toolbar.id="modal-paginas-toolbar"
    toolbar.className="modal-pages-toolbar"
    toolbar.innerHTML=`
      <div id="modal-paginas-info" class="modal-pages-info"></div>
      <div class="modal-pages-actions">
        <button id="modal-reset-order" type="button" class="btn atalho btn-sm">Restaurar ordem</button>
      </div>
    `
    box.insertBefore(toolbar, grid)
  }

  const info=document.getElementById("modal-paginas-info")
  const resetBtn=document.getElementById("modal-reset-order")
  if(resetBtn){
    resetBtn.onclick=()=>{
      if(!modalPaginasEstado.file || modalPaginasEstado.total<=1) return
      modalPaginasEstado.ordem=ordemPaginasNatural(modalPaginasEstado.total)
      salvarOrdemPaginasArquivo(modalPaginasEstado.file, modalPaginasEstado.ordem)
      renderizarGridModalPaginas()
    }
  }

  return {toolbar, info, resetBtn}
}

function atualizarStatusModalPaginas(){
  const info=document.getElementById("modal-paginas-info")
  const resetBtn=document.getElementById("modal-reset-order")
  if(!info || !resetBtn) return
  const total=modalPaginasEstado.total||0
  const personalizada=ordemPaginasEhPersonalizada(modalPaginasEstado.ordem||[])
  if(total<=1){
    info.textContent="Documento com 1 página."
    resetBtn.disabled=true
    return
  }
  info.textContent=personalizada
    ? "Ordem personalizada ativa. Arraste as páginas para reorganizar o PDF."
    : "Arraste as páginas para reorganizar. A ordem será salva automaticamente."
  resetBtn.disabled=!personalizada
}

function renderizarGridModalPaginas(){
  const grid=document.getElementById("modal-paginas-grid")
  if(!grid) return
  grid.innerHTML=""
  modalPaginasEstado.ordem.forEach((paginaIdx, posicao)=>{
    const item=modalPaginasEstado.itens.get(paginaIdx)
    if(!item) return
    item.dataset.modalPos=String(posicao)
    const ordemEl=item.querySelector(".modal-page-order")
    const labelEl=item.querySelector(".modal-page-label")
    if(ordemEl) ordemEl.textContent=String(posicao+1).padStart(2,"0")
    if(labelEl) labelEl.textContent="Página "+(paginaIdx+1)
    grid.appendChild(item)
  })
  atualizarStatusModalPaginas()
}

function resetarEstadoModalPaginas(){
  modalPaginaArrastandoPos=null
  modalPaginasEstado={file:null, ordem:[], itens:new Map(), total:0}
}

async function abrirPaginasModal(file){
  document.getElementById("modal-titulo").textContent=file.name
  const grid=document.getElementById("modal-paginas-grid")
  grid.innerHTML="<p style='color:#6b7280'>Carregando páginas...</p>"
  document.getElementById("modal-paginas").style.display="flex"
  garantirFerramentasModalPaginas()

  const arrayBuffer=await file.arrayBuffer()
  const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise
  modalPaginasEstado={
    file,
    ordem:obterOrdemPaginasArquivo(file, pdf.numPages),
    itens:new Map(),
    total:pdf.numPages
  }

  for(const paginaIdx of modalPaginasEstado.ordem){
    const page=await pdf.getPage(paginaIdx+1)
    const viewport=page.getViewport({scale:1.45})
    const canvas=document.createElement("canvas")
    canvas.width=viewport.width
    canvas.height=viewport.height
    const ctx=canvas.getContext("2d")
    ctx.fillStyle="#ffffff"
    ctx.fillRect(0,0,canvas.width,canvas.height)
    await page.render({canvasContext:ctx,viewport}).promise

    const item=document.createElement("div")
    item.className="modal-page-item"
    item.dataset.pageIndex=String(paginaIdx)
    if(pdf.numPages>1){
      item.draggable=true
      item.classList.add("modal-page-item-sortable")
      item.addEventListener("dragstart",(e)=>{
        modalPaginaArrastandoPos=Number(item.dataset.modalPos||0)
        item.classList.add("modal-page-item-dragging")
        if(e.dataTransfer){
          e.dataTransfer.effectAllowed="move"
          e.dataTransfer.setData("text/plain", item.dataset.modalPos||"0")
        }
      })
      item.addEventListener("dragend",()=>{
        modalPaginaArrastandoPos=null
        item.classList.remove("modal-page-item-dragging")
        document.querySelectorAll(".modal-page-item-drop-target").forEach(el=>el.classList.remove("modal-page-item-drop-target"))
      })
      item.addEventListener("dragover",(e)=>{
        const destinoPos=Number(item.dataset.modalPos||0)
        if(modalPaginaArrastandoPos===null || modalPaginaArrastandoPos===destinoPos) return
        e.preventDefault()
        item.classList.add("modal-page-item-drop-target")
        if(e.dataTransfer) e.dataTransfer.dropEffect="move"
      })
      item.addEventListener("dragleave",()=>{
        item.classList.remove("modal-page-item-drop-target")
      })
      item.addEventListener("drop",(e)=>{
        const destinoPos=Number(item.dataset.modalPos||0)
        if(modalPaginaArrastandoPos===null || modalPaginaArrastandoPos===destinoPos) return
        e.preventDefault()
        item.classList.remove("modal-page-item-drop-target")
        const ordemAtual=[...modalPaginasEstado.ordem]
        const [movida]=ordemAtual.splice(modalPaginaArrastandoPos,1)
        ordemAtual.splice(destinoPos,0,movida)
        modalPaginasEstado.ordem=ordemAtual
        salvarOrdemPaginasArquivo(file, ordemAtual)
        renderizarGridModalPaginas()
      })
    }

    const head=document.createElement("div")
    head.className="modal-page-head"
    const ordemBadge=document.createElement("span")
    ordemBadge.className="modal-page-order"
    const label=document.createElement("span")
    label.className="modal-page-label"
    label.textContent="Página "+(paginaIdx+1)
    head.appendChild(ordemBadge)
    head.appendChild(label)
    if(pdf.numPages>1){
      const dragHint=document.createElement("span")
      dragHint.className="modal-page-drag-hint"
      dragHint.textContent="Arraste para mover"
      head.appendChild(dragHint)
    }
    item.appendChild(head)
    item.appendChild(canvas)
    modalPaginasEstado.itens.set(paginaIdx, item)
  }
  renderizarGridModalPaginas()
}

function fecharModal(e){
  if(e.target===document.getElementById("modal-paginas")){
    document.getElementById("modal-paginas").style.display="none"
    resetarEstadoModalPaginas()
  }
}

function fecharModalBtn(){
  document.getElementById("modal-paginas").style.display="none"
  resetarEstadoModalPaginas()
}

async function criarThumbCard(file, idx=null, options={}){
  const compacto=options.compacto===true
  const ordemTexto=options.ordemTexto ?? (idx!==null ? String(idx+1).padStart(2,"0") : "PDF")
  const classesExtras=Array.isArray(options.classesExtras) ? options.classesExtras : []
  const canvasWidth=compacto ? 126 : 148
  const canvasHeight=compacto ? 146 : 172
  const card=document.createElement("div")
  card.className="thumb-card"
  if(compacto) card.classList.add("thumb-card-compact")
  classesExtras.forEach(classe=>card.classList.add(classe))
  card.onclick=()=>{
    if(Date.now()<bloquearCliqueThumbAte) return
    abrirPaginasModal(file)
  }

  const btnRemover=document.createElement("button")
  btnRemover.className="thumb-remover"
  btnRemover.type="button"
  btnRemover.setAttribute("aria-label","Remover arquivo")
  btnRemover.textContent="✕"
  btnRemover.onclick=(e)=>{
    e.stopPropagation()
    if(idx!==null) removerArquivoJuntar(idx)
  }

  const ordemBadge=document.createElement("div")
  ordemBadge.className="thumb-order-badge"
  ordemBadge.textContent=ordemTexto

  // Placeholder imediato — sem bloquear
  const canvas=document.createElement("canvas")
  canvas.width=canvasWidth
  canvas.height=canvasHeight
  const ctx=canvas.getContext("2d")
  const grad=ctx.createLinearGradient(0,0,0,canvasHeight)
  grad.addColorStop(0,"#f8fafc")
  grad.addColorStop(1,"#e5edf8")
  ctx.fillStyle=grad
  ctx.fillRect(0,0,canvasWidth,canvasHeight)
  ctx.fillStyle="#4f46e5"
  ctx.font=compacto ? "700 36px sans-serif" : "700 44px sans-serif"
  ctx.textAlign="center"
  ctx.fillText("PDF",canvasWidth/2,compacto ? 82 : 96)
  ctx.fillStyle="#94a3b8"
  ctx.font=compacto ? "600 11px sans-serif" : "600 12px sans-serif"
  ctx.fillText("Carregando prévia",74,122)

  const nome=document.createElement("div")
  nome.className="thumb-nome"
  nome.textContent=normalizarRotuloVisualPortugues(file.name)

  const pags=document.createElement("div")
  pags.className="thumb-paginas"
  pags.textContent="..."

  card.appendChild(ordemBadge)
  if(idx!==null) card.appendChild(btnRemover)
  card.appendChild(canvas)
  card.appendChild(nome)
  card.appendChild(pags)

  if(idx!==null){
    card.draggable=true
    card.classList.add("thumb-card-sortable")
    card.setAttribute("aria-label","Arraste para reorganizar o PDF")

    card.addEventListener("dragstart",(e)=>{
      arquivoJuntarArrastandoIdx=idx
      bloquearCliqueThumbAte=Date.now()+350
      card.classList.add("thumb-card-dragging")
      if(e.dataTransfer){
        e.dataTransfer.effectAllowed="move"
        e.dataTransfer.setData("text/plain", String(idx))
      }
    })

    card.addEventListener("dragend",()=>{
      arquivoJuntarArrastandoIdx=null
      bloquearCliqueThumbAte=Date.now()+350
      card.classList.remove("thumb-card-dragging")
      document.querySelectorAll(".thumb-card-drop-target").forEach(el=>el.classList.remove("thumb-card-drop-target"))
    })

    card.addEventListener("dragover",(e)=>{
      e.preventDefault()
      if(arquivoJuntarArrastandoIdx===null || arquivoJuntarArrastandoIdx===idx) return
      card.classList.add("thumb-card-drop-target")
      if(e.dataTransfer) e.dataTransfer.dropEffect="move"
    })

    card.addEventListener("dragleave",()=>{
      card.classList.remove("thumb-card-drop-target")
    })

    card.addEventListener("drop",(e)=>{
      e.preventDefault()
      e.stopPropagation()
      card.classList.remove("thumb-card-drop-target")
      if(arquivoJuntarArrastandoIdx===null || arquivoJuntarArrastandoIdx===idx) return
      reordenarArquivoJuntar(arquivoJuntarArrastandoIdx, idx)
    })
  }

  if(idx!==null){
    const mover=document.createElement("div")
    mover.className="thumb-move-controls"

    const btnSubir=document.createElement("button")
    btnSubir.type="button"
    btnSubir.className="thumb-move-btn"
    btnSubir.textContent="↑"
    btnSubir.disabled=idx===0
    btnSubir.setAttribute("aria-label","Mover arquivo para cima")
    btnSubir.onclick=(e)=>{
      e.stopPropagation()
      moverArquivoJuntar(idx,-1)
    }

    const btnDescer=document.createElement("button")
    btnDescer.type="button"
    btnDescer.className="thumb-move-btn"
    btnDescer.textContent="↓"
    btnDescer.disabled=idx===arquivos.length-1
    btnDescer.setAttribute("aria-label","Mover arquivo para baixo")
    btnDescer.onclick=(e)=>{
      e.stopPropagation()
      moverArquivoJuntar(idx,1)
    }

    mover.appendChild(btnSubir)
    mover.appendChild(btnDescer)
    card.appendChild(mover)
  }

  // Renderizar capa em background sem bloquear o loop
  let totalPaginas=1
  renderizarCapaAsync(file, canvas, pags).then(n=>{ totalPaginas=n })

  return {card, totalPaginas}
}

async function renderizarCapaAsync(file, canvas, pagsEl){
  try{
    const arrayBuffer=await file.arrayBuffer()
    const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise
    const page=await pdf.getPage(1)
    const viewport=page.getViewport({scale:0.8})
    canvas.width=viewport.width
    canvas.height=viewport.height
    const ctx=canvas.getContext("2d")
    ctx.fillStyle="#ffffff"
    ctx.fillRect(0,0,canvas.width,canvas.height)
    await page.render({canvasContext:ctx,viewport}).promise
    pagsEl.textContent=pdf.numPages+" página"+(pdf.numPages>1?"s":"")
    return pdf.numPages
  }catch(e){
    pagsEl.textContent="—"
    return 1
  }
}


// ===================== JUNTAR PDF =====================

let arquivos=[]
let pastasJuntar=[]
let resultadosPastasJuntar=[]
let arquivoJuntarArrastandoIdx=null
let bloquearCliqueThumbAte=0
let pastaJuntarArquivoArrastandoInfo=null

const fileInput=document.getElementById("fileInput")
const gallery=document.getElementById("file-gallery")


function arquivoEhCompactado(file){
  const nome=(file?.name||"").toLowerCase()
  const tipo=(file?.type||"").toLowerCase()
  return (
    /\.(zip|rar|7z|tar|tgz|gz|bz2|xz)$/i.test(nome) ||
    nome.endsWith(".tar.gz") ||
    nome.endsWith(".tar.bz2") ||
    nome.endsWith(".tar.xz") ||
    tipo==="application/zip" ||
    tipo==="application/x-zip-compressed" ||
    tipo==="application/x-rar-compressed" ||
    tipo==="application/vnd.rar" ||
    tipo==="application/x-7z-compressed" ||
    tipo==="application/gzip"
  )
}

function arquivoEhZip(file){
  return /\.zip$/i.test(file?.name||"") || file?.type==="application/zip" || file?.type==="application/x-zip-compressed"
}

function obterTipoPorNome(nome){
  const n=(nome||"").toLowerCase()
  if(n.endsWith(".pdf")) return "application/pdf"
  if(n.endsWith(".png")) return "image/png"
  if(n.endsWith(".jpg")||n.endsWith(".jpeg")) return "image/jpeg"
  if(n.endsWith(".webp")) return "image/webp"
  return ""
}

function arquivoValidoJuntarPorNome(nome){
  return /\.(pdf|png|jpe?g|webp)$/i.test(nome||"")
}

function nomeBaseSemExtensao(nome){
  return (nome||"arquivo").replace(/\.[^.]+$/,"")
}

function rerenderPastasJuntar(){
  const row=document.getElementById("pastas-adicionadas")
  if(!row) return
  row.innerHTML=""
  for(let i=0;i<pastasJuntar.length;i++) renderizarPastaThumb(i)
}

function adicionarOuSubstituirPastaJuntar(nomePasta, arquivosPasta){
  const nomePastaExibicao=normalizarRotuloVisualPortugues(nomePasta)
  const idxExistente=pastasJuntar.findIndex(p=>p.nomePasta===nomePasta && p.arquivos.length===arquivosPasta.length)
  if(idxExistente>=0){
    const desejaSubstituir=confirm('Já consta uma pasta com o mesmo nome ("'+nomePastaExibicao+'") e a mesma quantidade de documentos ('+arquivosPasta.length+').\\n\\nClique em OK para substituir ou em Cancelar para manter a atual.')
    if(!desejaSubstituir) return {adicionada:false, substituida:false}
    pastasJuntar[idxExistente]={
      nomePasta,
      arquivos:ordenarArquivosPastaInicialmente(arquivosPasta),
      expandida:pastasJuntar[idxExistente]?.expandida===true
    }
    rerenderPastasJuntar()
    atualizarInfoJuntar()
    return {adicionada:true, substituida:true}
  }
  pastasJuntar.push({
    nomePasta,
    arquivos:ordenarArquivosPastaInicialmente(arquivosPasta),
    expandida:false
  })
  renderizarPastaThumb(pastasJuntar.length-1)
  atualizarInfoJuntar()
  return {adicionada:true, substituida:false}
}

async function extrairPastasDeZipParaJuntar(zipFile){
  const JSZip=await carregarJSZip()
  const zip=await JSZip.loadAsync(await zipFile.arrayBuffer())
  const grupos=new Map()
  const zipBase=nomeBaseSemExtensao(zipFile.name)

  const entradas=Object.values(zip.files)
  for(const entry of entradas){
    if(entry.dir) continue
    if(!arquivoValidoJuntarPorNome(entry.name)) continue

    const partes=entry.name.split("/").filter(Boolean)
    if(partes.length===0) continue

    let nomePasta=zipBase
    let caminhoInterno=entry.name

    if(partes.length>1){
      nomePasta=partes[0]
      caminhoInterno=partes.slice(1).join("/")
    }

    const tipo=obterTipoPorNome(entry.name)
    const bytes=await entry.async("uint8array")
    const arquivo=new File([bytes], partes[partes.length-1], {type:tipo||"application/octet-stream"})
    try{
      Object.defineProperty(arquivo, "webkitRelativePath", {
        value: nomePasta + "/" + caminhoInterno,
        configurable: true
      })
    }catch(e){}
    if(!grupos.has(nomePasta)) grupos.set(nomePasta, [])
    grupos.get(nomePasta).push(arquivo)
  }

  return Array.from(grupos.entries()).map(([nomePasta, arquivos])=>({nomePasta, arquivos}))
}

let libarchiveRef=null
let libarchiveInitPromise=null

async function carregarLibarchive(){
  if(libarchiveRef) return libarchiveRef
  if(!libarchiveInitPromise){
    libarchiveInitPromise=(async()=>{
      const mod=await import("https://cdn.jsdelivr.net/npm/libarchive.js@2.0.2/dist/libarchive.js")
      const Archive=mod.Archive || mod.default?.Archive || mod.default || mod
      if(Archive?.init){
        Archive.init({
          workerUrl:"https://cdn.jsdelivr.net/npm/libarchive.js@2.0.2/dist/worker-bundle.js"
        })
      }
      libarchiveRef=Archive
      return Archive
    })()
  }
  return await libarchiveInitPromise
}

async function extrairPastasDeCompactadoParaJuntar(archiveFile){
  if(arquivoEhZip(archiveFile)){
    return await extrairPastasDeZipParaJuntar(archiveFile)
  }

  const Archive=await carregarLibarchive()
  const archive=await Archive.open(archiveFile)
  const grupos=new Map()
  const archiveBase=nomeBaseSemExtensao(archiveFile.name)

  await archive.extractFiles((entry)=>{
    const fileExtraido=entry?.file
    if(!fileExtraido) return

    const caminhoBase=String(entry?.path||"").replace(/\\/g,"/").replace(/^\/+/,"")
    const caminhoCompleto=(caminhoBase ? caminhoBase+fileExtraido.name : fileExtraido.name).replace(/\\/g,"/")
    if(!arquivoValidoJuntarPorNome(caminhoCompleto)) return

    const partes=caminhoCompleto.split("/").filter(Boolean)
    if(partes.length===0) return

    let nomePasta=archiveBase
    let caminhoInterno=caminhoCompleto
    if(partes.length>1){
      nomePasta=partes[0]
      caminhoInterno=partes.slice(1).join("/")
    }

    const tipo=obterTipoPorNome(fileExtraido.name)
    const arquivo=new File([fileExtraido], partes[partes.length-1], {type:tipo||fileExtraido.type||"application/octet-stream"})
    try{
      Object.defineProperty(arquivo, "webkitRelativePath", {
        value: nomePasta + "/" + caminhoInterno,
        configurable: true
      })
    }catch(e){}
    if(!grupos.has(nomePasta)) grupos.set(nomePasta, [])
    grupos.get(nomePasta).push(arquivo)
  })

  return Array.from(grupos.entries()).map(([nomePasta, arquivos])=>({nomePasta, arquivos}))
}

async function processarZipNoJuntar(zipFile){
  mostrarLoading("Lendo ZIP: "+zipFile.name+"...")
  const grupos=await extrairPastasDeZipParaJuntar(zipFile)
  if(grupos.length===0){
    esconderLoading()
    alert("Nenhum PDF ou imagem válido foi encontrado no ZIP.")
    return
  }

  let adicionadas=0
  let substituidas=0
  for(const grupo of grupos){
    const r=adicionarOuSubstituirPastaJuntar(grupo.nomePasta, grupo.arquivos)
    if(r.adicionada) adicionadas++
    if(r.substituida) substituidas++
  }

  esconderLoading()
  if(substituidas>0){
    mostrarSucesso("ZIP carregado com substituição de pasta(s).")
  }else{
    mostrarSucesso(adicionadas+" pasta"+(adicionadas>1?"s adicionadas":" adicionada")+" via ZIP!")
  }
}

async function processarCompactadoNoJuntar(archiveFile){
  if(arquivoEhZip(archiveFile)){
    await processarZipNoJuntar(archiveFile)
    return
  }

  mostrarLoading("Lendo compactado: "+archiveFile.name+"...")
  let grupos=[]
  try{
    grupos=await extrairPastasDeCompactadoParaJuntar(archiveFile)
  }catch(e){
    console.error(e)
    esconderLoading()
    mostrarErro("Não foi possível abrir esse compactado. Verifique se ele não está protegido por senha ou corrompido.")
    return
  }
  if(grupos.length===0){
    esconderLoading()
    alert("Nenhum PDF ou imagem válido foi encontrado no compactado.")
    return
  }

  let adicionadas=0
  let substituidas=0
  for(const grupo of grupos){
    const r=adicionarOuSubstituirPastaJuntar(grupo.nomePasta, grupo.arquivos)
    if(r.adicionada) adicionadas++
    if(r.substituida) substituidas++
  }

  esconderLoading()
  if(substituidas>0){
    mostrarSucesso("Compactado carregado com substituição de pasta(s).")
  }else{
    mostrarSucesso(adicionadas+" pasta"+(adicionadas>1?"s adicionadas":" adicionada")+" via compactado!")
  }
}

async function extrairCompactadosParaPastaPrincipal(compactados, nomePastaPrincipal){
  const arquivosExtraidos=[]
  let processados=0
  let ignorados=0

  for(const compactado of compactados){
    try{
      const grupos=await extrairPastasDeCompactadoParaJuntar(compactado)
      if(grupos.length===0){
        ignorados++
        continue
      }

      processados++
      const baseCompactado=nomeBaseSemExtensao(compactado.name)

      for(const grupo of grupos){
        for(const arquivo of grupo.arquivos){
          const caminhoOriginal=(arquivo.webkitRelativePath || `${grupo.nomePasta}/${arquivo.name}`)
            .replace(/\\/g,"/")
            .replace(/^\/+/,"")
          const partes=caminhoOriginal.split("/").filter(Boolean)
          const caminhoInterno=partes.length>1 ? partes.slice(1).join("/") : arquivo.name
          const caminhoFinal=`${nomePastaPrincipal}/${baseCompactado}/${caminhoInterno}`
          try{
            Object.defineProperty(arquivo, "webkitRelativePath", {
              value: caminhoFinal,
              configurable: true
            })
          }catch(e){}
          arquivosExtraidos.push(arquivo)
        }
      }
    }catch(err){
      console.warn("Não foi possível ler compactado da pasta:", compactado?.name, err)
      ignorados++
    }
  }

  return {arquivosExtraidos, processados, ignorados}
}

async function processarEntradaJuntar(files){
  const compactados=files.filter(arquivoEhCompactado)
  const comuns=files.filter(f=>!arquivoEhCompactado(f))
  if(comuns.length>0) await carregarFilesNoJuntar(comuns)
  for(const compactado of compactados){
    await processarCompactadoNoJuntar(compactado)
  }
}

fileInput.addEventListener("change",async(e)=>{
  await processarEntradaJuntar(Array.from(e.target.files))
  fileInput.value=""
})

async function renderizarArquivosJuntar(){
  gallery.innerHTML=""
  for(let i=0;i<arquivos.length;i++){
    const {card}=await criarThumbCard(arquivos[i], i)
    gallery.appendChild(card)
  }
}

function removerArquivoJuntar(idx){
  arquivos.splice(idx,1)
  renderizarArquivosJuntar()
  atualizarInfoJuntar()
}

function moverArquivoJuntar(idx, deslocamento){
  const novoIdx=idx+deslocamento
  if(novoIdx<0 || novoIdx>=arquivos.length) return
  const [arquivo]=arquivos.splice(idx,1)
  arquivos.splice(novoIdx,0,arquivo)
  renderizarArquivosJuntar()
  atualizarInfoJuntar()
}

function reordenarArquivoJuntar(origemIdx, destinoIdx){
  if(origemIdx===destinoIdx) return
  if(origemIdx<0 || destinoIdx<0) return
  if(origemIdx>=arquivos.length || destinoIdx>=arquivos.length) return
  const [arquivo]=arquivos.splice(origemIdx,1)
  arquivos.splice(destinoIdx,0,arquivo)
  renderizarArquivosJuntar()
  atualizarInfoJuntar()
}

function obterChaveOrdenacaoPasta(file){
  return (file?.webkitRelativePath || file?.name || "").toLowerCase()
}

function ordenarArquivosPastaInicialmente(listaArquivos){
  return [...listaArquivos].sort((a,b)=>obterChaveOrdenacaoPasta(a).localeCompare(obterChaveOrdenacaoPasta(b), "pt-BR", {numeric:true, sensitivity:"base"}))
}

// ===================== DRAG AND DROP UNIFICADO =====================

const DROP_ZONES={
  "#drop-zone":           "juntar",
  "#compactar-drop-zone": "compactar",
  "#imagempdf-drop-zone": "imagempdf",
  "#split-drop-zone":     "dividir",
  "#ocr-drop-zone":       "ocr",
  "#tradutor-drop-zone":  "tradutor",
  "#reorganizar-drop-zone":"reorganizar",
  "#assinar-drop-zone":   "assinar",
  "#edital-drop-zone":    "edital",
  "#powerpoint-drop-zone":"powerpoint"
}

let dropZoneAtiva=null

function eventoTemArquivos(evento){
  const tipos=Array.from(evento?.dataTransfer?.types || [])
  return tipos.includes("Files")
}

function obterZonaPorElemento(el){
  if(!(el instanceof Element)) return null
  for(let [sel,tipo] of Object.entries(DROP_ZONES)){
    const zone=el.closest(sel)
    if(zone) return {zone, tipo}
  }
  return null
}

function obterZonaFerramentaAtiva(){
  for(let [sel,tipo] of Object.entries(DROP_ZONES)){
    const zone=document.querySelector(sel)
    if(!zone) continue
    const secao=zone.closest("section")
    if(secao && secao.style.display!=="none") return {zone, tipo}
  }
  return null
}

function getZona(el, evento=null){
  if(evento?.composedPath){
    for(const item of evento.composedPath()){
      const encontrada=obterZonaPorElemento(item)
      if(encontrada) return encontrada
    }
  }
  const direta=obterZonaPorElemento(el)
  if(direta) return direta
  return obterZonaFerramentaAtiva()
}

function atualizarDestaqueDropZone(proximaZona){
  if(dropZoneAtiva?.zone && dropZoneAtiva.zone!==proximaZona?.zone){
    dropZoneAtiva.zone.classList.remove("drag-over")
  }
  if(proximaZona?.zone){
    proximaZona.zone.classList.add("drag-over")
  }
  dropZoneAtiva=proximaZona?.zone ? proximaZona : null
}

document.addEventListener("dragenter",(e)=>{
  if(!eventoTemArquivos(e)) return
  const r=getZona(e.target, e)
  if(r){
    e.preventDefault()
    atualizarDestaqueDropZone(r)
  }
})

document.addEventListener("dragover",(e)=>{
  if(!eventoTemArquivos(e)) return
  const r=getZona(e.target, e)
  if(r){
    e.preventDefault()
    if(e.dataTransfer) e.dataTransfer.dropEffect="copy"
    atualizarDestaqueDropZone(r)
  }
})

document.addEventListener("dragleave",(e)=>{
  if(!dropZoneAtiva?.zone) return
  const related=e.relatedTarget instanceof Element ? e.relatedTarget : null
  if(related && dropZoneAtiva.zone.contains(related)) return
  dropZoneAtiva.zone.classList.remove("drag-over")
  dropZoneAtiva=null
})

document.addEventListener("drop",async(e)=>{
  if(!eventoTemArquivos(e)) return
  const r=getZona(e.target, e) || dropZoneAtiva
  if(!r) return
  e.preventDefault()
  e.stopPropagation()
  atualizarDestaqueDropZone(null)

  const {tipo}=r
  const items=Array.from(e.dataTransfer.items||[])

  // Processar via FileSystemEntry (detecta pastas)
  if(items.length>0 && items[0].webkitGetAsEntry){
    const entries=items.map(i=>i.webkitGetAsEntry()).filter(Boolean)
    for(let entry of entries){
      if(entry.isDirectory){
        mostrarLoading("Lendo pasta: "+entry.name+"...")
        const todos=await lerDiretorio(entry)
        if(tipo==="juntar"){
          const validos=todos.filter(f=>f.type==="application/pdf"||f.type.startsWith("image/"))
          const compactados=todos.filter(arquivoEhCompactado)
          const {arquivosExtraidos}=await extrairCompactadosParaPastaPrincipal(compactados, entry.name)
          const arquivosDaPasta=[...validos, ...arquivosExtraidos]
          if(arquivosDaPasta.length===0){esconderLoading();alert("Nenhum PDF encontrado: "+entry.name);continue}
          adicionarOuSubstituirPastaJuntar(entry.name, arquivosDaPasta)
        }else if(tipo==="compactar"){
          const pdfs=todos.filter(f=>f.type==="application/pdf")
          if(pdfs.length>0) await carregarFilesNoCompactar(pdfs)
        }else if(tipo==="imagempdf"){
          const imagens=todos.filter(arquivoEhImagemCompativel)
          if(imagens.length>0) await carregarFilesNoImagemPDF(imagens)
        }else if(tipo==="dividir"){
          const pdf=todos.find(f=>f.type==="application/pdf")
          if(pdf) await carregarFileNoDividir(pdf)
        }else if(tipo==="ocr"){
          const pdfs=todos.filter(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
          if(pdfs.length>0) await carregarFilesNoOCR(pdfs)
        }else if(tipo==="tradutor"){
          const pdf=todos.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
          if(pdf) await carregarFileNoTradutor(pdf)
        }else if(tipo==="reorganizar"){
          const pdf=todos.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
          if(pdf) await carregarFileNoReorganizar(pdf)
        }else if(tipo==="assinar"){
          const pdf=todos.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
          if(pdf) await carregarPdfParaAssinatura(pdf)
        }else if(tipo==="edital"){
          const pdf=todos.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
          if(pdf) await carregarEditalPDF(pdf)
        }else if(tipo==="powerpoint"){
          const ppt=todos.find(arquivoEhPowerPoint)
          if(ppt) await carregarPowerPointArquivo(ppt)
        }
      }else{
        const file=await entryParaFile(entry)
        if(!file) continue
        if(tipo==="juntar"){
          if(arquivoEhCompactado(file)) await processarCompactadoNoJuntar(file)
          else if(file.type==="application/pdf"||file.type.startsWith("image/")) await carregarFilesNoJuntar([file])
        }
        else if(tipo==="compactar"&&file.type==="application/pdf")
          await carregarFilesNoCompactar([file])
        else if(tipo==="imagempdf"&&arquivoEhImagemCompativel(file))
          await carregarFilesNoImagemPDF([file])
        else if(tipo==="dividir"&&file.type==="application/pdf")
          await carregarFileNoDividir(file)
        else if(tipo==="ocr"&&(file.type==="application/pdf"||/\.pdf$/i.test(file.name)))
          await carregarFilesNoOCR([file])
        else if(tipo==="tradutor"&&(file.type==="application/pdf"||/\.pdf$/i.test(file.name)))
          await carregarFileNoTradutor(file)
        else if(tipo==="reorganizar"&&(file.type==="application/pdf"||/\.pdf$/i.test(file.name)))
          await carregarFileNoReorganizar(file)
        else if(tipo==="assinar"&&(file.type==="application/pdf"||/\.pdf$/i.test(file.name)))
          await carregarPdfParaAssinatura(file)
        else if(tipo==="edital"&&(file.type==="application/pdf"||/\.pdf$/i.test(file.name)))
          await carregarEditalPDF(file)
        else if(tipo==="powerpoint"&&arquivoEhPowerPoint(file))
          await carregarPowerPointArquivo(file)
      }
    }
    if(tipo==="juntar") atualizarInfoJuntar()
    esconderLoading()
    const totalRecebido=Array.from(e.dataTransfer.files||[]).length || entries.length || 1
    mostrarSucesso(`${totalRecebido} item${totalRecebido>1?"ns carregados":" carregado"} com sucesso.`)
    return
  }

  // Fallback sem FileSystemEntry
  const files=Array.from(e.dataTransfer.files||[])
  if(tipo==="juntar"){
    await processarEntradaJuntar(files)
  }else if(tipo==="compactar"){
    const pdfs=files.filter(f=>f.type==="application/pdf")
    if(pdfs.length>0) await carregarFilesNoCompactar(pdfs)
  }else if(tipo==="imagempdf"){
    const imagens=files.filter(arquivoEhImagemCompativel)
    if(imagens.length>0) await carregarFilesNoImagemPDF(imagens)
  }else if(tipo==="dividir"){
    const pdf=files.find(f=>f.type==="application/pdf")
    if(pdf) await carregarFileNoDividir(pdf)
  }else if(tipo==="ocr"){
    const pdfs=files.filter(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
    if(pdfs.length>0) await carregarFilesNoOCR(pdfs)
  }else if(tipo==="tradutor"){
    const pdf=files.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
    if(pdf) await carregarFileNoTradutor(pdf)
  }else if(tipo==="reorganizar"){
    const pdf=files.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
    if(pdf) await carregarFileNoReorganizar(pdf)
  }else if(tipo==="assinar"){
    const pdf=files.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
    if(pdf) await carregarPdfParaAssinatura(pdf)
  }else if(tipo==="edital"){
    const pdf=files.find(f=>f.type==="application/pdf"||/\.pdf$/i.test(f.name))
    if(pdf) await carregarEditalPDF(pdf)
  }else if(tipo==="powerpoint"){
    const ppt=files.find(arquivoEhPowerPoint)
    if(ppt) await carregarPowerPointArquivo(ppt)
  }
})

// Lê recursivamente todos os arquivos de um diretório
async function lerDiretorio(dirEntry){
  const result=[]
  const reader=dirEntry.createReader()

  // readEntries retorna no máximo 100 por vez — precisa chamar até retornar array vazio
  async function lerTodosOsLotes(){
    return new Promise((resolve,reject)=>{
      reader.readEntries(resolve, reject)
    })
  }

  let lote
  do{
    lote=await lerTodosOsLotes()
    for(let entry of lote){
      if(entry.isFile){
        const file=await entryParaFile(entry)
        if(file) result.push(file)
      }else if(entry.isDirectory){
        const sub=await lerDiretorio(entry)
        result.push(...sub)
      }
    }
  }while(lote.length>0)

  return result
}

function entryParaFile(entry){
  return new Promise((resolve)=>{
    entry.file(f=>resolve(f),()=>resolve(null))
  })
}

function selecionarPasta(){
  mostrarAvisoConfirmacaoPasta()
  const input=document.createElement("input")
  input.type="file"
  input.webkitdirectory=true
  input.style.display="none"
  document.body.appendChild(input)
  input.addEventListener("change",async(e)=>{
    document.body.removeChild(input)
    const selecionados=Array.from(e.target.files||[])
    const files=selecionados.filter(f=>f.type==="application/pdf"||f.type.startsWith("image/"))
    const compactados=selecionados.filter(arquivoEhCompactado)
    if(files.length===0 && compactados.length===0){alert("Nenhum PDF, imagem ou compactado encontrado na pasta.");return}
    mostrarLoading("Carregando pasta selecionada...")
    const nomePasta=(selecionados[0]?.webkitRelativePath||"").split("/")[0]||("Pasta "+(pastasJuntar.length+1))
    const nomePastaExibicao=normalizarRotuloVisualPortugues(nomePasta)
    const {arquivosExtraidos, processados:compactadosProcessados, ignorados:compactadosIgnorados}=await extrairCompactadosParaPastaPrincipal(compactados, nomePasta)
    const arquivosDaPasta=[...files, ...arquivosExtraidos]
    if(arquivosDaPasta.length===0){
      esconderLoading()
      alert("Nenhum PDF válido foi encontrado dentro da pasta ou dos compactados.")
      return
    }
    let resultado={adicionada:false, substituida:false}
    if(arquivosDaPasta.length>0){
      resultado=adicionarOuSubstituirPastaJuntar(nomePasta, arquivosDaPasta)
    }
    esconderLoading()
    if(resultado.adicionada || compactadosProcessados>0){
      if(compactadosProcessados>0 || compactadosIgnorados>0){
        const resumoIgnorados=compactadosIgnorados>0 ? " "+compactadosIgnorados+" compactado(s) ignorado(s)." : ""
        mostrarSucesso('Pasta "'+nomePastaExibicao+'" carregada com '+compactadosProcessados+' compactado(s) integrado(s).'+resumoIgnorados)
      }else{
        mostrarSucesso(resultado.substituida ? 'Pasta "'+nomePastaExibicao+'" substituída!' : 'Pasta "'+nomePastaExibicao+'" carregada!')
      }
    }
  })
  input.click()
}

function renderizarPastaThumb(idx){
  const {nomePasta, arquivos:arqs, expandida}=pastasJuntar[idx]
  const row=document.getElementById("pastas-adicionadas")

  const card=document.createElement("div")
  card.className="pasta-thumb-card"
  card.id="pasta-thumb-"+idx

  const btnRemover=document.createElement("button")
  btnRemover.className="pasta-thumb-remover"
  btnRemover.textContent="✕"
  btnRemover.onclick=(e)=>{e.stopPropagation();removerPastaJuntar(idx)}

  const icon=document.createElement("div")
  icon.className="pasta-thumb-icon"
  icon.textContent="📁"

  const nome=document.createElement("div")
  nome.className="pasta-thumb-nome"
  nome.textContent=normalizarRotuloVisualPortugues(nomePasta)

  const qtd=document.createElement("div")
  qtd.className="pasta-thumb-qtd"
  qtd.textContent=arqs.length+" doc"+(arqs.length>1?"s":"")

  const thumbsArea=document.createElement("div")
  thumbsArea.className="pasta-thumbs-expandida"
  thumbsArea.style.display=expandida ? "flex" : "none"
  thumbsArea.id="pasta-thumbs-exp-"+idx

  card.appendChild(btnRemover)
  card.appendChild(icon)
  card.appendChild(nome)
  card.appendChild(qtd)
  card.appendChild(thumbsArea)

  if(expandida){
    card.classList.add("expandida")
    renderizarArquivosDaPastaJuntarExpandida(idx, thumbsArea)
  }

  card.onclick=()=>{
    alternarPastaJuntarExpandida(idx)
  }

  row.appendChild(card)
}

async function renderizarArquivosDaPastaJuntarExpandida(idx, area){
  const pasta=pastasJuntar[idx]
  if(!pasta || !area) return
  area.innerHTML=""
  for(let i=0;i<pasta.arquivos.length;i++){
    try{
      const {card:thumb}=await criarThumbCard(pasta.arquivos[i])
      thumb.classList.add("thumb-card-pasta-expandida")
      thumb.addEventListener("click",(e)=>e.stopPropagation())
      const canvas=thumb.querySelector("canvas")
      if(canvas) canvas.classList.add("thumb-canvas-pasta-expandida")
      const badge=thumb.querySelector(".thumb-order-badge")
      if(badge) badge.textContent=String(i+1).padStart(2,"0")
      habilitarOrdenacaoArquivoNaPastaJuntar(thumb, idx, i)
      area.appendChild(thumb)
    }catch(e){}
  }
}

function alternarPastaJuntarExpandida(idx){
  const pasta=pastasJuntar[idx]
  if(!pasta) return
  pasta.expandida=!pasta.expandida
  rerenderPastasJuntar()
}

function reordenarArquivoNaPastaJuntar(pastaIdx, origemIdx, destinoIdx){
  const pasta=pastasJuntar[pastaIdx]
  if(!pasta) return
  if(origemIdx===destinoIdx) return
  if(origemIdx<0 || destinoIdx<0) return
  if(origemIdx>=pasta.arquivos.length || destinoIdx>=pasta.arquivos.length) return
  const [arquivo]=pasta.arquivos.splice(origemIdx,1)
  pasta.arquivos.splice(destinoIdx,0,arquivo)
  pasta.expandida=true
  rerenderPastasJuntar()
}

function habilitarOrdenacaoArquivoNaPastaJuntar(card, pastaIdx, arquivoIdx){
  card.draggable=true
  card.classList.add("thumb-card-sortable")
  card.setAttribute("aria-label","Arraste para reorganizar o PDF dentro da pasta")

  card.addEventListener("dragstart",(e)=>{
    pastaJuntarArquivoArrastandoInfo={pastaIdx, arquivoIdx}
    bloquearCliqueThumbAte=Date.now()+350
    card.classList.add("thumb-card-dragging")
    if(e.dataTransfer){
      e.dataTransfer.effectAllowed="move"
      e.dataTransfer.setData("text/plain", `${pastaIdx}:${arquivoIdx}`)
    }
  })

  card.addEventListener("dragend",()=>{
    pastaJuntarArquivoArrastandoInfo=null
    bloquearCliqueThumbAte=Date.now()+350
    card.classList.remove("thumb-card-dragging")
    document.querySelectorAll(".thumb-card-drop-target").forEach(el=>el.classList.remove("thumb-card-drop-target"))
  })

  card.addEventListener("dragover",(e)=>{
    if(!pastaJuntarArquivoArrastandoInfo) return
    if(pastaJuntarArquivoArrastandoInfo.pastaIdx!==pastaIdx) return
    if(pastaJuntarArquivoArrastandoInfo.arquivoIdx===arquivoIdx) return
    e.preventDefault()
    card.classList.add("thumb-card-drop-target")
    if(e.dataTransfer) e.dataTransfer.dropEffect="move"
  })

  card.addEventListener("dragleave",()=>{
    card.classList.remove("thumb-card-drop-target")
  })

  card.addEventListener("drop",(e)=>{
    if(!pastaJuntarArquivoArrastandoInfo) return
    if(pastaJuntarArquivoArrastandoInfo.pastaIdx!==pastaIdx) return
    if(pastaJuntarArquivoArrastandoInfo.arquivoIdx===arquivoIdx) return
    e.preventDefault()
    e.stopPropagation()
    card.classList.remove("thumb-card-drop-target")
    reordenarArquivoNaPastaJuntar(pastaIdx, pastaJuntarArquivoArrastandoInfo.arquivoIdx, arquivoIdx)
  })
}

function removerPastaJuntar(idx){
  pastasJuntar.splice(idx,1)
  document.getElementById("pastas-adicionadas").innerHTML=""
  for(let i=0;i<pastasJuntar.length;i++) renderizarPastaThumb(i)
  atualizarInfoJuntar()
}

// ===================== TOAST DE CARREGAMENTO =====================

let toastTimer=null

function obterToast(){
  let toast=document.getElementById("toast-loading")
  if(toast) return toast
  toast=document.createElement("div")
  toast.id="toast-loading"
  toast.setAttribute("role","status")
  toast.setAttribute("aria-live","polite")
  document.body.appendChild(toast)
  return toast
}

function calcularOffsetToast(){
  const barras=[...document.querySelectorAll(".fixed-bar")]
  let maiorAltura=0
  for(const barra of barras){
    const estilo=window.getComputedStyle(barra)
    if(estilo.display==="none" || estilo.visibility==="hidden" || Number(estilo.opacity)===0) continue
    const rect=barra.getBoundingClientRect()
    const estaNoViewport=rect.bottom>0 && rect.top<window.innerHeight
    if(rect.width<=0 || rect.height<=0 || !estaNoViewport) continue
    maiorAltura=Math.max(maiorAltura, rect.height)
  }
  const margemBase=18
  const folgaBarra=14
  return margemBase + (maiorAltura>0 ? maiorAltura + folgaBarra : 0)
}

function atualizarPosicaoToast(toast){
  if(!toast) return
  toast.style.bottom=`calc(${calcularOffsetToast()}px + env(safe-area-inset-bottom))`
}

function exibirToast({msg, tipo="loading", duracao=0, icone=""}){
  const toast=obterToast()
  atualizarPosicaoToast(toast)
  if(toastTimer) clearTimeout(toastTimer)
  toast.innerHTML=""
  toast.classList.remove("sucesso","aviso","erro","interativo")
  toast.classList.add("visivel")

  if(tipo==="loading"){
    const spinner=document.createElement("div")
    spinner.className="toast-spinner"
    toast.appendChild(spinner)
  }else if(icone){
    const iconEl=document.createElement("span")
    iconEl.className="toast-icon"
    iconEl.textContent=icone
    toast.appendChild(iconEl)
  }

  const texto=document.createElement("span")
  texto.textContent=msg
  toast.appendChild(texto)

  if(tipo==="sucesso" || tipo==="aviso" || tipo==="erro"){
    toast.classList.add(tipo)
  }

  if(duracao>0){
    toastTimer=setTimeout(()=>{
      toast.classList.remove("visivel","sucesso","aviso","erro","interativo")
      toast.innerHTML=""
    }, duracao)
  }
}

function mostrarLoading(msg){
  exibirToast({msg, tipo:"loading"})
}

function esconderLoading(){
  const toast=document.getElementById("toast-loading")
  if(!toast) return
  if(toastTimer) clearTimeout(toastTimer)
  toast.classList.remove("visivel","sucesso","aviso","erro","interativo")
  toast.innerHTML=""
}

function mostrarSucesso(msg){
  exibirToast({msg, tipo:"sucesso", duracao:2600, icone:"OK"})
}

function mostrarAviso(msg){
  exibirToast({msg, tipo:"aviso", duracao:3600, icone:"!"})
}

function mostrarErro(msg){
  exibirToast({msg, tipo:"erro", duracao:4200, icone:"X"})
}

function mostrarAvisoConfirmacaoPasta(){
  if(avisoConfirmacaoPastaExibido) return
  avisoConfirmacaoPastaExibido=true
  mostrarAviso("Ao carregar uma pasta, o navegador pode pedir confirmacao para liberar os arquivos. Isso faz parte da seguranca do browser.")
}

const LIMITE_PDFS_GRATUITO_POR_FERRAMENTA=35
const REGRAS_USO_GRATUITO_RECURSOS=Object.freeze({
  juntar_pdf:Object.freeze({
    nome:"Juntar PDF",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  }),
  compactar_pdf:Object.freeze({
    nome:"Compactar PDF",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  }),
  ocr:Object.freeze({
    nome:"OCR",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  }),
  pdf_word:Object.freeze({
    nome:"PDF para Word",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  }),
  tradutor_pdf:Object.freeze({
    nome:"Tradutor de PDF",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  }),
  word_pdf:Object.freeze({
    nome:"Word para PDF",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  }),
  excel_pdf:Object.freeze({
    nome:"Excel para PDF",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  }),
  excel_word:Object.freeze({
    nome:"Excel para Word",
    limitePorOperacao:LIMITE_PDFS_GRATUITO_POR_FERRAMENTA,
    unidadeSingular:"arquivo",
    unidadePlural:"arquivos"
  })
})
const CACHE_STATUS_PREMIUM_MS=60000
let cachePlanoAssinaturaAtual={plano:"gratuito", atualizadoEm:0}
let promessaPlanoAssinaturaAtual=null

function registrarUsoGratuitoRecurso(recurso, quantidade=1){
  return
}

async function obterPlanoAssinaturaAtual({forcar=false}={}){
  const agora=Date.now()
  if(!forcar && cachePlanoAssinaturaAtual.atualizadoEm>0 && (agora-cachePlanoAssinaturaAtual.atualizadoEm)<CACHE_STATUS_PREMIUM_MS){
    return cachePlanoAssinaturaAtual.plano
  }
  if(promessaPlanoAssinaturaAtual && !forcar){
    return await promessaPlanoAssinaturaAtual
  }

  promessaPlanoAssinaturaAtual=(async()=>{
    let plano="gratuito"
    try{
      const resposta=await fetch("api/auth/session", {
        method:"GET",
        credentials:"same-origin",
        headers:{"Accept":"application/json"}
      })
      if(resposta.ok){
        const dados=await resposta.json()
        const autenticado=Boolean(dados?.authenticated)
        const nivelAcesso=String(dados?.user?.accessLevel||"").trim().toLowerCase()
        const roleUsuario=String(dados?.user?.role||"").trim().toLowerCase()
        const statusAssinatura=String(dados?.subscription?.status||"").trim().toLowerCase()
        if(autenticado && (nivelAcesso==="administrador" || roleUsuario==="admin" || Boolean(dados?.user?.isAdmin))){
          plano="administrador"
        }else if(autenticado && (nivelAcesso==="premium" || statusAssinatura==="active" || Boolean(dados?.user?.isPremium))){
          plano="premium"
        }
      }
    }catch{
      plano="gratuito"
    }
    cachePlanoAssinaturaAtual={
      plano,
      atualizadoEm:Date.now()
    }
    return plano
  })()

  try{
    return await promessaPlanoAssinaturaAtual
  }finally{
    promessaPlanoAssinaturaAtual=null
  }
}

async function validarAcessoRecursoComPlano(recurso, quantidadeSolicitada=1, quantidadeAtual=0){
  const solicitado=Math.max(0, Number(quantidadeSolicitada||0))
  const atual=Math.max(0, Number(quantidadeAtual||0))
  const plano=await obterPlanoAssinaturaAtual()
  if(plano==="premium" || plano==="administrador"){
    return {
      permitido:true,
      premiumAtivo:true,
      quantidadePermitida:solicitado
    }
  }

  const regra=REGRAS_USO_GRATUITO_RECURSOS[recurso]
  if(!regra){
    return {
      permitido:true,
      premiumAtivo:false,
      quantidadePermitida:solicitado
    }
  }

  const limite=Math.max(1, Number(regra.limitePorOperacao||LIMITE_PDFS_GRATUITO_POR_FERRAMENTA))
  const restante=Math.max(limite-atual,0)
  const unidade=limite===1 ? regra.unidadeSingular : regra.unidadePlural
  const quantidadePermitida=Math.min(restante, solicitado)

  if(restante<=0){
    return {
      permitido:false,
      premiumAtivo:false,
      codigo:"limite_gratuito",
      quantidadePermitida:0,
      motivo:`No plano gratuito, ${regra.nome} aceita ate ${limite} ${unidade} por ferramenta. Para processar mais, assine o Premium.`
    }
  }

  if(solicitado>restante){
    const unidadeRestante=restante===1 ? regra.unidadeSingular : regra.unidadePlural
    return {
      permitido:true,
      premiumAtivo:false,
      codigo:"limite_gratuito_parcial",
      quantidadePermitida,
      motivo:`No plano gratuito, ${regra.nome} aceita ate ${limite} ${unidade} por ferramenta. Voce ainda pode adicionar ${restante} ${unidadeRestante} nesta ferramenta.`
    }
  }

  return {
    permitido:true,
    premiumAtivo:false,
    codigo:"ok",
    quantidadePermitida
  }
}

function mostrarCtaUpgradePremium(motivo){
  mostrarAvisoComAcao(
    motivo,
    "Ir para Premium",
    ()=>{ window.location.href="premium.html" }
  )
}

function mostrarAvisoComAcao(msg, textoAcao, onClick, duracao=9000){
  const toast=obterToast()
  atualizarPosicaoToast(toast)
  if(toastTimer) clearTimeout(toastTimer)
  toast.innerHTML=""
  toast.classList.remove("sucesso","aviso","erro","interativo")
  toast.classList.add("visivel","aviso","interativo")

  const iconEl=document.createElement("span")
  iconEl.className="toast-icon"
  iconEl.textContent="!"
  toast.appendChild(iconEl)

  const texto=document.createElement("span")
  texto.textContent=msg
  toast.appendChild(texto)

  const acao=document.createElement("button")
  acao.type="button"
  acao.className="toast-action-btn"
  acao.textContent=textoAcao
  acao.addEventListener("click",(event)=>{
    event.preventDefault()
    esconderLoading()
    if(typeof onClick==="function") onClick()
  })
  toast.appendChild(acao)

  if(duracao>0){
    toastTimer=setTimeout(()=>{
      toast.classList.remove("visivel","sucesso","aviso","erro","interativo")
      toast.innerHTML=""
    }, duracao)
  }
}

window.alert=(msg)=>mostrarAviso(String(msg??""))

function atualizarProgressoJuntarAntigo(percentual, titulo="", subtitulo=""){
  const card=document.getElementById("juntar-progress-card")
  const fill=document.getElementById("juntar-progress-fill")
  const label=document.getElementById("juntar-progress-label")
  const percent=document.getElementById("juntar-progress-percent")
  const sub=document.getElementById("juntar-progress-subtext")
  if(!card || !fill || !label || !percent || !sub) return
  card.style.display="block"
  const seguro=Math.max(0,Math.min(100,Math.round(percentual||0)))
  fill.style.width=seguro+"%"
  percent.textContent=seguro+"%"
  if(titulo) label.textContent=titulo
  if(subtitulo!==undefined) sub.textContent=subtitulo
}

function ocultarProgressoJuntarAntigo(){
  const card=document.getElementById("juntar-progress-card")
  const fill=document.getElementById("juntar-progress-fill")
  const label=document.getElementById("juntar-progress-label")
  const percent=document.getElementById("juntar-progress-percent")
  const sub=document.getElementById("juntar-progress-subtext")
  if(card) card.style.display="block"
  if(fill) fill.style.width="0%"
  if(label) label.textContent="Aguardando arquivos"
  if(percent) percent.textContent="0%"
  if(sub) sub.textContent="A barra de progresso aparece aqui durante a geração do PDF."
}
function garantirTelaProcesso(secaoId, telaId, config){
  if(document.getElementById(telaId)) return
  const secao=document.getElementById(secaoId)
  const barraFixa=secao?.querySelector(".fixed-bar")
  if(!secao || !barraFixa) return

  const tela=document.createElement("div")
  tela.id=telaId
  tela.className="process-screen"
  tela.style.display="none"
  tela.innerHTML=`
    <div class="process-screen-card">
      <button id="${telaId}-voltar" type="button" class="process-back-btn">Voltar</button>
      <div id="${telaId}-progress" class="process-progress-block">
        <span class="process-kicker">${config.kicker}</span>
        <h3 id="${telaId}-titulo" class="process-title">${config.tituloInicial}</h3>
        <p id="${telaId}-subtitulo" class="process-subtitle">${config.subtituloInicial}</p>
        <div class="progress-head progress-head-centered">
          <strong>Progresso</strong>
          <span id="${telaId}-percent">0%</span>
        </div>
        <div class="progress-track">
          <div id="${telaId}-fill" class="progress-fill"></div>
        </div>
      </div>
      <div id="${telaId}-resultado" class="process-result-block" style="display:none">
        <span class="process-kicker">${config.kickerResultado}</span>
        <h3 id="${telaId}-resultado-titulo" class="process-title">${config.tituloResultado}</h3>
        <p id="${telaId}-resultado-texto" class="process-subtitle">${config.textoResultado}</p>
        <button id="${telaId}-download" class="btn generate">${config.botaoResultado}</button>
      </div>
    </div>
  `

  secao.insertBefore(tela, barraFixa)
  const btnVoltar=tela.querySelector(`#${telaId}-voltar`)
  if(btnVoltar){
    btnVoltar.onclick=()=>fecharTelaProcesso(secaoId, telaId)
  }
}

function garantirTelasDeProcesso(){
  garantirTelaProcesso("unificador","juntar-processo",{
    kicker:"Processando arquivos",
    tituloInicial:"Preparando arquivos...",
    subtituloInicial:"Aguarde enquanto o PDF esta sendo gerado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Processamento concluido",
    textoResultado:"Seu arquivo ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("dividir-pdf","dividir-processo",{
    kicker:"Dividindo arquivo",
    tituloInicial:"Preparando divisão...",
    subtituloInicial:"Aguarde enquanto os arquivos sao separados.",
    kickerResultado:"Arquivos prontos",
    tituloResultado:"Divisao concluida",
    textoResultado:"Os arquivos gerados ja podem ser baixados.",
    botaoResultado:"Baixar arquivos"
  })

  garantirTelaProcesso("compactar-section","compactar-processo",{
    kicker:"Compactando arquivos",
    tituloInicial:"Preparando compactacao...",
    subtituloInicial:"Aguarde enquanto os PDFs sao processados.",
    kickerResultado:"Arquivos prontos",
    tituloResultado:"Compactacao concluida",
    textoResultado:"Os arquivos compactados ja podem ser baixados.",
    botaoResultado:"Baixar arquivos compactados"
  })

  garantirTelaProcesso("imagempdf-section","imagempdf-processo",{
    kicker:"Gerando PDF",
    tituloInicial:"Preparando imagens...",
    subtituloInicial:"Aguarde enquanto as imagens sao organizadas no PDF.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"PDF concluido",
    textoResultado:"Seu PDF ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("ocr-section","ocr-processo",{
    kicker:"Reconhecendo texto",
    tituloInicial:"Preparando OCR...",
    subtituloInicial:"Aguarde enquanto os PDFs sao analisados.",
    kickerResultado:"Arquivos prontos",
    tituloResultado:"OCR concluido",
    textoResultado:"Os arquivos pesquisaveis ja podem ser baixados.",
    botaoResultado:"Baixar arquivos OCR"
  })

  garantirTelaProcesso("converter-section","converter-processo",{
    kicker:"Convertendo PDF",
    tituloInicial:"Preparando conversao...",
    subtituloInicial:"Aguarde enquanto o Word e gerado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Conversao concluida",
    textoResultado:"Seu arquivo ja pode ser baixado.",
    botaoResultado:"Baixar Word"
  })

  garantirTelaProcesso("tradutor-section","tradutor-processo",{
    kicker:"Traduzindo PDF",
    tituloInicial:"Preparando traducao...",
    subtituloInicial:"Aguarde enquanto o conteudo e processado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Traducao concluida",
    textoResultado:"Seu PDF traduzido ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("wordpdf-section","wordpdf-processo",{
    kicker:"Convertendo documento",
    tituloInicial:"Preparando conversao...",
    subtituloInicial:"Aguarde enquanto o PDF e gerado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Conversao concluida",
    textoResultado:"Seu PDF ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("excelpdf-section","excelpdf-processo",{
    kicker:"Convertendo planilha",
    tituloInicial:"Preparando conversao...",
    subtituloInicial:"Aguarde enquanto o PDF e gerado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Conversao concluida",
    textoResultado:"Seu PDF ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("excelword-section","excelword-processo",{
    kicker:"Convertendo planilha",
    tituloInicial:"Preparando conversao...",
    subtituloInicial:"Aguarde enquanto o Word e gerado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Conversao concluida",
    textoResultado:"Seu arquivo ja pode ser baixado.",
    botaoResultado:"Baixar Word"
  })

  garantirTelaProcesso("reorganizar-section","reorganizar-processo",{
    kicker:"Reorganizando paginas",
    tituloInicial:"Preparando reorganizacao...",
    subtituloInicial:"Aguarde enquanto o PDF e atualizado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Reorganizacao concluida",
    textoResultado:"Seu PDF reorganizado ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("assinar-section","assinar-processo",{
    kicker:"Assinando documento",
    tituloInicial:"Preparando assinatura...",
    subtituloInicial:"Aguarde enquanto o PDF e assinado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Assinatura concluida",
    textoResultado:"Seu PDF assinado ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("edital-section","edital-processo",{
    kicker:"Analisando edital",
    tituloInicial:"Preparando analise...",
    subtituloInicial:"Aguarde enquanto o resumo e gerado.",
    kickerResultado:"Resumo pronto",
    tituloResultado:"Analise concluida",
    textoResultado:"Seu resumo ja esta pronto para download.",
    botaoResultado:"Baixar resumo"
  })

  garantirTelaProcesso("powerpoint-section","powerpoint-processo",{
    kicker:"Convertendo apresentacao",
    tituloInicial:"Preparando conversao...",
    subtituloInicial:"Aguarde enquanto o PDF e gerado.",
    kickerResultado:"Arquivo pronto",
    tituloResultado:"Conversao concluida",
    textoResultado:"Seu PDF ja pode ser baixado.",
    botaoResultado:"Baixar PDF"
  })

  garantirTelaProcesso("juntarpastas-section","juntarpastas-processo",{
    kicker:"Gerando PDFs",
    tituloInicial:"Preparando arquivos...",
    subtituloInicial:"Aguarde enquanto as pastas sao processadas.",
    kickerResultado:"Arquivos prontos",
    tituloResultado:"Processamento concluido",
    textoResultado:"Os PDFs gerados ja podem ser baixados.",
    botaoResultado:"Baixar arquivos"
  })
}

function mostrarTelaProcesso(secaoId, telaId){
  const secao=document.getElementById(secaoId)
  const tela=document.getElementById(telaId)
  if(!secao || !tela) return
  secao.classList.add("process-mode")
  tela.style.display="flex"
}

function fecharTelaProcesso(secaoId, telaId){
  const secao=document.getElementById(secaoId)
  const tela=document.getElementById(telaId)
  if(secao) secao.classList.remove("process-mode")
  if(tela) tela.style.display="none"
}

function ocultarTelaProcesso(secaoId, telaId, tituloPadrao, subtituloPadrao){
  const secao=document.getElementById(secaoId)
  const tela=document.getElementById(telaId)
  const fill=document.getElementById(`${telaId}-fill`)
  const percent=document.getElementById(`${telaId}-percent`)
  const titulo=document.getElementById(`${telaId}-titulo`)
  const subtitulo=document.getElementById(`${telaId}-subtitulo`)
  const progress=document.getElementById(`${telaId}-progress`)
  const resultado=document.getElementById(`${telaId}-resultado`)
  resetarAnimacaoTelaProcesso(telaId)
  if(secao) secao.classList.remove("process-mode")
  if(tela) tela.style.display="none"
  if(fill) fill.style.width="0%"
  if(percent) percent.textContent="0%"
  if(titulo) titulo.textContent=tituloPadrao
  if(subtitulo) subtitulo.textContent=subtituloPadrao
  if(progress) progress.style.display="block"
  if(resultado) resultado.style.display="none"
}

const estadosTelaProcesso={}

function esperar(ms){
  return new Promise(resolve=>setTimeout(resolve, ms))
}

function obterEstadoTelaProcesso(telaId){
  if(!estadosTelaProcesso[telaId]){
    estadosTelaProcesso[telaId]={
      atual: 0,
      alvo: 0,
      raf: null
    }
  }
  return estadosTelaProcesso[telaId]
}

function resetarAnimacaoTelaProcesso(telaId){
  const estado=estadosTelaProcesso[telaId]
  if(estado?.raf) cancelAnimationFrame(estado.raf)
  estadosTelaProcesso[telaId]={
    atual: 0,
    alvo: 0,
    raf: null
  }
}

function definirPercentualTelaProcesso(telaId, percentual, instantaneo=false){
  const fill=document.getElementById(`${telaId}-fill`)
  const percent=document.getElementById(`${telaId}-percent`)
  if(!fill || !percent) return Promise.resolve()

  const destino=Math.max(0,Math.min(100,Number(percentual)||0))
  const estado=obterEstadoTelaProcesso(telaId)

  if(estado.raf){
    cancelAnimationFrame(estado.raf)
    estado.raf=null
  }

  if(instantaneo){
    estado.atual=destino
    estado.alvo=destino
    fill.style.width=destino.toFixed(1)+"%"
    percent.textContent=Math.round(destino)+"%"
    return Promise.resolve()
  }

  const inicio=estado.atual
  const delta=destino-inicio
  if(Math.abs(delta)<0.2){
    estado.atual=destino
    estado.alvo=destino
    fill.style.width=destino.toFixed(1)+"%"
    percent.textContent=Math.round(destino)+"%"
    return Promise.resolve()
  }

  const duracao=Math.max(420, Math.min(950, Math.abs(delta)*18))
  estado.alvo=destino

  return new Promise(resolve=>{
    const inicioTempo=performance.now()
    const animar=(agora)=>{
      const progresso=Math.min(1,(agora-inicioTempo)/duracao)
      const eased=1-Math.pow(1-progresso,3)
      const valor=inicio+(delta*eased)
      estado.atual=valor
      fill.style.width=valor.toFixed(1)+"%"
      percent.textContent=Math.round(valor)+"%"
      if(progresso<1){
        estado.raf=requestAnimationFrame(animar)
      }else{
        estado.atual=destino
        estado.alvo=destino
        estado.raf=null
        fill.style.width=destino.toFixed(1)+"%"
        percent.textContent=Math.round(destino)+"%"
        resolve()
      }
    }
    estado.raf=requestAnimationFrame(animar)
  })
}

function atualizarTelaProcesso(secaoId, telaId, percentual, titulo="", subtitulo=""){
  mostrarTelaProcesso(secaoId, telaId)
  const progress=document.getElementById(`${telaId}-progress`)
  const resultado=document.getElementById(`${telaId}-resultado`)
  const label=document.getElementById(`${telaId}-titulo`)
  const sub=document.getElementById(`${telaId}-subtitulo`)
  if(!progress || !resultado || !label || !sub) return
  progress.style.display="block"
  resultado.style.display="none"
  const seguro=Math.max(0,Math.min(100,Math.round(percentual||0)))
  definirPercentualTelaProcesso(telaId, seguro)
  if(titulo) label.textContent=titulo
  if(subtitulo!==undefined) sub.textContent=subtitulo
}

async function finalizarTelaProcesso(secaoId, telaId, titulo, subtitulo, botaoTexto, onDownload){
  mostrarTelaProcesso(secaoId, telaId)
  const progress=document.getElementById(`${telaId}-progress`)
  const resultado=document.getElementById(`${telaId}-resultado`)
  const tituloEl=document.getElementById(`${telaId}-resultado-titulo`)
  const textoEl=document.getElementById(`${telaId}-resultado-texto`)
  const btn=document.getElementById(`${telaId}-download`)
  await definirPercentualTelaProcesso(telaId, 100)
  await esperar(320)
  if(progress) progress.style.display="none"
  if(resultado) resultado.style.display="flex"
  if(tituloEl) tituloEl.textContent=titulo
  if(textoEl) textoEl.textContent=subtitulo
  if(btn){
    btn.textContent=botaoTexto
    btn.onclick=onDownload || null
  }
}

async function concluirEtapaTelaProcesso(secaoId, telaId, titulo="", subtitulo="", tituloPadrao="", subtituloPadrao=""){
  atualizarTelaProcesso(secaoId, telaId, 100, titulo, subtitulo)
  await definirPercentualTelaProcesso(telaId, 100)
  await esperar(260)
  ocultarTelaProcesso(secaoId, telaId, tituloPadrao, subtituloPadrao)
}

function atualizarProgressoJuntar(percentual, titulo="", subtitulo=""){
  atualizarTelaProcesso("unificador","juntar-processo",percentual,titulo,subtitulo)
}

function ocultarProgressoJuntar(){
  ocultarTelaProcesso(
    "unificador",
    "juntar-processo",
    "Preparando arquivos...",
    "Aguarde enquanto o PDF esta sendo gerado."
  )
}

function atualizarProgressoDividir(percentual, titulo="", subtitulo=""){
  atualizarTelaProcesso("dividir-pdf","dividir-processo",percentual,titulo,subtitulo)
}

function ocultarProgressoDividir(){
  ocultarTelaProcesso(
    "dividir-pdf",
    "dividir-processo",
    "Preparando divisão...",
    "Aguarde enquanto os arquivos sao separados."
  )
}

function atualizarProgressoCompactar(percentual, titulo="", subtitulo=""){
  atualizarTelaProcesso("compactar-section","compactar-processo",percentual,titulo,subtitulo)
}

function ocultarProgressoCompactar(){
  ocultarTelaProcesso(
    "compactar-section",
    "compactar-processo",
    "Preparando compactacao...",
    "Aguarde enquanto os PDFs sao compactados."
  )
}

function atualizarProgressoImagemPDF(percentual, titulo="", subtitulo=""){
  atualizarTelaProcesso("imagempdf-section","imagempdf-processo",percentual,titulo,subtitulo)
}

function ocultarProgressoImagemPDF(){
  ocultarTelaProcesso(
    "imagempdf-section",
    "imagempdf-processo",
    "Preparando imagens...",
    "Aguarde enquanto as imagens sao organizadas no PDF."
  )
}

function atualizarProgressoOCR(percentual, titulo="", subtitulo=""){
  atualizarTelaProcesso("ocr-section","ocr-processo",percentual,titulo,subtitulo)
}

function configurarAcaoSecundariaTelaProcesso(telaId, texto="", onClick=null){
  const resultado=document.getElementById(`${telaId}-resultado`)
  if(!resultado) return

  let btn=document.getElementById(`${telaId}-secondary`)
  if(!texto){
    if(btn) btn.remove()
    return
  }

  if(!btn){
    btn=document.createElement("button")
    btn.id=`${telaId}-secondary`
    btn.type="button"
    btn.className="btn atalho"
    resultado.appendChild(btn)
  }

  btn.textContent=texto
  btn.onclick=typeof onClick==="function" ? onClick : null
}

function ocultarProgressoOCR(){
  ocultarTelaProcesso(
    "ocr-section",
    "ocr-processo",
    "Preparando OCR...",
    "Aguarde enquanto os PDFs sao analisados."
  )
  configurarAcaoSecundariaTelaProcesso("ocr-processo", "", null)
}

garantirTelasDeProcesso()

function carregarImagemEmMemoria(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file)
    const imagem=new Image()
    imagem.onload=()=>{
      URL.revokeObjectURL(url)
      resolve(imagem)
    }
    imagem.onerror=()=>{
      URL.revokeObjectURL(url)
      reject(new Error("Falha ao ler a imagem."))
    }
    imagem.src=url
  })
}

function arquivoEhImagemCompativel(file){
  if(!file) return false
  if(String(file.type || "").startsWith("image/")) return true
  return /\.(png|jpe?g|webp|bmp|gif)$/i.test(String(file.name || ""))
}

async function incorporarImagemArquivoNoPdf(pdfDoc, file){
  let img
  if(file.type==="image/png"){
    img=await pdfDoc.embedPng(await file.arrayBuffer())
  }else if(file.type==="image/jpeg" || file.type==="image/jpg"){
    img=await pdfDoc.embedJpg(await file.arrayBuffer())
  }else{
    const imagem=await carregarImagemEmMemoria(file)
    const canvas=document.createElement("canvas")
    canvas.width=imagem.naturalWidth || imagem.width
    canvas.height=imagem.naturalHeight || imagem.height
    const ctx=canvas.getContext("2d")
    if(!ctx){
      canvas.remove()
      throw new Error("Falha ao preparar a imagem.")
    }
    ctx.drawImage(imagem,0,0,canvas.width,canvas.height)
    const blob=await new Promise((resolve,reject)=>{
      canvas.toBlob((saida)=>saida ? resolve(saida) : reject(new Error("Falha ao converter a imagem.")), "image/png")
    })
    const bytesPng=await blob.arrayBuffer()
    img=await pdfDoc.embedPng(bytesPng)
    canvas.remove()
  }
  return {img, width:img.width, height:img.height}
}

async function imagemParaPDF(file){
  const novoPdf=await PDFLib.PDFDocument.create()
  const {img, width, height}=await incorporarImagemArquivoNoPdf(novoPdf, file)
  const page=novoPdf.addPage([width,height])
  page.drawImage(img,{x:0,y:0,width,height})
  const pdfBytes=await novoPdf.save()
  return new File([pdfBytes],file.name.replace(/\.[^.]+$/,"")+".pdf",{type:"application/pdf"})
}

document.getElementById("imagempdfInput")?.addEventListener("change", async(event)=>{
  const files=Array.from(event.target.files || [])
  if(files.length>0){
    await carregarFilesNoImagemPDF(files)
  }
  event.target.value=""
})

function limparPreviewsImagemPDF(){
  imagensPdfLista.forEach((item)=>{
    if(item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
  })
}

function obterNomeBaseImagemPDF(){
  const input=document.getElementById("imagempdfFileName")
  const valor=input?.value?.trim()
  if(valor) return normalizarNomeArquivoBase(valor, "imagens_unificadas")
  if(imagensPdfLista.length===1){
    return normalizarNomeArquivoBase(nomeBaseSemExtensao(imagensPdfLista[0].file.name), "imagem")
  }
  return "imagens_unificadas"
}

function atualizarInfoImagemPDF(){
  const contador=document.getElementById("imagempdf-counter")
  const info=document.getElementById("imagempdf-info")
  const total=imagensPdfLista.length
  const totalBytes=imagensPdfLista.reduce((soma,item)=>soma+Number(item?.file?.size || 0),0)

  if(contador){
    contador.textContent=total===0
      ? "Nenhuma imagem carregada"
      : `${total} imagem${total>1?"ns carregadas":" carregada"}`
  }

  if(info){
    info.textContent=total===0
      ? ""
      : `${total} ${total>1?"imagens":"imagem"} | Total ${formatarTamanhoArquivo(totalBytes)}`
  }
}

function sugerirNomeSaidaImagemPDF(){
  const input=document.getElementById("imagempdfFileName")
  if(!input || input.value.trim()) return
  input.value=obterNomeBaseImagemPDF()
}

function removerImagemPDF(itemId){
  const indice=imagensPdfLista.findIndex((item)=>item.id===itemId)
  if(indice<0) return
  const [removida]=imagensPdfLista.splice(indice,1)
  if(removida?.previewUrl) URL.revokeObjectURL(removida.previewUrl)
  resultadoImagemPdfBytes=null
  resultadoImagemPdfNome=""
  document.getElementById("resultado-imagempdf").style.display="none"
  renderizarGaleriaImagemPDF()
  atualizarInfoImagemPDF()
  if(imagensPdfLista.length===0){
    document.getElementById("imagempdfFileName").value=""
  }
}

function renderizarGaleriaImagemPDF(){
  const galeria=document.getElementById("imagempdf-gallery")
  if(!galeria) return
  galeria.innerHTML=""

  imagensPdfLista.forEach((item, indice)=>{
    const card=document.createElement("article")
    card.className="imagempdf-card"

    const ordem=document.createElement("span")
    ordem.className="imagempdf-order"
    ordem.textContent=String(indice+1).padStart(2,"0")

    const img=document.createElement("img")
    img.className="imagempdf-preview"
    img.src=item.previewUrl
    img.alt=item.file.name

    const nome=document.createElement("div")
    nome.className="imagempdf-name"
    nome.textContent=item.file.name

    const meta=document.createElement("div")
    meta.className="imagempdf-meta"
    meta.textContent=formatarTamanhoArquivo(item.file.size)

    const btnRemover=document.createElement("button")
    btnRemover.type="button"
    btnRemover.className="btn danger imagempdf-remove"
    btnRemover.textContent="Remover"
    btnRemover.onclick=()=>removerImagemPDF(item.id)

    card.appendChild(ordem)
    card.appendChild(img)
    card.appendChild(nome)
    card.appendChild(meta)
    card.appendChild(btnRemover)
    galeria.appendChild(card)
  })
}

async function carregarFilesNoImagemPDF(files){
  const validos=(Array.isArray(files) ? files : [])
    .filter(arquivoEhImagemCompativel)
    .map((file)=>({
      id:`imgpdf-${++imagemPdfItemSeq}`,
      file,
      previewUrl:URL.createObjectURL(file)
    }))

  if(validos.length===0){
    mostrarAviso("Selecione imagens validas para gerar o PDF.")
    return
  }

  imagensPdfLista.push(...validos)
  resultadoImagemPdfBytes=null
  resultadoImagemPdfNome=""
  document.getElementById("resultado-imagempdf").style.display="none"
  document.getElementById("imagempdf-status").textContent=""
  renderizarGaleriaImagemPDF()
  atualizarInfoImagemPDF()
  sugerirNomeSaidaImagemPDF()
}

function limparImagemPDF(){
  limparPreviewsImagemPDF()
  imagensPdfLista=[]
  resultadoImagemPdfBytes=null
  resultadoImagemPdfNome=""
  document.getElementById("imagempdfInput").value=""
  document.getElementById("imagempdfFileName").value=""
  document.getElementById("imagempdf-gallery").innerHTML=""
  document.getElementById("imagempdf-status").textContent=""
  document.getElementById("imagempdf-info").textContent=""
  document.getElementById("resultado-imagempdf").style.display="none"
  atualizarInfoImagemPDF()
  ocultarProgressoImagemPDF()
}

async function converterImagensParaPDF(){
  if(imagensPdfLista.length===0){
    alert("Selecione pelo menos uma imagem.")
    return
  }

  garantirTelasDeProcesso()
  const usaTelaProcesso=Boolean(document.getElementById("imagempdf-processo"))
  const status=document.getElementById("imagempdf-status")
  const total=imagensPdfLista.length
  const nomeFinal=normalizarNomeSaidaPdf(obterNomeBaseImagemPDF(), "imagens_unificadas")

  document.getElementById("resultado-imagempdf").style.display="none"
  status.textContent="Preparando imagens para gerar o PDF..."

  try{
    if(usaTelaProcesso){
      atualizarProgressoImagemPDF(6, "Preparando imagens...", `${total} ${total>1?"imagens":"imagem"} na fila para conversao.`)
    }

    const pdf=await PDFLib.PDFDocument.create()

    for(let i=0;i<imagensPdfLista.length;i++){
      const item=imagensPdfLista[i]
      const percentual=10+((i/Math.max(total,1))*82)
      const nomeVisual=normalizarRotuloVisualPortugues(item.file.name)
      status.textContent=`Convertendo ${nomeVisual} (${i+1} de ${total})...`
      if(usaTelaProcesso){
        atualizarProgressoImagemPDF(percentual, `Convertendo imagem ${i+1} de ${total}`, nomeVisual)
      }

      const {img, width, height}=await incorporarImagemArquivoNoPdf(pdf, item.file)
      const page=pdf.addPage([width,height])
      page.drawImage(img,{x:0,y:0,width,height})
    }

    if(usaTelaProcesso){
      atualizarProgressoImagemPDF(96, "Finalizando PDF...", "Montando o arquivo final para download.")
    }

    resultadoImagemPdfBytes=await pdf.save()
    resultadoImagemPdfNome=nomeFinal
    document.getElementById("resultado-imagempdf").style.display="block"
    renderizarEncadeamentoResultado("resultado-imagempdf","imagempdf",[
      {bytes:resultadoImagemPdfBytes, nome:resultadoImagemPdfNome}
    ])
    document.getElementById("imagempdf-info").textContent=`${total} ${total>1?"imagens convertidas":"imagem convertida"} em PDF.`
    status.textContent="PDF gerado com sucesso."

    if(usaTelaProcesso){
      await concluirEtapaTelaProcesso(
        "imagempdf-section",
        "imagempdf-processo",
        "PDF gerado",
        "Abrindo o resultado final...",
        "Preparando imagens...",
        "Aguarde enquanto as imagens sao organizadas no PDF."
      )
    }

    await iniciarDownloadAutomatico(baixarResultadoImagemPDF, "Download do PDF iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    status.textContent="Falha ao gerar o PDF a partir das imagens."
    if(usaTelaProcesso) ocultarProgressoImagemPDF()
    mostrarErro("Nao foi possivel gerar o PDF com essas imagens. Tente novamente com arquivos PNG, JPG ou WEBP.")
  }
}

function baixarResultadoImagemPDF(){
  if(!resultadoImagemPdfBytes) return
  baixarArquivo(resultadoImagemPdfBytes, resultadoImagemPdfNome || "imagens_unificadas.pdf")
}

async function carregarFilesNoJuntar(files){
  let novos=Array.isArray(files) ? files.filter(Boolean) : []
  if(novos.length===0) return

  const totalAtual=arquivos.length+pastasJuntar.reduce((soma,pasta)=>soma+Number(pasta?.arquivos?.length||0),0)
  const acessoJuntar=await validarAcessoRecursoComPlano("juntar_pdf", novos.length, totalAtual)
  if(!acessoJuntar.permitido){
    mostrarCtaUpgradePremium(acessoJuntar.motivo)
    return
  }
  if(acessoJuntar.quantidadePermitida<novos.length){
    novos=novos.slice(0, acessoJuntar.quantidadePermitida)
    if(acessoJuntar.motivo) mostrarCtaUpgradePremium(acessoJuntar.motivo)
  }
  if(novos.length===0) return

  mostrarLoading("Carregando "+novos.length+" arquivo"+(novos.length>1?"s":"")+"...")
  for(let file of novos){
    let fileFinal=file
    if(file.type!=="application/pdf"){
      mostrarLoading("Convertendo imagem: "+file.name+"...")
      try{ fileFinal=await imagemParaPDF(file) }
      catch(e){ esconderLoading(); mostrarErro("Nao foi possivel converter: "+file.name); continue }
    }
    arquivos.push(fileFinal)
  }
  await renderizarArquivosJuntar()
  esconderLoading()
  mostrarSucesso(novos.length+" arquivo"+(novos.length>1?"s carregados":"carregado")+"!")
  atualizarInfoJuntar()
}

function atualizarInfoJuntar(){
  const ta=arquivos.length
  const tp=pastasJuntar.length
  sugerirNomeSaidaJuntar()
  let info=""
  if(tp>0) info+=tp+" pasta"+(tp>1?"s":"")
  if(ta>0) info+=(info?" + ":"")+ta+" arquivo"+(ta>1?"s":"")
  document.getElementById("file-counter").textContent=info||"Nenhum arquivo carregado"
  document.getElementById("juntar-info").textContent=ta>1 ? info+" | Arraste as miniaturas para reorganizar" : info
  const btn=document.getElementById("actionBtn")
  btn.disabled=ta===0 && tp===0
  if(tp>0){
    btn.textContent=tp>1?"GERAR "+tp+" PDFs (1 por pasta)":"GERAR PDF DA PASTA"
  }else{
    btn.textContent="CONSOLIDAR PDF"
  }
}

function limparJuntar(){
  arquivos=[]
  pastasJuntar=[]
  resultadoJuntarBytes=null
  resultadoJuntarNome=""
  resultadosPastasJuntar=[]
  gallery.innerHTML=""
  document.getElementById("pastas-adicionadas").innerHTML=""
  document.getElementById("file-counter").textContent="Nenhum arquivo carregado"
  document.getElementById("juntar-info").textContent=""
  document.getElementById("resultado-pastas").style.display="none"
  document.getElementById("resultado-pastas-btns").innerHTML=""
  const nomeInput=document.getElementById("finalFileName")
  if(nomeInput) nomeInput.value=""
  ocultarProgressoJuntar()
  atualizarInfoJuntar()
}

document.getElementById("actionBtn").addEventListener("click",async()=>{
  if(arquivos.length===0 && pastasJuntar.length===0){
    alert("Selecione pelo menos um arquivo ou pasta")
    return
  }

  const totalArquivosJuntar=arquivos.length+pastasJuntar.reduce((soma,pasta)=>soma+Number(pasta?.arquivos?.length||0),0)
  const acessoJuntar=await validarAcessoRecursoComPlano("juntar_pdf", totalArquivosJuntar)
  if(!acessoJuntar.permitido || acessoJuntar.quantidadePermitida<totalArquivosJuntar){
    mostrarCtaUpgradePremium(acessoJuntar.motivo || "No plano gratuito, esta ferramenta aceita ate 35 PDFs.")
    return
  }

  try{
    if(pastasJuntar.length>0){
      await gerarPDFsPorPasta()
    }else{
      await gerarPDFAvulsos()
    }
  }catch(e){
    console.error(e)
    ocultarProgressoJuntar()
    mostrarErro("Não foi possível concluir o processamento dos arquivos.")
  }
})

async function gerarPDFAvulsos(){
  document.getElementById("resultado-juntar").style.display="none"
  atualizarProgressoJuntar(6,"Consolidando PDFs","Preparando arquivos e conferindo a ordem...")
  document.getElementById("juntar-info").textContent="Consolidando PDFs..."

  const mergedPdf=await PDFLib.PDFDocument.create()
  const totalArquivos=arquivos.length

  for(let i=0;i<totalArquivos;i++){
    const file=arquivos[i]
    const nomeArquivoExibicao=normalizarRotuloVisualPortugues(file.name)
    atualizarProgressoJuntar(12+((i/Math.max(totalArquivos,1))*66),"Consolidando PDFs",`Lendo ${i+1} de ${totalArquivos}: ${nomeArquivoExibicao}`)
    const bytes=await file.arrayBuffer()
    const pdf=await carregarPdfPreservandoAssinaturaVisual(bytes)
    const ordemPaginas=obterOrdemPaginasArquivo(file, pdf.getPageCount())
    const pages=await mergedPdf.copyPages(pdf,ordemPaginas)
    pages.forEach(p=>mergedPdf.addPage(p))
    atualizarProgressoJuntar(18+(((i+1)/Math.max(totalArquivos,1))*66),"Consolidando PDFs",`Arquivo ${i+1} de ${totalArquivos} incorporado ao PDF final.`)
  }

  atualizarProgressoJuntar(92,"Finalizando PDF","Salvando e preparando o download...")
  resultadoJuntarBytes=await mergedPdf.save()
  resultadoJuntarNome=normalizarNomeSaidaPdf(obterNomeBaseSaidaJuntar("arquivo_unificado"), "arquivo_unificado")
  const pdfFinal=await PDFLib.PDFDocument.load(resultadoJuntarBytes)
  const totalPags=pdfFinal.getPageCount()
  document.getElementById("juntar-info").textContent=arquivos.length+" arquivo(s) consolidados em "+totalPags+" páginas"
  await finalizarTelaProcesso(
    "unificador",
    "juntar-processo",
    "PDF concluído",
    resultadoJuntarNome+" pronto para download.",
    "Baixar PDF",
    baixarResultadoJuntar
  )
  renderizarEncadeamentoResultado("juntar-processo-resultado","juntar",[
    {bytes:resultadoJuntarBytes, nome:resultadoJuntarNome}
  ], {ocultarDestinos:["juntar"]})
  await iniciarDownloadAutomatico(baixarResultadoJuntar, "Download do PDF consolidado iniciado automaticamente.")
}

async function gerarPDFsPorPasta(){
  resultadosPastasJuntar=[]

  const todasPastas=[...pastasJuntar]
  if(arquivos.length>0){
    const nomeAvulso=obterNomeBaseSaidaJuntar("Arquivos_Avulsos")
    todasPastas.push({nomePasta:nomeAvulso,arquivos})
  }

  for(let i=0;i<todasPastas.length;i++){
    const {nomePasta,arquivos:arqs}=todasPastas[i]
    const nomePastaExibicao=normalizarRotuloVisualPortugues(nomePasta)
    atualizarProgressoJuntar(8+((i/Math.max(todasPastas.length,1))*72),"Gerando PDFs por pasta",`Pasta ${i+1} de ${todasPastas.length}: ${nomePastaExibicao}`)
    document.getElementById("juntar-info").textContent="Gerando: "+nomePastaExibicao+" ("+(i+1)+"/"+todasPastas.length+")..."
    const mergedPdf=await PDFLib.PDFDocument.create()
    const ordenados=[...arqs]
    for(let j=0;j<ordenados.length;j++){
      const file=ordenados[j]
      try{
        const nomeArquivoExibicao=normalizarRotuloVisualPortugues(file.name)
        atualizarProgressoJuntar((((i)+(j+1)/Math.max(ordenados.length,1))/Math.max(todasPastas.length,1))*100,"Gerando PDFs por pasta",`Pasta ${i+1}/${todasPastas.length} · arquivo ${j+1}/${ordenados.length}: ${nomeArquivoExibicao}`)
        let f=file
        if(file.type!=="application/pdf") f=await imagemParaPDF(file)
        const bytes=await f.arrayBuffer()
        const pdf=await carregarPdfPreservandoAssinaturaVisual(bytes)
        const ordemPaginas=obterOrdemPaginasArquivo(file, pdf.getPageCount())
        const pages=await mergedPdf.copyPages(pdf,ordemPaginas)
        pages.forEach(p=>mergedPdf.addPage(p))
      }catch(e){ console.warn("Erro:",file.name,e) }
    }
    const pdfBytes=await mergedPdf.save()
    const nomeFinal=normalizarNomeSaidaPdf(nomePasta, "pasta_"+(i+1))
    resultadosPastasJuntar.push({nome:nomeFinal,bytes:pdfBytes})
  }


  atualizarProgressoJuntar(92,"Finalizando arquivos","Empacotando os PDFs gerados para download...")
  document.getElementById("juntar-info").textContent=todasPastas.length+" PDF"+(todasPastas.length>1?"s gerados":"gerado")+"!"
  if(resultadosPastasJuntar.length===1){
    await finalizarTelaProcesso(
      "unificador",
      "juntar-processo",
      "PDF concluído",
      resultadosPastasJuntar[0].nome+" pronto para download.",
      "Baixar PDF",
      ()=>baixarArquivo(resultadosPastasJuntar[0].bytes,resultadosPastasJuntar[0].nome)
    )
    renderizarEncadeamentoResultado("juntar-processo-resultado","juntar-pastas",resultadosPastasJuntar,{ocultarDestinos:["juntar"]})
    return
  }

  await finalizarTelaProcesso(
    "unificador",
    "juntar-processo",
    "Arquivos concluídos",
    resultadosPastasJuntar.length+" PDFs prontos para download em ZIP.",
    "Baixar arquivos",
    baixarTudoZipado
  )
  renderizarEncadeamentoResultado("juntar-processo-resultado","juntar-pastas",resultadosPastasJuntar,{ocultarDestinos:["juntar"]})
  await iniciarDownloadAutomatico(
    baixarResultadosPastasAutomaticamente,
    resultadosPastasJuntar.length>1
      ? "Download do ZIP iniciado automaticamente."
      : "Download do PDF iniciado automaticamente."
  )
}

async function baixarResultadosPastasAutomaticamente(){
  if(resultadosPastasJuntar.length===1){
    baixarArquivo(resultadosPastasJuntar[0].bytes,resultadosPastasJuntar[0].nome)
    return
  }

  if(resultadosPastasJuntar.length>1){
    await baixarTudoZipado()
  }
}

async function baixarTudoZipado(){
  const JSZip=await carregarJSZip()
  const zip=new JSZip()
  for(let item of resultadosPastasJuntar) zip.file(item.nome,item.bytes)
  const blob=await zip.generateAsync({type:"blob"})
  baixarBlob(blob, "PDFs_Consolidados.zip")
}

function baixarResultadoJuntar(){
  if(!resultadoJuntarBytes) return
  baixarArquivo(resultadoJuntarBytes,resultadoJuntarNome)
}

function enviarResultadoParaDividir(){
  if(!resultadoJuntarBytes) return
  const file=bytesParaFile(resultadoJuntarBytes,resultadoJuntarNome)
  limparJuntar(); abrirDividir(file)
}

function enviarResultadoParaCompactar(){
  if(!resultadoJuntarBytes) return
  const file=bytesParaFile(resultadoJuntarBytes,resultadoJuntarNome)
  limparJuntar(); abrirCompactar([file])
}

function enviarResultadoParaOCR(){
  if(!resultadoJuntarBytes) return
  const file=bytesParaFile(resultadoJuntarBytes,resultadoJuntarNome)
  limparJuntar(); abrirOCR(file)
}


// ===================== DIVIDIR PDF =====================

// ===================== DIVIDIR PDF =====================

function mostrarInputDivisao(modo){
  const sizeDisponivel=!document.querySelector('input[name="splitMode"][value="size"]')?.disabled
  document.getElementById("input-pages").style.display = modo==="pages" ? "block" : "none"
  document.getElementById("input-size").style.display  = modo==="size" && sizeDisponivel ? "block" : "none"
}

let splitFileRef=null

document.getElementById("splitFileInput").addEventListener("change",async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarFileNoDividir(file)
})

async function carregarFileNoDividir(file){
  splitFileRef=file
  resultadosDividirList=[]
  document.getElementById("resultado-dividir").style.display="none"
  ocultarProgressoDividir()

  const splitGallery=document.getElementById("split-gallery")
  splitGallery.innerHTML=""

  const {card, totalPaginas}=await criarThumbCard(file)
  splitGallery.appendChild(card)

  document.getElementById("dividir-info").textContent="1 arquivo | "+totalPaginas+" páginas | Clique na miniatura para ver páginas"
}

function limparDividir(){
  splitFileRef=null
  resultadosDividirList=[]
  document.getElementById("split-gallery").innerHTML=""
  document.getElementById("dividir-info").textContent=""
  document.getElementById("splitFileInput").value=""
  document.getElementById("resultado-dividir").style.display="none"
  // Resetar modo de divisão
  document.querySelectorAll('input[name="splitMode"]').forEach(r=>r.checked=false)
  document.getElementById("input-pages").style.display="none"
  document.getElementById("input-size").style.display="none"
  document.getElementById("pagesPerFile").value=""
  document.getElementById("sizePerFile").value=""
  ocultarProgressoDividir()
}

async function dividirPDF(){
  if(!splitFileRef){
    alert("Selecione um PDF primeiro")
    return
  }

  const modoSelecionado=document.querySelector('input[name="splitMode"]:checked')
  if(!modoSelecionado){
    alert("Selecione um modo de divisão antes de continuar.")
    return
  }

  resultadosDividirList=[]
  document.getElementById("resultado-dividir").style.display="none"
  try{
    const file=splitFileRef
    const bytes=await file.arrayBuffer()
    let pdf=await carregarPdfPreservandoAssinaturaVisual(bytes)
    pdf=await recriarPdfComOrdemAplicada(pdf, file)
    const totalPaginas=pdf.getPageCount()
    const modo=modoSelecionado.value

    if(modo==="size"){
      alert("A divisão por tamanho está planejada para uma próxima atualização.")
      return
    }

    atualizarProgressoDividir(8,"Preparando divisão","Lendo o arquivo selecionado e validando as páginas...")
    document.getElementById("dividir-info").textContent="Dividindo PDF..."

  // DIVIDIR POR QUANTIDADE DE PAGINAS
  if(modo==="pages"){
    const qtd=parseInt(document.getElementById("pagesPerFile").value)
    if(!qtd || qtd<=0){
      ocultarProgressoDividir()
      alert("Digite a quantidade de páginas")
      return
    }
    let contador=1
    for(let i=0;i<totalPaginas;i+=qtd){
      atualizarProgressoDividir(
        (Math.min(i+qtd,totalPaginas)/Math.max(totalPaginas,1))*84,
        "Separando páginas",
        `Bloco ${contador} em preparacao...`
      )
      const novoPdf=await PDFLib.PDFDocument.create()
      const paginas=[]
      for(let j=i;j<i+qtd && j<totalPaginas;j++) paginas.push(j)
      const copied=await novoPdf.copyPages(pdf,paginas)
      copied.forEach(p=>novoPdf.addPage(p))
      const pdfBytes=await novoPdf.save()
      resultadosDividirList.push({bytes:pdfBytes, nome:"parte_"+contador+".pdf"})
      contador++
    }
  }

  // PAGINAS IMPARES
  if(modo==="odd"){
    const novoPdf=await PDFLib.PDFDocument.create()
    const paginas=[]
    for(let i=0;i<totalPaginas;i++){
      if((i+1)%2!==0) paginas.push(i)
      atualizarProgressoDividir(
        ((i+1)/Math.max(totalPaginas,1))*84,
        "Separando páginas ímpares",
        `Analisando página ${i+1} de ${totalPaginas}...`
      )
    }
    const copied=await novoPdf.copyPages(pdf,paginas)
    copied.forEach(p=>novoPdf.addPage(p))
    const pdfBytes=await novoPdf.save()
    resultadosDividirList.push({bytes:pdfBytes, nome:"paginas_impares.pdf"})
  }

  // PAGINAS PARES
  if(modo==="even"){
    const novoPdf=await PDFLib.PDFDocument.create()
    const paginas=[]
    for(let i=0;i<totalPaginas;i++){
      if((i+1)%2===0) paginas.push(i)
      atualizarProgressoDividir(
        ((i+1)/Math.max(totalPaginas,1))*84,
        "Separando páginas pares",
        `Analisando página ${i+1} de ${totalPaginas}...`
      )
    }
    const copied=await novoPdf.copyPages(pdf,paginas)
    copied.forEach(p=>novoPdf.addPage(p))
    const pdfBytes=await novoPdf.save()
    resultadosDividirList.push({bytes:pdfBytes, nome:"paginas_pares.pdf"})
  }

    atualizarProgressoDividir(92,"Finalizando divisão","Organizando os arquivos gerados para download...")
    document.getElementById("dividir-info").textContent="Divisão concluída: "+resultadosDividirList.length+" arquivo(s) gerado(s)"
    await finalizarTelaProcesso(
      "dividir-pdf",
      "dividir-processo",
      "Divisao concluida",
      resultadosDividirList.length+" arquivo(s) pronto(s) para download.",
      resultadosDividirList.length>1 ? "Baixar arquivos" : "Baixar arquivo",
      baixarResultadosDividir
    )
    renderizarEncadeamentoResultado("dividir-processo-resultado","dividir",resultadosDividirList,{ocultarDestinos:["dividir"]})
    await iniciarDownloadAutomatico(
      baixarResultadosDividir,
      resultadosDividirList.length>1
        ? "Download do ZIP com as partes iniciado automaticamente."
        : "Download do PDF dividido iniciado automaticamente."
    )
  }catch(e){
    console.error(e)
    ocultarProgressoDividir()
    mostrarErro("Não foi possível dividir o arquivo.")
  }
}

async function baixarResultadosDividir(){
  await baixarColecaoResultados(resultadosDividirList, "PDFs_Divididos.zip")
}

function enviarPartsParaCompactar(){
  if(resultadosDividirList.length===0) return
  const files=resultadosDividirList.map(item=>bytesParaFile(item.bytes, item.nome))
  limparDividir()
  abrirCompactar(files)
}

function enviarPartsParaJuntar(){
  if(resultadosDividirList.length===0) return
  const files=resultadosDividirList.map(item=>bytesParaFile(item.bytes, item.nome))
  limparDividir()
  abrirUnificador(files)
}


// ===================== OCR =====================

let ocrTextoGlobal=""
let ocrFiles=[]
let ocrResultados=[]
let ocrWorkerRef=null
let ocrWorkerStatusHook=null

document.getElementById("ocrInput").addEventListener("change",async(e)=>{
  const files=Array.from(e.target.files||[])
  if(!files.length) return
  await carregarFilesNoOCR(files)
  e.target.value=""
})

async function carregarFilesNoOCR(files){
  const validos=files.filter(f=>f && (f.type==="application/pdf" || /\.pdf$/i.test(f.name)))
  if(validos.length===0){
    alert("Selecione PDF(s) válido(s).")
    return
  }

  const existentes=new Set(ocrFiles.map(f=>`${f.name}_${f.size}_${f.lastModified}`))
  let novos=validos.filter(f=>!existentes.has(`${f.name}_${f.size}_${f.lastModified}`))
  if(novos.length===0) return

  const acessoOCR=await validarAcessoRecursoComPlano("ocr", novos.length, ocrFiles.length)
  if(!acessoOCR.permitido){
    mostrarCtaUpgradePremium(acessoOCR.motivo)
    return
  }
  if(acessoOCR.quantidadePermitida<novos.length){
    novos=novos.slice(0, acessoOCR.quantidadePermitida)
    if(acessoOCR.motivo) mostrarCtaUpgradePremium(acessoOCR.motivo)
  }

  ocrFiles.push(...novos)
  ocrTextoGlobal=""
  ocrResultados=[]
  document.getElementById("ocr-resultado-box").style.display="none"
  document.getElementById("ocr-status").textContent=""

  const gallery=document.getElementById("ocr-gallery")
  for(const file of novos){
    try{
      const {card}=await criarThumbCard(file)
      gallery.appendChild(card)
    }catch{
      const div=document.createElement("div")
      div.className="thumb-card"
      div.innerHTML=`<div class="thumb-header"><strong>${file.name}</strong></div><div class="thumb-meta">PDF</div>`
      gallery.appendChild(div)
    }
  }

  const totalArquivos=ocrFiles.length
  document.getElementById("ocr-info").textContent=`${totalArquivos} arquivo(s) pronto(s) para OCR`
}

function limparOCR(){
  ocrTextoGlobal=""
  ocrFiles=[]
  ocrResultados=[]
  ocrWorkerStatusHook=null
  ocultarProgressoOCR()
  document.getElementById("ocr-gallery").innerHTML=""
  document.getElementById("ocr-status").textContent=""
  document.getElementById("ocr-resultado-box").style.display="none"
  document.getElementById("ocr-info").textContent=""
  document.getElementById("ocrInput").value=""
}

async function obterOCRWorker(statusEl, onStatusUpdate=null){
  ocrWorkerStatusHook=typeof onStatusUpdate==="function" ? onStatusUpdate : null
  if(ocrWorkerRef) return ocrWorkerRef
  if(!window.Tesseract) throw new Error("Tesseract não carregado.")
  statusEl.textContent="Carregando motor OCR..."
  if(ocrWorkerStatusHook) ocrWorkerStatusHook("Carregando motor OCR...")
  ocrWorkerRef=await Tesseract.createWorker('por', 1, {
    logger: (m)=>{
      if(m.status==='recognizing text' && Number.isFinite(m.progress)){
        const mensagem=`OCR em andamento... ${Math.round(m.progress*100)}%`
        statusEl.textContent=mensagem
        if(ocrWorkerStatusHook) ocrWorkerStatusHook(mensagem, m)
      }
    }
  })
  try{
    await ocrWorkerRef.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1'
    })
  }catch{}
  return ocrWorkerRef
}

function nomePdfOCR(nome){
  return nome.replace(/\.pdf$/i,'') + '_OCR.pdf'
}

async function reconhecerTexto(){
  if(ocrFiles.length===0){
    alert("Selecione ao menos um PDF primeiro")
    return
  }

  const acessoOCR=await validarAcessoRecursoComPlano("ocr", ocrFiles.length)
  if(!acessoOCR.permitido){
    mostrarCtaUpgradePremium(acessoOCR.motivo)
    return
  }
  if(acessoOCR.quantidadePermitida<ocrFiles.length){
    mostrarCtaUpgradePremium(acessoOCR.motivo)
    return
  }
  const arquivosParaProcessar=[...ocrFiles]

  garantirTelasDeProcesso()
  const status=document.getElementById("ocr-status")
  const resultadoBox=document.getElementById("ocr-resultado-box")
  const usarTelaProcesso=Boolean(document.getElementById("ocr-processo"))
  status.textContent="Preparando OCR..."
  resultadoBox.style.display="none"
  ocrTextoGlobal=""
  ocrResultados=[]
  configurarAcaoSecundariaTelaProcesso("ocr-processo", "", null)

  let progressoOcrPagina=null
  const totalArquivos=Math.max(arquivosParaProcessar.length,1)
  const atualizarStatusOCR=(percentual, mensagem, titulo="Reconhecendo texto")=>{
    status.textContent=mensagem
    if(usarTelaProcesso){
      atualizarProgressoOCR(percentual, titulo, mensagem)
    }
  }

  if(usarTelaProcesso){
    atualizarProgressoOCR(4,"Preparando OCR","Validando arquivos selecionados...")
    document.getElementById("ocr-processo")?.scrollIntoView({behavior:"smooth", block:"start"})
  }

  try{
    const worker=await obterOCRWorker(status, (mensagem, meta)=>{
      if(!usarTelaProcesso) return
      if(meta?.status==="recognizing text" && progressoOcrPagina){
        const progressoInterno=Math.max(0,Math.min(1,Number(meta.progress)||0))
        const percentualAtual=progressoOcrPagina.inicio + ((progressoOcrPagina.fim-progressoOcrPagina.inicio)*progressoInterno)
        atualizarProgressoOCR(percentualAtual,"Reconhecendo texto",`${progressoOcrPagina.rotulo} | ${Math.round(progressoInterno*100)}%`)
        return
      }
      atualizarProgressoOCR(6,"Preparando OCR",mensagem)
    })
    const canvas=document.createElement('canvas')
    const ctx=canvas.getContext('2d', { willReadFrequently: true })

    for(let fileIndex=0; fileIndex<arquivosParaProcessar.length; fileIndex++){
      const file=arquivosParaProcessar[fileIndex]
      const nomeArquivo=normalizarRotuloVisualPortugues(file.name)
      const progressoInicioArquivo=8+((fileIndex/totalArquivos)*80)
      const progressoFimArquivo=8+(((fileIndex+1)/totalArquivos)*80)
      atualizarStatusOCR(progressoInicioArquivo,`Abrindo ${nomeArquivo} (${fileIndex+1}/${arquivosParaProcessar.length})...`,"Preparando OCR")

      const sourceBytes=new Uint8Array(await file.arrayBuffer())
      const pdfjsDoc=await pdfjsLib.getDocument({data:sourceBytes}).promise
      const sourcePdfLib=await PDFLib.PDFDocument.load(sourceBytes)
      const outputPdf=await PDFLib.PDFDocument.create()
      const outputFont=await outputPdf.embedFont(PDFLib.StandardFonts.Helvetica)
      let textoArquivo=''

      for(let i=1;i<=pdfjsDoc.numPages;i++){
        const totalPaginas=Math.max(pdfjsDoc.numPages,1)
        const progressoInicioPagina=progressoInicioArquivo + (((i-1)/totalPaginas)*(progressoFimArquivo-progressoInicioArquivo))
        const progressoFimPagina=progressoInicioArquivo + ((i/totalPaginas)*(progressoFimArquivo-progressoInicioArquivo))
        const page=await pdfjsDoc.getPage(i)
        atualizarStatusOCR(progressoInicioPagina,`${nomeArquivo}: pagina ${i} de ${pdfjsDoc.numPages}...`)

        const content=await page.getTextContent()
        const textoExistente=(content.items||[]).map(item=>item.str).join(' ').trim()
        if(textoExistente.length>20){
          const [copiedPage]=await outputPdf.copyPages(sourcePdfLib,[i-1])
          outputPdf.addPage(copiedPage)
          textoArquivo+=textoExistente + "\n"
          progressoOcrPagina=null
          atualizarStatusOCR(progressoFimPagina,`${nomeArquivo}: pagina ${i} de ${pdfjsDoc.numPages} concluida.`)
          continue
        }

        const viewport=page.getViewport({scale:1.25})
        canvas.width=Math.ceil(viewport.width)
        canvas.height=Math.ceil(viewport.height)
        ctx.clearRect(0,0,canvas.width,canvas.height)
        await page.render({canvasContext:ctx, viewport}).promise

        progressoOcrPagina={
          inicio:progressoInicioPagina,
          fim:progressoFimPagina,
          rotulo:`${nomeArquivo}: pagina ${i}/${pdfjsDoc.numPages}`
        }
        const {data}=await worker.recognize(canvas)
        progressoOcrPagina=null
        textoArquivo += (data.text||'') + "\n"

        const jpgUrl=canvas.toDataURL('image/jpeg',0.72)
        const jpgImg=await outputPdf.embedJpg(jpgUrl)
        const pdfPage=outputPdf.addPage([viewport.width, viewport.height])
        pdfPage.drawImage(jpgImg,{x:0,y:0,width:viewport.width,height:viewport.height})

        const words=(data.words||[]).filter(w=>w && w.text && w.bbox)
        for(const word of words){
          const x0=word.bbox.x0 ?? word.bbox.left ?? 0
          const y0=word.bbox.y0 ?? word.bbox.top ?? 0
          const x1=word.bbox.x1 ?? word.bbox.right ?? x0
          const y1=word.bbox.y1 ?? word.bbox.bottom ?? y0
          const width=Math.max(1, x1-x0)
          const height=Math.max(7, y1-y0)
          const y=viewport.height - y1
          const safeText=String(word.text).replace(/\s+/g,' ').trim()
          if(!safeText) continue
          pdfPage.drawText(safeText,{
            x:x0,
            y:y,
            size:Math.max(6, Math.min(22, height*0.85)),
            font:outputFont,
            color:PDFLib.rgb(1,1,1),
            opacity:0.01,
            maxWidth:width+2,
            lineHeight:height
          })
        }

        atualizarStatusOCR(progressoFimPagina,`${nomeArquivo}: pagina ${i} de ${pdfjsDoc.numPages} concluida.`)
      }

      const resultBytes=await outputPdf.save()
      ocrResultados.push({
        nome:nomePdfOCR(file.name),
        bytes:resultBytes,
        texto:textoArquivo.trim()
      })
      ocrTextoGlobal += (textoArquivo.trim() + "\n\n")
    }

    if(!acessoOCR.premiumAtivo && ocrResultados.length>0){
      registrarUsoGratuitoRecurso("ocr", ocrResultados.length)
    }

    if(usarTelaProcesso){
      atualizarProgressoOCR(94,"Finalizando OCR","Preparando os arquivos reconhecidos para download...")
      await finalizarTelaProcesso(
        "ocr-section",
        "ocr-processo",
        "OCR concluido",
        ocrResultados.length>1
          ? `${ocrResultados.length} arquivo(s) com OCR prontos para download.`
          : "Arquivo com OCR pronto para download.",
        ocrResultados.length>1 ? "Baixar arquivos OCR" : "Baixar PDF com OCR",
        baixarResultadosOCR
      )
      configurarAcaoSecundariaTelaProcesso("ocr-processo","Copiar Texto",copiarTexto)
      renderizarEncadeamentoResultado("ocr-processo-resultado","ocr",ocrResultados,{ocultarDestinos:["ocr"]})
      document.getElementById("ocr-processo")?.scrollIntoView({behavior:"smooth"})
    }else{
      status.textContent=`OCR concluído para ${ocrResultados.length} arquivo(s).`
      resultadoBox.style.display="block"
      renderizarEncadeamentoResultado("ocr-resultado-box","ocr",ocrResultados,{ocultarDestinos:["ocr"]})
      resultadoBox.scrollIntoView({behavior:"smooth"})
      await iniciarDownloadAutomatico(
        baixarResultadosOCR,
        ocrResultados.length>1
          ? "Download do ZIP do OCR iniciado automaticamente."
          : "Download do PDF com OCR iniciado automaticamente."
      )
    }
  }catch(erro){
    console.error(erro)
    progressoOcrPagina=null
    ocrWorkerStatusHook=null
    status.textContent=""
    if(usarTelaProcesso) ocultarProgressoOCR()
    mostrarErro("Não foi possível concluir o OCR dos arquivos.")
  }
}

async function baixarResultadosOCR(){
  if(ocrResultados.length===0){
    alert("Nenhum resultado OCR disponível.")
    return
  }
  await baixarColecaoResultados(ocrResultados, "OCR_Resultados.zip")
}

function copiarTexto(){
  if(!ocrTextoGlobal.trim()){
    mostrarAviso("Nenhum texto reconhecido ainda.")
    return
  }
  navigator.clipboard.writeText(ocrTextoGlobal).then(()=>{
    mostrarSucesso("Texto copiado com sucesso.")
  }).catch(()=>{
    mostrarErro("Não foi possível copiar o texto.")
  })
}

async function encerrarOCRWorker(){
  if(ocrWorkerRef){
    try{ await ocrWorkerRef.terminate() }catch{}
    ocrWorkerRef=null
  }
}
window.addEventListener('beforeunload', ()=>{ encerrarOCRWorker() })

// ===================== COMPACTAR PDF =====================

let arquivosCompactar=[]
let compactarProcessando=false

document.getElementById("compactarInput").addEventListener("change",async(e)=>{
  await carregarFilesNoCompactar(Array.from(e.target.files).filter(f=>f.type==="application/pdf"))
  document.getElementById("compactarInput").value=""
})

function selecionarPastaCompactar(){
  mostrarAvisoConfirmacaoPasta()
  const input=document.createElement("input")
  input.type="file"
  input.webkitdirectory=true
  input.style.display="none"
  document.body.appendChild(input)
  input.addEventListener("change",async(e)=>{
    const files=Array.from(e.target.files).filter(f=>f.type==="application/pdf")
    document.body.removeChild(input)
    if(files.length===0){alert("Nenhum PDF encontrado na pasta.");return}
    mostrarLoading("Carregando pasta: "+files.length+" PDF"+(files.length>1?"s":"")+"...")
    await carregarFilesNoCompactar(files)
  })
  input.click()
}

async function carregarFilesNoCompactar(files){
  let novos=Array.isArray(files) ? files.filter(Boolean) : []
  if(novos.length===0) return

  const acessoCompactar=await validarAcessoRecursoComPlano("compactar_pdf", novos.length, arquivosCompactar.length)
  if(!acessoCompactar.permitido){
    mostrarCtaUpgradePremium(acessoCompactar.motivo)
    return
  }
  if(acessoCompactar.quantidadePermitida<novos.length){
    novos=novos.slice(0, acessoCompactar.quantidadePermitida)
    if(acessoCompactar.motivo) mostrarCtaUpgradePremium(acessoCompactar.motivo)
  }
  if(novos.length===0) return

  mostrarLoading("Carregando "+novos.length+" arquivo"+(novos.length>1?"s":"")+"...")
  for(let file of novos){
    arquivosCompactar.push(file)
    const {card}=await criarThumbCard(file)
    document.getElementById("compactar-lista").appendChild(card)
  }
  esconderLoading()
  mostrarSucesso(novos.length+" arquivo"+(novos.length>1?"s carregados":"carregado")+"!")
  atualizarInfoCompactar()
}

function atualizarInfoCompactar(){
  const total=arquivosCompactar.length
  const tamanhoTotal=arquivosCompactar.reduce((soma,file)=>soma+(file?.size||0),0)
  const contador=document.getElementById("compactar-counter")
  if(contador){
    contador.textContent=total>0
      ? total+" arquivo"+(total!==1?"s carregados":" carregado")
      : "Nenhum arquivo carregado"
  }
  const partes=[total+" arquivo"+(total!==1?"s":"")]
  if(total>0) partes.push("Total atual "+formatarTamanho(tamanhoTotal))
  partes.push("Clique na miniatura para ver páginas")
  document.getElementById("compactar-info").textContent=partes.join(" | ")
}

function limparCompactar(){
  arquivosCompactar=[]
  resultadosCompactarList=[]
  compactarProcessando=false
  ocultarProgressoCompactar()
  document.getElementById("compactar-lista").innerHTML=""
  document.getElementById("compactar-info").textContent=""
  document.getElementById("compactar-status").textContent=""
  document.getElementById("compactarInput").value=""
  document.getElementById("resultado-compactar").style.display="none"
  const contador=document.getElementById("compactar-counter")
  if(contador) contador.textContent="Nenhum arquivo carregado"
}

function formatarTamanho(bytes){
  if(bytes>=1024*1024) return (bytes/(1024*1024)).toFixed(2)+" MB"
  return (bytes/1024).toFixed(1)+" KB"
}

// Pausa para não travar o browser
function yield_(){
  return new Promise(r=>setTimeout(r,0))
}

function obterMetaCompactacaoAutomaticaBytes(modo, tamanhoOriginal){
  if(modo!=="extrema") return null
  return Math.max(1, Math.round(tamanhoOriginal*0.30))
}

function obterPerfisCompactacao(modo="normal", options={}){
  const perfisBase=[
    {escala:1.08, qualidadeJpeg:0.70, nome:"Equilibrado"},
    {escala:0.98, qualidadeJpeg:0.64, nome:"Reducao media"},
    {escala:0.90, qualidadeJpeg:0.58, nome:"Reducao forte"},
    {escala:0.82, qualidadeJpeg:0.52, nome:"Reducao forte+"},
    {escala:0.74, qualidadeJpeg:0.46, nome:"Agressivo"},
    {escala:0.66, qualidadeJpeg:0.40, nome:"Agressivo+"}
  ]
  const perfisAgressivos=[
    {escala:0.58, qualidadeJpeg:0.34, nome:"Limite tecnico"},
    {escala:0.52, qualidadeJpeg:0.28, nome:"Limite tecnico+"},
    {escala:0.46, qualidadeJpeg:0.22, nome:"Ultra compacto", forcarCinza:true},
    {escala:0.40, qualidadeJpeg:0.18, nome:"Ultra compacto+", forcarCinza:true},
    {escala:0.34, qualidadeJpeg:0.14, nome:"Emergencial", forcarCinza:true}
  ]
  if(modo==="extrema" || options.incluirAgressivos){
    return perfisBase.concat(perfisAgressivos)
  }
  return perfisBase
}

function obterPerfilPadraoCompactacao(modo){
  const perfis=obterPerfisCompactacao(modo)
  return modo==="extrema" ? perfis[Math.max(perfis.length-2,0)] : perfis[0]
}

function aplicarEscalaCinzaCanvas(ctx, largura, altura){
  const frame=ctx.getImageData(0,0,largura,altura)
  const dados=frame.data
  for(let i=0;i<dados.length;i+=4){
    const r=dados[i]
    const g=dados[i+1]
    const b=dados[i+2]
    const luma=(r*38 + g*75 + b*15) >> 7
    dados[i]=luma
    dados[i+1]=luma
    dados[i+2]=luma
  }
  ctx.putImageData(frame,0,0)
}

// Renderiza cada página do PDF como imagem e monta novo PDF
async function compactarComImagensRecomprimidas(arrayBuffer, perfil, onProgresso){
  const pdfSrc=await pdfjsLib.getDocument({data:new Uint8Array(arrayBuffer)}).promise
  const novoPdf=await PDFLib.PDFDocument.create()

  const escala=Math.max(0.34, Math.min(1.18, Number(perfil?.escala || 1.08)))
  const qualidadeJpeg=Math.max(0.12, Math.min(0.88, Number(perfil?.qualidadeJpeg || 0.70)))
  const forcarCinza=Boolean(perfil?.forcarCinza)

  const canvas=document.createElement("canvas")
  const ctx=canvas.getContext("2d")

  for(let i=1;i<=pdfSrc.numPages;i++){
    if(onProgresso) onProgresso({pagina:i, totalPaginas:pdfSrc.numPages, perfil})
    await yield_()

    const page=await pdfSrc.getPage(i)
    const viewport=page.getViewport({scale:escala})
    canvas.width=viewport.width
    canvas.height=viewport.height
    ctx.fillStyle="#ffffff"
    ctx.fillRect(0,0,canvas.width,canvas.height)
    await page.render({canvasContext:ctx, viewport}).promise
    if(forcarCinza){
      try{
        aplicarEscalaCinzaCanvas(ctx, canvas.width, canvas.height)
      }catch(e){
        console.warn("Falha ao aplicar escala de cinza na compactacao", e)
      }
    }
    await yield_()

    const blob=await new Promise(res=>canvas.toBlob(res,"image/jpeg",qualidadeJpeg))
    const jpegBytes=blob
      ? new Uint8Array(await blob.arrayBuffer())
      : Uint8Array.from(atob(canvas.toDataURL("image/jpeg",qualidadeJpeg).split(",")[1]), c=>c.charCodeAt(0))
    const img=await novoPdf.embedJpg(jpegBytes)
    const pdfPage=novoPdf.addPage([viewport.width, viewport.height])
    pdfPage.drawImage(img,{x:0,y:0,width:viewport.width,height:viewport.height})
  }

  canvas.remove()
  return await novoPdf.save({useObjectStreams:true})
}

async function compactarPDFAteMeta(arrayBuffer, metaBytes, modo, onProgresso){
  if(arrayBuffer.byteLength<=metaBytes){
    return {
      bytes:new Uint8Array(arrayBuffer),
      atingiuMeta:true,
      reutilizouOriginal:true,
      perfil:null,
      tentativas:0
    }
  }

  const perfis=obterPerfisCompactacao(modo,{incluirAgressivos:true})
  const cache=new Map()

  async function avaliarPerfil(indice){
    if(cache.has(indice)) return cache.get(indice)
    const perfil=perfis[indice]
    const bytes=await compactarComImagensRecomprimidas(arrayBuffer, perfil, (info)=>{
      if(onProgresso){
        onProgresso({
          ...info,
          tentativaAtual: indice+1,
          totalTentativas: perfis.length
        })
      }
    })
    const resultado={
      indice,
      perfil,
      bytes,
      tamanho:bytes.byteLength
    }
    cache.set(indice, resultado)
    return resultado
  }

  let baixo=0
  let alto=perfis.length-1
  let melhorAbaixo=null
  let melhorAcima=null

  while(baixo<=alto){
    const meio=Math.floor((baixo+alto)/2)
    const atual=await avaliarPerfil(meio)
    if(atual.tamanho<=metaBytes){
      melhorAbaixo=atual
      alto=meio-1
    }else{
      if(!melhorAcima || atual.tamanho<melhorAcima.tamanho) melhorAcima=atual
      baixo=meio+1
    }
  }

  if(!melhorAbaixo){
    const extremo=await avaliarPerfil(perfis.length-1)
    if(!melhorAcima || extremo.tamanho<melhorAcima.tamanho){
      melhorAcima=extremo
    }
  }

  const fallbackIdx=modo==="extrema" ? perfis.length-2 : Math.floor(perfis.length/2)
  const escolhido=melhorAbaixo || melhorAcima || await avaliarPerfil(Math.max(0, fallbackIdx))
  return {
    bytes:escolhido.bytes,
    atingiuMeta:escolhido.tamanho<=metaBytes,
    reutilizouOriginal:false,
    perfil:escolhido.perfil,
    tentativas:cache.size
  }
}

function renderizarResumoCompactacao(container, {totalOriginal, totalFinal, resumoLinhas, modo}){
  if(!container) return
  const acoes=obterAreaAcoesResultado(container) || container
  const resumoAnterior=document.getElementById("compactar-resumo-box")
  if(resumoAnterior) resumoAnterior.remove()

  const reducaoTotal=Math.max(0, (1-(totalFinal/Math.max(totalOriginal,1)))*100).toFixed(1)
  const resumoEl=document.createElement("div")
  resumoEl.id="compactar-resumo-box"
  const resumoWrap=document.createElement("div")
  resumoWrap.className="compactar-resumo"

  const resumoTotal=document.createElement("div")
  resumoTotal.className="resumo-total"
  const detalheMeta=modo==="extrema"
    ? " | alvo automatico: pelo menos 70% de reducao por arquivo"
    : ""
  resumoTotal.textContent="Total: "+formatarTamanho(totalOriginal)+" -> "+formatarTamanho(totalFinal)+detalheMeta+" | "
  const reducaoEl=document.createElement("strong")
  reducaoEl.style.color="#10b981"
  reducaoEl.textContent="-"+reducaoTotal+"%"
  resumoTotal.appendChild(reducaoEl)
  resumoWrap.appendChild(resumoTotal)

  resumoLinhas.forEach((linha)=>{
    const linhaEl=document.createElement("div")
    linhaEl.className="resumo-linha"
    linhaEl.textContent=linha
    resumoWrap.appendChild(linhaEl)
  })

  resumoEl.appendChild(resumoWrap)
  const ancoraResumo=acoes?.querySelector(".resultado-label") || acoes?.querySelector(".process-subtitle")
  if(ancoraResumo){
    acoes.insertBefore(resumoEl, ancoraResumo)
  }else{
    acoes.appendChild(resumoEl)
  }
}

async function compactarPDFs(){
  if(arquivosCompactar.length===0){
    alert("Selecione pelo menos um PDF")
    return
  }
  if(compactarProcessando) return

  const acessoCompactar=await validarAcessoRecursoComPlano("compactar_pdf", arquivosCompactar.length)
  if(!acessoCompactar.permitido || acessoCompactar.quantidadePermitida<arquivosCompactar.length){
    mostrarCtaUpgradePremium(acessoCompactar.motivo || "No plano gratuito, esta ferramenta aceita ate 35 PDFs.")
    return
  }

  const modoSelecionado=document.querySelector('input[name="compactMode"]:checked')
  if(!modoSelecionado){
    alert("Selecione um modo de compactacao antes de continuar.")
    return
  }

  resultadosCompactarList=[]
  document.getElementById("resultado-compactar").style.display="none"

  garantirTelasDeProcesso()
  const modo=modoSelecionado.value
  const status=document.getElementById("compactar-status")
  const usarTelaProcesso=Boolean(document.getElementById("compactar-processo"))
  const totalArquivos=Math.max(arquivosCompactar.length,1)

  let totalOriginal=0
  let totalFinal=0
  let resumoLinhas=[]
  compactarProcessando=true

  try{
    if(usarTelaProcesso){
      atualizarProgressoCompactar(4,"Preparando compactacao","Validando arquivos selecionados...")
      document.getElementById("compactar-processo")?.scrollIntoView({behavior:"smooth", block:"start"})
    }

    for(let i=0;i<arquivosCompactar.length;i++){
      const file=arquivosCompactar[i]
      const nomeArquivo=normalizarRotuloVisualPortugues(file.name)
      const progressoInicio=8+((i/totalArquivos)*80)
      const progressoFim=8+(((i+1)/totalArquivos)*80)

      const atualizarStatusAtual=(percentual, mensagem)=>{
        status.textContent=mensagem
        if(usarTelaProcesso){
          atualizarProgressoCompactar(percentual,"Compactando arquivos",mensagem)
        }
      }

      atualizarStatusAtual(progressoInicio,`Arquivo ${i+1}/${arquivosCompactar.length}: ${nomeArquivo}`)

      const arrayBuffer=await file.arrayBuffer()
      const tamanhoOriginal=arrayBuffer.byteLength
      const metaBytes=obterMetaCompactacaoAutomaticaBytes(modo, tamanhoOriginal)
      let pdfBytes=null
      let statusMeta=""

      if(metaBytes){
        const resultadoMeta=await compactarPDFAteMeta(arrayBuffer, metaBytes, modo, (info)=>{
          const totalTentativas=Math.max(1, Number(info?.totalTentativas||1))
          const tentativaAtual=Math.max(1, Number(info?.tentativaAtual||1))
          const totalPaginas=Math.max(1, Number(info?.totalPaginas||1))
          const paginaAtual=Math.max(1, Number(info?.pagina||1))
          const progressoInterno=((tentativaAtual-1)+(paginaAtual/totalPaginas))/totalTentativas
          const percentualAtual=progressoInicio+((progressoFim-progressoInicio)*Math.max(0,Math.min(1,progressoInterno)))
          atualizarStatusAtual(
            percentualAtual,
            `Arquivo ${i+1}/${arquivosCompactar.length}: ${nomeArquivo} | tentativa ${tentativaAtual}/${totalTentativas} | pagina ${paginaAtual}/${totalPaginas}`
          )
        })
        pdfBytes=resultadoMeta.bytes
        if(resultadoMeta.reutilizouOriginal){
          statusMeta="ja estava abaixo da meta"
        }else if(resultadoMeta.atingiuMeta){
          statusMeta="meta atingida"
        }else{
          statusMeta="limite tecnico da compressao"
        }
      }else{
        const perfilBase=obterPerfilPadraoCompactacao(modo)
        pdfBytes=await compactarComImagensRecomprimidas(arrayBuffer, perfilBase, (info)=>{
          const totalPaginas=Math.max(1, Number(info?.totalPaginas||1))
          const paginaAtual=Math.max(1, Number(info?.pagina||1))
          const progressoInterno=paginaAtual/totalPaginas
          const percentualAtual=progressoInicio+((progressoFim-progressoInicio)*Math.max(0,Math.min(1,progressoInterno)))
          atualizarStatusAtual(
            percentualAtual,
            `Arquivo ${i+1}/${arquivosCompactar.length}: ${nomeArquivo} | pagina ${paginaAtual}/${totalPaginas}`
          )
        })
      }

      let tamanhoFinal=pdfBytes.byteLength
      if(tamanhoFinal>=tamanhoOriginal){
        pdfBytes=new Uint8Array(arrayBuffer)
        tamanhoFinal=tamanhoOriginal
        statusMeta=metaBytes
          ? (tamanhoOriginal<=metaBytes ? "ja estava abaixo da meta" : "arquivo ja estava mais otimizado que as tentativas")
          : "arquivo ja estava otimizado"
      }

      totalOriginal+=tamanhoOriginal
      totalFinal+=tamanhoFinal

      const reducao=Math.max(0, (1-(tamanhoFinal/Math.max(tamanhoOriginal,1)))*100).toFixed(1)
      const nomeOriginal=file.name.replace(".pdf","")
      const nomeFinal=nomeOriginal+"_compactado.pdf"

      resultadosCompactarList.push({bytes:pdfBytes, nome:nomeFinal})
      let linha=file.name+": "+formatarTamanho(tamanhoOriginal)+" -> "+formatarTamanho(tamanhoFinal)+" (-"+reducao+"%)"
      if(metaBytes){
        linha+=" | alvo "+formatarTamanho(metaBytes)+" | "+statusMeta
      }
      resumoLinhas.push(linha)
      atualizarStatusAtual(progressoFim,`Arquivo ${i+1}/${arquivosCompactar.length} concluido: ${nomeArquivo}`)
    }

    const textoConclusao=resultadosCompactarList.length>1
      ? resultadosCompactarList.length+" arquivo(s) compactado(s) e prontos para download."
      : "Arquivo compactado e pronto para download."

    if(usarTelaProcesso){
      atualizarProgressoCompactar(94,"Finalizando compactacao","Organizando o resultado para download automatico...")
      await finalizarTelaProcesso(
        "compactar-section",
        "compactar-processo",
        "Compactacao concluida",
        textoConclusao,
        resultadosCompactarList.length>1 ? "Baixar arquivos compactados" : "Baixar PDF compactado",
        baixarResultadosCompactar
      )
      const painelProcesso=document.getElementById("compactar-processo-resultado")
      renderizarResumoCompactacao(painelProcesso, {totalOriginal, totalFinal, resumoLinhas, modo})
      renderizarEncadeamentoResultado("compactar-processo-resultado","compactar",resultadosCompactarList,{ocultarDestinos:["compactar"]})
      document.getElementById("compactar-processo")?.scrollIntoView({behavior:"smooth"})
    }else{
      const painelCompactar=document.getElementById("resultado-compactar")
      renderizarResumoCompactacao(painelCompactar, {totalOriginal, totalFinal, resumoLinhas, modo})
      const acoes=obterAreaAcoesResultado(painelCompactar) || painelCompactar
      const labelResultado=acoes?.querySelector(".resultado-label") || painelCompactar?.querySelector(".resultado-label")
      if(labelResultado){
        labelResultado.textContent=(modo==="extrema")
          ? "Compactacao concluida! O sistema tentou atingir a meta definida para cada arquivo."
          : "Compactacao concluida! O que deseja fazer?"
      }
      document.getElementById("resultado-compactar").style.display="block"
      renderizarEncadeamentoResultado("resultado-compactar","compactar",resultadosCompactarList,{ocultarDestinos:["compactar"]})
      document.getElementById("resultado-compactar").scrollIntoView({behavior:"smooth"})
    }

    status.textContent=""
  }catch(e){
    console.error(e)
    status.textContent=""
    if(usarTelaProcesso){
      ocultarProgressoCompactar()
    }
    mostrarErro("Nao foi possivel concluir a compactacao dos arquivos.")
  }finally{
    compactarProcessando=false
  }
}

async function baixarResultadosCompactar(){
  await baixarColecaoResultados(resultadosCompactarList, "PDFs_Compactados.zip")
}

function enviarCompactadosParaJuntar(){
  if(resultadosCompactarList.length===0) return
  const files=resultadosCompactarList.map(item=>bytesParaFile(item.bytes, item.nome))
  limparCompactar()
  abrirUnificador(files)
}

function enviarCompactadosParaDividir(){
  if(resultadosCompactarList.length===0) return
  const file=bytesParaFile(resultadosCompactarList[0].bytes, resultadosCompactarList[0].nome)
  limparCompactar()
  abrirDividir(file)
}

function enviarCompactadosParaOCR(){
  if(resultadosCompactarList.length===0) return
  const file=bytesParaFile(resultadosCompactarList[0].bytes, resultadosCompactarList[0].nome)
  limparCompactar()
  abrirOCR(file)
}


// ===================== CONVERTER PDF PARA WORD =====================

let converterFileRef=null
let resultadoWordBlob=null
let resultadoWordNome=""

document.getElementById("converterInput").addEventListener("change",async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarFileNoConverter(file)
})

async function carregarFileNoConverter(file){
  converterFileRef=file
  resultadoWordBlob=null
  document.getElementById("resultado-converter").style.display="none"
  document.getElementById("converter-status").textContent=""

  const convGallery=document.getElementById("converter-gallery")
  convGallery.innerHTML=""

  const {card, totalPaginas}=await criarThumbCard(file)
  convGallery.appendChild(card)

  document.getElementById("converter-info").textContent="1 arquivo | "+totalPaginas+" páginas | Clique na miniatura para ver páginas"
}

function limparConverter(){
  converterFileRef=null
  resultadoWordBlob=null
  resultadoWordNome=""
  document.getElementById("converter-gallery").innerHTML=""
  document.getElementById("converter-status").textContent=""
  document.getElementById("resultado-converter").style.display="none"
  document.getElementById("converter-info").textContent=""
  document.getElementById("converterInput").value=""
}

function sanitizarTextoParaDocxXml(texto){
  return String(texto||"")
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g,"")
}

function extrairParagrafosDoConteudoPdf(content){
  const linhas=new Map()
  for(const item of (content?.items||[])){
    const texto=sanitizarTextoParaDocxXml(String(item?.str||"")).replace(/\s+/g," ").trim()
    if(!texto) continue
    const transform=item?.transform||[]
    const y=Math.round(Number(transform[5]||0))
    const x=Number(transform[4]||0)
    if(!linhas.has(y)) linhas.set(y,[])
    linhas.get(y).push({x, texto})
  }

  return [...linhas.entries()]
    .sort((a,b)=>b[0]-a[0])
    .map(([,partes])=>partes
      .sort((a,b)=>a.x-b.x)
      .map(parte=>parte.texto)
      .join(" ")
      .replace(/\s+/g," ")
      .trim()
    )
    .filter(Boolean)
}

async function extrairParagrafosPaginaComFallback(page, statusEl, paginaAtual, totalPaginas, permitirOcrFallback){
  const content=await page.getTextContent()
  const paragrafosTexto=extrairParagrafosDoConteudoPdf(content)
  const caracteresExtraidos=paragrafosTexto.join("").length
  if(caracteresExtraidos>=20 || !permitirOcrFallback){
    return {paragrafos:paragrafosTexto, usouOcr:false}
  }

  try{
    const worker=await obterOCRWorker(statusEl)
    statusEl.textContent=`Página ${paginaAtual} de ${totalPaginas}: aplicando OCR...`

    const viewport=page.getViewport({scale:1.5})
    const canvas=document.createElement("canvas")
    const ctx=canvas.getContext("2d", {willReadFrequently:true})
    canvas.width=Math.ceil(viewport.width)
    canvas.height=Math.ceil(viewport.height)
    ctx.clearRect(0,0,canvas.width,canvas.height)
    await page.render({canvasContext:ctx, viewport}).promise

    const {data}=await worker.recognize(canvas)
    const paragrafosOcr=String(data?.text||"")
      .split(/\r?\n+/)
      .map(linha=>sanitizarTextoParaDocxXml(linha).replace(/\s+/g," ").trim())
      .filter(Boolean)

    if(paragrafosOcr.length>0){
      return {paragrafos:paragrafosOcr, usouOcr:true}
    }
  }catch(erro){
    console.warn("Falha no OCR de apoio da conversão PDF para Word:", erro)
  }

  return {paragrafos:paragrafosTexto, usouOcr:false}
}

async function converterParaWord(){
  if(!converterFileRef){
    alert("Selecione um PDF primeiro")
    return
  }

  const acessoConverter=await validarAcessoRecursoComPlano("pdf_word", 1)
  if(!acessoConverter.permitido){
    mostrarCtaUpgradePremium(acessoConverter.motivo)
    return
  }

  garantirTelasDeProcesso()
  const status=document.getElementById("converter-status")
  const usarTelaProcesso=Boolean(document.getElementById("converter-processo"))
  const atualizarStatusConverter=(percentual, mensagem, titulo="Convertendo PDF")=>{
    status.textContent=mensagem
    if(usarTelaProcesso){
      atualizarTelaProcesso("converter-section","converter-processo",percentual,titulo,mensagem)
    }
  }
  status.textContent="Extraindo texto do PDF..."
  document.getElementById("resultado-converter").style.display="none"
  if(usarTelaProcesso){
    atualizarTelaProcesso("converter-section","converter-processo",4,"Preparando conversao...","Validando o PDF selecionado...")
    document.getElementById("converter-processo")?.scrollIntoView({behavior:"smooth", block:"start"})
  }

  try{
    const arrayBuffer=await converterFileRef.arrayBuffer()
    atualizarStatusConverter(12,"Abrindo o PDF para extracao de texto...","Extraindo texto")
    const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise
    const acessoOcrFallback=await validarAcessoRecursoComPlano("ocr", 1)
    const permitirOcrFallback=Boolean(acessoOcrFallback?.permitido)
    const statusProxy={
      get textContent(){ return status.textContent },
      set textContent(valor){
        atualizarStatusConverter(18, String(valor||""), "Extraindo texto")
      }
    }

    let paragrafos=[]
    let paginasComOcr=0
    let paginasSemTexto=0

    for(let i=1;i<=pdf.numPages;i++){
      const percentualPagina=18+Math.round((i/Math.max(pdf.numPages,1))*58)
      atualizarStatusConverter(percentualPagina,"Processando pagina "+i+" de "+pdf.numPages+"...","Extraindo texto")
      const page=await pdf.getPage(i)
      const {paragrafos:paragrafosPagina, usouOcr}=await extrairParagrafosPaginaComFallback(
        page,
        statusProxy,
        i,
        pdf.numPages,
        permitirOcrFallback
      )

      if(usouOcr) paginasComOcr++
      if(paragrafosPagina.length===0){
        paginasSemTexto++
        paragrafos.push(`[Página ${i}: texto não identificado automaticamente]`)
      }else{
        paragrafos.push(...paragrafosPagina)
      }

      if(i<pdf.numPages) paragrafos.push("--- Página "+(i+1)+" ---")
    }

    if(paragrafos.length===0){
      paragrafos=["Não foi possível extrair texto deste PDF. Rode a ferramenta OCR e tente novamente."]
    }

    atualizarStatusConverter(84,"Gerando arquivo Word...","Gerando documento")
    resultadoWordBlob=await gerarDocxDeParagrafos(paragrafos, converterFileRef.name)
    resultadoWordNome=converterFileRef.name.replace(/\.pdf$/i,"")+".docx"

    if(paginasComOcr>0){
      status.textContent=`Conversão concluída com OCR em ${paginasComOcr} página(s).`
      if(!acessoOcrFallback.premiumAtivo){
        registrarUsoGratuitoRecurso("ocr", 1)
      }
    }else if(paginasSemTexto>0){
      status.textContent="Conversão concluída com aviso: algumas páginas ficaram sem texto identificável."
    }else{
      status.textContent="Conversão concluída!"
    }

    if(usarTelaProcesso){
      await concluirEtapaTelaProcesso(
        "converter-section",
        "converter-processo",
        "Arquivo pronto",
        "Word gerado com sucesso.",
        "Preparando conversao...",
        "Aguarde enquanto o Word e gerado."
      )
    }
    document.getElementById("resultado-converter").style.display="block"
    document.getElementById("resultado-converter").scrollIntoView({behavior:"smooth"})
    if(!acessoConverter.premiumAtivo){
      registrarUsoGratuitoRecurso("pdf_word", 1)
    }
    await iniciarDownloadAutomatico(baixarResultadoWord, "Download do Word iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    if(usarTelaProcesso){
      ocultarTelaProcesso("converter-section","converter-processo","Preparando conversao...","Aguarde enquanto o Word e gerado.")
    }
    status.textContent="Não foi possível converter este PDF."
    mostrarErro("Falha na conversão para Word. Se o arquivo for escaneado, use OCR e tente novamente.")
  }
}

function carregarJSZip(){
  return carregarBibliotecaGlobal(
    "JSZip",
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    "Falha ao carregar JSZip"
  )
}

function baixarResultadoWord(){
  if(!resultadoWordBlob) return
  baixarBlob(resultadoWordBlob, resultadoWordNome)
}

function enviarConverterParaJuntar(){
  if(!converterFileRef) return
  const file=converterFileRef
  limparConverter()
  abrirUnificador([file])
}

function enviarConverterParaCompactar(){
  if(!converterFileRef) return
  const file=converterFileRef
  limparConverter()
  abrirCompactar([file])
}


// ===================== TRADUZIR PDF =====================

let tradutorFileRef=null
let tradutorDadosPdfCache=null
let tradutorPaginasTraduzidas=[]
let resultadoTradutorPdfBytes=null
let resultadoTradutorTxtBlob=null
let resultadoTradutorNomePdf=""
let resultadoTradutorNomeTxt=""
let tradutorProcessando=false

document.getElementById("tradutorInput").addEventListener("change", async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarFileNoTradutor(file)
  e.target.value=""
})

async function carregarFileNoTradutor(file){
  tradutorFileRef=file
  tradutorDadosPdfCache=null
  tradutorPaginasTraduzidas=[]
  resultadoTradutorPdfBytes=null
  resultadoTradutorTxtBlob=null
  resultadoTradutorNomePdf=""
  resultadoTradutorNomeTxt=""
  tradutorProcessando=false

  document.getElementById("resultado-tradutor").style.display="none"
  document.getElementById("tradutor-status").textContent=""
  document.getElementById("tradutor-preview").style.display="none"
  document.getElementById("tradutor-preview-text").textContent=""

  const infoBox=document.getElementById("tradutor-info-box")
  const nomeEl=document.getElementById("tradutor-nome")
  const metaEl=document.getElementById("tradutor-meta")
  if(infoBox) infoBox.style.display="block"
  if(nomeEl) nomeEl.textContent="PDF: "+file.name
  if(metaEl) metaEl.textContent="Lendo metadados do documento..."
  document.getElementById("tradutor-bar-info").textContent="1 arquivo selecionado: "+file.name

  const dados=await extrairTextoPdfPorPaginas(file)
  tradutorDadosPdfCache=dados
  const paginasComTexto=dados.paginas.filter(texto=>String(texto||"").trim().length>0).length
  if(metaEl){
    metaEl.textContent=`${dados.totalPaginas} paginas | ${paginasComTexto} com texto | ${formatarTamanhoArquivo(file.size)}`
  }
}

function quebrarTextoParaTraducao(texto, limite=1400){
  const palavras=String(texto||"")
    .replace(/\s+/g," ")
    .trim()
    .split(" ")
    .filter(Boolean)
  if(palavras.length===0) return []
  const partes=[]
  let trecho=[]
  let tamanhoAtual=0
  for(const palavra of palavras){
    const incremento=palavra.length + (trecho.length>0 ? 1 : 0)
    if(tamanhoAtual+incremento>limite && trecho.length>0){
      partes.push(trecho.join(" "))
      trecho=[palavra]
      tamanhoAtual=palavra.length
    }else{
      trecho.push(palavra)
      tamanhoAtual+=incremento
    }
  }
  if(trecho.length>0) partes.push(trecho.join(" "))
  return partes
}

async function traduzirTrechoViaGoogle(texto, origem, destino){
  const params=new URLSearchParams({
    client:"gtx",
    sl:origem||"auto",
    tl:destino,
    dt:"t",
    q:texto
  })
  const resposta=await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`)
  if(!resposta.ok){
    throw new Error("Falha na API Google Translate")
  }
  const dados=await resposta.json()
  const blocos=Array.isArray(dados?.[0]) ? dados[0] : []
  const traducao=blocos
    .map(item=>Array.isArray(item) ? String(item[0]||"") : "")
    .join("")
    .trim()
  if(!traducao){
    throw new Error("Resposta vazia da traducao Google")
  }
  return traducao
}

async function traduzirTrechoViaMyMemory(texto, origem, destino){
  const origemNormalizada=origem==="auto" ? "pt" : origem
  const params=new URLSearchParams({
    q:texto,
    langpair:`${origemNormalizada}|${destino}`
  })
  const resposta=await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`)
  if(!resposta.ok){
    throw new Error("Falha na API MyMemory")
  }
  const dados=await resposta.json()
  const traducaoBruta=String(dados?.responseData?.translatedText||"").trim()
  if(!traducaoBruta){
    throw new Error("Resposta vazia da traducao MyMemory")
  }
  return decodificarEntidadesXml(traducaoBruta)
}

async function traduzirTrechoComFallback(texto, origem, destino){
  const conteudo=String(texto||"").trim()
  if(!conteudo) return ""
  if(origem!=="auto" && origem===destino) return conteudo
  try{
    return await traduzirTrechoViaGoogle(conteudo, origem, destino)
  }catch{
    return await traduzirTrechoViaMyMemory(conteudo, origem, destino)
  }
}

async function traduzirPaginasPdf(paginas, origem, destino, statusEl){
  const traducaoPaginas=[]
  const totalPaginas=paginas.length
  for(let i=0;i<totalPaginas;i++){
    const textoPagina=String(paginas[i]||"").replace(/\s+/g," ").trim()
    if(!textoPagina){
      traducaoPaginas.push("")
      continue
    }
    const trechos=quebrarTextoParaTraducao(textoPagina)
    const trechosTraduzidos=[]
    for(let t=0;t<trechos.length;t++){
      if(statusEl){
        statusEl.textContent=`Traduzindo pagina ${i+1}/${totalPaginas} (trecho ${t+1}/${trechos.length})...`
      }
      const traducaoTrecho=await traduzirTrechoComFallback(trechos[t], origem, destino)
      trechosTraduzidos.push(traducaoTrecho)
      if(t<trechos.length-1){
        await esperar(80)
      }
    }
    traducaoPaginas.push(trechosTraduzidos.join(" ").replace(/\s+/g," ").trim())
  }
  return traducaoPaginas
}

function montarTextoTraduzidoPorPaginas(paginas){
  return paginas
    .map((texto, idx)=>{
      const conteudo=String(texto||"").trim() || "Sem texto detectado nesta pagina."
      return `=== PAGINA ${idx+1} ===\n${conteudo}`
    })
    .join("\n\n")
}

function obterPreviaTextoTraduzido(texto, limite=1800){
  const conteudo=String(texto||"").trim()
  if(conteudo.length<=limite) return conteudo
  return conteudo.slice(0, limite)+"\n\n[...]"
}

async function gerarPdfTraduzidoDePaginas(paginasTraduzidas){
  const pdf=await PDFLib.PDFDocument.create()
  const fonteTexto=await pdf.embedFont(PDFLib.StandardFonts.Helvetica)
  const fonteTitulo=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold)
  const larguraPagina=595
  const alturaPagina=842
  const margem=44
  const larguraTexto=larguraPagina-(margem*2)
  const tamanhoFonte=11
  const alturaLinha=16

  for(let i=0;i<paginasTraduzidas.length;i++){
    let pagina=pdf.addPage([larguraPagina, alturaPagina])
    let y=alturaPagina-margem
    const tituloBase=`Pagina ${i+1}`
    pagina.drawText(tituloBase, {
      x:margem,
      y,
      size:13,
      font:fonteTitulo,
      color:PDFLib.rgb(0.09, 0.21, 0.38)
    })
    y-=24

    const textoSeguro=normalizarTextoParaPdf(String(paginasTraduzidas[i]||"").trim() || "Sem texto detectado nesta pagina.")
    let linhas=quebrarTextoParaPdf(textoSeguro, fonteTexto, tamanhoFonte, larguraTexto)
    if(linhas.length===0){
      linhas=["Sem texto detectado nesta pagina."]
    }

    for(const linha of linhas){
      if(y<margem+4){
        pagina=pdf.addPage([larguraPagina, alturaPagina])
        y=alturaPagina-margem
        pagina.drawText(`${tituloBase} (continua)`, {
          x:margem,
          y,
          size:11,
          font:fonteTitulo,
          color:PDFLib.rgb(0.38, 0.45, 0.54)
        })
        y-=20
      }
      pagina.drawText(linha, {
        x:margem,
        y,
        size:tamanhoFonte,
        font:fonteTexto,
        color:PDFLib.rgb(0.11, 0.13, 0.19)
      })
      y-=alturaLinha
    }
  }

  return await pdf.save()
}

async function traduzirPDF(){
  if(!tradutorFileRef){
    alert("Selecione um PDF primeiro")
    return
  }
  if(tradutorProcessando) return
  const acessoTradutor=await validarAcessoRecursoComPlano("tradutor_pdf", 1)
  if(!acessoTradutor.permitido){
    mostrarCtaUpgradePremium(acessoTradutor.motivo)
    return
  }

  garantirTelasDeProcesso()
  const status=document.getElementById("tradutor-status")
  const usarTelaProcesso=Boolean(document.getElementById("tradutor-processo"))
  const atualizarStatusTradutor=(percentual, mensagem, titulo="Traduzindo PDF")=>{
    status.textContent=mensagem
    if(usarTelaProcesso){
      atualizarTelaProcesso("tradutor-section","tradutor-processo",percentual,titulo,mensagem)
    }
  }
  const origemSelect=document.getElementById("tradutor-idioma-origem")
  const destinoSelect=document.getElementById("tradutor-idioma-destino")
  const origem=String(origemSelect?.value||"auto").trim() || "auto"
  const destino=String(destinoSelect?.value||"en").trim() || "en"

  tradutorProcessando=true
  document.getElementById("resultado-tradutor").style.display="none"
  if(usarTelaProcesso){
    atualizarTelaProcesso("tradutor-section","tradutor-processo",4,"Preparando traducao...","Validando arquivo e idiomas...")
    document.getElementById("tradutor-processo")?.scrollIntoView({behavior:"smooth", block:"start"})
  }

  try{
    atualizarStatusTradutor(14,"Lendo o conteudo do PDF...","Lendo documento")
    const dados=tradutorDadosPdfCache || await extrairTextoPdfPorPaginas(tradutorFileRef)
    tradutorDadosPdfCache=dados
    const statusProxy={
      get textContent(){ return status.textContent },
      set textContent(valor){
        atualizarStatusTradutor(52, String(valor||""), "Traduzindo conteudo")
      }
    }

    if(origem!=="auto" && origem===destino){
      tradutorPaginasTraduzidas=[...dados.paginas]
      atualizarStatusTradutor(58,"Origem e destino iguais. O texto foi mantido sem traducao.","Traduzindo conteudo")
    }else{
      atualizarStatusTradutor(28,"Traduzindo o conteudo do PDF...","Traduzindo conteudo")
      tradutorPaginasTraduzidas=await traduzirPaginasPdf(dados.paginas, origem, destino, statusProxy)
    }

    atualizarStatusTradutor(82,"Gerando PDF traduzido...","Gerando arquivo")
    resultadoTradutorPdfBytes=await gerarPdfTraduzidoDePaginas(tradutorPaginasTraduzidas)

    const nomeBase=normalizarNomeArquivoBase(nomeBaseSemExtensao(tradutorFileRef.name), "documento")
    resultadoTradutorNomePdf=`${nomeBase}_traduzido_${destino}.pdf`

    const textoConsolidado=montarTextoTraduzidoPorPaginas(tradutorPaginasTraduzidas)
    resultadoTradutorTxtBlob=new Blob([textoConsolidado], {type:"text/plain;charset=utf-8"})
    resultadoTradutorNomeTxt=`${nomeBase}_traducao_${destino}.txt`

    const previewEl=document.getElementById("tradutor-preview")
    const previewTextoEl=document.getElementById("tradutor-preview-text")
    if(previewEl && previewTextoEl){
      previewTextoEl.textContent=obterPreviaTextoTraduzido(textoConsolidado)
      previewEl.style.display="block"
    }

    document.getElementById("resultado-tradutor").style.display="block"
    renderizarEncadeamentoResultado("resultado-tradutor","tradutor",[
      {bytes:resultadoTradutorPdfBytes, nome:resultadoTradutorNomePdf}
    ], {ocultarDestinos:["tradutor"]})
    if(!acessoTradutor.premiumAtivo){
      registrarUsoGratuitoRecurso("tradutor_pdf", 1)
    }
    document.getElementById("tradutor-bar-info").textContent="Traducao concluida e pronta para download."
    status.textContent="Traducao concluida com sucesso."
    if(usarTelaProcesso){
      await concluirEtapaTelaProcesso(
        "tradutor-section",
        "tradutor-processo",
        "Arquivo pronto",
        "PDF traduzido com sucesso.",
        "Preparando traducao...",
        "Aguarde enquanto o conteudo e processado."
      )
    }
    document.getElementById("resultado-tradutor").scrollIntoView({behavior:"smooth"})
    await iniciarDownloadAutomatico(baixarResultadoTraducaoPDF, "Download do PDF traduzido iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    if(usarTelaProcesso){
      ocultarTelaProcesso("tradutor-section","tradutor-processo","Preparando traducao...","Aguarde enquanto o conteudo e processado.")
    }
    status.textContent="Falha ao traduzir o PDF."
    mostrarErro("Nao foi possivel traduzir agora. Tente novamente em alguns instantes.")
  }finally{
    tradutorProcessando=false
  }
}

function baixarResultadoTraducaoPDF(){
  if(!resultadoTradutorPdfBytes) return
  baixarArquivo(resultadoTradutorPdfBytes, resultadoTradutorNomePdf)
}

function baixarResultadoTraducaoTexto(){
  if(!resultadoTradutorTxtBlob) return
  baixarBlob(resultadoTradutorTxtBlob, resultadoTradutorNomeTxt)
}

function limparTradutorPDF(){
  tradutorFileRef=null
  tradutorDadosPdfCache=null
  tradutorPaginasTraduzidas=[]
  resultadoTradutorPdfBytes=null
  resultadoTradutorTxtBlob=null
  resultadoTradutorNomePdf=""
  resultadoTradutorNomeTxt=""
  tradutorProcessando=false

  const input=document.getElementById("tradutorInput")
  if(input) input.value=""
  const origemSelect=document.getElementById("tradutor-idioma-origem")
  const destinoSelect=document.getElementById("tradutor-idioma-destino")
  if(origemSelect) origemSelect.value="auto"
  if(destinoSelect) destinoSelect.value="en"

  document.getElementById("tradutor-info-box").style.display="none"
  document.getElementById("tradutor-nome").textContent=""
  document.getElementById("tradutor-meta").textContent=""
  document.getElementById("tradutor-status").textContent=""
  document.getElementById("tradutor-preview-text").textContent=""
  document.getElementById("tradutor-preview").style.display="none"
  document.getElementById("tradutor-bar-info").textContent=""
  document.getElementById("resultado-tradutor").style.display="none"
}


// ===================== UTILITÁRIOS COMPARTILHADOS DE CONVERSÃO =====================

const carregamentosExternos={}

function criarInfoBox(secaoId, nomeId, nome){
  const box=document.getElementById(secaoId)
  document.getElementById(nomeId).textContent="📄 "+nome
  box.style.display="block"
}

function carregarBibliotecaGlobal(globalName, src, mensagemErro){
  if(window[globalName]) return Promise.resolve(window[globalName])
  if(carregamentosExternos[globalName]) return carregamentosExternos[globalName]

  carregamentosExternos[globalName]=new Promise((resolve,reject)=>{
    const scriptExistente=document.querySelector(`script[data-global-lib="${globalName}"]`)
    if(scriptExistente){
      scriptExistente.addEventListener("load",()=>resolve(window[globalName]),{once:true})
      scriptExistente.addEventListener("error",()=>reject(new Error(mensagemErro)),{once:true})
      return
    }

    const script=document.createElement("script")
    script.src=src
    script.async=true
    script.dataset.globalLib=globalName
    script.onload=()=>resolve(window[globalName])
    script.onerror=()=>reject(new Error(mensagemErro))
    document.head.appendChild(script)
  }).catch((erro)=>{
    delete carregamentosExternos[globalName]
    throw erro
  })

  return carregamentosExternos[globalName]
}

async function carregarJSZipSeNecessario(){
  return carregarJSZip()
}

async function carregarSheetJS(){
  return carregarBibliotecaGlobal(
    "XLSX",
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    "Falha ao carregar SheetJS"
  )
}

async function gerarDocxDeParagrafos(paragrafos, nome){
  const JSZip=await carregarJSZip()
  const listaParagrafos=(Array.isArray(paragrafos) ? paragrafos : [])
    .map(p=>sanitizarTextoParaDocxXml(String(p||"")))
    .filter(p=>p.trim().length>0)

  if(listaParagrafos.length===0){
    listaParagrafos.push("Não foi possível extrair texto deste arquivo.")
  }

  const xmlParas=listaParagrafos.map(p=>{
    const texto=p
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    return `<w:p><w:r><w:t xml:space="preserve">${texto}</w:t></w:r></w:p>`
  }).join("\n")
  const docXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${xmlParas}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>`
  const relsXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  const wordRelsXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  const contentTypesXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  const zip=new JSZip()
  zip.file("[Content_Types].xml",contentTypesXml)
  zip.file("_rels/.rels",relsXml)
  zip.file("word/document.xml",docXml)
  zip.file("word/_rels/document.xml.rels",wordRelsXml)
  return await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"})
}

async function gerarPDFDeTabela(linhas, titulo){
  const novoPdf=await PDFLib.PDFDocument.create()
  const fontSize=10
  const margin=40
  const lineHeight=16
  const pageWidth=842
  const pageHeight=595
  let page=novoPdf.addPage([pageWidth,pageHeight])
  let y=pageHeight-margin

  // Título
  page.drawText(normalizarTextoParaPdf(titulo),{x:margin,y,size:14,color:PDFLib.rgb(0.2,0.2,0.8)})
  y-=lineHeight*2

  for(let linha of linhas){
    if(y<margin+lineHeight){
      page=novoPdf.addPage([pageWidth,pageHeight])
      y=pageHeight-margin
    }
    const texto=linha.join("   |   ").substring(0,120)
    const textoSeguro=normalizarTextoParaPdf(texto)
    page.drawText(textoSeguro,{x:margin,y,size:fontSize,color:PDFLib.rgb(0.1,0.1,0.1)})
    y-=lineHeight
  }

  return await novoPdf.save()
}


// ===================== WORD PARA PDF =====================

let wordpdfFileRef=null
let resultadoWordPDFBytes=null
let resultadoWordPDFNome=""

document.getElementById("wordpdfInput").addEventListener("change",async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  carregarFileNoWordPDF(file)
})

function carregarFileNoWordPDF(file){
  wordpdfFileRef=file
  resultadoWordPDFBytes=null
  document.getElementById("resultado-wordpdf").style.display="none"
  document.getElementById("wordpdf-status").textContent=""
  criarInfoBox("wordpdf-info-box","wordpdf-nome",file.name)
  document.getElementById("wordpdf-bar-info").textContent="1 arquivo selecionado: "+file.name
}

function limparWordPDF(){
  wordpdfFileRef=null
  resultadoWordPDFBytes=null
  resultadoWordPDFNome=""
  document.getElementById("wordpdf-info-box").style.display="none"
  document.getElementById("wordpdf-status").textContent=""
  document.getElementById("resultado-wordpdf").style.display="none"
  document.getElementById("wordpdf-bar-info").textContent=""
  document.getElementById("wordpdfInput").value=""
}

async function converterWordParaPDF(){
  if(!wordpdfFileRef){alert("Selecione um arquivo Word primeiro");return}
  const acessoWordPdf=await validarAcessoRecursoComPlano("word_pdf", 1)
  if(!acessoWordPdf.permitido){
    mostrarCtaUpgradePremium(acessoWordPdf.motivo)
    return
  }
  garantirTelasDeProcesso()
  const status=document.getElementById("wordpdf-status")
  const usarTelaProcesso=Boolean(document.getElementById("wordpdf-processo"))
  const atualizarStatusWordPdf=(percentual, mensagem, titulo="Convertendo documento")=>{
    status.textContent=mensagem
    if(usarTelaProcesso){
      atualizarTelaProcesso("wordpdf-section","wordpdf-processo",percentual,titulo,mensagem)
    }
  }
  if(usarTelaProcesso){
    atualizarTelaProcesso("wordpdf-section","wordpdf-processo",4,"Preparando conversao...","Validando o arquivo Word...")
    document.getElementById("wordpdf-processo")?.scrollIntoView({behavior:"smooth", block:"start"})
  }

  try{
    atualizarStatusWordPdf(12,"Lendo documento Word...","Lendo documento")
    const mammoth=await carregarMammoth()
    const arrayBuffer=await wordpdfFileRef.arrayBuffer()
    const resultado=await mammoth.extractRawText({arrayBuffer})
    const texto=resultado.value

    atualizarStatusWordPdf(26,"Gerando PDF...","Gerando PDF")

    const paragrafos=texto.split("\n").filter(p=>p.trim().length>0)
    const novoPdf=await PDFLib.PDFDocument.create()
    const fontSize=11
    const margin=50
    const lineHeight=18
    const pageWidth=595
    const pageHeight=842
    let page=novoPdf.addPage([pageWidth,pageHeight])
    let y=pageHeight-margin

    for(let indice=0; indice<paragrafos.length; indice++){
      const paragrafo=paragrafos[indice]
      if(usarTelaProcesso && paragrafos.length>0){
        const percentual=26+Math.round(((indice+1)/paragrafos.length)*56)
        atualizarTelaProcesso("wordpdf-section","wordpdf-processo",percentual,"Gerando PDF",`Escrevendo conteudo ${indice+1} de ${paragrafos.length}...`)
      }
      const palavras=paragrafo.split(" ")
      let linhaAtual=""
      for(let palavra of palavras){
        const teste=linhaAtual?linhaAtual+" "+palavra:palavra
        if(teste.length>80){
          if(y<margin+lineHeight){page=novoPdf.addPage([pageWidth,pageHeight]);y=pageHeight-margin}
          const textoSeguro=normalizarTextoParaPdf(linhaAtual)
          if(textoSeguro.trim()) page.drawText(textoSeguro,{x:margin,y,size:fontSize,color:PDFLib.rgb(0,0,0)})
          y-=lineHeight
          linhaAtual=palavra
        }else{
          linhaAtual=teste
        }
      }
      if(linhaAtual.trim()){
        if(y<margin+lineHeight){page=novoPdf.addPage([pageWidth,pageHeight]);y=pageHeight-margin}
        const textoSeguro=normalizarTextoParaPdf(linhaAtual)
        page.drawText(textoSeguro,{x:margin,y,size:fontSize,color:PDFLib.rgb(0,0,0)})
        y-=lineHeight
      }
      y-=4
    }

    resultadoWordPDFBytes=await novoPdf.save()
    resultadoWordPDFNome=wordpdfFileRef.name.replace(/\.(doc|docx)$/i,"")+".pdf"
    status.textContent="Conversão concluída!"
    if(usarTelaProcesso){
      await concluirEtapaTelaProcesso("wordpdf-section","wordpdf-processo","Arquivo pronto","PDF gerado com sucesso.","Preparando conversao...","Aguarde enquanto o PDF e gerado.")
    }
    document.getElementById("resultado-wordpdf").style.display="block"
    renderizarEncadeamentoResultado("resultado-wordpdf","wordpdf",[
      {bytes:resultadoWordPDFBytes, nome:resultadoWordPDFNome}
    ], {ocultarDestinos:["dividir"]})
    if(!acessoWordPdf.premiumAtivo){
      registrarUsoGratuitoRecurso("word_pdf", 1)
    }
    document.getElementById("resultado-wordpdf").scrollIntoView({behavior:"smooth"})
    await iniciarDownloadAutomatico(baixarResultadoWordPDF, "Download do PDF iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    if(usarTelaProcesso){
      ocultarTelaProcesso("wordpdf-section","wordpdf-processo","Preparando conversao...","Aguarde enquanto o PDF e gerado.")
    }
    status.textContent="Falha ao converter o documento."
    mostrarErro("Não foi possível converter este arquivo Word.")
  }
}

function carregarMammoth(){
  return carregarBibliotecaGlobal(
    "mammoth",
    "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
    "Falha ao carregar Mammoth"
  )
}

function baixarResultadoWordPDF(){
  if(!resultadoWordPDFBytes) return
  baixarArquivo(resultadoWordPDFBytes, resultadoWordPDFNome)
}

function enviarWordPDFParaCompactar(){
  if(!resultadoWordPDFBytes) return
  const file=bytesParaFile(resultadoWordPDFBytes, resultadoWordPDFNome)
  limparWordPDF()
  abrirCompactar([file])
}

function enviarWordPDFParaDividir(){
  if(!resultadoWordPDFBytes) return
  const file=bytesParaFile(resultadoWordPDFBytes, resultadoWordPDFNome)
  limparWordPDF()
  abrirDividir(file)
}

function enviarWordPDFParaJuntar(){
  if(!resultadoWordPDFBytes) return
  const file=bytesParaFile(resultadoWordPDFBytes, resultadoWordPDFNome)
  limparWordPDF()
  abrirUnificador([file])
}


// ===================== EXCEL PARA PDF =====================

let excelpdfFileRef=null
let resultadoExcelPDFBytes=null
let resultadoExcelPDFNome=""

document.getElementById("excelpdfInput").addEventListener("change",async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  carregarFileNoExcelPDF(file)
})

function carregarFileNoExcelPDF(file){
  excelpdfFileRef=file
  resultadoExcelPDFBytes=null
  document.getElementById("resultado-excelpdf").style.display="none"
  document.getElementById("excelpdf-status").textContent=""
  criarInfoBox("excelpdf-info-box","excelpdf-nome",file.name)
  document.getElementById("excelpdf-bar-info").textContent="1 arquivo selecionado: "+file.name
}

function limparExcelPDF(){
  excelpdfFileRef=null
  resultadoExcelPDFBytes=null
  resultadoExcelPDFNome=""
  document.getElementById("excelpdf-info-box").style.display="none"
  document.getElementById("excelpdf-status").textContent=""
  document.getElementById("resultado-excelpdf").style.display="none"
  document.getElementById("excelpdf-bar-info").textContent=""
  document.getElementById("excelpdfInput").value=""
}

async function converterExcelParaPDF(){
  if(!excelpdfFileRef){alert("Selecione um arquivo Excel primeiro");return}
  const acessoExcelPdf=await validarAcessoRecursoComPlano("excel_pdf", 1)
  if(!acessoExcelPdf.permitido){
    mostrarCtaUpgradePremium(acessoExcelPdf.motivo)
    return
  }
  garantirTelasDeProcesso()
  const status=document.getElementById("excelpdf-status")
  const usarTelaProcesso=Boolean(document.getElementById("excelpdf-processo"))
  const atualizarStatusExcelPdf=(percentual, mensagem, titulo="Convertendo planilha")=>{
    status.textContent=mensagem
    if(usarTelaProcesso){
      atualizarTelaProcesso("excelpdf-section","excelpdf-processo",percentual,titulo,mensagem)
    }
  }
  if(usarTelaProcesso){
    atualizarTelaProcesso("excelpdf-section","excelpdf-processo",4,"Preparando conversao...","Validando a planilha selecionada...")
    document.getElementById("excelpdf-processo")?.scrollIntoView({behavior:"smooth", block:"start"})
  }

  try{
    atualizarStatusExcelPdf(12,"Lendo planilha Excel...","Lendo planilha")
    const XLSX=await carregarSheetJS()
    const arrayBuffer=await excelpdfFileRef.arrayBuffer()
    const workbook=XLSX.read(arrayBuffer,{type:"array"})

    atualizarStatusExcelPdf(24,"Gerando PDF...","Gerando PDF")

    const novoPdf=await PDFLib.PDFDocument.create()
    const fontSize=9
    const margin=30
    const lineHeight=14
    const pageWidth=842
    const pageHeight=595

    for(let i=0;i<workbook.SheetNames.length;i++){
      const sheetName=workbook.SheetNames[i]
      const percentual=24+Math.round(((i+1)/Math.max(workbook.SheetNames.length,1))*58)
      atualizarStatusExcelPdf(percentual,"Processando aba: "+sheetName+" ("+(i+1)+" de "+workbook.SheetNames.length+")...","Gerando PDF")
      const sheet=workbook.Sheets[sheetName]
      const dados=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""})

      let page=novoPdf.addPage([pageWidth,pageHeight])
      let y=pageHeight-margin

      page.drawText(normalizarTextoParaPdf("Aba: "+sheetName),{x:margin,y,size:12,color:PDFLib.rgb(0.2,0.2,0.8)})
      y-=lineHeight*2

      for(let linha of dados){
        if(y<margin+lineHeight){
          page=novoPdf.addPage([pageWidth,pageHeight])
          y=pageHeight-margin
        }
        const texto=linha.map(c=>String(c).substring(0,20)).join("  |  ").substring(0,130)
        const textoSeguro=normalizarTextoParaPdf(texto)
        page.drawText(textoSeguro,{x:margin,y,size:fontSize,color:PDFLib.rgb(0.1,0.1,0.1)})
        y-=lineHeight
      }
    }

    resultadoExcelPDFBytes=await novoPdf.save()
    resultadoExcelPDFNome=excelpdfFileRef.name.replace(/\.(xls|xlsx)$/i,"")+".pdf"
    status.textContent="Conversão concluída!"
    if(usarTelaProcesso){
      await concluirEtapaTelaProcesso("excelpdf-section","excelpdf-processo","Arquivo pronto","PDF gerado com sucesso.","Preparando conversao...","Aguarde enquanto o PDF e gerado.")
    }
    document.getElementById("resultado-excelpdf").style.display="block"
    renderizarEncadeamentoResultado("resultado-excelpdf","excelpdf",[
      {bytes:resultadoExcelPDFBytes, nome:resultadoExcelPDFNome}
    ], {ocultarDestinos:["dividir"]})
    if(!acessoExcelPdf.premiumAtivo){
      registrarUsoGratuitoRecurso("excel_pdf", 1)
    }
    document.getElementById("resultado-excelpdf").scrollIntoView({behavior:"smooth"})
    await iniciarDownloadAutomatico(baixarResultadoExcelPDF, "Download do PDF iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    if(usarTelaProcesso){
      ocultarTelaProcesso("excelpdf-section","excelpdf-processo","Preparando conversao...","Aguarde enquanto o PDF e gerado.")
    }
    status.textContent="Falha ao converter a planilha."
    mostrarErro("Não foi possível converter este arquivo Excel para PDF.")
  }
}

function baixarResultadoExcelPDF(){
  if(!resultadoExcelPDFBytes) return
  baixarArquivo(resultadoExcelPDFBytes, resultadoExcelPDFNome)
}

function enviarExcelPDFParaCompactar(){
  if(!resultadoExcelPDFBytes) return
  const file=bytesParaFile(resultadoExcelPDFBytes, resultadoExcelPDFNome)
  limparExcelPDF()
  abrirCompactar([file])
}

function enviarExcelPDFParaDividir(){
  if(!resultadoExcelPDFBytes) return
  const file=bytesParaFile(resultadoExcelPDFBytes, resultadoExcelPDFNome)
  limparExcelPDF()
  abrirDividir(file)
}

function enviarExcelPDFParaJuntar(){
  if(!resultadoExcelPDFBytes) return
  const file=bytesParaFile(resultadoExcelPDFBytes, resultadoExcelPDFNome)
  limparExcelPDF()
  abrirUnificador([file])
}


// ===================== EXCEL PARA WORD =====================

let excelwordFileRef=null
let resultadoExcelWordBlob=null
let resultadoExcelWordNome=""

document.getElementById("excelwordInput").addEventListener("change",async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  carregarFileNoExcelWord(file)
})

function carregarFileNoExcelWord(file){
  excelwordFileRef=file
  resultadoExcelWordBlob=null
  document.getElementById("resultado-excelword").style.display="none"
  document.getElementById("excelword-status").textContent=""
  criarInfoBox("excelword-info-box","excelword-nome",file.name)
  document.getElementById("excelword-bar-info").textContent="1 arquivo selecionado: "+file.name
}

function limparExcelWord(){
  excelwordFileRef=null
  resultadoExcelWordBlob=null
  resultadoExcelWordNome=""
  document.getElementById("excelword-info-box").style.display="none"
  document.getElementById("excelword-status").textContent=""
  document.getElementById("resultado-excelword").style.display="none"
  document.getElementById("excelword-bar-info").textContent=""
  document.getElementById("excelwordInput").value=""
}

async function converterExcelParaWord(){
  if(!excelwordFileRef){alert("Selecione um arquivo Excel primeiro");return}
  const acessoExcelWord=await validarAcessoRecursoComPlano("excel_word", 1)
  if(!acessoExcelWord.permitido){
    mostrarCtaUpgradePremium(acessoExcelWord.motivo)
    return
  }
  garantirTelasDeProcesso()
  const status=document.getElementById("excelword-status")
  const usarTelaProcesso=Boolean(document.getElementById("excelword-processo"))
  const atualizarStatusExcelWord=(percentual, mensagem, titulo="Convertendo planilha")=>{
    status.textContent=mensagem
    if(usarTelaProcesso){
      atualizarTelaProcesso("excelword-section","excelword-processo",percentual,titulo,mensagem)
    }
  }
  if(usarTelaProcesso){
    atualizarTelaProcesso("excelword-section","excelword-processo",4,"Preparando conversao...","Validando a planilha selecionada...")
    document.getElementById("excelword-processo")?.scrollIntoView({behavior:"smooth", block:"start"})
  }

  try{
    atualizarStatusExcelWord(12,"Lendo planilha Excel...","Lendo planilha")

    const XLSX=await carregarSheetJS()
    const arrayBuffer=await excelwordFileRef.arrayBuffer()
    const workbook=XLSX.read(arrayBuffer,{type:"array"})

    atualizarStatusExcelWord(24,"Gerando Word...","Gerando documento")

    let paragrafos=[]

    for(let i=0;i<workbook.SheetNames.length;i++){
      const sheetName=workbook.SheetNames[i]
      const percentual=24+Math.round(((i+1)/Math.max(workbook.SheetNames.length,1))*58)
      atualizarStatusExcelWord(percentual,"Processando aba: "+sheetName+" ("+(i+1)+" de "+workbook.SheetNames.length+")...","Gerando documento")
      const sheet=workbook.Sheets[sheetName]
      const dados=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""})

      paragrafos.push("=== Aba: "+sheetName+" ===")
      paragrafos.push("")

      for(let linha of dados){
        const texto=linha.map(c=>String(c)).join("\t | \t")
        if(texto.trim()) paragrafos.push(texto)
      }
      paragrafos.push("")
      paragrafos.push("--- Fim da aba "+sheetName+" ---")
      paragrafos.push("")
    }

    resultadoExcelWordBlob=await gerarDocxDeParagrafos(paragrafos, excelwordFileRef.name)
    resultadoExcelWordNome=excelwordFileRef.name.replace(/\.(xls|xlsx)$/i,"")+".docx"
    status.textContent="Conversão concluída!"
    if(usarTelaProcesso){
      await concluirEtapaTelaProcesso("excelword-section","excelword-processo","Arquivo pronto","Word gerado com sucesso.","Preparando conversao...","Aguarde enquanto o Word e gerado.")
    }
    document.getElementById("resultado-excelword").style.display="block"
    if(!acessoExcelWord.premiumAtivo){
      registrarUsoGratuitoRecurso("excel_word", 1)
    }
    document.getElementById("resultado-excelword").scrollIntoView({behavior:"smooth"})
    await iniciarDownloadAutomatico(baixarResultadoExcelWord, "Download do Word iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    if(usarTelaProcesso){
      ocultarTelaProcesso("excelword-section","excelword-processo","Preparando conversao...","Aguarde enquanto o Word e gerado.")
    }
    status.textContent="Falha ao converter a planilha."
    mostrarErro("Não foi possível converter este arquivo Excel para Word.")
  }
}

function baixarResultadoExcelWord(){
  if(!resultadoExcelWordBlob) return
  baixarBlob(resultadoExcelWordBlob, resultadoExcelWordNome)
}


// ===================== JUNTAR PASTAS =====================

const MAX_PASTAS = 20
const PLANOS_JUNTAR_PASTAS = Object.freeze({
  gratuito: Object.freeze({
    codigo:"gratuito",
    nome:"Gratuito",
    maxPastas:MAX_PASTAS,
    maxArquivosPorPasta:35,
    maxBytesTotal:150*1024*1024,
    permiteSubpastas:false,
    permiteLote:false
  }),
  premium: Object.freeze({
    codigo:"premium",
    nome:"Premium",
    maxPastas:MAX_PASTAS,
    maxArquivosPorPasta:500,
    maxBytesTotal:2*1024*1024*1024,
    permiteSubpastas:true,
    permiteLote:true
  }),
  administrador: Object.freeze({
    codigo:"administrador",
    nome:"Administrador",
    maxPastas:100,
    maxArquivosPorPasta:2000,
    maxBytesTotal:5*1024*1024*1024,
    permiteSubpastas:true,
    permiteLote:true
  })
})

let planoJuntarPastasAtual="gratuito"
let planoJuntarPastasPromise=null

let pastasLista = [] // [{nomePasta, arquivos:[File]}]
let resultadosPastasBytes = [] // [{nome, bytes}]

function obterPlanoJuntarPastasAtual(){
  return PLANOS_JUNTAR_PASTAS[planoJuntarPastasAtual] || PLANOS_JUNTAR_PASTAS.gratuito
}

function formatarBytesJuntarPastas(bytes){
  const valor=Number(bytes||0)
  if(!Number.isFinite(valor) || valor<=0) return "0 B"
  if(valor>=1024*1024*1024) return (valor/(1024*1024*1024)).toFixed(2)+" GB"
  if(valor>=1024*1024) return (valor/(1024*1024)).toFixed(1)+" MB"
  if(valor>=1024) return (valor/1024).toFixed(1)+" KB"
  return Math.round(valor)+" B"
}

function somarBytesArquivosJuntarPastas(arquivos){
  if(!Array.isArray(arquivos)) return 0
  return arquivos.reduce((soma,file)=>soma+Number(file?.size||0),0)
}

function obterTotalBytesJuntarPastas(){
  return pastasLista.reduce((soma,pasta)=>soma+somarBytesArquivosJuntarPastas(pasta?.arquivos||[]),0)
}

function obterTotalArquivosJuntarPastas(){
  return pastasLista.reduce((soma,pasta)=>soma+Number(pasta?.arquivos?.length||0),0)
}

function arquivoEstaEmSubpastaJuntarPastas(file){
  const caminho=String(file?.webkitRelativePath||"").replace(/\\/g,"/").replace(/^\/+/,"")
  if(!caminho) return false
  const partes=caminho.split("/").filter(Boolean)
  return partes.length>2
}

function analisarEntradaPastaJuntarPastas(nomePasta, arquivos){
  const plano=obterPlanoJuntarPastasAtual()
  const lista=Array.isArray(arquivos) ? arquivos.filter(Boolean) : []

  if(lista.length===0){
    return {
      ok:false,
      codigo:"sem_arquivos",
      motivo:"Nenhum PDF valido foi encontrado nessa entrada."
    }
  }

  if(!plano.permiteSubpastas && lista.some(arquivoEstaEmSubpastaJuntarPastas)){
    return {
      ok:false,
      codigo:"subpastas",
      motivo:`\"${nomePasta}\" possui subpastas. No plano gratuito use apenas PDFs na pasta principal.`
    }
  }

  if(lista.length>plano.maxArquivosPorPasta){
    return {
      ok:false,
      codigo:"arquivos_por_pasta",
      motivo:`\"${nomePasta}\" excede o limite do plano ${plano.nome.toLowerCase()}: ${lista.length} arquivos. O maximo e ${plano.maxArquivosPorPasta} por pasta.`
    }
  }

  if(plano.codigo==="gratuito"){
    const totalAtual=obterTotalArquivosJuntarPastas()
    if(totalAtual+lista.length>LIMITE_PDFS_GRATUITO_POR_FERRAMENTA){
      const restante=Math.max(LIMITE_PDFS_GRATUITO_POR_FERRAMENTA-totalAtual,0)
      return {
        ok:false,
        codigo:"arquivos_totais",
        motivo:`No plano gratuito, o Juntar Pastas aceita ate ${LIMITE_PDFS_GRATUITO_POR_FERRAMENTA} PDFs por ferramenta. Restam ${restante}.`
      }
    }
  }

  const bytesEntrada=somarBytesArquivosJuntarPastas(lista)
  const bytesAtuais=obterTotalBytesJuntarPastas()
  if(bytesAtuais+bytesEntrada>plano.maxBytesTotal){
    const restante=Math.max(plano.maxBytesTotal-bytesAtuais,0)
    return {
      ok:false,
      codigo:"bytes_totais",
      motivo:`Limite total do plano ${plano.nome.toLowerCase()} atingido. Restam ${formatarBytesJuntarPastas(restante)} de ${formatarBytesJuntarPastas(plano.maxBytesTotal)}.`
    }
  }

  return {
    ok:true,
    codigo:"ok",
    arquivos:lista,
    bytes:bytesEntrada
  }
}

function validarColecaoJuntarPastas(){
  const plano=obterPlanoJuntarPastasAtual()
  const totalBytes=obterTotalBytesJuntarPastas()
  const totalArquivos=obterTotalArquivosJuntarPastas()

  if(plano.codigo==="gratuito" && totalArquivos>LIMITE_PDFS_GRATUITO_POR_FERRAMENTA){
    return {
      ok:false,
      codigo:"arquivos_totais",
      motivo:`No plano gratuito, o Juntar Pastas aceita ate ${LIMITE_PDFS_GRATUITO_POR_FERRAMENTA} PDFs por ferramenta.`
    }
  }

  if(totalBytes>plano.maxBytesTotal){
    return {
      ok:false,
      codigo:"bytes_totais",
      motivo:`O total carregado excede ${formatarBytesJuntarPastas(plano.maxBytesTotal)} para o plano ${plano.nome.toLowerCase()}.`
    }
  }

  for(const pasta of pastasLista){
    const arquivos=Array.isArray(pasta?.arquivos) ? pasta.arquivos : []
    if(arquivos.length===0){
      return {
        ok:false,
        codigo:"sem_arquivos",
        motivo:`A entrada \"${pasta?.nomePasta||"Pasta"}\" nao possui PDFs validos.`
      }
    }
    if(arquivos.length>plano.maxArquivosPorPasta){
      return {
        ok:false,
        codigo:"arquivos_por_pasta",
        motivo:`\"${pasta?.nomePasta||"Pasta"}\" excede ${plano.maxArquivosPorPasta} arquivos por pasta para o plano ${plano.nome.toLowerCase()}.`
      }
    }
    if(!plano.permiteSubpastas && arquivos.some(arquivoEstaEmSubpastaJuntarPastas)){
      return {
        ok:false,
        codigo:"subpastas",
        motivo:"Subpastas sao permitidas apenas no Premium para Juntar Pastas."
      }
    }
  }

  return {ok:true}
}

function bloqueioPlanoComCtaPremium(resultado){
  const plano=obterPlanoJuntarPastasAtual()
  if(plano.codigo!=="gratuito") return false
  const codigo=String(resultado?.codigo||"")
  return codigo==="subpastas" || codigo==="arquivos_por_pasta" || codigo==="arquivos_totais" || codigo==="bytes_totais"
}

function mostrarFeedbackBloqueioJuntarPastas(resultado){
  if(!resultado?.motivo) return
  if(bloqueioPlanoComCtaPremium(resultado)){
    mostrarAvisoComAcao(
      resultado.motivo,
      "Ir para Premium",
      ()=>{ window.location.href="premium.html" }
    )
    return
  }
  mostrarAviso(resultado.motivo)
}

function aplicarDescricaoPlanoJuntarPastas(){
  const secao=document.getElementById("juntarpastas-section")
  if(!secao) return

  const descricao=secao.querySelector(".unificador-header p")
  if(descricao){
    descricao.textContent="Cada pasta gera um PDF separado. Gratuito: ate 35 PDFs por ferramenta e 150 MB totais (sem subpastas). Premium: ate 500 arquivos por pasta e 2 GB totais. Administrador: limites estendidos."
  }

  const hint=secao.querySelector(".pastas-adicionar-hint")
  if(hint){
    const plano=obterPlanoJuntarPastasAtual()
    let resumoPlano="Plano gratuito ativo: sem subpastas, ate 35 PDFs por ferramenta e 150 MB totais."
    if(plano.codigo==="administrador"){
      resumoPlano="Perfil administrador ativo: limites estendidos e fluxo em lote liberado."
    }else if(plano.codigo==="premium"){
      resumoPlano="Plano Premium ativo: subpastas e processamento em lote liberados."
    }
    hint.textContent="Aceita ZIP, RAR, 7Z, TAR e outros compactados compativeis. "+resumoPlano
  }
}

async function detectarPlanoJuntarPastas({forcar=false}={}){
  if(planoJuntarPastasPromise && !forcar) return await planoJuntarPastasPromise

  planoJuntarPastasPromise=(async()=>{
    const proximoPlano=await obterPlanoAssinaturaAtual({forcar})

    planoJuntarPastasAtual=proximoPlano
    aplicarDescricaoPlanoJuntarPastas()
    atualizarInfoJuntarPastas()
    return proximoPlano
  })()

  try{
    return await planoJuntarPastasPromise
  }finally{
    planoJuntarPastasPromise=null
  }
}

async function adicionarPastaListaJuntarPastas(nomePasta, arquivos){
  const plano=obterPlanoJuntarPastasAtual()
  if(pastasLista.length >= plano.maxPastas){
    return {
      ok:false,
      codigo:"max_pastas",
      motivo:"Limite de "+plano.maxPastas+" pastas atingido."
    }
  }

  const analise=analisarEntradaPastaJuntarPastas(nomePasta, arquivos)
  if(!analise.ok) return analise

  pastasLista.push({
    nomePasta,
    arquivos: ordenarArquivosPastaInicialmente(analise.arquivos),
    expandida: false
  })
  await renderizarPastaCard(pastasLista.length-1)
  return {ok:true, codigo:"adicionada"}
}

async function adicionarPasta(){
  mostrarAvisoConfirmacaoPasta()
  await detectarPlanoJuntarPastas()
  const plano=obterPlanoJuntarPastasAtual()

  if(pastasLista.length >= plano.maxPastas){
    alert("Limite de "+plano.maxPastas+" pastas atingido.")
    return
  }

  const input = document.createElement("input")
  input.type = "file"
  input.webkitdirectory = true
  input.style.display = "none"
  document.body.appendChild(input)
  input.addEventListener("change", async(e)=>{
    document.body.removeChild(input)
    const arquivosSelecionados = Array.from(e.target.files||[])
    const pdfs = arquivosSelecionados.filter(f=>f.type==="application/pdf" || /\.pdf$/i.test(f.name))
    const compactados = arquivosSelecionados.filter(arquivoEhCompactado)
    if(pdfs.length===0 && compactados.length===0){
      alert("Nenhum PDF ou compactado encontrado nessa pasta.")
      return
    }

    const nomePasta = arquivosSelecionados[0]?.webkitRelativePath?.split("/")[0] || ("Pasta "+(pastasLista.length+1))
    let adicionadas = 0
    let compactadosLidos = 0
    let compactadosIgnorados = 0
    const bloqueios=[]

    const registrarBloqueio=(resultado)=>{
      if(!resultado?.motivo) return
      const codigo=String(resultado?.codigo||"")
      if(bloqueios.some((item)=>item.motivo===resultado.motivo && item.codigo===codigo)) return
      bloqueios.push({
        codigo,
        motivo:resultado.motivo
      })
    }

    mostrarLoading("Lendo pasta selecionada...")

    if(pdfs.length>0 && pastasLista.length < plano.maxPastas){
      const resultadoPrincipal = await adicionarPastaListaJuntarPastas(nomePasta, pdfs)
      if(resultadoPrincipal.ok){
        adicionadas++
      }else{
        registrarBloqueio(resultadoPrincipal)
      }
    }

    for(const compactado of compactados){
      if(pastasLista.length >= plano.maxPastas) break
      try{
        const grupos = await extrairPastasDeCompactadoParaJuntar(compactado)
        if(grupos.length===0){
          compactadosIgnorados++
          continue
        }
        compactadosLidos++
        const baseCompactado = nomeBaseSemExtensao(compactado.name)
        for(const grupo of grupos){
          if(pastasLista.length >= plano.maxPastas) break
          const pdfsGrupo = grupo.arquivos.filter(f=>f.type==="application/pdf" || /\.pdf$/i.test(f.name))
          if(pdfsGrupo.length===0) continue
          const nomeGrupo = grupos.length===1
            ? baseCompactado
            : `${baseCompactado} - ${grupo.nomePasta}`
          const resultadoGrupo = await adicionarPastaListaJuntarPastas(nomeGrupo, pdfsGrupo)
          if(resultadoGrupo.ok){
            adicionadas++
          }else{
            registrarBloqueio(resultadoGrupo)
          }
        }
      }catch(err){
        console.warn("Nao foi possivel ler o compactado dentro da pasta:", compactado.name, err)
        compactadosIgnorados++
      }
    }

    esconderLoading()
    atualizarInfoJuntarPastas()

    if(adicionadas===0){
      if(bloqueios.length>0){
        mostrarFeedbackBloqueioJuntarPastas(bloqueios[0])
      }else{
        alert("Nenhum PDF valido foi encontrado na pasta ou nos compactados.")
      }
      return
    }

    if(compactados.length>0){
      const resumoCompactados = compactadosLidos>0
        ? ` ${compactadosLidos} compactado(s) lido(s).`
        : ""
      const resumoIgnorados = compactadosIgnorados>0
        ? ` ${compactadosIgnorados} compactado(s) nao puderam ser usados.`
        : ""
      mostrarSucesso(adicionadas+" entrada"+(adicionadas>1?"s adicionadas":" adicionada")+"."+resumoCompactados+resumoIgnorados)
      if(bloqueios.length>0) mostrarFeedbackBloqueioJuntarPastas(bloqueios[0])
      return
    }

    if(bloqueios.length>0){
      mostrarFeedbackBloqueioJuntarPastas(bloqueios[0])
    }
  })
  input.click()
}

async function adicionarCompactadoJuntarPastas(){
  await detectarPlanoJuntarPastas()
  const plano=obterPlanoJuntarPastasAtual()

  if(pastasLista.length >= plano.maxPastas){
    alert("Limite de "+plano.maxPastas+" pastas atingido.")
    return
  }

  const input=document.getElementById("pastaCompactadoInput")
  if(!input) return

  input.onchange=async(e)=>{
    const arquivo=e.target.files?.[0]
    input.value=""
    if(!arquivo) return

    mostrarLoading("Lendo compactado: "+arquivo.name+"...")
    let grupos=[]
    try{
      grupos=await extrairPastasDeCompactadoParaJuntar(arquivo)
    }catch(err){
      console.error(err)
      esconderLoading()
      mostrarErro("Nao foi possivel abrir esse compactado. Verifique se ele nao esta protegido por senha ou corrompido.")
      return
    }

    if(grupos.length===0){
      esconderLoading()
      alert("Nenhum PDF encontrado nesse compactado.")
      return
    }

    const bloqueios=[]
    const registrarBloqueio=(resultado)=>{
      if(!resultado?.motivo) return
      const codigo=String(resultado?.codigo||"")
      if(bloqueios.some((item)=>item.motivo===resultado.motivo && item.codigo===codigo)) return
      bloqueios.push({
        codigo,
        motivo:resultado.motivo
      })
    }

    let adicionadas=0
    for(const grupo of grupos){
      const pdfsGrupo=grupo.arquivos.filter(f=>f.type==="application/pdf" || /\.pdf$/i.test(f.name))
      const resultado=await adicionarPastaListaJuntarPastas(grupo.nomePasta, pdfsGrupo)
      if(resultado.ok){
        adicionadas++
      }else{
        registrarBloqueio(resultado)
      }
      if(pastasLista.length >= plano.maxPastas) break
    }

    esconderLoading()
    atualizarInfoJuntarPastas()

    if(adicionadas===0){
      if(bloqueios.length>0){
        mostrarFeedbackBloqueioJuntarPastas(bloqueios[0])
      }else{
        mostrarErro("Nao foi possivel adicionar novas pastas. Verifique o limite atual.")
      }
      return
    }

    if(grupos.length>adicionadas){
      mostrarSucesso(adicionadas+" pasta(s) adicionadas. O restante foi ignorado por causa do limite.")
    }else{
      mostrarSucesso(adicionadas+" pasta"+(adicionadas>1?"s adicionadas":" adicionada")+" via compactado!")
    }

    if(bloqueios.length>0){
      mostrarFeedbackBloqueioJuntarPastas(bloqueios[0])
    }
  }

  input.click()
}

async function renderizarPastaCard(idx){
  const {nomePasta, arquivos, expandida} = pastasLista[idx]
  const lista = document.getElementById("pastas-lista")

  const card = document.createElement("div")
  card.className = "pasta-card"
  if(expandida) card.classList.add("expandida")
  card.id = "pasta-card-"+idx

  // Header da pasta
  const header = document.createElement("div")
  header.className = "pasta-card-header"

  const numero = document.createElement("div")
  numero.className = "pasta-numero"
  numero.textContent = String(idx+1).padStart(2,"0")

  const info = document.createElement("div")
  info.className = "pasta-card-info"

  const nomeEl = document.createElement("div")
  nomeEl.className = "pasta-nome"
  nomeEl.textContent = normalizarRotuloVisualPortugues(nomePasta)

  const qtdEl = document.createElement("div")
  qtdEl.className = "pasta-qtd"
  qtdEl.textContent = arquivos.length+" PDF"+(arquivos.length>1?"s":"")

  const hintEl = document.createElement("div")
  hintEl.className = "pasta-hint"
  hintEl.textContent = expandida
    ? "Arraste os PDFs para organizar a ordem final."
    : "Clique para abrir e organizar os PDFs desta pasta."

  const acoes = document.createElement("div")
  acoes.className = "pasta-card-actions"

  const btnExpandir = document.createElement("button")
  btnExpandir.className = "btn atalho btn-sm"
  btnExpandir.type = "button"
  btnExpandir.textContent = expandida ? "Ocultar PDFs" : "Organizar PDFs"
  btnExpandir.onclick = (e)=>{
    e.stopPropagation()
    alternarExpandirPasta(idx)
  }

  const btnRemover = document.createElement("button")
  btnRemover.className = "btn danger btn-sm"
  btnRemover.type = "button"
  btnRemover.textContent = "Remover"
  btnRemover.onclick = (e)=>{
    e.stopPropagation()
    removerPasta(idx)
  }

  info.appendChild(nomeEl)
  info.appendChild(qtdEl)
  info.appendChild(hintEl)
  acoes.appendChild(btnExpandir)
  acoes.appendChild(btnRemover)
  header.appendChild(numero)
  header.appendChild(info)
  header.appendChild(acoes)
  card.appendChild(header)

  const thumbs = document.createElement("div")
  thumbs.className = "pasta-thumbs"
  thumbs.onclick = ()=>alternarExpandirPasta(idx)

  for(let i=0;i<Math.min(arquivos.length,5);i++){
    try{
      const {card:thumb} = await criarThumbCard(arquivos[i])
      thumb.classList.add("thumb-card-folder-preview")
      const badge=thumb.querySelector(".thumb-order-badge")
      if(badge) badge.textContent = String(i+1).padStart(2,"0")
      thumbs.appendChild(thumb)
    }catch(e){}
  }
  if(arquivos.length>5){
    const mais = document.createElement("div")
    mais.className = "thumb-mais"
    mais.textContent = "+"+(arquivos.length-5)
    thumbs.appendChild(mais)
  }

  card.appendChild(thumbs)

  if(expandida){
    const painel = document.createElement("div")
    painel.className = "pasta-expandida-painel"

    const topo = document.createElement("div")
    topo.className = "pasta-expandida-topo"

    const titulo = document.createElement("div")
    titulo.className = "pasta-expandida-titulo"
    titulo.textContent = "Ordem dos PDFs desta pasta"

    const texto = document.createElement("div")
    texto.className = "pasta-expandida-texto"
    texto.textContent = "Arraste uma miniatura sobre a outra para reorganizar o PDF final."

    topo.appendChild(titulo)
    topo.appendChild(texto)

    const grid = document.createElement("div")
    grid.className = "pasta-thumbs-expandida-grid"

    for(let i=0;i<arquivos.length;i++){
      try{
        const {card:thumb} = await criarThumbCard(arquivos[i])
        thumb.classList.add("thumb-card-folder")
        const badge=thumb.querySelector(".thumb-order-badge")
        if(badge) badge.textContent = String(i+1).padStart(2,"0")
        habilitarOrdenacaoArquivoDentroDaPasta(thumb, idx, i)
        grid.appendChild(thumb)
      }catch(e){}
    }

    painel.appendChild(topo)
    painel.appendChild(grid)
    card.appendChild(painel)
  }

  lista.appendChild(card)
}

function removerPasta(idx){
  pastasLista.splice(idx,1)
  rerenderPastasLista()
  atualizarInfoJuntarPastas()
}

async function rerenderPastasLista(){
  const lista=document.getElementById("pastas-lista")
  if(!lista) return
  lista.innerHTML=""
  for(let i=0;i<pastasLista.length;i++){
    await renderizarPastaCard(i)
  }
}

function alternarExpandirPasta(idx){
  const pasta=pastasLista[idx]
  if(!pasta) return
  pasta.expandida=!pasta.expandida
  rerenderPastasLista()
}

function reordenarArquivosDaPasta(pastaIdx, origemIdx, destinoIdx){
  const pasta=pastasLista[pastaIdx]
  if(!pasta) return
  if(origemIdx===destinoIdx) return
  if(origemIdx<0 || destinoIdx<0) return
  if(origemIdx>=pasta.arquivos.length || destinoIdx>=pasta.arquivos.length) return
  const [arquivo]=pasta.arquivos.splice(origemIdx,1)
  pasta.arquivos.splice(destinoIdx,0,arquivo)
  pasta.expandida=true
  rerenderPastasLista()
}

function habilitarOrdenacaoArquivoDentroDaPasta(card, pastaIdx, arquivoIdx){
  card.draggable=true
  card.classList.add("thumb-card-sortable")
  card.setAttribute("aria-label","Arraste para reorganizar o PDF dentro da pasta")

  card.addEventListener("dragstart",(e)=>{
    pastaArquivoArrastandoInfo={pastaIdx, arquivoIdx}
    bloquearCliqueThumbAte=Date.now()+350
    card.classList.add("thumb-card-dragging")
    if(e.dataTransfer){
      e.dataTransfer.effectAllowed="move"
      e.dataTransfer.setData("text/plain", `${pastaIdx}:${arquivoIdx}`)
    }
  })

  card.addEventListener("dragend",()=>{
    pastaArquivoArrastandoInfo=null
    bloquearCliqueThumbAte=Date.now()+350
    card.classList.remove("thumb-card-dragging")
    document.querySelectorAll(".thumb-card-drop-target").forEach(el=>el.classList.remove("thumb-card-drop-target"))
  })

  card.addEventListener("dragover",(e)=>{
    if(!pastaArquivoArrastandoInfo) return
    if(pastaArquivoArrastandoInfo.pastaIdx!==pastaIdx) return
    if(pastaArquivoArrastandoInfo.arquivoIdx===arquivoIdx) return
    e.preventDefault()
    card.classList.add("thumb-card-drop-target")
    if(e.dataTransfer) e.dataTransfer.dropEffect="move"
  })

  card.addEventListener("dragleave",()=>{
    card.classList.remove("thumb-card-drop-target")
  })

  card.addEventListener("drop",(e)=>{
    if(!pastaArquivoArrastandoInfo) return
    if(pastaArquivoArrastandoInfo.pastaIdx!==pastaIdx) return
    if(pastaArquivoArrastandoInfo.arquivoIdx===arquivoIdx) return
    e.preventDefault()
    e.stopPropagation()
    card.classList.remove("thumb-card-drop-target")
    reordenarArquivosDaPasta(pastaIdx, pastaArquivoArrastandoInfo.arquivoIdx, arquivoIdx)
  })
}

function atualizarInfoJuntarPastas(){
  const plano=obterPlanoJuntarPastasAtual()
  const total=pastasLista.length
  const totalArquivos=obterTotalArquivosJuntarPastas()
  const totalBytes=obterTotalBytesJuntarPastas()
  const restante=Math.max(plano.maxBytesTotal-totalBytes,0)

  const contador=document.getElementById("pastas-contador")
  if(contador){
    contador.textContent=`${total}/${plano.maxPastas} pastas | ${formatarBytesJuntarPastas(totalBytes)}/${formatarBytesJuntarPastas(plano.maxBytesTotal)}`
  }

  const infoBar=document.getElementById("juntarpastas-info")
  if(infoBar){
    const partes=[
      `Plano ${plano.nome.toLowerCase()}`,
      `${total} pasta${total!==1?"s":""}`,
      `${totalArquivos} PDF${totalArquivos!==1?"s":""}`,
      `${formatarBytesJuntarPastas(totalBytes)} de ${formatarBytesJuntarPastas(plano.maxBytesTotal)}`,
      `ate ${plano.maxArquivosPorPasta} arquivos por pasta`,
      plano.permiteSubpastas ? "subpastas liberadas" : "sem subpastas"
    ]
    if(plano.codigo==="gratuito"){
      partes.push(`limite total ${LIMITE_PDFS_GRATUITO_POR_FERRAMENTA} PDFs`)
    }
    if(restante>0) partes.push(`restante ${formatarBytesJuntarPastas(restante)}`)
    infoBar.textContent=partes.join(" | ")
  }

  const limitePastasAtingido=total>=plano.maxPastas
  const btnAddPasta=document.getElementById("btn-add-pasta")
  if(btnAddPasta) btnAddPasta.disabled=limitePastasAtingido
  const btnCompactado=document.getElementById("btn-add-compactado")
  if(btnCompactado) btnCompactado.disabled=limitePastasAtingido

  const resultado=document.getElementById("resultado-juntarpastas")
  if(resultado) resultado.style.display="none"
}

function limparJuntarPastas(){
  pastasLista=[]
  resultadosPastasBytes=[]
  document.getElementById("pastas-lista").innerHTML=""
  document.getElementById("juntarpastas-status").textContent=""
  document.getElementById("resultado-juntarpastas").style.display="none"
  document.getElementById("resultado-juntarpastas-btns").innerHTML=""
  document.getElementById("juntarpastas-info").textContent=""
  document.getElementById("pastas-contador").textContent=""
  document.getElementById("btn-add-pasta").disabled=false
  const btnCompactado=document.getElementById("btn-add-compactado")
  if(btnCompactado) btnCompactado.disabled=false
  aplicarDescricaoPlanoJuntarPastas()
  atualizarInfoJuntarPastas()
}

async function gerarPDFsDasPastas(){
  if(pastasLista.length===0){
    alert("Adicione pelo menos uma pasta.")
    return
  }

  await detectarPlanoJuntarPastas()
  const validacao=validarColecaoJuntarPastas()
  if(!validacao.ok){
    mostrarFeedbackBloqueioJuntarPastas(validacao)
    return
  }

  resultadosPastasBytes=[]
  const status=document.getElementById("juntarpastas-status")
  const btns=document.getElementById("resultado-juntarpastas-btns")
  btns.innerHTML=""
  document.getElementById("resultado-juntarpastas").style.display="none"

  for(let i=0;i<pastasLista.length;i++){
    const {nomePasta, arquivos} = pastasLista[i]
    const nomePastaExibicao=normalizarRotuloVisualPortugues(nomePasta)
    status.textContent="Gerando PDF da "+nomePastaExibicao+" ("+(i+1)+" de "+pastasLista.length+")..."

    const mergedPdf = await PDFLib.PDFDocument.create()

    const arquivosOrdenados = [...arquivos]

    for(let file of arquivosOrdenados){
      try{
        const bytes = await file.arrayBuffer()
        const pdf = await carregarPdfPreservandoAssinaturaVisual(bytes)
        const ordemPaginas = obterOrdemPaginasArquivo(file, pdf.getPageCount())
        const pages = await mergedPdf.copyPages(pdf, ordemPaginas)
        pages.forEach(p=>mergedPdf.addPage(p))
      }catch(e){
        console.warn("Erro ao processar "+file.name, e)
      }
    }

    const pdfBytes = await mergedPdf.save()
    const nomeFinal = normalizarNomeSaidaPdf(nomePasta, "pasta_"+(i+1))
    resultadosPastasBytes.push({nome:nomeFinal, bytes:pdfBytes, qtd:arquivos.length})

    // Criar botao de download para esta pasta
    const btn = document.createElement("button")
    btn.className = "btn generate"
    btn.textContent = "⬇ "+nomeFinal+" ("+arquivos.length+" docs)"
    btn.onclick = (()=>{
      const b=pdfBytes, n=nomeFinal
      return ()=>baixarArquivo(b,n)
    })()
    btns.appendChild(btn)
  }

  // Botao baixar todos
  if(resultadosPastasBytes.length>1){
    const btnTodos = document.createElement("button")
    btnTodos.className = "btn primary"
    btnTodos.textContent = "⬇ Baixar Todos ("+resultadosPastasBytes.length+")"
    btnTodos.onclick = ()=>baixarColecaoResultados(resultadosPastasBytes, "PDFs_Das_Pastas.zip")
    btns.insertBefore(btnTodos, btns.firstChild)
  }

  status.textContent="Concluído! "+resultadosPastasBytes.length+" PDF"+(resultadosPastasBytes.length>1?"s gerados":"gerado")+"."
  document.getElementById("resultado-juntarpastas").style.display="block"
  renderizarEncadeamentoResultado("resultado-juntarpastas","juntarpastas",resultadosPastasBytes,{ocultarDestinos:["juntar"]})
  document.getElementById("resultado-juntarpastas").scrollIntoView({behavior:"smooth"})
  await iniciarDownloadAutomatico(
    ()=>baixarColecaoResultados(resultadosPastasBytes, "PDFs_Das_Pastas.zip"),
    resultadosPastasBytes.length>1
      ? "Download do ZIP das pastas iniciado automaticamente."
      : "Download do PDF da pasta iniciado automaticamente."
  )
}

// ===================== FERRAMENTAS COMPLEMENTARES =====================

function removerAcentosTexto(texto){
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
}

function formatarTamanhoArquivo(bytes){
  const valor=Number(bytes||0)
  if(!Number.isFinite(valor) || valor<=0) return "0 KB"
  if(valor<1024) return valor+" B"
  if(valor<1024*1024) return (valor/1024).toFixed(1)+" KB"
  return (valor/(1024*1024)).toFixed(2)+" MB"
}

function nomeBaseSemExtensao(nome){
  return String(nome||"arquivo").replace(/\.[^.]+$/,"")
}

function decodificarEntidadesXml(texto){
  return String(texto||"")
    .replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/&quot;/g,'"')
    .replace(/&apos;/g,"'")
}

function escaparHtml(texto){
  return String(texto||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;")
}

function quebrarTextoParaPdf(texto, font, size, larguraMaxima){
  const linhas=[]
  const paragrafos=String(texto||"").split(/\n+/)
  for(const paragrafoCru of paragrafos){
    const paragrafo=paragrafoCru.trim()
    if(!paragrafo){
      linhas.push("")
      continue
    }
    const palavras=paragrafo.split(/\s+/)
    let linhaAtual=""
    for(const palavra of palavras){
      const tentativa=linhaAtual ? linhaAtual+" "+palavra : palavra
      if(font.widthOfTextAtSize(tentativa, size)<=larguraMaxima){
        linhaAtual=tentativa
      }else{
        if(linhaAtual) linhas.push(linhaAtual)
        linhaAtual=palavra
      }
    }
    if(linhaAtual) linhas.push(linhaAtual)
  }
  return linhas
}

async function extrairTextoPdfPorPaginas(file){
  const dados=await file.arrayBuffer()
  const pdf=await pdfjsLib.getDocument({data:dados}).promise
  const paginas=[]
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i)
    const content=await page.getTextContent()
    const texto=content.items.map(item=>String(item.str||"")).join(" ").replace(/\s+/g," ").trim()
    paginas.push(texto)
  }
  return {
    totalPaginas: pdf.numPages,
    paginas,
    textoCompleto: paginas.join("\n\n")
  }
}

function criarListaHtmlAnalise(itens, textoVazio){
  if(!Array.isArray(itens) || itens.length===0){
    return `<p class="analysis-empty">${escaparHtml(textoVazio)}</p>`
  }
  return itens.map(item=>`<div class="analysis-list-item">${escaparHtml(item)}</div>`).join("")
}

function arquivoEhPowerPoint(file){
  return !!file && /\.(pptx|ppsx)$/i.test(file.name || "")
}

// ===================== REORGANIZAR PDF =====================

let reorganizarFileRef=null
let resultadoReorganizarBytes=null
let resultadoReorganizarNome=""

document.getElementById("reorganizarInput").addEventListener("change", async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarFileNoReorganizar(file)
  e.target.value=""
})

async function carregarFileNoReorganizar(file){
  reorganizarFileRef=file
  resultadoReorganizarBytes=null
  resultadoReorganizarNome=""
  document.getElementById("resultado-reorganizar").style.display="none"
  document.getElementById("reorganizar-status").textContent=""
  const gallery=document.getElementById("reorganizar-gallery")
  gallery.innerHTML=""
  const {card, totalPaginas}=await criarThumbCard(file)
  gallery.appendChild(card)
  document.getElementById("reorganizar-info").textContent=`1 arquivo | ${totalPaginas} páginas | Clique na miniatura para abrir as páginas`
}

function abrirModalReorganizacao(){
  if(!reorganizarFileRef){
    alert("Selecione um PDF primeiro.")
    return
  }
  abrirPaginasModal(reorganizarFileRef)
}

async function gerarPDFReorganizado(){
  if(!reorganizarFileRef){
    alert("Selecione um PDF primeiro.")
    return
  }
  const status=document.getElementById("reorganizar-status")
  status.textContent="Aplicando a ordem salva ao documento..."
  const bytes=await reorganizarFileRef.arrayBuffer()
  let pdf=await carregarPdfPreservandoAssinaturaVisual(bytes)
  pdf=await recriarPdfComOrdemAplicada(pdf, reorganizarFileRef)
  resultadoReorganizarBytes=await pdf.save()
  resultadoReorganizarNome=nomeBaseSemExtensao(reorganizarFileRef.name)+"_reorganizado.pdf"
  status.textContent="PDF reorganizado com sucesso."
  document.getElementById("resultado-reorganizar").style.display="block"
  renderizarEncadeamentoResultado("resultado-reorganizar","reorganizar",[
    {bytes:resultadoReorganizarBytes, nome:resultadoReorganizarNome}
  ], {ocultarDestinos:["reorganizar"]})
  document.getElementById("reorganizar-info").textContent="Nova ordem pronta para download."
  await iniciarDownloadAutomatico(baixarResultadoReorganizar, "Download do PDF reorganizado iniciado automaticamente.")
}

function baixarResultadoReorganizar(){
  if(!resultadoReorganizarBytes) return
  baixarArquivo(resultadoReorganizarBytes, resultadoReorganizarNome)
}

function restaurarOrdemReorganizar(){
  if(!reorganizarFileRef) return
  ordemPaginasPorArquivo.delete(reorganizarFileRef)
  if(modalPaginasEstado.file===reorganizarFileRef && modalPaginasEstado.total>0){
    modalPaginasEstado.ordem=ordemPaginasNatural(modalPaginasEstado.total)
    renderizarGridModalPaginas()
  }
  document.getElementById("resultado-reorganizar").style.display="none"
  document.getElementById("reorganizar-status").textContent="A ordem original foi restaurada."
  mostrarSucesso("Ordem original restaurada.")
}

function limparReorganizarPDF(){
  reorganizarFileRef=null
  resultadoReorganizarBytes=null
  resultadoReorganizarNome=""
  document.getElementById("reorganizar-gallery").innerHTML=""
  document.getElementById("reorganizar-status").textContent=""
  document.getElementById("reorganizar-info").textContent=""
  document.getElementById("reorganizarInput").value=""
  document.getElementById("resultado-reorganizar").style.display="none"
}

// ===================== ASSINAR PDF =====================

let assinarPdfFileRef=null
let assinarCertFileRef=null
let resultadoAssinaturaBytes=null
let resultadoAssinaturaNome=""
let assinaturaModoAtual="sign"
const ITI_VERIFIER_URL="https://verificador.iti.gov.br/"
const ICP_STATUS_VALIDOS=["aprovado","reprovado","indeterminado"]
let assinaturaValidacaoAtual={
  validationId:null,
  fileName:"",
  fileSha256:"",
  itiVerifierUrl:ITI_VERIFIER_URL
}

const assinaturaModosInfo={
  sign:{
    label:"Assinatura digital visível com data e hora locais.",
    botao:"ASSINAR PDF"
  },
  timestamp:{
    label:"Marcador de hora local com registro da data e hora do certificado no PDF.",
    botao:"APLICAR MARCADOR DE HORA"
  },
  "certify-visible":{
    label:"Certificação do documento com assinatura visível na página final.",
    botao:"CERTIFICAR PDF"
  },
  "certify-invisible":{
    label:"Certificação do documento com assinatura invisível e restrições de alteração.",
    botao:"CERTIFICAR PDF"
  }
}

document.getElementById("assinarPdfInput").addEventListener("change", async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarPdfParaAssinatura(file)
  e.target.value=""
})

document.getElementById("assinarCertInput").addEventListener("change", async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarCertificadoParaAssinatura(file)
  e.target.value=""
})

document.getElementById("assinar-icp-open-iti")?.addEventListener("click", abrirVerificadorIti)
document.getElementById("assinar-icp-save-btn")?.addEventListener("click", salvarValidacaoIcpBrasil)
document.getElementById("assinar-icp-history-btn")?.addEventListener("click", ()=>{
  carregarHistoricoValidacaoIcp()
})

function limparTextoLinhaUnica(valor, limite=255){
  return String(valor||"").replace(/\s+/g," ").trim().slice(0, limite)
}

function limparTextoMultilinha(valor, limite=4000){
  return String(valor||"").replace(/\r/g,"").trim().slice(0, limite)
}

function statusIcpRotulo(status){
  const chave=String(status||"pending").trim().toLowerCase()
  if(chave==="aprovado") return "Aprovado"
  if(chave==="reprovado") return "Reprovado"
  if(chave==="indeterminado") return "Indeterminado"
  return "Pendente"
}

function formatarDataHoraRegistro(valor){
  const bruto=String(valor||"").trim()
  if(!bruto) return "-"
  const normalizado=bruto.includes("T") ? bruto : bruto.replace(" ", "T")
  const data=new Date(normalizado)
  if(Number.isNaN(data.getTime())) return bruto
  return data.toLocaleString("pt-BR")
}

function hashCurto(valor){
  const hash=String(valor||"").trim()
  if(hash.length<=24) return hash || "-"
  return `${hash.slice(0, 12)}...${hash.slice(-10)}`
}

function definirFeedbackValidacaoIcp(mensagem="", tipo="info"){
  const feedback=document.getElementById("assinar-icp-feedback")
  if(!feedback) return
  feedback.textContent=String(mensagem||"").trim()
  feedback.className="sign-icp-feedback"
  if(tipo==="success" || tipo==="warning" || tipo==="error"){
    feedback.classList.add(`is-${tipo}`)
  }
  feedback.style.display=feedback.textContent ? "block" : "none"
}

function limparFormularioValidacaoIcp(){
  const statusEl=document.getElementById("assinar-icp-status")
  const protocoloEl=document.getElementById("assinar-icp-protocolo")
  const relatorioEl=document.getElementById("assinar-icp-relatorio-url")
  const notasEl=document.getElementById("assinar-icp-notes")
  if(statusEl) statusEl.value="pending"
  if(protocoloEl) protocoloEl.value=""
  if(relatorioEl) relatorioEl.value=""
  if(notasEl) notasEl.value=""
}

function atualizarPainelValidacaoIcp(){
  const painel=document.getElementById("assinar-icp-panel")
  if(!painel) return

  const nomeEl=document.getElementById("assinar-icp-file")
  const hashEl=document.getElementById("assinar-icp-hash")
  if(nomeEl){
    nomeEl.textContent=assinaturaValidacaoAtual.fileName || "-"
  }
  if(hashEl){
    hashEl.textContent=assinaturaValidacaoAtual.fileSha256 || "-"
  }

  painel.style.display="block"
}

function resetarValidacaoIcpVisual(ocultarPainel=true){
  assinaturaValidacaoAtual={
    validationId:null,
    fileName:"",
    fileSha256:"",
    itiVerifierUrl:ITI_VERIFIER_URL
  }
  limparFormularioValidacaoIcp()
  definirFeedbackValidacaoIcp("")
  const historico=document.getElementById("assinar-icp-history")
  if(historico){
    historico.innerHTML=""
  }
  if(ocultarPainel){
    const painel=document.getElementById("assinar-icp-panel")
    if(painel) painel.style.display="none"
  }
}

async function requisicaoApiAssinatura(path, options={}){
  const requestOptions={
    method:"GET",
    credentials:"same-origin",
    headers:{
      "Accept":"application/json",
      "Content-Type":"application/json"
    },
    ...options
  }

  if(requestOptions.body && typeof requestOptions.body!=="string"){
    requestOptions.body=JSON.stringify(requestOptions.body)
  }

  const resposta=await fetch(path, requestOptions)
  const texto=await resposta.text()
  let payload={}
  try{
    payload=texto ? JSON.parse(texto) : {}
  }catch{
    payload={ok:false, message:"Resposta invalida da API."}
  }

  if(!resposta.ok || payload.ok===false){
    const mensagem=payload?.message || "Falha ao comunicar com a API."
    const erro=new Error(mensagem)
    erro.status=resposta.status
    erro.payload=payload
    throw erro
  }

  return payload
}

async function calcularHashSha256Hex(bytes){
  if(!window.crypto?.subtle){
    throw new Error("Web Crypto indisponivel neste navegador.")
  }

  const inicio=bytes.byteOffset || 0
  const fim=inicio+(bytes.byteLength || bytes.length || 0)
  const view=bytes.buffer.slice(inicio, fim)
  const digest=await window.crypto.subtle.digest("SHA-256", view)
  return Array.from(new Uint8Array(digest)).map((valor)=>valor.toString(16).padStart(2, "0")).join("")
}

function abrirVerificadorIti(){
  const url=assinaturaValidacaoAtual.itiVerifierUrl || ITI_VERIFIER_URL
  window.open(url, "_blank", "noopener,noreferrer")
  definirFeedbackValidacaoIcp("Verificador ITI aberto em nova aba. Envie o PDF e depois registre o resultado abaixo.", "warning")
}

async function iniciarRegistroValidacaoIcp(localSummary){
  const payload=await requisicaoApiAssinatura("api/signatures/validation-start", {
    method:"POST",
    body:{
      fileName:assinaturaValidacaoAtual.fileName,
      fileSha256:assinaturaValidacaoAtual.fileSha256,
      localSummary,
      verifierUrl:assinaturaValidacaoAtual.itiVerifierUrl || ITI_VERIFIER_URL
    }
  })

  assinaturaValidacaoAtual.validationId=Number(payload?.validation?.id||0) || null
  assinaturaValidacaoAtual.itiVerifierUrl=String(payload?.validation?.itiVerifierUrl || ITI_VERIFIER_URL)
  return payload
}

function renderizarHistoricoValidacaoIcp(history){
  const container=document.getElementById("assinar-icp-history")
  if(!container) return
  container.innerHTML=""

  if(!Array.isArray(history) || history.length===0){
    const vazio=document.createElement("p")
    vazio.className="sign-icp-history-empty"
    vazio.textContent="Sem validacoes ICP-Brasil registradas para este usuario."
    container.appendChild(vazio)
    return
  }

  history.forEach((item)=>{
    const statusRaw=String(item?.icpStatus || "pending").trim().toLowerCase()
    const statusClass=ICP_STATUS_VALIDOS.includes(statusRaw) ? statusRaw : "pending"

    const card=document.createElement("article")
    card.className="sign-icp-history-item"

    const head=document.createElement("div")
    head.className="sign-icp-history-head"

    const titulo=document.createElement("strong")
    titulo.textContent=item?.fileName || "Arquivo sem nome"

    const badge=document.createElement("span")
    badge.className=`sign-icp-history-status is-${statusClass}`
    badge.textContent=statusIcpRotulo(statusRaw)

    head.appendChild(titulo)
    head.appendChild(badge)

    const meta1=document.createElement("p")
    meta1.className="sign-icp-history-meta"
    meta1.textContent=`SHA-256: ${hashCurto(item?.fileSha256)} | Assinaturas locais: ${Number(item?.localSignaturesCount||0)}`

    const meta2=document.createElement("p")
    meta2.className="sign-icp-history-meta"
    const protocolo=item?.itiProtocol ? ` | Protocolo: ${item.itiProtocol}` : ""
    meta2.textContent=`Criado em ${formatarDataHoraRegistro(item?.createdAt)}${protocolo}`

    const meta3=document.createElement("p")
    meta3.className="sign-icp-history-meta"
    const finalizado=item?.finishedAt ? formatarDataHoraRegistro(item?.finishedAt) : "pendente"
    meta3.textContent=`Finalizado em ${finalizado}`

    card.appendChild(head)
    card.appendChild(meta1)
    card.appendChild(meta2)
    card.appendChild(meta3)

    if(item?.notes){
      const notas=document.createElement("p")
      notas.className="sign-icp-history-meta"
      notas.textContent=`Obs.: ${item.notes}`
      card.appendChild(notas)
    }

    if(item?.itiReportUrl){
      const linkLinha=document.createElement("p")
      linkLinha.className="sign-icp-history-meta"
      const link=document.createElement("a")
      link.href=String(item.itiReportUrl)
      link.target="_blank"
      link.rel="noopener noreferrer"
      link.textContent="Abrir relatorio informado"
      linkLinha.appendChild(link)
      card.appendChild(linkLinha)
    }

    container.appendChild(card)
  })
}

async function carregarHistoricoValidacaoIcp({silencioso=false}={}){
  try{
    const payload=await requisicaoApiAssinatura("api/signatures/history?limit=6")
    renderizarHistoricoValidacaoIcp(payload?.history || [])
  }catch(erro){
    if(!silencioso){
      definirFeedbackValidacaoIcp(`Nao foi possivel carregar historico ICP-Brasil: ${erro.message}`, "warning")
    }
    const container=document.getElementById("assinar-icp-history")
    if(container && !container.innerHTML){
      renderizarHistoricoValidacaoIcp([])
    }
  }
}

async function salvarValidacaoIcpBrasil(){
  if(!assinaturaValidacaoAtual.fileSha256){
    definirFeedbackValidacaoIcp("Valide um PDF primeiro para gerar hash e iniciar o registro ICP-Brasil.", "warning")
    return
  }

  const statusEl=document.getElementById("assinar-icp-status")
  const protocoloEl=document.getElementById("assinar-icp-protocolo")
  const relatorioEl=document.getElementById("assinar-icp-relatorio-url")
  const notasEl=document.getElementById("assinar-icp-notes")

  const icpStatus=String(statusEl?.value || "pending").trim().toLowerCase()
  if(!ICP_STATUS_VALIDOS.includes(icpStatus)){
    definirFeedbackValidacaoIcp("Selecione o resultado oficial (aprovado, reprovado ou indeterminado).", "warning")
    return
  }

  try{
    const payload=await requisicaoApiAssinatura("api/signatures/validation-finish", {
      method:"POST",
      body:{
        validationId:assinaturaValidacaoAtual.validationId || 0,
        fileSha256:assinaturaValidacaoAtual.fileSha256,
        icpStatus,
        itiProtocol:limparTextoLinhaUnica(protocoloEl?.value || "", 120),
        itiReportUrl:limparTextoLinhaUnica(relatorioEl?.value || "", 255),
        notes:limparTextoMultilinha(notasEl?.value || "", 4000),
        verifierUrl:assinaturaValidacaoAtual.itiVerifierUrl || ITI_VERIFIER_URL
      }
    })

    assinaturaValidacaoAtual.validationId=Number(payload?.validation?.id || assinaturaValidacaoAtual.validationId || 0) || null
    definirFeedbackValidacaoIcp(
      `Validacao ICP-Brasil salva com sucesso. Status: ${statusIcpRotulo(payload?.validation?.icpStatus)}.`,
      "success"
    )
    await carregarHistoricoValidacaoIcp({silencioso:true})
  }catch(erro){
    definirFeedbackValidacaoIcp(`Nao foi possivel salvar a validacao ICP-Brasil: ${erro.message}`, "error")
  }
}

resetarValidacaoIcpVisual()

function selecionarModoAssinatura(modo){
  assinaturaModoAtual=assinaturaModosInfo[modo] ? modo : "sign"
  atualizarModoAssinaturaUI()
  if(modo==="timestamp"){
    mostrarAviso("No navegador o marcador usa a data e a hora locais da assinatura. TSA e LTV exigem um serviço externo.")
  }
}

function atualizarModoAssinaturaUI(){
  Object.keys(assinaturaModosInfo).forEach((modo)=>{
    const el=document.getElementById(`sign-action-${modo}`)
    if(el) el.classList.toggle("is-active", assinaturaModoAtual===modo)
  })
  const label=document.getElementById("assinar-modo-label")
  if(label) label.textContent=assinaturaModosInfo[assinaturaModoAtual].label
  const btn=document.querySelector('#assinar-section .fixed-bar .btn.generate')
  if(btn) btn.textContent=assinaturaModosInfo[assinaturaModoAtual].botao
}

async function carregarPdfParaAssinatura(file){
  assinarPdfFileRef=file
  resultadoAssinaturaBytes=null
  resultadoAssinaturaNome=""
  document.getElementById("resultado-assinar").style.display="none"
  document.getElementById("assinar-validacao").style.display="none"
  resetarValidacaoIcpVisual()
  const dados=await extrairTextoPdfPorPaginas(file)
  document.getElementById("assinar-pdf-box").style.display="block"
  document.getElementById("assinar-pdf-nome").textContent="PDF: "+file.name
  document.getElementById("assinar-pdf-meta").textContent=`${dados.totalPaginas} páginas | ${formatarTamanhoArquivo(file.size)}`
  document.getElementById("assinar-bar-info").textContent=`${dados.totalPaginas} páginas prontas para assinatura`
  document.getElementById("assinar-status").textContent=""
}

async function carregarCertificadoParaAssinatura(file){
  assinarCertFileRef=file
  document.getElementById("assinar-cert-box").style.display="block"
  document.getElementById("assinar-cert-nome").textContent="Certificado: "+file.name
  document.getElementById("assinar-cert-meta").textContent=formatarTamanhoArquivo(file.size)
  document.getElementById("assinar-status").textContent="Certificado carregado. Informe a senha para assinar."
}

function limparAssinarPDF(){
  assinarPdfFileRef=null
  assinarCertFileRef=null
  resultadoAssinaturaBytes=null
  resultadoAssinaturaNome=""
  assinaturaModoAtual="sign"
  document.getElementById("assinarPdfInput").value=""
  document.getElementById("assinarCertInput").value=""
  document.getElementById("assinar-pdf-box").style.display="none"
  document.getElementById("assinar-cert-box").style.display="none"
  document.getElementById("assinar-pdf-nome").textContent=""
  document.getElementById("assinar-pdf-meta").textContent=""
  document.getElementById("assinar-cert-nome").textContent=""
  document.getElementById("assinar-cert-meta").textContent=""
  document.getElementById("assinarCertSenha").value=""
  document.getElementById("assinarMotivo").value=""
  document.getElementById("assinarLocal").value=""
  document.getElementById("assinarContato").value=""
  document.getElementById("assinar-status").textContent=""
  document.getElementById("assinar-bar-info").textContent=""
  document.getElementById("resultado-assinar").style.display="none"
  document.getElementById("assinar-validacao").style.display="none"
  resetarValidacaoIcpVisual()
  atualizarModoAssinaturaUI()
}

function arrayBufferParaBinaryString(buffer){
  const bytes=new Uint8Array(buffer)
  const partes=[]
  const bloco=0x8000
  for(let i=0;i<bytes.length;i+=bloco){
    partes.push(String.fromCharCode(...bytes.subarray(i, i+bloco)))
  }
  return partes.join("")
}

async function carregarNodeForge(){
  return carregarBibliotecaGlobal(
    "forge",
    "https://unpkg.com/node-forge@1.3.1/dist/forge.min.js",
    "Falha ao carregar node-forge"
  )
}

async function carregarZgaPdfSigner(){
  await carregarNodeForge()
  return carregarBibliotecaGlobal(
    "Zga",
    "https://cdn.jsdelivr.net/npm/zgapdfsigner/dist/zgapdfsigner.min.js",
    "Falha ao carregar ZgaPdfSigner"
  )
}

async function extrairNomeCertificadoDigital(buffer, senha){
  const forge=await carregarNodeForge()
  const der=arrayBufferParaBinaryString(buffer)
  const asn1=forge.asn1.fromDer(der)
  const pkcs12=forge.pkcs12.pkcs12FromAsn1(asn1, false, senha)
  const bags=pkcs12.getBags({bagType: forge.pki.oids.certBag})[forge.pki.oids.certBag] || []
  const certBag=bags[0]
  if(!certBag || !certBag.cert) return "Titular do certificado"
  const cert=certBag.cert
  const cn=(cert.subject.attributes || []).find(attr=>attr.name==="commonName")
  if(cn?.value) return cn.value
  return cert.subject.getField("CN")?.value || "Titular do certificado"
}

function obterImagemCarimboAssinatura(nome, modo){
  const canvas=document.createElement("canvas")
  canvas.width=820
  canvas.height=220
  const ctx=canvas.getContext("2d")
  const grad=ctx.createLinearGradient(0,0,820,220)
  grad.addColorStop(0,"#ecfeff")
  grad.addColorStop(1,"#f0fdf4")
  ctx.fillStyle=grad
  ctx.fillRect(0,0,820,220)
  ctx.strokeStyle="#0f766e"
  ctx.lineWidth=6
  ctx.strokeRect(10,10,800,200)
  ctx.fillStyle="#0f172a"
  ctx.font="700 38px Arial"
  const titulo=modo.startsWith("certify") ? "Documento certificado digitalmente" : "Documento assinado digitalmente"
  ctx.fillText(titulo, 34, 72)
  ctx.fillStyle="#14532d"
  ctx.font="600 30px Arial"
  ctx.fillText(nome || "Titular do certificado", 34, 120)
  ctx.fillStyle="#475569"
  ctx.font="500 24px Arial"
  ctx.fillText("Data/Hora local: "+new Date().toLocaleString("pt-BR"), 34, 164)
  return canvas.toDataURL("image/png")
}

function dataUrlParaUint8Array(dataUrl){
  const base64=String(dataUrl||"").split(",")[1] || ""
  const bin=atob(base64)
  const bytes=new Uint8Array(bin.length)
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i)
  return bytes
}

async function executarAcaoAssinatura(){
  if(!assinarPdfFileRef){
    alert("Selecione um PDF para assinar.")
    return
  }
  if(!assinarCertFileRef){
    alert("Selecione um certificado digital.")
    return
  }
  const senha=document.getElementById("assinarCertSenha").value
  if(!senha){
    alert("Informe a senha do certificado.")
    return
  }

  const status=document.getElementById("assinar-status")
  status.textContent="Carregando bibliotecas de assinatura digital..."

  try{
    const Zga=await carregarZgaPdfSigner()
    const pdfBytes=await assinarPdfFileRef.arrayBuffer()
    const certBytes=await assinarCertFileRef.arrayBuffer()
    const dadosPdf=await extrairTextoPdfPorPaginas(assinarPdfFileRef)
    const nomeAssinante=await extrairNomeCertificadoDigital(certBytes, senha)

    /** @type {any} */
    const sopt={
      p12cert: certBytes,
      pwd: senha,
      signdate: "1",
      reason: document.getElementById("assinarMotivo").value || (assinaturaModoAtual==="timestamp" ? "Marcador de hora local" : "Assinatura digital"),
      location: document.getElementById("assinarLocal").value || "Brasil",
      contact: document.getElementById("assinarContato").value || "",
      permission: assinaturaModoAtual.startsWith("certify") ? 2 : 1
    }

    if(assinaturaModoAtual!=="certify-invisible"){
      const imagemCarimbo=dataUrlParaUint8Array(obterImagemCarimboAssinatura(nomeAssinante, assinaturaModoAtual))
      sopt.drawinf={
        area:{
          x: 26,
          y: 32,
          w: 170,
          h: 48
        },
        pageidx: String(Math.max(dadosPdf.totalPaginas-1, 0)),
        imgInfo:{
          imgData: imagemCarimbo,
          imgType: "png"
        }
      }
    }

    status.textContent="Aplicando assinatura digital ao PDF..."
    const signer=new Zga.PdfSigner(sopt)
    resultadoAssinaturaBytes=await signer.sign(pdfBytes)
    resultadoAssinaturaNome=nomeBaseSemExtensao(assinarPdfFileRef.name)+"_assinado.pdf"
    document.getElementById("resultado-assinar").style.display="block"
    renderizarEncadeamentoResultado("resultado-assinar","assinar",[
      {bytes:resultadoAssinaturaBytes, nome:resultadoAssinaturaNome}
    ], {ocultarDestinos:["assinar"]})
    document.getElementById("assinar-bar-info").textContent="Documento assinado e pronto para download."
    status.textContent="Assinatura aplicada com sucesso."
    await validarAssinaturasPDF()
    await iniciarDownloadAutomatico(baixarResultadoAssinatura, "Download do PDF assinado iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    status.textContent="Falha ao assinar o documento."
    mostrarErro("Não foi possível assinar o PDF. Verifique a senha do certificado e o formato do arquivo.")
  }
}

function baixarResultadoAssinatura(){
  if(!resultadoAssinaturaBytes) return
  baixarArquivo(resultadoAssinaturaBytes, resultadoAssinaturaNome)
}

async function validarAssinaturasPDF(){
  let bytes=null
  if(resultadoAssinaturaBytes){
    bytes=resultadoAssinaturaBytes instanceof Uint8Array ? resultadoAssinaturaBytes : new Uint8Array(resultadoAssinaturaBytes)
  }else if(assinarPdfFileRef){
    bytes=new Uint8Array(await assinarPdfFileRef.arrayBuffer())
  }
  if(!bytes){
    alert("Carregue ou assine um PDF primeiro.")
    return
  }

  const texto=arrayBufferParaBinaryString(bytes.buffer)
  const tiposSig=(texto.match(/\/Type\s*\/Sig/g)||[]).length
  const camposSig=(texto.match(/\/FT\s*\/Sig/g)||[]).length
  const byteRanges=(texto.match(/\/ByteRange\s*\[/g)||[]).length
  const subfilters=(texto.match(/\/SubFilter\s*\/adbe\.pkcs7\.detached/g)||[]).length + (texto.match(/\/SubFilter\s*\/ETSI\.CAdES\.detached/g)||[]).length
  const totalAssinaturas=Math.max(tiposSig, camposSig, byteRanges, subfilters)
  const arquivoNomeAtual=limparTextoLinhaUnica(resultadoAssinaturaNome || assinarPdfFileRef?.name || "documento.pdf", 255)
  let hashSha256=""

  try{
    hashSha256=await calcularHashSha256Hex(bytes)
  }catch(erro){
    console.warn("Nao foi possivel calcular hash SHA-256.", erro)
  }

  const linhas=[
    totalAssinaturas>0
      ? `Assinaturas encontradas: ${totalAssinaturas}`
      : "Nenhuma assinatura detectada no PDF analisado.",
    byteRanges>0
      ? "Há indício de intervalo criptográfico (ByteRange) no documento."
      : "Não foi encontrado ByteRange no documento.",
    subfilters>0
      ? "Foi identificado um subfiltro de assinatura compatível com PKCS#7/CAdES."
      : "Nenhum subfiltro PKCS#7/CAdES foi identificado.",
    hashSha256
      ? `Hash SHA-256: ${hashSha256}`
      : "Hash SHA-256 indisponivel no navegador atual.",
    "Esta é uma validação local preliminar. Verificação jurídica completa, cadeia ICP-Brasil e TSA exigem serviço especializado."
  ]

  document.getElementById("assinar-validacao").style.display="block"
  document.getElementById("assinar-validacao-texto").textContent=linhas.join("\n")

  if(!hashSha256){
    return
  }

  const resumoLocal={
    signatureCount:totalAssinaturas,
    hasByteRange:byteRanges>0,
    hasPkcs7:subfilters>0,
    hasCades:subfilters>0,
    byteRangesCount:byteRanges,
    subfiltersCount:subfilters
  }

  const mudouArquivo=assinaturaValidacaoAtual.fileSha256!==hashSha256
  assinaturaValidacaoAtual.fileName=arquivoNomeAtual
  assinaturaValidacaoAtual.fileSha256=hashSha256
  assinaturaValidacaoAtual.itiVerifierUrl=assinaturaValidacaoAtual.itiVerifierUrl || ITI_VERIFIER_URL

  if(mudouArquivo){
    assinaturaValidacaoAtual.validationId=null
    limparFormularioValidacaoIcp()
  }

  atualizarPainelValidacaoIcp()

  if(!assinaturaValidacaoAtual.validationId){
    try{
      await iniciarRegistroValidacaoIcp(resumoLocal)
      definirFeedbackValidacaoIcp(
        `Registro ICP-Brasil iniciado (#${assinaturaValidacaoAtual.validationId}). Abra o verificador ITI e salve o resultado oficial abaixo.`,
        "success"
      )
    }catch(erro){
      const mensagem=String(erro?.message || "")
      const mensagemMin=mensagem.toLowerCase()
      if(mensagemMin.includes("sess") || mensagemMin.includes("autentic")){
        definirFeedbackValidacaoIcp(
          "Faça login para salvar a auditoria ICP-Brasil no sistema. A validacao manual no ITI pode ser feita normalmente.",
          "warning"
        )
      }else{
        definirFeedbackValidacaoIcp(`Nao foi possivel iniciar registro ICP-Brasil: ${mensagem || "falha desconhecida."}`, "warning")
      }
    }
  }

  await carregarHistoricoValidacaoIcp({silencioso:true})
}

// ===================== EDITAL PDF =====================

let editalFileRef=null
let editalResumoAtual=null

document.getElementById("editalInput").addEventListener("change", async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarEditalPDF(file)
  e.target.value=""
})

async function carregarEditalPDF(file){
  editalFileRef=file
  editalResumoAtual=null
  const dados=await extrairTextoPdfPorPaginas(file)
  document.getElementById("edital-info-box").style.display="block"
  document.getElementById("edital-nome").textContent="Edital: "+file.name
  document.getElementById("edital-meta").textContent=`${dados.totalPaginas} páginas | ${formatarTamanhoArquivo(file.size)}`
  document.getElementById("edital-bar-info").textContent=`${dados.totalPaginas} páginas carregadas para análise`
  document.getElementById("edital-status").textContent=""
  document.getElementById("resultado-edital").style.display="none"
}

function extrairItensRegex(texto, regex, limite=12){
  const itens=[]
  let match
  while((match=regex.exec(texto))!==null && itens.length<limite){
    const valor=match[0].replace(/\s+/g," ").trim()
    if(!itens.includes(valor)) itens.push(valor)
  }
  return itens
}

function gerarTopicosEdital(texto){
  const mapa=[
    {label:"Inscrições", regex:/inscri(c|ç)(a|ã)o|cadastramento/gi},
    {label:"Prova objetiva", regex:/prova objetiva|avaliacao objetiva/gi},
    {label:"Prova discursiva", regex:/prova discursiva|reda(c|ç)(a|ã)o/gi},
    {label:"Recursos", regex:/recurso(s)?|interposi(c|ç)(a|ã)o/gi},
    {label:"Homologação", regex:/homologa(c|ç)(a|ã)o/gi},
    {label:"Resultado", regex:/resultado final|resultado preliminar/gi},
    {label:"Vagas", regex:/vaga(s)?|cadastro reserva/gi},
    {label:"Conteúdo programático", regex:/conte(u|ú)do program(a|á)tico/gi}
  ]
  return mapa
    .map(item=>({label:item.label, total:(texto.match(item.regex)||[]).length}))
    .filter(item=>item.total>0)
    .sort((a,b)=>b.total-a.total)
    .slice(0,8)
}

function montarResumoEditalAnalise(analise){
  const linhas=[
    `Arquivo: ${analise.nome}`,
    `Páginas analisadas: ${analise.paginas}`,
    `Datas encontradas: ${analise.datas.length}`,
    `Valores encontrados: ${analise.valores.length}`
  ]
  if(analise.topicos.length>0){
    linhas.push("")
    linhas.push("Tópicos em destaque:")
    analise.topicos.forEach(item=>linhas.push(`- ${item.label}: ${item.total} ocorrência(s)`))
  }
  if(analise.datas.length>0){
    linhas.push("")
    linhas.push("Primeiras datas detectadas:")
    analise.datas.slice(0,8).forEach(item=>linhas.push(`- ${item}`))
  }
  if(analise.alertas.length>0){
    linhas.push("")
    linhas.push("Alertas:")
    analise.alertas.forEach(item=>linhas.push(`- ${item}`))
  }
  return linhas.join("\n")
}

async function analisarEditalPDF(){
  if(!editalFileRef){
    alert("Selecione um edital em PDF primeiro.")
    return
  }

  const status=document.getElementById("edital-status")
  status.textContent="Lendo e analisando o edital..."
  const dados=await extrairTextoPdfPorPaginas(editalFileRef)
  const textoCompleto=dados.textoCompleto
  const textoBusca=removerAcentosTexto(textoCompleto).toLowerCase()
  const datas=extrairItensRegex(textoCompleto, /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, 20)
  const valores=extrairItensRegex(textoCompleto, /R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, 16)
  const topicos=gerarTopicosEdital(textoBusca)
  const alertas=[]

  if(textoCompleto.replace(/\s+/g,"").length<300){
    alertas.push("O PDF parece ter pouco texto selecionável. Se o edital for escaneado, rode OCR antes da análise.")
  }
  if(datas.length===0){
    alertas.push("Nenhuma data foi identificada automaticamente. Revise o documento manualmente.")
  }
  if(!/inscricao/.test(textoBusca)){
    alertas.push("Não foi encontrada a palavra inscrição no texto extraído.")
  }

  editalResumoAtual={
    nome: editalFileRef.name,
    paginas: dados.totalPaginas,
    datas,
    valores,
    topicos,
    alertas,
    resumoTexto: montarResumoEditalAnalise({
      nome: editalFileRef.name,
      paginas: dados.totalPaginas,
      datas,
      valores,
      topicos,
      alertas
    })
  }

  document.getElementById("edital-stat-paginas").textContent=String(dados.totalPaginas)
  document.getElementById("edital-stat-datas").textContent=String(datas.length)
  document.getElementById("edital-stat-valores").textContent=String(valores.length)
  document.getElementById("edital-stat-topicos").textContent=String(topicos.length)
  document.getElementById("edital-resumo-texto").textContent=editalResumoAtual.resumoTexto
  document.getElementById("edital-datas-list").innerHTML=criarListaHtmlAnalise(datas, "Nenhuma data encontrada automaticamente.")
  document.getElementById("edital-valores-list").innerHTML=criarListaHtmlAnalise(valores, "Nenhum valor monetário encontrado.")
  document.getElementById("edital-topicos-list").innerHTML=criarListaHtmlAnalise([
    ...topicos.map(item=>`${item.label}: ${item.total} ocorrência(s)`),
    ...alertas
  ], "Nenhum tópico relevante identificado.")
  document.getElementById("resultado-edital").style.display="block"
  document.getElementById("edital-bar-info").textContent="Resumo do edital pronto para cópia e download."
  status.textContent="Análise concluída."
  await iniciarDownloadAutomatico(baixarResumoEdital, "Download do resumo do edital iniciado automaticamente.")
}

async function copiarResumoEdital(){
  if(!editalResumoAtual) return
  try{
    await navigator.clipboard.writeText(editalResumoAtual.resumoTexto)
    mostrarSucesso("Resumo copiado com sucesso.")
  }catch(erro){
    mostrarErro("Não foi possível copiar o resumo.")
  }
}

function baixarResumoEdital(){
  if(!editalResumoAtual) return
  const blob=new Blob([editalResumoAtual.resumoTexto], {type:"text/plain;charset=utf-8"})
  baixarBlob(blob, nomeBaseSemExtensao(editalResumoAtual.nome)+"_resumo_edital.txt")
}

function limparEditalPDF(){
  editalFileRef=null
  editalResumoAtual=null
  document.getElementById("editalInput").value=""
  document.getElementById("edital-info-box").style.display="none"
  document.getElementById("edital-nome").textContent=""
  document.getElementById("edital-meta").textContent=""
  document.getElementById("edital-status").textContent=""
  document.getElementById("edital-bar-info").textContent=""
  document.getElementById("resultado-edital").style.display="none"
}

// ===================== POWERPOINT PARA PDF =====================

let powerpointFileRef=null
let resultadoPowerPointBytes=null
let resultadoPowerPointNome=""

document.getElementById("powerpointInput").addEventListener("change", async(e)=>{
  const file=e.target.files[0]
  if(!file) return
  await carregarPowerPointArquivo(file)
  e.target.value=""
})

async function carregarPowerPointArquivo(file){
  powerpointFileRef=file
  resultadoPowerPointBytes=null
  resultadoPowerPointNome=""
  document.getElementById("resultado-powerpoint").style.display="none"
  document.getElementById("powerpoint-info-box").style.display="block"
  document.getElementById("powerpoint-nome").textContent="Apresentação: "+file.name
  document.getElementById("powerpoint-meta").textContent=formatarTamanhoArquivo(file.size)
  document.getElementById("powerpoint-bar-info").textContent="Arquivo pronto para conversão."
  document.getElementById("powerpoint-status").textContent=""
}

async function extrairSlidesPowerPoint(file){
  const JSZip=await carregarJSZip()
  const zip=await JSZip.loadAsync(await file.arrayBuffer())
  const slides=Object.keys(zip.files)
    .filter(nome=>/^ppt\/slides\/slide\d+\.xml$/i.test(nome))
    .sort((a,b)=>{
      const na=Number((a.match(/slide(\d+)\.xml/i)||[])[1]||0)
      const nb=Number((b.match(/slide(\d+)\.xml/i)||[])[1]||0)
      return na-nb
    })

  if(slides.length===0){
    throw new Error("Nenhum slide legível foi encontrado. Esta versão aceita arquivos .pptx e .ppsx baseados em XML.")
  }

  const saida=[]
  for(let i=0;i<slides.length;i++){
    const xml=await zip.file(slides[i]).async("string")
    const textos=[...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)]
      .map(match=>decodificarEntidadesXml(match[1]))
      .map(item=>item.replace(/\s+/g," ").trim())
      .filter(Boolean)
    saida.push({
      indice:i+1,
      texto:textos.join(" ").trim()
    })
  }
  return saida
}

async function converterPowerPointParaPDF(){
  if(!powerpointFileRef){
    alert("Selecione um arquivo PowerPoint primeiro.")
    return
  }

  const status=document.getElementById("powerpoint-status")
  status.textContent="Lendo a apresentação e extraindo o texto dos slides..."

  try{
    const slides=await extrairSlidesPowerPoint(powerpointFileRef)
    const pdf=await PDFLib.PDFDocument.create()
    const fonte=await pdf.embedFont(PDFLib.StandardFonts.Helvetica)
    const fonteTitulo=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold)

    slides.forEach((slide)=>{
      const page=pdf.addPage([841.89, 595.28])
      const {width, height}=page.getSize()
      page.drawRectangle({x:0,y:height-92,width,height:92,color:PDFLib.rgb(0.93,0.46,0.12)})
      page.drawText(`Slide ${String(slide.indice).padStart(2,"0")}`, {
        x: 34,
        y: height-58,
        size: 28,
        font: fonteTitulo,
        color: PDFLib.rgb(1,1,1)
      })

      const textoBase=slide.texto || "Nenhum texto detectado neste slide. Se a apresentação for visual, use esta saída como roteiro textual."
      const linhas=quebrarTextoParaPdf(textoBase, fonte, 15, width-90).slice(0,22)
      let cursorY=height-130
      linhas.forEach((linha)=>{
        if(!linha){
          cursorY-=12
          return
        }
        page.drawText(linha, {
          x: 38,
          y: cursorY,
          size: 15,
          font: fonte,
          color: PDFLib.rgb(0.12,0.16,0.22)
        })
        cursorY-=22
      })
      if(slide.texto && linhas.length>=22){
        page.drawText("Conteúdo parcial: o slide possui mais texto do que a página comporta.", {
          x: 38,
          y: 40,
          size: 12,
          font: fonte,
          color: PDFLib.rgb(0.75,0.14,0.14)
        })
      }
    })

    resultadoPowerPointBytes=await pdf.save()
    resultadoPowerPointNome=nomeBaseSemExtensao(powerpointFileRef.name)+".pdf"
    document.getElementById("powerpoint-preview-list").innerHTML=criarListaHtmlAnalise(
      slides.slice(0,8).map(slide=>`Slide ${slide.indice}: ${(slide.texto || "Sem texto detectado.").slice(0,180)}`),
      "Nenhum slide disponível."
    )
    document.getElementById("resultado-powerpoint").style.display="block"
    renderizarEncadeamentoResultado("resultado-powerpoint","powerpoint",[
      {bytes:resultadoPowerPointBytes, nome:resultadoPowerPointNome}
    ])
    document.getElementById("powerpoint-bar-info").textContent=`${slides.length} slide(s) convertidos para PDF.`
    status.textContent="Conversão concluída."
    await iniciarDownloadAutomatico(baixarResultadoPowerPointPDF, "Download do PDF da apresentação iniciado automaticamente.")
  }catch(erro){
    console.error(erro)
    status.textContent="Falha ao converter a apresentação."
    mostrarErro("Não foi possível converter este PowerPoint. Use arquivos .pptx ou .ppsx.")
  }
}

function baixarResultadoPowerPointPDF(){
  if(!resultadoPowerPointBytes) return
  baixarArquivo(resultadoPowerPointBytes, resultadoPowerPointNome)
}

function limparPowerPointPDF(){
  powerpointFileRef=null
  resultadoPowerPointBytes=null
  resultadoPowerPointNome=""
  document.getElementById("powerpointInput").value=""
  document.getElementById("powerpoint-info-box").style.display="none"
  document.getElementById("powerpoint-nome").textContent=""
  document.getElementById("powerpoint-meta").textContent=""
  document.getElementById("powerpoint-status").textContent=""
  document.getElementById("powerpoint-bar-info").textContent=""
  document.getElementById("resultado-powerpoint").style.display="none"
  document.getElementById("powerpoint-preview-list").innerHTML=""
}





