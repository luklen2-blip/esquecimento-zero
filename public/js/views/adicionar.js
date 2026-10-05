import { api, showToast } from '../api.js';

let currentDocumentId = null;

export function renderAdicionar() {
  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Novo Registro</span>
          <h1 class="text-2xl font-black text-slate-900 mt-0.5">Cadastrar Item ou Documento</h1>
          <p class="text-xs text-slate-500 mt-1">Fotografe, envie a nota fiscal em PDF ou digite os dados diretamente.</p>
        </div>
        <a href="/dashboard" class="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar
        </a>
      </div>

      <!-- Banner de Alerta de Limite do Plano (se aplicável) -->
      <div id="plan-quota-warning" class="hidden bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600 flex-shrink-0"></i>
          <div>
            <p class="text-xs font-bold text-amber-900">Limite de 10 Itens do Plano Gratuito Atingido</p>
            <p class="text-[11px] text-amber-700">Para continuar cadastrando sem limites e ativar o OCR por IA, conheça o Premium.</p>
          </div>
        </div>
        <a href="/planos" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl whitespace-nowrap">
          Ver Planos
        </a>
      </div>

      <!-- Métodos de Captura de Documento -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="scan-line" class="w-4 h-4 text-brand-600"></i>
            1. Envio do Documento com Leitura por IA
          </h2>
          <span class="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <i data-lucide="sparkles" class="w-3 h-3 text-purple-500"></i> IA/OCR Ativo
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- 1. Tirar Foto (Câmera Mobile) -->
          <label class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 cursor-pointer transition-all text-center group">
            <input id="input-camera" type="file" accept="image/*" capture="environment" class="hidden" />
            <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i data-lucide="camera" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-slate-800">Tirar Foto</span>
            <span class="text-[10px] text-slate-400 mt-0.5">Câmera do celular</span>
          </label>

          <!-- 2. Enviar Imagem -->
          <label class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 cursor-pointer transition-all text-center group">
            <input id="input-image" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" />
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i data-lucide="image" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-slate-800">Galeria</span>
            <span class="text-[10px] text-slate-400 mt-0.5">Fotos salvas (JPG/PNG)</span>
          </label>

          <!-- 3. Enviar PDF -->
          <label class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-rose-500 hover:bg-rose-50/20 cursor-pointer transition-all text-center group">
            <input id="input-pdf" type="file" accept="application/pdf" class="hidden" />
            <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i data-lucide="file-text" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-slate-800">Nota Fiscal PDF</span>
            <span class="text-[10px] text-slate-400 mt-0.5">Arquivo DANFE</span>
          </label>

          <!-- 4. Manual -->
          <div onclick="document.getElementById('item-title').focus()" class="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all text-center group">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i data-lucide="edit" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-bold text-slate-800">Manual</span>
            <span class="text-[10px] text-slate-400 mt-0.5">Digitar os campos</span>
          </div>
        </div>

        <!-- Animação de Análise por IA / Scanner -->
        <div id="ai-scanning-overlay" class="hidden p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white text-center space-y-3">
          <div class="flex items-center justify-center gap-2 text-purple-300">
            <i data-lucide="sparkles" class="w-6 h-6 animate-pulse text-amber-400"></i>
            <span class="text-sm font-extrabold uppercase tracking-wider">Processando Documento com IA</span>
          </div>
          <p id="ai-step-text" class="text-xs text-purple-200">Lendo texto e identificando dados da compra...</p>
          <div class="w-48 mx-auto bg-purple-950/60 rounded-full h-1.5 overflow-hidden">
            <div class="bg-amber-400 h-full rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>

        <!-- Área de Pré-visualização do Documento Enviado -->
        <div id="upload-preview-area" class="hidden p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div id="preview-icon-wrapper" class="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm flex-shrink-0">
              <i data-lucide="file" class="w-5 h-5"></i>
            </div>
            <div>
              <p id="preview-filename" class="text-xs font-bold text-slate-800 truncate max-w-xs"></p>
              <p id="preview-filesize" class="text-[11px] text-emerald-600 font-medium">Upload concluído e analisado pela IA</p>
            </div>
          </div>
          <button id="btn-remove-doc" type="button" class="text-xs font-semibold text-rose-600 hover:underline">
            Remover
          </button>
        </div>

        <!-- Banner de Confirmação dos Dados Identificados pela IA -->
        <div id="ai-confirmation-banner" class="hidden p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <i data-lucide="check-check" class="w-4 h-4"></i>
          </div>
          <div>
            <h3 class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <span>IA Identificou os Dados da Nota Fiscal com Sucesso</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">94% de Confiança</span>
            </h3>
            <p class="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
              Os campos abaixo foram preenchidos automaticamente. <strong>Você pode conferir e corrigir qualquer informação antes de salvar.</strong>
            </p>
          </div>
        </div>
      </div>

      <!-- Formulário de Confirmação e Cadastro dos Dados -->
      <form id="form-item" class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="check-square" class="w-4 h-4 text-emerald-600"></i>
            2. Confirmação dos Dados do Item e Prazos
          </h2>
          <span class="text-xs text-slate-400">Campos com * são obrigatórios</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <!-- Nome do Produto / Título -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-title">
              Nome do Produto / Item *
            </label>
            <input id="item-title" type="text" required placeholder="Ex: Geladeira Frost Free 400L, Smart TV 55, Dipirona 500mg"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
          </div>

          <!-- Categoria -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-category">
              Categoria
            </label>
            <select id="item-category" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white">
              <option value="cat_eletronicos">Eletrônicos & Tecnologia</option>
              <option value="cat_eletrodomesticos">Eletrodomésticos & Casa</option>
              <option value="cat_alimentos">Alimentos & Despensa</option>
              <option value="cat_saude">Medicamentos & Saúde</option>
              <option value="cat_veiculos">Veículos & Transporte</option>
              <option value="cat_documentos">Documentos & Contratos</option>
              <option value="cat_geral">Geral & Diversos</option>
            </select>
          </div>

          <!-- Loja / Estabelecimento -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-store">
              Loja / Fornecedor
            </label>
            <input id="item-store" type="text" placeholder="Ex: Magazine Luiza, Amazon, Farmácia"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
          </div>

          <!-- Data da Compra -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-purchase-date">
              Data da Compra
            </label>
            <input id="item-purchase-date" type="date"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
          </div>

          <!-- Valor Pago (R$) -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-price">
              Valor Pago (R$)
            </label>
            <input id="item-price" type="number" step="0.01" min="0" placeholder="0,00"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
          </div>

          <!-- Número da Nota Fiscal -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-invoice">
              Nº da Nota Fiscal / Cupom
            </label>
            <input id="item-invoice" type="text" placeholder="Ex: NF-49281 ou Chave de Acesso"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
          </div>

          <!-- Quantidade -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-quantity">
              Quantidade
            </label>
            <input id="item-quantity" type="number" min="1" value="1"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
          </div>

          <!-- Data Final da Garantia -->
          <div class="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
            <label class="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1" for="item-warranty-end">
              Data Término da Garantia
            </label>
            <input id="item-warranty-end" type="date"
              class="w-full px-3.5 py-2 rounded-lg border border-blue-200 text-sm focus:border-brand-500 outline-none bg-white" />
            <span class="text-[10px] text-blue-600 mt-1 block">O sistema avisará antes que ela expire</span>
          </div>

          <!-- Data de Validade do Produto -->
          <div class="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
            <label class="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1" for="item-expiration-date">
              Data de Validade (se houver)
            </label>
            <input id="item-expiration-date" type="date"
              class="w-full px-3.5 py-2 rounded-lg border border-amber-200 text-sm focus:border-brand-500 outline-none bg-white" />
            <span class="text-[10px] text-amber-700 mt-1 block">Para alimentos, remédios e cosméticos</span>
          </div>

          <!-- Observações -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" for="item-notes">
              Observações Adicionais
            </label>
            <textarea id="item-notes" rows="2" placeholder="Ex: Guardado no armário da cozinha, suporte técnico Samsung 0800..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"></textarea>
          </div>

        </div>

        <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a href="/dashboard" class="text-xs font-semibold text-slate-500 hover:text-slate-800">
            Cancelar e Voltar
          </a>

          <button id="btn-save-item" type="submit"
            class="w-full sm:w-auto px-7 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Confirmar e Salvar no Sistema</span>
          </button>
        </div>

      </form>

    </div>
  `;
}

export async function initAdicionarEvents() {
  currentDocumentId = null;

  // Verifica cota do usuário
  try {
    const meRes = await api.auth.me();
    const usage = meRes?.data?.usage;
    if (usage && usage.isLimitReached) {
      const banner = document.getElementById('plan-quota-warning');
      const saveBtn = document.getElementById('btn-save-item');
      if (banner) banner.classList.remove('hidden');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }
  } catch (err) {
    console.warn('[Adicionar] Não foi possível verificar cotas:', err.message);
  }

  // Preenche data da compra com hoje
  const purchaseDateInput = document.getElementById('item-purchase-date');
  if (purchaseDateInput) {
    purchaseDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Handlers para os 3 inputs de upload com IA
  const cameraInput = document.getElementById('input-camera');
  const imageInput = document.getElementById('input-image');
  const pdfInput = document.getElementById('input-pdf');

  async function handleFileUpload(file) {
    if (!file) return;

    const scanningOverlay = document.getElementById('ai-scanning-overlay');
    const previewArea = document.getElementById('upload-preview-area');
    const confirmationBanner = document.getElementById('ai-confirmation-banner');
    const stepText = document.getElementById('ai-step-text');

    if (scanningOverlay) scanningOverlay.classList.remove('hidden');
    if (previewArea) previewArea.classList.add('hidden');
    if (confirmationBanner) confirmationBanner.classList.add('hidden');
    if (window.lucide) window.lucide.createIcons();

    showToast(`Enviando ${file.name} para análise por IA...`, 'info');

    try {
      // 1. Upload do Arquivo
      if (stepText) stepText.textContent = 'Enviando documento para o servidor seguro...';
      const uploadRes = await api.documents.upload(file);
      const doc = uploadRes.data;
      currentDocumentId = doc.id;

      // 2. Processamento Inteligente por IA / OCR
      if (stepText) stepText.textContent = 'IA analisando notas fiscais, lojas, valores e prazos...';
      const processRes = await api.documents.process(doc.id);
      const extracted = processRes?.data?.extracted;

      // Oculta animação de escaneamento
      if (scanningOverlay) scanningOverlay.classList.add('hidden');

      // Exibe pré-visualização do documento
      const filenameEl = document.getElementById('preview-filename');
      const filesizeEl = document.getElementById('preview-filesize');
      const iconWrapper = document.getElementById('preview-icon-wrapper');

      if (previewArea) previewArea.classList.remove('hidden');
      if (filenameEl) filenameEl.textContent = doc.fileName;
      if (filesizeEl) {
        const kb = Math.round(doc.fileSize / 1024);
        filesizeEl.textContent = `${kb} KB • Analisado com sucesso pela IA`;
      }

      if (iconWrapper) {
        if (doc.fileType.startsWith('image/')) {
          iconWrapper.innerHTML = `<img src="${doc.filePath}" class="w-full h-full object-cover rounded-lg" />`;
        } else {
          iconWrapper.innerHTML = `<i data-lucide="file-text" class="w-5 h-5 text-rose-600"></i>`;
        }
      }

      // 3. Preenchimento Automático dos Campos Identificados
      if (extracted) {
        if (extracted.title) document.getElementById('item-title').value = extracted.title;
        if (extracted.categoryId) document.getElementById('item-category').value = extracted.categoryId;
        if (extracted.store) document.getElementById('item-store').value = extracted.store;
        if (extracted.purchaseDate) document.getElementById('item-purchase-date').value = extracted.purchaseDate;
        if (extracted.price) document.getElementById('item-price').value = extracted.price;
        if (extracted.quantity) document.getElementById('item-quantity').value = extracted.quantity;
        if (extracted.invoiceNumber) document.getElementById('item-invoice').value = extracted.invoiceNumber;
        if (extracted.warrantyEndDate) document.getElementById('item-warranty-end').value = extracted.warrantyEndDate;
        if (extracted.expirationDate) document.getElementById('item-expiration-date').value = extracted.expirationDate;
        if (extracted.notes) document.getElementById('item-notes').value = extracted.notes;

        // Exibe o Banner de Confirmação da IA
        if (confirmationBanner) confirmationBanner.classList.remove('hidden');
        showToast('IA identificou os dados com sucesso! Revise e confirme.', 'success');
      }

    } catch (err) {
      if (scanningOverlay) scanningOverlay.classList.add('hidden');
      showToast(err.message || 'Falha no processamento do documento.', 'error');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  if (cameraInput) cameraInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));
  if (imageInput) imageInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));
  if (pdfInput) pdfInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));

  // Botão remover anexo
  const removeDocBtn = document.getElementById('btn-remove-doc');
  if (removeDocBtn) {
    removeDocBtn.addEventListener('click', () => {
      currentDocumentId = null;
      const previewArea = document.getElementById('upload-preview-area');
      const confirmationBanner = document.getElementById('ai-confirmation-banner');
      if (previewArea) previewArea.classList.add('hidden');
      if (confirmationBanner) confirmationBanner.classList.add('hidden');
      if (cameraInput) cameraInput.value = '';
      if (imageInput) imageInput.value = '';
      if (pdfInput) pdfInput.value = '';
      showToast('Anexo removido.', 'info');
    });
  }

  // Submissão do formulário
  const form = document.getElementById('form-item');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-item');

      const title = document.getElementById('item-title').value.trim();
      const categoryId = document.getElementById('item-category').value;
      const store = document.getElementById('item-store').value.trim();
      const purchaseDate = document.getElementById('item-purchase-date').value;
      const price = document.getElementById('item-price').value;
      const quantity = document.getElementById('item-quantity').value;
      const invoiceNumber = document.getElementById('item-invoice').value.trim();
      const warrantyEndDate = document.getElementById('item-warranty-end').value;
      const expirationDate = document.getElementById('item-expiration-date').value;
      const notes = document.getElementById('item-notes').value.trim();

      try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Salvando no banco...`;
        if (window.lucide) window.lucide.createIcons();

        await api.items.create({
          title,
          categoryId,
          store,
          purchaseDate,
          price,
          quantity,
          invoiceNumber,
          warrantyEndDate,
          expirationDate,
          notes,
          documentId: currentDocumentId
        });

        showToast('Item registrado com sucesso! Lembretes programados.', 'success');
        window.location.href = '/dashboard';
      } catch (err) {
        showToast(err.message || 'Falha ao salvar item.', 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Confirmar e Salvar no Sistema</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  if (window.lucide) window.lucide.createIcons();
}
