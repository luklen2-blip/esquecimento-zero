import { authStorage, api, showToast } from '../api.js';

export function renderAdicionar() {
  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        
        <div class="mb-6">
          <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Cadastro de Item ou Documento</span>
          <h1 class="text-2xl font-black text-slate-900 mt-1">Como você deseja adicionar?</h1>
          <p class="text-sm text-slate-500 mt-1">Escolha a forma mais conveniente para registrar sua garantia ou produto</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Opção 1: Tirar Foto -->
          <div class="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 transition-all flex flex-col items-center text-center group cursor-pointer"
               onclick="alert('Módulo de Câmera e Captura Direta programado para a Etapa 2 de Upload e OCR.');">
            <div class="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i data-lucide="camera" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">Tirar Foto</h3>
            <p class="text-xs text-slate-500 mt-1">Use a câmera do seu celular para fotografar a nota fiscal ou produto</p>
            <span class="mt-3 text-[11px] font-semibold text-brand-600 group-hover:underline">Abrir Câmera →</span>
          </div>

          <!-- Opção 2: Enviar Imagem -->
          <div class="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 transition-all flex flex-col items-center text-center group cursor-pointer"
               onclick="alert('Módulo de Upload de Fotos e Imagens programado para a Etapa 2 de Upload.');">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i data-lucide="image" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">Enviar Imagem da Galeria</h3>
            <p class="text-xs text-slate-500 mt-1">Selecione fotos já salvas (JPG, PNG) no seu aparelho</p>
            <span class="mt-3 text-[11px] font-semibold text-brand-600 group-hover:underline">Selecionar Imagem →</span>
          </div>

          <!-- Opção 3: Enviar PDF -->
          <div class="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 transition-all flex flex-col items-center text-center group cursor-pointer"
               onclick="alert('Módulo de Leitura de PDFs de Nota Fiscal programado para a Etapa 2.');">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i data-lucide="file-text" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">Enviar Arquivo PDF (DANFE)</h3>
            <p class="text-xs text-slate-500 mt-1">Envie o arquivo eletrônico da nota fiscal emitido pela loja</p>
            <span class="mt-3 text-[11px] font-semibold text-brand-600 group-hover:underline">Selecionar PDF →</span>
          </div>

          <!-- Opção 4: Inserir Manualmente -->
          <div class="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 transition-all flex flex-col items-center text-center group cursor-pointer"
               onclick="alert('Formulário manual de cadastro programado para a próxima etapa.');">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i data-lucide="edit-3" class="w-6 h-6"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">Inserir Dados Manualmente</h3>
            <p class="text-xs text-slate-500 mt-1">Preencha nome, data, valor e garantia por conta própria</p>
            <span class="mt-3 text-[11px] font-semibold text-brand-600 group-hover:underline">Preencher Campos →</span>
          </div>
        </div>

        <div class="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Esta funcionalidade será ativada na <strong>Etapa 2 (Upload e OCR)</strong>.</span>
          <a href="/dashboard" class="font-semibold text-brand-600 hover:underline">← Voltar ao Dashboard</a>
        </div>

      </div>
    </div>
  `;
}

export function renderCalendario() {
  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <i data-lucide="calendar" class="w-7 h-7"></i>
        </div>
        <h1 class="text-2xl font-black text-slate-900">Visão de Calendário</h1>
        <p class="text-sm text-slate-500 max-w-md mx-auto">
          Visualize visualmente em uma grade mensal todos os seus vencimentos, garantias a expirar e tarefas programadas.
        </p>
        <div class="p-3 bg-slate-50 rounded-xl max-w-sm mx-auto text-xs text-slate-600">
          Disponível na etapa do sistema de lembretes e agendamentos.
        </div>
        <a href="/dashboard" class="inline-block mt-3 px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl">
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  `;
}

export function renderLembretes() {
  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <i data-lucide="bell" class="w-7 h-7"></i>
        </div>
        <h1 class="text-2xl font-black text-slate-900">Central de Lembretes</h1>
        <p class="text-sm text-slate-500 max-w-md mx-auto">
          Configure avisos preventivos (30 dias antes, 7 dias antes, no dia) via e-mail e notificações no aparelho.
        </p>
        <div class="p-3 bg-slate-50 rounded-xl max-w-sm mx-auto text-xs text-slate-600">
          Arquitetura preparada para disparos programados de avisos.
        </div>
        <a href="/dashboard" class="inline-block mt-3 px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl">
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  `;
}

export function renderHistorico() {
  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
          <i data-lucide="archive" class="w-7 h-7"></i>
        </div>
        <h1 class="text-2xl font-black text-slate-900">Histórico de Documentos</h1>
        <p class="text-sm text-slate-500 max-w-md mx-auto">
          Busca avançada, filtros por loja, data de emissão e download das notas fiscais e comprovantes em PDF.
        </p>
        <a href="/dashboard" class="inline-block mt-3 px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl">
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  `;
}

export function renderPerfil() {
  const user = authStorage.getUser() || { name: 'Usuário', email: 'usuario@exemplo.com' };
  return `
    <div class="view-enter max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        <div class="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-900">${user.name}</h1>
            <p class="text-xs text-slate-500 mt-0.5">${user.email}</p>
            <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              Plano Gratuito (10 itens)
            </span>
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Privacidade & Seus Dados (LGPD)</h2>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
            <p>Seus dados são protegidos por criptografia e isolados exclusivamente para a sua conta.</p>
            <div class="flex flex-wrap gap-2 pt-2">
              <button onclick="alert('Exportação de dados em JSON disponível para download.');" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100">
                Exportar Meus Dados
              </button>
              <button onclick="if(confirm('Tem certeza que deseja solicitar exclusão completa de seus dados conforme a LGPD?')){ alert('Solicitação registrada. Seus dados serão anonimizados.'); }" class="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold hover:bg-rose-100">
                Solicitar Exclusão de Conta
              </button>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
          <a href="/dashboard" class="text-xs font-semibold text-slate-600 hover:text-brand-600">← Voltar ao Início</a>
          <button id="btn-profile-logout" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
            <i data-lucide="log-out" class="w-4 h-4"></i> Sair da Conta
          </button>
        </div>

      </div>
    </div>
  `;
}

export function initPerfilEvents() {
  const logoutBtn = document.getElementById('btn-profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      api.auth.logout();
    });
  }
}

export function renderPlanos() {
  return `
    <div class="view-enter max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div class="text-center max-w-xl mx-auto mb-8">
        <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Escolha a Melhor Opção</span>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Planos Simples e Transparentes</h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-2">
          Comece gratuitamente e evolua para o plano ilimitado com reconhecimento inteligente por IA quando precisar.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        <!-- Plano Gratuito -->
        <div class="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Plano Atual</span>
              <span class="text-xs font-semibold text-slate-400">Gratuito para sempre</span>
            </div>
            <h2 class="text-2xl font-black text-slate-900">Gratuito</h2>
            <div class="my-4">
              <span class="text-4xl font-extrabold text-slate-900">R$ 0</span>
              <span class="text-xs text-slate-500 font-medium">/mês</span>
            </div>
            <p class="text-xs text-slate-600 mb-6">Ideal para quem quer testar e controlar seus itens principais.</p>

            <ul class="space-y-3 text-xs text-slate-700">
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span><strong>Até 10 itens</strong> cadastrados simultaneamente</span>
              </li>
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span>Painel de vencimentos e garantias</span>
              </li>
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span>Lembretes básicos no painel</span>
              </li>
              <li class="flex items-center gap-2.5 text-slate-400">
                <i data-lucide="x" class="w-4 h-4 text-slate-300 flex-shrink-0"></i>
                <span>Processamento automático por IA de notas fiscais</span>
              </li>
              <li class="flex items-center gap-2.5 text-slate-400">
                <i data-lucide="x" class="w-4 h-4 text-slate-300 flex-shrink-0"></i>
                <span>Exportação completa de dados</span>
              </li>
            </ul>
          </div>

          <div class="mt-8 pt-4 border-t border-slate-100">
            <button disabled class="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed">
              Seu Plano Ativo
            </button>
          </div>
        </div>

        <!-- Plano Premium -->
        <div class="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-slate-800 relative">
          <div class="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
            Mais Escolhido
          </div>

          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">Premium Ilimitado</span>
            </div>
            <h2 class="text-2xl font-black text-white">Premium IA</h2>
            <div class="my-4">
              <span class="text-4xl font-extrabold text-white">R$ 14,90</span>
              <span class="text-xs text-slate-400 font-medium">/mês ou R$ 149/ano no PIX</span>
            </div>
            <p class="text-xs text-slate-300 mb-6">Para quem quer automação total sem digitar dados e sem limite de itens.</p>

            <ul class="space-y-3 text-xs text-slate-200">
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
                <span><strong>Itens ilimitados</strong> sem restrições</span>
              </li>
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
                <span><strong>Processamento inteligente por IA / OCR</strong> de fotos e PDFs</span>
              </li>
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
                <span>Lembretes e notificações avançadas</span>
              </li>
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
                <span>Histórico completo e pesquisa inteligente</span>
              </li>
              <li class="flex items-center gap-2.5">
                <i data-lucide="check" class="w-4 h-4 text-amber-400 flex-shrink-0"></i>
                <span>Categorias personalizadas e exportação</span>
              </li>
            </ul>
          </div>

          <div class="mt-8 pt-4 border-t border-slate-800">
            <button onclick="alert('Cobrança em ambiente de preparação! O gateway PIX nativo será ativado na fase de monetização.');"
              class="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              <span>Assinar Plano Premium (PIX / Cartão)</span>
            </button>
            <p class="text-[10px] text-center text-slate-400 mt-2">
              Cobrança segura • Cancele quando quiser • Garantia de 7 dias
            </p>
          </div>
        </div>

      </div>

    </div>
  `;
}
