import { api, showToast } from '../api.js';

export function renderLogin() {
  return `
    <div class="view-enter min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
        
        <!-- Cabeçalho do Card -->
        <div class="text-center mb-6">
          <div class="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <i data-lucide="key-round" class="w-6 h-6"></i>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Acesse sua Conta</h1>
          <p class="text-sm text-slate-500 mt-1">Gerencie seus prazos, garantias e notas fiscais com tranquilidade</p>
        </div>

        <!-- Botão de Demonstração Rápida -->
        <div class="mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 flex items-center justify-between">
          <div class="text-left">
            <p class="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-blue-600"></i> Quer testar agora?
            </p>
            <p class="text-[11px] text-blue-700">Preencha com o perfil de demonstração</p>
          </div>
          <button id="btn-demo-fill" type="button" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
            Preencher Demo
          </button>
        </div>

        <!-- Formulário de Login -->
        <form id="form-login" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" for="login-email">E-mail</label>
            <div class="relative">
              <i data-lucide="mail" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input id="login-email" type="email" required placeholder="seu@email.com" autocomplete="email"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider" for="login-password">Senha</label>
              <a href="#" onclick="alert('Para fins de demonstração, utilize o botão Preencher Demo acima.'); return false;" class="text-xs font-medium text-brand-600 hover:underline">Esqueceu?</a>
            </div>
            <div class="relative">
              <i data-lucide="lock" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input id="login-password" type="password" required placeholder="Sua senha secreta" autocomplete="current-password"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
            </div>
          </div>

          <button id="btn-login-submit" type="submit"
            class="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2">
            <span>Entrar no Esquecimento Zero</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </form>

        <!-- Rodapé do Card -->
        <div class="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Ainda não tem conta?
          <a href="/cadastro" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">Criar conta gratuita (10 itens inclusos)</a>
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
    <div class="view-enter min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
        
        <!-- Cabeçalho do Card -->
        <div class="text-center mb-6">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <i data-lucide="user-plus" class="w-6 h-6"></i>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Crie sua Conta Gratuita</h1>
          <p class="text-sm text-slate-500 mt-1">Comece agora a organizar suas garantias e compras com até 10 itens gratuitos</p>
        </div>

        <!-- Formulário de Cadastro -->
        <form id="form-register" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" for="reg-name">Nome Completo</label>
            <div class="relative">
              <i data-lucide="user" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input id="reg-name" type="text" required placeholder="Como podemos te chamar?" autocomplete="name"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" for="reg-email">Seu Melhor E-mail</label>
            <div class="relative">
              <i data-lucide="mail" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input id="reg-email" type="email" required placeholder="seu@email.com" autocomplete="email"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" for="reg-password">Criar Senha Segura</label>
            <div class="relative">
              <i data-lucide="lock" class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input id="reg-password" type="password" required minlength="6" placeholder="Mínimo de 6 caracteres" autocomplete="new-password"
                class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
            </div>
          </div>

          <!-- Consentimento LGPD & Termos -->
          <div class="pt-2">
            <label class="flex items-start gap-3 cursor-pointer">
              <input id="reg-terms" type="checkbox" required class="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
              <span class="text-xs text-slate-600 leading-relaxed">
                Declaro ter mais de 13 anos e concordo com os
                <a href="/termos" target="_blank" class="text-brand-600 hover:underline font-semibold">Termos de Uso</a> e a
                <a href="/privacidade" target="_blank" class="text-brand-600 hover:underline font-semibold">Política de Privacidade (LGPD)</a>.
              </span>
            </label>
          </div>

          <button id="btn-register-submit" type="submit"
            class="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2">
            <span>Criar Conta e Iniciar Grátis</span>
            <i data-lucide="check" class="w-4 h-4"></i>
          </button>
        </form>

        <!-- Rodapé do Card -->
        <div class="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Já possui cadastro?
          <a href="/login" class="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-1">Fazer login</a>
        </div>

      </div>
    </div>
  `;
}

export function initRegisterEvents() {
  const form = document.getElementById('form-register');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-register-submit');
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const termsAccepted = document.getElementById('reg-terms').checked;

      if (!termsAccepted) {
        showToast('É necessário aceitar os Termos e a Política de Privacidade para prosseguir.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Criando conta...`;
        if (window.lucide) window.lucide.createIcons();

        await api.auth.register({ name, email, password, termsAccepted });
        showToast('Conta criada com sucesso! Aproveite seus 10 itens gratuitos.', 'success');
        window.location.href = '/dashboard';
      } catch (err) {
        showToast(err.message || 'Falha ao criar conta.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Criar Conta e Iniciar Grátis</span><i data-lucide="check" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}
