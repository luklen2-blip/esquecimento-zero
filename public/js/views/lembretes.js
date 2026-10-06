import { api, showToast } from '../api.js';

let cachedReminderData = null;

export function renderLembretes() {
  return `
    <div class="view-enter max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <!-- Cabeçalho Principal -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-1">
            <i data-lucide="bell" class="w-3.5 h-3.5"></i> Central de Alertas
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Veja o que precisa da sua atenção</h1>
          <p id="context-phrase" class="text-xs sm:text-sm text-slate-600 mt-1">
            Carregando seus prazos e vencimentos...
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a href="/adicionar" class="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Novo Item</span>
          </a>
          <a href="/dashboard" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
            <span>Dashboard</span>
          </a>
        </div>
      </div>

      <!-- Container do Conteúdo Dinâmico -->
      <div id="reminders-content-area">
        <div class="flex items-center justify-center py-16 text-slate-400 gap-2">
          <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-brand-600"></i>
          <span class="text-xs font-medium">Analisando seus prazos...</span>
        </div>
      </div>

      <!-- Modal de Detalhes do Alerta / Item -->
      <div id="reminder-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div id="reminder-modal-content" class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 relative max-h-[90vh] overflow-y-auto">
          <!-- Injetado dinamicamente via JS -->
        </div>
      </div>

    </div>
  `;
}

export async function initLembretesEvents() {
  const container = document.getElementById('reminders-content-area');
  const contextPhraseEl = document.getElementById('context-phrase');
  if (!container) return;

  try {
    const res = await api.reminders.list();
    cachedReminderData = res?.data || res;
    renderRemindersUI(container, contextPhraseEl, cachedReminderData);
  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center text-rose-600 text-xs bg-rose-50 rounded-2xl border border-rose-200">
        Falha ao carregar alertas: ${err.message || 'Erro de conexão'}.
      </div>
    `;
  }
}

function formatDate(iso) {
  if (!iso) return '-';
  const parts = String(iso).split('T')[0].split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

function formatMoney(val) {
  if (!val) return 'R$ 0,00';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderRemindersUI(container, contextPhraseEl, data) {
  const summary = data?.summary || { total: 0, attentionCount: 0, overdue: 0, today: 0, next7Days: 0, next30Days: 0 };
  const groups = data?.groups || { overdue: [], today: [], next7Days: [], next30Days: [] };

  // 1. Atualização da Frase de Contexto
  if (contextPhraseEl) {
    let mainSentence = '';
    if (summary.attentionCount > 1) {
      mainSentence = `Você tem <strong>${summary.attentionCount} coisas</strong> que precisam da sua atenção agora.`;
    } else if (summary.attentionCount === 1) {
      mainSentence = `Você tem <strong>1 coisa</strong> que precisa da sua atenção agora.`;
    } else {
      mainSentence = `Está tudo em dia.`;
    }
    contextPhraseEl.innerHTML = `
      ${mainSentence}
      <span class="text-slate-400 block sm:inline sm:ml-1">
        Quando você cadastra uma informação importante, o Esquecimento Zero ajuda você a não perder o prazo.
      </span>
    `;
  }

  // 2. Estado "Alerta Zero" (Sem nenhum alerta nas 4 faixas)
  if (summary.total === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
          🎉
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-slate-900">Está tudo em dia! 🎉</h2>
        <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Nenhum vencimento ou garantia precisa da sua atenção agora. Suas notas, compras e documentos estão sob controle.
        </p>
        <div class="pt-2">
          <a href="/dashboard" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
            <span>Voltar para o Dashboard</span>
          </a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: container });
    return;
  }

  // 3. Renderização dos 4 Grupos de Severidade
  let html = `<div class="space-y-8">`;

  // Grupo 1: Vencidos (Vermelho Vivo)
  if (groups.overdue && groups.overdue.length > 0) {
    html += `
      <section class="space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-rose-200">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span>
            <h2 class="text-sm font-extrabold text-rose-950 uppercase tracking-wider">Vencidos</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
              ${groups.overdue.length}
            </span>
          </div>
          <span class="text-[11px] font-semibold text-rose-700">Ação imediata necessária</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${groups.overdue.map(item => renderAlertCard(item, 'overdue')).join('')}
        </div>
      </section>
    `;
  }

  // Grupo 2: Vencem Hoje (Laranja / Âmbar Forte)
  if (groups.today && groups.today.length > 0) {
    html += `
      <section class="space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-amber-200">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500"></span>
            <h2 class="text-sm font-extrabold text-amber-950 uppercase tracking-wider">Vencem Hoje</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
              ${groups.today.length}
            </span>
          </div>
          <span class="text-[11px] font-semibold text-amber-700">Último dia de vigência</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${groups.today.map(item => renderAlertCard(item, 'today')).join('')}
        </div>
      </section>
    `;
  }

  // Grupo 3: Próximos 7 Dias (Amarelo / Dourado)
  if (groups.next7Days && groups.next7Days.length > 0) {
    html += `
      <section class="space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-yellow-200">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
            <h2 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Próximos 7 Dias</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-900 border border-yellow-300">
              ${groups.next7Days.length}
            </span>
          </div>
          <span class="text-[11px] font-semibold text-slate-500">Fique atento esta semana</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${groups.next7Days.map(item => renderAlertCard(item, 'next7Days')).join('')}
        </div>
      </section>
    `;
  }

  // Grupo 4: Próximos 30 Dias (Azul / Neutro)
  if (groups.next30Days && groups.next30Days.length > 0) {
    html += `
      <section class="space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            <h2 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Próximos 30 Dias</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              ${groups.next30Days.length}
            </span>
          </div>
          <span class="text-[11px] font-semibold text-slate-400">Avisos preventivos</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${groups.next30Days.map(item => renderAlertCard(item, 'next30Days')).join('')}
        </div>
      </section>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  // 4. Vincula eventos de clique para abrir detalhes do alerta
  const cards = container.querySelectorAll('.alert-card-clickable');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const remId = card.getAttribute('data-reminder-id');
      const allReminders = data?.reminders || [];
      const reminder = allReminders.find(r => r.id === remId);
      if (reminder) {
        openReminderDetailModal(reminder);
      }
    });
  });
}

function renderAlertCard(item, groupType) {
  let cardBorder = 'border-slate-200 hover:border-slate-300';
  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let badgeText = item.label;
  let iconName = item.type === 'warranty' ? 'shield' : 'clock';

  if (groupType === 'overdue') {
    cardBorder = 'border-rose-300 bg-rose-50/40 hover:border-rose-400 hover:bg-rose-50/70';
    badgeClass = 'bg-rose-600 text-white border-rose-700 shadow-sm';
    badgeText = `VENCIDO • ${item.label}`;
    iconName = 'alert-octagon';
  } else if (groupType === 'today') {
    cardBorder = 'border-amber-300 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50/70';
    badgeClass = 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-sm';
    badgeText = 'VENCE HOJE';
    iconName = 'alert-triangle';
  } else if (groupType === 'next7Days') {
    cardBorder = 'border-yellow-200 bg-yellow-50/30 hover:border-yellow-300 hover:bg-yellow-50/60';
    badgeClass = 'bg-yellow-100 text-yellow-900 border-yellow-300 font-bold';
    badgeText = item.label;
    iconName = 'clock';
  } else {
    cardBorder = 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/60';
    badgeClass = 'bg-blue-50 text-blue-800 border-blue-200 font-semibold';
    badgeText = item.label;
    iconName = 'calendar';
  }

  const typeLabel = item.type === 'warranty' ? 'Garantia' : 'Validade';

  return `
    <div data-reminder-id="${item.id}"
         role="button"
         tabindex="0"
         aria-label="${typeLabel} de ${item.title}: ${badgeText}"
         class="alert-card-clickable p-4 rounded-2xl border ${cardBorder} shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-3 group">
      
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="${item.categoryIcon || 'tag'}" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <span class="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ${typeLabel} • ${item.categoryName}
            </span>
            <h3 class="text-sm font-bold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors truncate">
              ${item.title}
            </h3>
            <p class="text-xs text-slate-500 truncate mt-0.5">
              ${item.store || 'Loja não informada'}
            </p>
          </div>
        </div>

        <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border whitespace-nowrap flex-shrink-0 ${badgeClass}">
          ${badgeText}
        </span>
      </div>

      <div class="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
        <div class="flex items-center gap-1.5 font-medium">
          <i data-lucide="${iconName}" class="w-3.5 h-3.5 text-slate-400"></i>
          <span>Data: <strong>${formatDate(item.triggerDate)}</strong></span>
        </div>
        <span class="text-[11px] font-semibold text-brand-600 group-hover:underline flex items-center gap-1">
          <span>Ver detalhes</span>
          <i data-lucide="chevron-right" class="w-3 h-3"></i>
        </span>
      </div>

    </div>
  `;
}

function openReminderDetailModal(reminder) {
  const modal = document.getElementById('reminder-modal');
  const modalContent = document.getElementById('reminder-modal-content');
  if (!modal || !modalContent) return;

  const typeLabel = reminder.type === 'warranty' ? 'Garantia' : 'Validade';

  modalContent.innerHTML = `
    <div class="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center flex-shrink-0 font-bold">
          <i data-lucide="${reminder.categoryIcon || 'tag'}" class="w-6 h-6"></i>
        </div>
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-brand-600">${typeLabel} • ${reminder.categoryName}</span>
          <h2 class="text-base sm:text-lg font-black text-slate-900 leading-snug">${reminder.title}</h2>
        </div>
      </div>
      <button id="btn-close-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-base font-bold">
        ✕
      </button>
    </div>

    <!-- Status do Prazo -->
    <div class="p-3.5 rounded-2xl ${
      reminder.diffDays < 0 ? 'bg-rose-50 border border-rose-200 text-rose-900' :
      reminder.diffDays === 0 ? 'bg-amber-50 border border-amber-200 text-amber-900' :
      'bg-blue-50 border border-blue-200 text-blue-900'
    } flex items-center justify-between text-xs">
      <div>
        <p class="font-extrabold uppercase tracking-wide text-[10px]">Situação do Prazo</p>
        <p class="font-bold text-sm mt-0.5">${reminder.label}</p>
      </div>
      <span class="font-mono font-bold text-xs">
        Vencimento: ${formatDate(reminder.triggerDate)}
      </span>
    </div>

    <!-- Dados Detalhados do Item -->
    <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <div>
        <span class="text-slate-400 block text-[10px] uppercase font-bold">Loja / Estabelecimento</span>
        <span class="font-semibold text-slate-800">${reminder.store || 'Não informada'}</span>
      </div>
      <div>
        <span class="text-slate-400 block text-[10px] uppercase font-bold">Valor do Item</span>
        <span class="font-semibold text-slate-800">${formatMoney(reminder.price)}</span>
      </div>
      <div>
        <span class="text-slate-400 block text-[10px] uppercase font-bold">Data da Compra</span>
        <span class="font-semibold text-slate-800">${formatDate(reminder.purchaseDate)}</span>
      </div>
      <div>
        <span class="text-slate-400 block text-[10px] uppercase font-bold">Nota Fiscal</span>
        <span class="font-semibold text-slate-800 font-mono">${reminder.invoiceNumber || 'Não informada'}</span>
      </div>
      ${reminder.notes ? `
        <div class="col-span-2 pt-2 border-t border-slate-200/60">
          <span class="text-slate-400 block text-[10px] uppercase font-bold">Observações</span>
          <span class="text-slate-700 italic">${reminder.notes}</span>
        </div>
      ` : ''}
    </div>

    <!-- Anexo / Documento -->
    ${reminder.document ? `
      <div class="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2.5 truncate">
          <i data-lucide="file-text" class="w-5 h-5 text-rose-500 flex-shrink-0"></i>
          <span class="font-medium text-slate-800 truncate">${reminder.document.fileName}</span>
        </div>
        <a href="${reminder.document.filePath}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[11px] rounded-lg border border-brand-200 transition-colors whitespace-nowrap">
          Abrir Arquivo
        </a>
      </div>
    ` : ''}

    <!-- Ações Inferiores -->
    <div class="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
      <a href="/historico" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors">
        <i data-lucide="archive" class="w-4 h-4"></i>
        <span>Consultar no Histórico</span>
      </a>
      <button id="btn-modal-ok" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors">
        Entendido
      </button>
    </div>
  `;

  modal.classList.remove('hidden');

  if (window.lucide) {
    window.lucide.createIcons({ root: modalContent });
  }

  // Fechamento do modal
  const close = () => modal.classList.add('hidden');
  const closeBtn = document.getElementById('btn-close-modal');
  const okBtn = document.getElementById('btn-modal-ok');
  if (closeBtn) closeBtn.onclick = close;
  if (okBtn) okBtn.onclick = close;
  modal.onclick = (e) => {
    if (e.target === modal) close();
  };
}
