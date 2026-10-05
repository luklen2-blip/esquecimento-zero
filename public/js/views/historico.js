import { api, showToast } from '../api.js';

let cachedItems = [];
let cachedDocuments = [];
let activeTab = 'items'; // 'items' | 'documents'

export function renderHistorico() {
  return `
    <div class="view-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <!-- Cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Histórico Completo</span>
          <h1 class="text-2xl font-black text-slate-900 mt-0.5">Meus Itens e Documentos</h1>
          <p class="text-xs text-slate-500 mt-1">Consulte todos os seus produtos, notas fiscais e garantias cadastradas.</p>
        </div>

        <div class="flex items-center gap-2">
          <a href="/adicionar" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Novo Item</span>
          </a>
        </div>
      </div>

      <!-- Barra de Pesquisa e Alternância de Abas -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Abas -->
        <div class="flex items-center p-1 bg-slate-200/80 rounded-xl max-w-xs">
          <button id="tab-btn-items" class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-white text-slate-900 shadow-sm">
            Itens Salvos
          </button>
          <button id="tab-btn-docs" class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900">
            Documentos / NF
          </button>
        </div>

        <!-- Campo de Busca -->
        <div class="relative w-full sm:w-72">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input id="input-search" type="text" placeholder="Buscar por nome, loja ou NF..."
            class="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-brand-500 outline-none transition-all bg-white" />
        </div>
      </div>

      <!-- Container do Conteúdo Dinâmico -->
      <div id="historico-content-area">
        <div class="flex items-center justify-center py-12 text-slate-400 gap-2">
          <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-brand-600"></i>
          <span class="text-xs font-medium">Carregando seus registros...</span>
        </div>
      </div>

    </div>
  `;
}

export async function initHistoricoEvents() {
  activeTab = 'items';
  const container = document.getElementById('historico-content-area');
  const searchInput = document.getElementById('input-search');
  const tabBtnItems = document.getElementById('tab-btn-items');
  const tabBtnDocs = document.getElementById('tab-btn-docs');

  try {
    const [itemsRes, docsRes] = await Promise.all([
      api.items.list(),
      api.documents.list()
    ]);
    cachedItems = itemsRes?.data || [];
    cachedDocuments = docsRes?.data || [];

    renderActiveTabContent(container, searchInput ? searchInput.value : '');
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="p-6 text-center text-rose-600 text-xs">
          Erro ao carregar histórico: ${err.message}
        </div>
      `;
    }
  }

  // Alternador de Abas
  if (tabBtnItems && tabBtnDocs) {
    tabBtnItems.addEventListener('click', () => {
      activeTab = 'items';
      tabBtnItems.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-white text-slate-900 shadow-sm';
      tabBtnDocs.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900';
      renderActiveTabContent(container, searchInput ? searchInput.value : '');
    });

    tabBtnDocs.addEventListener('click', () => {
      activeTab = 'documents';
      tabBtnDocs.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-white text-slate-900 shadow-sm';
      tabBtnItems.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900';
      renderActiveTabContent(container, searchInput ? searchInput.value : '');
    });
  }

  // Busca em tempo real
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderActiveTabContent(container, e.target.value);
    });
  }
}

function renderActiveTabContent(container, searchTerm = '') {
  if (!container) return;
  const term = searchTerm.toLowerCase().trim();

  const formatMoney = (val) => {
    if (!val) return 'R$ 0,00';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const p = iso.split('T')[0].split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  };

  if (activeTab === 'items') {
    const filtered = cachedItems.filter(item => {
      const t = (item.title || '').toLowerCase();
      const s = (item.store || '').toLowerCase();
      const nf = (item.invoiceNumber || '').toLowerCase();
      return t.includes(term) || s.includes(term) || nf.includes(term);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          <i data-lucide="package-search" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
          <p class="text-xs font-medium">Nenhum item encontrado${term ? ` para "${term}"` : ''}.</p>
          <a href="/adicionar" class="inline-block mt-3 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
            Cadastrar Primeiro Item
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map(item => `
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-brand-300 transition-colors">
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                    <i data-lucide="${item.categoryIcon || 'tag'}" class="w-3 h-3"></i>
                    ${item.categoryName || 'Geral'}
                  </span>
                  <span class="text-xs font-extrabold text-slate-900">${formatMoney(item.price)}</span>
                </div>

                <h3 class="text-sm font-bold text-slate-900 leading-snug">${item.title}</h3>
                <p class="text-xs text-slate-500 mt-0.5">${item.store || 'Loja não informada'}</p>

                ${item.invoiceNumber ? `<div class="mt-2 text-[11px] text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded inline-block">NF: ${item.invoiceNumber}</div>` : ''}

                <div class="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Data Compra:</span>
                    <span>${formatDate(item.purchaseDate)}</span>
                  </div>
                  ${item.warrantyEndDate ? `
                    <div class="flex justify-between text-blue-700 font-semibold">
                      <span>Término Garantia:</span>
                      <span>${formatDate(item.warrantyEndDate)}</span>
                    </div>
                  ` : ''}
                  ${item.expirationDate ? `
                    <div class="flex justify-between text-amber-700 font-semibold">
                      <span>Validade:</span>
                      <span>${formatDate(item.expirationDate)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[10px] text-slate-400">Qtd: ${item.quantity || 1}</span>
                <button onclick="window.deleteItemAction('${item.id}', '${item.title}')" class="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Excluir
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  } else {
    // Aba Documentos
    const filteredDocs = cachedDocuments.filter(doc => (doc.fileName || '').toLowerCase().includes(term));

    if (filteredDocs.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          <i data-lucide="file-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
          <p class="text-xs font-medium">Nenhum documento arquivado${term ? ` para "${term}"` : ''}.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredDocs.map(doc => `
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5 hover:border-brand-300 transition-colors">
              <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                ${doc.fileType && doc.fileType.startsWith('image/')
                  ? `<img src="${doc.filePath}" class="w-full h-full object-cover rounded-xl" />`
                  : `<i data-lucide="file-text" class="w-6 h-6 text-rose-500"></i>`
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 truncate">${doc.fileName}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">${formatDate(doc.createdAt)} • ${Math.round(doc.fileSize / 1024)} KB</p>
                <a href="${doc.filePath}" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline mt-1.5">
                  <i data-lucide="external-link" class="w-3 h-3"></i> Abrir Arquivo
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}

// Handler global para exclusão de item
window.deleteItemAction = async (id, title) => {
  if (!confirm(`Deseja realmente remover "${title}" do seu controle?`)) {
    return;
  }

  try {
    await api.items.delete(id);
    showToast('Item removido com sucesso!', 'success');
    cachedItems = cachedItems.filter(i => i.id !== id);
    const container = document.getElementById('historico-content-area');
    const searchInput = document.getElementById('input-search');
    renderActiveTabContent(container, searchInput ? searchInput.value : '');
  } catch (err) {
    showToast(err.message || 'Falha ao remover item.', 'error');
  }
};
