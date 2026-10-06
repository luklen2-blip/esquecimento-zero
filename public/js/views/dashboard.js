import { api, showToast } from '../api.js';
import { analytics } from '../analytics.js';

export function renderDashboard() {
  return `
    <div id="dashboard-container" class="view-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div class="flex items-center justify-center min-h-[300px]">
        <div class="flex flex-col items-center gap-3 text-slate-400">
          <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-brand-600"></i>
          <p class="text-sm font-medium">Buscando seus vencimentos e garantias...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initDashboardEvents() {
  const container = document.getElementById('dashboard-container');
  if (!container) return;

  try {
    const res = await api.dashboard.getStats();
    const data = res.data;
    const userRes = await api.auth.me().catch(() => null);
    const user = userRes?.data?.user || { name: 'Usuário' };

    renderDashboardContent(container, data, user);
    setupTrialCountdownTicker(data.access);

    // Eventos do Botão de Compartilhamento
    const shareBtn = document.getElementById('btn-share-app');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        analytics.track('compartilhamento_clicado');
        const shareData = {
          title: 'Esquecimento Zero',
          text: 'O que você não quer esquecer? Conheça o Esquecimento Zero e guarde compras, garantias e notas.',
          url: window.location.origin
        };

        if (navigator.share) {
          try {
            await navigator.share(shareData);
            showToast('Obrigado por compartilhar o Esquecimento Zero!', 'success');
          } catch {}
        } else {
          try {
            await navigator.clipboard.writeText(`${shareData.text} Acesse: ${shareData.url}`);
            showToast('Link copiado! Compartilhe com quem você conhece.', 'success');
          } catch {
            showToast(`Compartilhe o link: ${shareData.url}`, 'info');
          }
        }
      });
    }

    // Eventos de fechamento do momento Aha!
    const closeAhaBtn = document.getElementById('btn-close-aha');
    if (closeAhaBtn) {
      closeAhaBtn.addEventListener('click', () => {
        sessionStorage.removeItem('ez_just_created');
        const banner = document.getElementById('aha-moment-banner');
        if (banner) banner.remove();
      });
    }

  } catch (err) {
    container.innerHTML = `
      <div class="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <i data-lucide="alert-circle" class="w-10 h-10 text-rose-500 mx-auto mb-3"></i>
        <h3 class="text-base font-bold text-rose-900">Não foi possível carregar o Dashboard</h3>
        <p class="text-xs text-rose-700 mt-1">${err.message}</p>
        <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors">
          Tentar Novamente
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: container });
  }
}

function renderDashboardContent(container, data, user) {
  const { metrics, warrantiesEnding, expirationsNear, upcomingDue, recentDocuments, recentItems } = data;

  const isFreePlan = metrics.plan === 'free' || metrics.plan === 'trial';
  const isLimitReached = isFreePlan && metrics.totalItems >= 10;

  // Formatador de Moeda BRL
  const formatMoney = (val) => {
    if (!val) return 'R$ 0,00';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Formatador de Data BR
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const parts = isoString.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoString;
  };

  const access = data.access || {};
  const isLifetime = access.isLifetime || metrics.plan === 'lifetime';
  const isExpired = access.isExpired;
  const isTrial = access.isTrial || !isLifetime;
  const hoursRemaining = access.hoursRemaining ?? 24;
  const minutesRemaining = access.minutesRemaining ?? 0;
  const checkoutUrl = access.checkoutUrl || metrics.checkoutUrl || 'https://pay.kiwify.com.br/cd5quHM';
  const notice = access.notice || {};

  let commercialBannerHtml = '';

  if (isLifetime) {
    commercialBannerHtml = `
      <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-500/30 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
            👑
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-extrabold text-white">Acesso Vitalício Ativo</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">LIFETIME</span>
            </div>
            <p class="text-xs text-slate-300 mt-0.5">Você possui armazenamento e leitura de notas fiscais com IA ilimitados sem qualquer mensalidade.</p>
          </div>
        </div>
      </div>
    `;
  } else if (isExpired) {
    commercialBannerHtml = `
      <div class="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border-2 border-rose-500/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-black text-white">Seu período gratuito terminou.</h3>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-300 uppercase border border-rose-500/40">Acesso Pausado</span>
            </div>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Todos os seus registros continuam salvos com segurança. Continue com acesso vitalício por apenas <strong>R$ 19,90 (pagamento único)</strong>.
            </p>
            <div class="mt-2.5">
              <div id="trial-countdown-text" class="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs sm:text-sm font-black text-rose-300 inline-flex items-center gap-1.5">
                🔒 Seu período gratuito terminou.
              </div>
            </div>
          </div>
        </div>
        <a href="${checkoutUrl}" target="_blank" rel="noopener noreferrer"
          class="px-5 py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 flex-shrink-0 transition-transform hover:scale-105 whitespace-nowrap">
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>QUERO MEU ACESSO VITALÍCIO — R$ 19,90</span>
        </a>
      </div>
    `;
  } else {
    // 5 Estágios visuais das 24 Horas
    let bannerBorder = 'border-indigo-500/30';
    let bannerBg = 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900';
    let iconBg = 'bg-brand-500/20 text-brand-400';
    let iconName = 'gift';
    let badgeClasses = 'bg-brand-500/20 text-brand-300 border border-brand-500/30';
    let headline = '🎁 Seu teste gratuito está ativo';
    let message = 'Você tem 24 horas para experimentar o Esquecimento Zero. Você ainda tem bastante tempo para experimentar.';
    let badgeText = '24H GRÁTIS';

    if (hoursRemaining < 1) {
      bannerBorder = 'border-2 border-rose-500/80 animate-pulse';
      bannerBg = 'bg-gradient-to-r from-rose-950 via-slate-900 to-orange-950';
      iconBg = 'bg-rose-500/20 text-rose-400';
      iconName = 'flame';
      badgeClasses = 'bg-rose-500/30 text-rose-300 border border-rose-500/40 animate-pulse';
      headline = '⚠️ Sua experiência gratuita termina em breve.';
      message = 'Seu período gratuito termina em poucos minutos. Garanta seu acesso vitalício permanente por R$ 19,90.';
      badgeText = 'ÚLTIMA HORA';
    } else if (hoursRemaining < 3) {
      bannerBorder = 'border-2 border-amber-500/70';
      bannerBg = 'bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950';
      iconBg = 'bg-amber-500/20 text-amber-400';
      iconName = 'alert-triangle';
      badgeClasses = 'bg-amber-500/30 text-amber-300 border border-amber-500/40';
      headline = '⏰ Seu período gratuito está terminando.';
      message = 'Faltam poucas horas para o encerramento do teste. Continue com acesso vitalício permanente por apenas R$ 19,90.';
      badgeText = 'RETA FINAL';
    } else if (hoursRemaining < 12) {
      bannerBorder = 'border border-amber-500/40';
      bannerBg = 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900';
      iconBg = 'bg-amber-500/20 text-amber-400';
      iconName = 'clock';
      badgeClasses = 'bg-amber-400/20 text-amber-300 border border-amber-400/30';
      headline = 'Aproveite seu período gratuito';
      message = 'Aproveite seu período gratuito para organizar suas informações importantes.';
      badgeText = 'PERÍODO ATIVO';
    }

    commercialBannerHtml = `
      <div class="${bannerBg} ${bannerBorder} text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0">
            <i data-lucide="${iconName}" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-black text-white">${headline}</h3>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${badgeClasses} uppercase">${badgeText}</span>
            </div>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              ${message}
            </p>
            <div class="mt-2.5">
              <div id="trial-countdown-text" class="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm font-bold text-amber-300 inline-flex items-center gap-1.5">
                ${hoursRemaining >= 1
                  ? `⏳ Seu teste gratuito termina em <strong>${hoursRemaining} hora${hoursRemaining > 1 ? 's' : ''} e ${minutesRemaining} min</strong>`
                  : `🔥 Seu teste gratuito termina em <strong>${minutesRemaining} minutos</strong>`
                }
              </div>
            </div>
          </div>
        </div>
        <a href="${checkoutUrl}" target="_blank" rel="noopener noreferrer"
          class="px-5 py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 flex-shrink-0 transition-transform hover:scale-105 whitespace-nowrap">
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>QUERO MEU ACESSO VITALÍCIO — R$ 19,90</span>
        </a>
      </div>
    `;
  }

  // 1. Momento "Aha!" pós-cadastro
  const justCreatedRaw = sessionStorage.getItem('ez_just_created');
  let ahaMomentHtml = '';
  if (justCreatedRaw) {
    try {
      const itemInfo = JSON.parse(justCreatedRaw);
      ahaMomentHtml = `
        <div id="aha-moment-banner" class="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-emerald-500/50 space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-2xl flex-shrink-0 border border-emerald-500/30">
                ✅
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg sm:text-xl font-black text-white">Pronto!</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 uppercase">Informação Segura</span>
                </div>
                <p class="text-xs sm:text-sm text-emerald-300 font-bold mt-1">
                  Você acabou de tirar essa informação da sua memória e colocá-la no Esquecimento Zero.
                </p>
                <p class="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Agora você pode encontrar essa informação quando precisar.
                </p>
              </div>
            </div>
            <button id="btn-close-aha" type="button" class="text-slate-400 hover:text-white p-1 text-sm font-bold">
              ✕
            </button>
          </div>

          <div class="pt-3 border-t border-emerald-500/30">
            <p class="text-xs font-bold text-emerald-200 mb-2">O que você pode adicionar agora a este item?</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              <a href="/adicionar" class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-2 transition-colors">
                <span>📄</span> <span>Nota fiscal</span>
              </a>
              <a href="/adicionar" class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-2 transition-colors">
                <span>🛡️</span> <span>Garantia</span>
              </a>
              <a href="/adicionar" class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-2 transition-colors">
                <span>⏰</span> <span>Lembrete</span>
              </a>
              <a href="/adicionar" class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-2 transition-colors">
                <span>📝</span> <span>Observação</span>
              </a>
            </div>
          </div>
        </div>
      `;
    } catch {}
  }

  // 2. Onboarding Passo 1 (quando usuário possui 0 itens)
  let onboardingHtml = '';
  if (metrics.totalItems === 0 && !justCreatedRaw) {
    onboardingHtml = `
      <div class="bg-gradient-to-br from-brand-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-brand-500/30 space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-black text-xl border border-brand-500/30">
            🚀
          </div>
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-500/30 text-brand-300 uppercase tracking-wider">Passo 1</span>
            <h2 class="text-xl sm:text-2xl font-black text-white mt-0.5">Vamos começar com uma coisa importante.</h2>
          </div>
        </div>
        <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Não tente cadastrar tudo de uma vez. Comece por uma informação ou compra recente que você costuma esquecer: seu celular, uma garantia ativa, uma compra ou a revisão do carro.
        </p>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <a href="/adicionar" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105">
            <i data-lucide="plus-circle" class="w-5 h-5"></i>
            <span>➕ Cadastrar meu primeiro item</span>
          </a>
          <a href="/como-usar" class="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors">
            <i data-lucide="book-open" class="w-4 h-4"></i>
            <span>Como usar no dia a dia</span>
          </a>
        </div>

        <div class="pt-3 border-t border-white/10">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exemplos rápidos do que cadastrar agora:</p>
          <div class="flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
            <span class="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">📱 Celular ou Computador</span>
            <span class="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">📺 TV ou Eletrodoméstico</span>
            <span class="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">🚗 Revisão do Veículo</span>
            <span class="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">📄 Nota Fiscal recente</span>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Sugestão Contextual para Segundo Cadastro (quando 1 <= totalItems <= 4)
  let contextualSuggestionHtml = '';
  if (metrics.totalItems > 0 && metrics.totalItems <= 4) {
    contextualSuggestionHtml = `
      <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="text-xs sm:text-sm font-bold text-indigo-300 flex items-center gap-1.5">
            <i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i>
            Quer deixar esse cadastro ainda mais completo?
          </h4>
          <p class="text-xs text-slate-300 mt-1">
            Se for produto: adicione a nota fiscal e a garantia. Se for veículo: adicione manutenção e próximos vencimentos. Se for documento: adicione a data de validade e um lembrete.
          </p>
        </div>
        <a href="/adicionar" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 self-start sm:self-auto transition-colors">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          <span>Adicionar outro item</span>
        </a>
      </div>
    `;
  }

  const userBadgeText = isLifetime
    ? 'Acesso Vitalício'
    : isExpired
    ? 'Teste Expirado'
    : (hoursRemaining >= 1 ? `Teste (${hoursRemaining}h)` : `Teste (<1h)`);

  container.innerHTML = `
    <!-- Banner Comercial de Status -->
    ${commercialBannerHtml}

    <!-- Momento Aha! (se acabou de criar) -->
    ${ahaMomentHtml}

    <!-- Onboarding de Primeiro Item (se vazio) -->
    ${onboardingHtml}

    <!-- Sugestão Contextual (se tem 1-4 itens) -->
    ${contextualSuggestionHtml}

    <!-- 1. Cabeçalho de Boas-Vindas e Ação Rápida -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900">Olá, ${user.name.split(' ')[0]}!</h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            isLifetime ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : isExpired ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
          }">
            <i data-lucide="${isLifetime ? 'crown' : isExpired ? 'lock' : 'sparkles'}" class="w-3 h-3"></i>
            ${userBadgeText}
          </span>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Seu lugar para guardar compras, notas, garantias e o que você não quer esquecer.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <a href="/adicionar" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 ${
          isExpired ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'
        } text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Novo Item</span>
        </a>
      </div>
    </div>

    <!-- 2. Barra de Capacidade do Plano Gratuito (10 itens) -->
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm border border-slate-700">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div class="flex items-center gap-2">
          <i data-lucide="layers" class="w-4 h-4 text-brand-400"></i>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Capacidade do seu Plano</span>
        </div>
        <div class="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span>${metrics.totalItems} de ${metrics.itemsLimit} itens cadastrados</span>
          ${isFreePlan ? `<a href="/planos" class="text-amber-400 hover:text-amber-300 underline font-bold ml-1">Evoluir para Ilimitado →</a>` : ''}
        </div>
      </div>
      
      <!-- Barra de Progresso -->
      <div class="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div class="h-2.5 rounded-full transition-all duration-500 ${
          metrics.usagePercentage >= 90 ? 'bg-rose-500' : metrics.usagePercentage >= 60 ? 'bg-amber-400' : 'bg-brand-500'
        }" style="width: ${metrics.usagePercentage}%"></div>
      </div>

      <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2">
        <span>${metrics.remainingQuota} vagas restantes no limite gratuito</span>
        <span>${metrics.usagePercentage}% utilizado</span>
      </div>
    </div>

    <!-- 3. Quatro Cartões de Resumo e Métricas -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      
      <!-- Próximos Vencimentos -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-colors">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Vencimentos</span>
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i data-lucide="clock" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <span class="text-2xl sm:text-3xl font-black text-slate-900">${metrics.upcomingDueCount}</span>
          <p class="text-[11px] text-slate-500 mt-0.5">Nos próximos 30 dias</p>
        </div>
      </div>

      <!-- Garantias a Vencer -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Garantias</span>
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <span class="text-2xl sm:text-3xl font-black text-slate-900">${metrics.warrantiesCount}</span>
          <p class="text-[11px] text-slate-500 mt-0.5">Fim nos próx. 60 dias</p>
        </div>
      </div>

      <!-- Produtos com Validade Próxima -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-colors">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Validades</span>
          <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <span class="text-2xl sm:text-3xl font-black text-slate-900">${metrics.expirationsCount}</span>
          <p class="text-[11px] text-slate-500 mt-0.5">Alimentos e remédios</p>
        </div>
      </div>

      <!-- Documentos Salvos -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-colors">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Documentos</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i data-lucide="file-check-2" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <span class="text-2xl sm:text-3xl font-black text-slate-900">${metrics.totalDocuments}</span>
          <p class="text-[11px] text-slate-500 mt-0.5">Arquivados em nuvem</p>
        </div>
      </div>

    </div>

    <!-- 4. Painel Principal Dividido em 2 Colunas -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Coluna Esquerda: Garantias e Validades (8 colunas no desktop) -->
      <div class="lg:col-span-8 space-y-6">

        <!-- Bloco: Garantias Próximas do Fim -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <i data-lucide="shield" class="w-4 h-4"></i>
              </div>
              <h2 class="text-base font-bold text-slate-900">Garantias Próximas do Fim</h2>
            </div>
            <span class="text-xs text-slate-400 font-medium">${warrantiesEnding.length} alertas</span>
          </div>

          ${
            warrantiesEnding.length === 0
              ? `<div class="py-8 text-center text-slate-400 text-xs">
                   <i data-lucide="shield-check" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                   Nenhuma garantia próxima de expirar nos próximos 60 dias.
                 </div>`
              : `<div class="space-y-3">
                  ${warrantiesEnding
                    .map(
                      item => `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 transition-all gap-3">
                      <div class="flex items-start gap-3">
                        <div class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm flex-shrink-0">
                          <i data-lucide="${item.categoryIcon || 'tag'}" class="w-4 h-4"></i>
                        </div>
                        <div>
                          <h3 class="text-sm font-bold text-slate-800 leading-tight">${item.title}</h3>
                          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span class="font-medium text-slate-600">${item.store || 'Loja não informada'}</span>
                            <span>•</span>
                            <span>Valor: <strong class="text-slate-700">${formatMoney(item.price)}</strong></span>
                            ${item.invoiceNumber ? `<span>•</span><span class="bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-mono">${item.invoiceNumber}</span>` : ''}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <div class="text-right">
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            item.isUrgent
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            ${item.daysRemaining === 0 ? 'Vence Hoje!' : `Restam ${item.daysRemaining} dias`}
                          </span>
                          <p class="text-[10px] text-slate-400 mt-0.5">Término: ${formatDate(item.warrantyEndDate)}</p>
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>`
          }
        </div>

        <!-- Bloco: Produtos Próximos da Validade -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <i data-lucide="alert-octagon" class="w-4 h-4"></i>
              </div>
              <h2 class="text-base font-bold text-slate-900">Produtos Próximos da Validade</h2>
            </div>
            <span class="text-xs text-slate-400 font-medium">${expirationsNear.length} itens</span>
          </div>

          ${
            expirationsNear.length === 0
              ? `<div class="py-8 text-center text-slate-400 text-xs">
                   <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                   Nenhum medicamento ou alimento próximo da data de validade.
                 </div>`
              : `<div class="space-y-3">
                  ${expirationsNear
                    .map(
                      item => `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-rose-200 bg-slate-50/50 hover:bg-rose-50/20 transition-all gap-3">
                      <div class="flex items-start gap-3">
                        <div class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm flex-shrink-0">
                          <i data-lucide="${item.categoryIcon || 'tag'}" class="w-4 h-4"></i>
                        </div>
                        <div>
                          <h3 class="text-sm font-bold text-slate-800 leading-tight">${item.title}</h3>
                          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span>Categoria: <strong class="text-slate-600">${item.categoryName}</strong></span>
                            ${item.notes ? `<span>•</span><span class="truncate max-w-[200px] text-slate-500">${item.notes}</span>` : ''}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <div class="text-right">
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            item.isExpired
                              ? 'bg-rose-600 text-white'
                              : item.isUrgent
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }">
                            <i data-lucide="${item.isExpired ? 'x-circle' : 'alert-triangle'}" class="w-3 h-3"></i>
                            ${item.isExpired ? 'VENCIDO' : `Vence em ${item.daysRemaining} dias`}
                          </span>
                          <p class="text-[10px] text-slate-400 mt-0.5">Validade: ${formatDate(item.expirationDate)}</p>
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>`
          }
        </div>

      </div>

      <!-- Coluna Direita: Documentos e Ações (4 colunas no desktop) -->
      <div class="lg:col-span-4 space-y-6">

        <!-- Documentos Recentes -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div class="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <i data-lucide="file-text" class="w-4 h-4"></i>
              </div>
              <h2 class="text-sm font-bold text-slate-900">Documentos Recentes</h2>
            </div>
            <a href="/historico" class="text-[11px] font-semibold text-brand-600 hover:underline">Ver todos</a>
          </div>

          ${
            recentDocuments.length === 0
              ? `<div class="py-6 text-center text-slate-400 text-xs">
                   <p>Nenhum documento salvo ainda.</p>
                 </div>`
              : `<div class="space-y-2.5">
                  ${recentDocuments
                    .map(
                      doc => `
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-sm flex-shrink-0">
                        <i data-lucide="file-check" class="w-4 h-4"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-slate-800 truncate">${doc.fileName}</p>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400">
                          <span class="text-emerald-600 font-medium">Processado</span>
                          <span>•</span>
                          <span>${formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>`
          }
        </div>

        <!-- Banner Promocional Plano Premium -->
        <div class="bg-gradient-to-br from-indigo-900 via-brand-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div class="relative z-10">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold mb-3 border border-amber-400/30">
              <i data-lucide="sparkles" class="w-3 h-3"></i> Versão Premium
            </div>
            <h3 class="text-base font-bold text-white leading-tight">Chega de digitar dados de notas fiscais</h3>
            <p class="text-xs text-slate-300 mt-1.5 leading-relaxed">
              No Plano Premium você fotografa ou envia o PDF e a IA extrai automaticamente produto, loja, garantia e valor.
            </p>
            <a href="/planos" class="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all">
              Conhecer Recursos Premium
            </a>
          </div>
        </div>

        <!-- Card Informativo: Como Usar no Dia a Dia -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
              <i data-lucide="book-open" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 leading-tight">Como usar no seu dia a dia?</h4>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                Guia rápido com 15 passos para organizar suas informações importantes e não depender apenas da memória.
              </p>
            </div>
          </div>
          <a href="/como-usar" class="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-white hover:bg-slate-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 shadow-sm transition-all">
            <span>Acessar Guia do Usuário</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </a>
        </div>

        <!-- Card: Hábito de Uso (Regra Simples) -->
        <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-500/20 shadow-sm space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <i data-lucide="brain" class="w-4 h-4"></i>
            </div>
            <h3 class="text-sm font-bold text-white">Você não precisa lembrar.</h3>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            O Esquecimento Zero lembra por você. Adote uma regra simples no seu dia a dia:
          </p>
          <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 font-semibold italic">
            "Se eu sei que vou precisar lembrar disso depois, eu cadastro agora."
          </div>
        </div>

        <!-- Bloco de Compartilhamento / Aquisição -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 leading-tight">Conhece alguém que vive esquecendo onde guardou as coisas?</h4>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                Compartilhe o Esquecimento Zero e ajude amigos e família a nunca mais perder notas, prazos ou garantias.
              </p>
            </div>
          </div>
          <button id="btn-share-ez" type="button" class="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all hover:scale-[1.01]">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span id="btn-share-text">Compartilhar Esquecimento Zero</span>
          </button>
        </div>

      </div>

    </div>
  `;

  // Inicializar ticker de contagem regressiva em tempo real sincronizado com o servidor
  setupTrialCountdownTicker(access);

  // Fechar banner Momento Aha
  const closeAhaBtn = container.querySelector('#btn-close-aha');
  if (closeAhaBtn) {
    closeAhaBtn.addEventListener('click', () => {
      sessionStorage.removeItem('ez_just_created');
      const banner = document.getElementById('aha-moment-banner');
      if (banner) banner.remove();
    });
  }

  // Ação de compartilhamento com Web Share API ou clipboard fallback
  const shareBtn = container.querySelector('#btn-share-ez');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      window.ezAnalytics?.track('compartilhamento_clicado');
      const shareData = {
        title: 'Esquecimento Zero — Guarde o que você não quer esquecer',
        text: 'Você não precisa lembrar de tudo. O Esquecimento Zero guarda compras, notas, garantias e prazos para você.',
        url: window.location.origin
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          window.ezAnalytics?.track('compartilhamento_sucesso', { method: 'web_share' });
        } catch (err) {
          // Usuário cancelou o compartilhamento
        }
      } else if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(window.location.origin);
          const textSpan = shareBtn.querySelector('#btn-share-text');
          if (textSpan) {
            const original = textSpan.textContent;
            textSpan.textContent = 'Link copiado para a área de transferência! ✅';
            setTimeout(() => { textSpan.textContent = original; }, 3000);
          }
          window.ezAnalytics?.track('compartilhamento_sucesso', { method: 'clipboard' });
        } catch (e) {}
      }
    });
  }

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}

function setupTrialCountdownTicker(access) {
  if (window.__trialTickerInterval) {
    clearInterval(window.__trialTickerInterval);
    window.__trialTickerInterval = null;
  }

  if (!access || access.isLifetime || !access.trialEndsAt) {
    return;
  }

  const serverBase = access.serverTime ? new Date(access.serverTime).getTime() : Date.now();
  const localBase = Date.now();
  const serverDelta = localBase - serverBase;
  const targetEndTime = new Date(access.trialEndsAt).getTime();

  function update() {
    const countdownEl = document.getElementById('trial-countdown-text');
    if (!countdownEl) return;

    const currentServerTime = Date.now() - serverDelta;
    const remainingMs = targetEndTime - currentServerTime;

    if (remainingMs <= 0) {
      countdownEl.innerHTML = `🔒 Seu período gratuito terminou.`;
      countdownEl.className = 'px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs sm:text-sm font-black text-rose-300 inline-flex items-center gap-1.5';
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    if (hours >= 1) {
      countdownEl.innerHTML = `⏳ Seu teste gratuito termina em <strong>${hours} hora${hours > 1 ? 's' : ''} e ${minutes} min</strong>`;
      countdownEl.className = 'px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm font-bold text-amber-300 inline-flex items-center gap-1.5';
    } else {
      countdownEl.innerHTML = `🔥 Seu teste gratuito termina em <strong>${minutes} min e ${seconds}s</strong>`;
      countdownEl.className = 'px-3 py-1.5 rounded-xl bg-rose-900/60 border border-rose-400/50 text-xs sm:text-sm font-black text-rose-200 inline-flex items-center gap-1.5 animate-pulse';
    }
  }

  update();
  window.__trialTickerInterval = setInterval(update, 1000);
}
