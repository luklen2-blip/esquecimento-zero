import { authStorage } from './api.js';
import { renderLogin, initLoginEvents, renderRegister, initRegisterEvents } from './views/auth.js';
import { renderDashboard, initDashboardEvents } from './views/dashboard.js';
import { renderTerms, renderPrivacy } from './views/legal.js';
import { renderAdicionar, initAdicionarEvents } from './views/adicionar.js';
import { renderHistorico, initHistoricoEvents } from './views/historico.js';
import {
  renderCalendario,
  renderLembretes,
  renderPerfil,
  initPerfilEvents,
  renderPlanos
} from './views/placeholders.js';

const routes = {
  '/': { title: 'Esquecimento Zero', render: () => '', isProtected: false },
  '/login': { title: 'Entrar - Esquecimento Zero', render: renderLogin, init: initLoginEvents, isProtected: false },
  '/cadastro': { title: 'Criar Conta - Esquecimento Zero', render: renderRegister, init: initRegisterEvents, isProtected: false },
  '/dashboard': { title: 'Dashboard - Esquecimento Zero', render: renderDashboard, init: initDashboardEvents, isProtected: true },
  '/adicionar': { title: 'Novo Item - Esquecimento Zero', render: renderAdicionar, init: initAdicionarEvents, isProtected: true },
  '/calendario': { title: 'Calendário - Esquecimento Zero', render: renderCalendario, isProtected: true },
  '/lembretes': { title: 'Lembretes - Esquecimento Zero', render: renderLembretes, isProtected: true },
  '/historico': { title: 'Histórico de Documentos - Esquecimento Zero', render: renderHistorico, init: initHistoricoEvents, isProtected: true },
  '/perfil': { title: 'Meu Perfil - Esquecimento Zero', render: renderPerfil, init: initPerfilEvents, isProtected: true },
  '/planos': { title: 'Planos e Preços - Esquecimento Zero', render: renderPlanos, isProtected: false },
  '/termos': { title: 'Termos de Uso - Esquecimento Zero', render: renderTerms, isProtected: false },
  '/privacidade': { title: 'Política de Privacidade - Esquecimento Zero', render: renderPrivacy, isProtected: false }
};

export function navigateTo(path) {
  window.history.pushState(null, '', path);
  handleRoute();
}

export function handleRoute() {
  let path = window.location.pathname;

  // Normaliza rota inicial
  if (path === '/' || path === '') {
    if (authStorage.isAuthenticated()) {
      path = '/dashboard';
      window.history.replaceState(null, '', path);
    } else {
      path = '/login';
      window.history.replaceState(null, '', path);
    }
  }

  // Se o usuário já está logado e tenta acessar /login ou /cadastro, redireciona para o dashboard
  if (authStorage.isAuthenticated() && (path === '/login' || path === '/cadastro')) {
    path = '/dashboard';
    window.history.replaceState(null, '', path);
  }

  const routeConfig = routes[path] || {
    title: 'Página Não Encontrada - Esquecimento Zero',
    render: () => `
      <div class="view-enter max-w-md mx-auto py-16 text-center">
        <h1 class="text-4xl font-extrabold text-slate-800">404</h1>
        <p class="text-sm text-slate-500 mt-2">Página não encontrada.</p>
        <a href="/dashboard" class="inline-block mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">Voltar ao Início</a>
      </div>
    `,
    isProtected: false
  };

  // Verificação de rota protegida
  if (routeConfig.isProtected && !authStorage.isAuthenticated()) {
    window.history.replaceState(null, '', '/login');
    return handleRoute();
  }

  document.title = routeConfig.title;

  const appRoot = document.getElementById('app-root');
  if (appRoot) {
    appRoot.innerHTML = routeConfig.render();
    if (routeConfig.init) {
      routeConfig.init();
    }
  }

  updateNavUI(path);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  window.scrollTo(0, 0);
}

function updateNavUI(currentPath) {
  // Atualiza classes do menu desktop
  const desktopLinks = document.querySelectorAll('#desktop-nav a');
  desktopLinks.forEach(link => {
    const route = link.getAttribute('data-route');
    if (route === currentPath) {
      link.classList.add('bg-brand-50', 'text-brand-600', 'font-bold');
      link.classList.remove('text-slate-600', 'text-slate-700');
    } else {
      link.classList.remove('bg-brand-50', 'text-brand-600', 'font-bold');
      if (!link.classList.contains('text-amber-600')) {
        link.classList.add('text-slate-600');
      }
    }
  });

  // Atualiza barra de navegação móvel
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    const route = link.getAttribute('data-route');
    if (route === currentPath) {
      link.classList.add('text-brand-600', 'font-bold');
      link.classList.remove('text-slate-500');
    } else {
      link.classList.remove('text-brand-600', 'font-bold');
      link.classList.add('text-slate-500');
    }
  });
}

// Inicializador de escutas de eventos do roteador
export function initRouter() {
  window.addEventListener('popstate', handleRoute);

  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    if (!targetLink) return;

    const href = targetLink.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || targetLink.getAttribute('target') === '_blank') {
      return;
    }

    e.preventDefault();
    navigateTo(href);
  });

  handleRoute();
}
