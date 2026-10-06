import { authStorage, api } from './api.js';
import { initRouter, handleRoute } from './router.js';
import { analytics } from './analytics.js';

function renderHeaderUserActions() {
  const container = document.getElementById('user-nav-actions');
  const desktopNav = document.getElementById('desktop-nav');
  const mobileBottomBar = document.getElementById('mobile-bottom-bar');
  if (!container) return;

  const isAuthenticated = authStorage.isAuthenticated();
  const user = authStorage.getUser();

  if (isAuthenticated && user) {
    if (desktopNav) desktopNav.classList.remove('hidden');
    if (mobileBottomBar) mobileBottomBar.classList.remove('hidden');

    container.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="/perfil" class="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-xs font-bold text-slate-800 leading-tight">${user.name.split(' ')[0]}</p>
            <p class="text-[10px] text-slate-400">Conta Gratuita</p>
          </div>
        </a>

        <button id="btn-header-logout" title="Sair da conta" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    const logoutBtn = document.getElementById('btn-header-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        api.auth.logout();
      });
    }
  } else {
    if (desktopNav) desktopNav.classList.add('hidden');
    if (mobileBottomBar) mobileBottomBar.classList.add('hidden');

    container.innerHTML = `
      <div class="flex items-center gap-2">
        <a href="/login" class="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 transition-colors">
          Entrar
        </a>
        <a href="/cadastro" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105">
          Criar Conta
        </a>
      </div>
    `;
  }

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}

// Inicializador da aplicação
async function initApp() {
  renderHeaderUserActions();

  // Escuta alterações de estado de autenticação
  window.addEventListener('ez:auth-change', (e) => {
    renderHeaderUserActions();
    handleRoute();
  });

  // Se já houver token, valida em background
  if (authStorage.isAuthenticated()) {
    try {
      await api.auth.me();
      renderHeaderUserActions();
    } catch (err) {
      console.warn('[App] Sessão não pôde ser renovada:', err.message);
    }
  }

  // Inicializa o roteador SPA
  initRouter();
}

// Inicia quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
