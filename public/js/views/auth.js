import { api, showToast } from '../api.js';
import { analytics } from '../analytics.js';

function renderValueProposition() {
  return `
    <div class="space-y-6 text-slate-800">
      
      <!-- Cabeçalho de Impacto -->
      <div class="space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
          <span class="text-sm">🧠</span> Esquecimento Zero
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          O que você não quer esquecer?
        </h1>
        <p class="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          Cadastre compras, documentos, garantias, vencimentos e informações importantes para encontrar tudo quando precisar.
        </p>
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-sm">
          <span class="text-lg">✨</span>
          <span>Sua memória não precisa carregar tudo sozinha.</span>
        </div>
      </div>

      <!-- O que você pode guardar? (8 Cards Visuais) -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500">O que você pode guardar?</h2>
          <span class="text-[11px] text-brand-600 font-semibold">Tudo em um só lugar</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-800">
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">🛒</span>
            <span class="font-bold text-[11px] sm:text-xs">Compras & Produtos</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">📄</span>
            <span class="font-bold text-[11px] sm:text-xs">Notas Fiscais & PDFs</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">🛡️</span>
            <span class="font-bold text-[11px] sm:text-xs">Garantias</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">⏰</span>
            <span class="font-bold text-[11px] sm:text-xs">Vencimentos & Prazos</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">🚗</span>
            <span class="font-bold text-[11px] sm:text-xs">Veículo & Revisões</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">🏠</span>
            <span class="font-bold text-[11px] sm:text-xs">Itens da Casa</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">👨‍👩‍👧</span>
            <span class="font-bold text-[11px] sm:text-xs">Família & Filhos</span>
          </div>
          <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col gap-1">
            <span class="text-base">💼</span>
            <span class="font-bold text-[11px] sm:text-xs">Trabalho & Negócio</span>
          </div>
        </div>
      </div>

      <!-- Frases de Ação Rápida -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div class="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
          💡 <strong>Se você sabe que vai precisar lembrar disso depois:</strong> cadastre agora.
        </div>
        <div class="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
          🎯 <strong>Não sabe se vale a pena cadastrar?</strong> Cadastre.
        </div>
      </div>

      <!-- Comunicação com Públicos -->
      <div class="pt-1 border-t border-slate-200/80">
        <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Ideal para todas as suas necessidades</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
          <div class="flex items-start gap-1.5">
            <span class="text-brand-600 font-bold">✔ Consumidores:</span>
            <span>Comprou? Cadastre. Guardou a nota? Registre. Tem garantia? Salve.</span>
          </div>
          <div class="flex items-start gap-1.5">
            <span class="text-brand-600 font-bold">✔ Famílias:</span>
            <span>Organize compras da casa e documentos de todos em um só lugar.</span>
          </div>
          <div class="flex items-start gap-1.5">
            <span class="text-brand-600 font-bold">✔ Motoristas:</span>
            <span>Compras, documentos, manutenção e revisões do veículo.</span>
          </div>
          <div class="flex items-start gap-1.5">
            <span class="text-brand-600 font-bold">✔ Profissionais:</span>
            <span>Equipamentos, ferramentas e notas sem estresse ou desorganização.</span>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function renderLogin() {
  return `
    <div class="view-enter max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        <!-- Coluna Esquerda: Proposta de Valor e Apresentação -->
        <div class="lg:col-span-7">
          ${renderValueProposition()}
        </div>

        <!-- Coluna Direita: Card de Login -->
        <div class="lg:col-span-5">
          <div class="w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
            
            <div class="text-center">
              <div class="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <i data-lucide="key-round" class="w-6 h-6"></i>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Acesse sua Conta</h2>
              <p class="text-xs text-slate-500 mt-1">Entre para acessar seus itens, prazos e documentos</p>
            </div>

            <!-- Botão de Demonstração Rápida -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
              <div class="text-left">
                <p class="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-blue-600"></i> Teste rápido
                </p>
                <p class="text-[11px] text-blue-700">Preencha com o perfil de demonstração</p>
              </div>
              <button id="btn-demo-fill" type="button" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                Preencher Demo
              </button>
            </div>

            <!-- Formulário de Login -->
            <form id="form-login" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" for="login-email">E-mail</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input id="login-email" type="email" required placeholder="seu@email.com" autocomplete="email"
                    class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider" for="login-password">Senha</label>
                  <a href="#" onclick="alert('Utilize o botão Preencher Demo acima para acessar a conta de demonstração.'); return false;" class="text-xs font-medium text-brand-600 hover:underline">Esqueceu?</a>
                </div>
                <div class="relative">
                  <i data-lucide="lock" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input id="login-password" type="password" required placeholder="Sua senha secreta" autocomplete="current-password"
                    class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
              </div>

              <button id="btn-login-submit" type="submit"
                class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2">
                <span>Entrar no Esquecimento Zero</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

            <div class="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Ainda não tem conta?
              <a href="/cadastro" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">Criar conta grátis por 24 horas</a>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;
}

export function initLoginEvents() {
  const form = document.getElementById('form-login');
  const demoBtn = document.getElementById('btn-demo-fill');

  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      document.getElementById('login-email').value = 'demo@esquecimentozero.com.br';
      document.getElementById('login-password').value = 'demo123';
      showToast('Credenciais de demonstração preenchidas!', 'info');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-login-submit');
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Conectando...`;
        if (window.lucide) window.lucide.createIcons();

        await api.auth.login(email, password);
        analytics.track('login_efetuado');
        showToast('Login realizado com sucesso! Bem-vindo(a).', 'success');
        window.location.href = '/dashboard';
      } catch (err) {
        showToast(err.message || 'Falha ao autenticar.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Entrar no Esquecimento Zero</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}

export function renderRegister() {
  return `
    <div class="view-enter max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        <!-- Coluna Esquerda: Proposta de Valor e Apresentação -->
        <div class="lg:col-span-7">
          ${renderValueProposition()}
        </div>

        <!-- Coluna Direita: Card de Cadastro com CTA 24h -->
        <div class="lg:col-span-5">
          <div class="w-full bg-white rounded-3xl border-2 border-brand-500/20 shadow-xl p-6 sm:p-8 space-y-5 relative">
            
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>🎁 24 Horas Grátis • Sem Cartão</span>
            </div>

            <div>
              <h2 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Comece em Segundos</h2>
              <p class="text-xs text-slate-500 mt-1">Crie sua conta e experimente todas as funcionalidades por 24 horas.</p>
            </div>

            <!-- Formulário de Cadastro -->
            <form id="form-register" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" for="reg-name">Seu Nome</label>
                <div class="relative">
                  <i data-lucide="user" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input id="reg-name" type="text" required placeholder="Como podemos te chamar?" autocomplete="name"
                    class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" for="reg-email">Seu E-mail</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input id="reg-email" type="email" required placeholder="seu@email.com" autocomplete="email"
                    class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" for="reg-password">Senha de Acesso</label>
                <div class="relative">
                  <i data-lucide="lock" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input id="reg-password" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" autocomplete="new-password"
                    class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
              </div>

              <!-- Consentimento LGPD & Termos -->
              <div class="pt-1">
                <label class="flex items-start gap-2.5 cursor-pointer">
                  <input id="reg-terms" type="checkbox" required class="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                  <span class="text-[11px] text-slate-600 leading-relaxed">
                    Declaro mais de 13 anos e concordo com os
                    <a href="/termos" target="_blank" class="text-brand-600 hover:underline font-semibold">Termos de Uso</a> e a
                    <a href="/privacidade" target="_blank" class="text-brand-600 hover:underline font-semibold">Política de Privacidade</a>.
                  </span>
                </label>
              </div>

              <button id="btn-register-submit" type="submit"
                class="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2">
                <span>COMEÇAR GRÁTIS POR 24 HORAS</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

            <div class="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
              Já possui cadastro?
              <a href="/login" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">Fazer login</a>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;
}

export function initRegisterEvents() {
  const form = document.getElementById('form-register');
  const nameInput = document.getElementById('reg-name');

  if (nameInput) {
    nameInput.addEventListener('focus', () => {
      analytics.track('cadastro_iniciado');
    }, { once: true });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-register-submit');
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const termsAccepted = document.getElementById('reg-terms').checked;

      if (!termsAccepted) {
        showToast('É necessário concordar com os Termos e a Política de Privacidade para prosseguir.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Ativando seu teste gratuito...`;
        if (window.lucide) window.lucide.createIcons();

        await api.auth.register({ name, email, password, termsAccepted });
        analytics.track('cadastro_concluido', { email });
        showToast('Conta criada com sucesso! Suas 24 horas gratuitas começaram agora.', 'success');
        window.location.href = '/dashboard';
      } catch (err) {
        showToast(err.message || 'Falha ao criar conta.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>COMEÇAR GRÁTIS POR 24 HORAS</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}

