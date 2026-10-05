/**
 * Cliente de API Desacoplado para Esquecimento Zero
 */

const TOKEN_KEY = 'ez_token';
const USER_KEY = 'ez_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY)
};

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all ${
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : type === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-900'
      : 'bg-white border-slate-200 text-slate-800'
  }`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0 ${
      type === 'success' ? 'text-emerald-600' : type === 'error' ? 'text-rose-600' : 'text-brand-600'
    }"></i>
    <span class="flex-1">${message}</span>
    <button class="text-slate-400 hover:text-slate-600 ml-1" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons({ root: toast });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

export async function apiRequest(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      authStorage.clearToken();
      window.dispatchEvent(new CustomEvent('ez:auth-change', { detail: { authenticated: false } }));
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/cadastro')) {
        window.location.href = '/login';
      }
      throw new Error(data?.error?.message || 'Sessão expirada. Faça login novamente.');
    }

    if (!res.ok) {
      throw new Error(data?.error?.message || `Erro ${res.status}: Requisição não processada.`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  auth: {
    async register(payload) {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res?.data?.token) {
        authStorage.setToken(res.data.token);
        authStorage.setUser(res.data.user);
        window.dispatchEvent(new CustomEvent('ez:auth-change', { detail: { authenticated: true, user: res.data.user } }));
      }
      return res;
    },

    async login(email, password) {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res?.data?.token) {
        authStorage.setToken(res.data.token);
        authStorage.setUser(res.data.user);
        window.dispatchEvent(new CustomEvent('ez:auth-change', { detail: { authenticated: true, user: res.data.user } }));
      }
      return res;
    },

    async me() {
      const res = await apiRequest('/api/auth/me');
      if (res?.data?.user) {
        authStorage.setUser(res.data.user);
      }
      return res;
    },

    logout() {
      authStorage.clearToken();
      window.dispatchEvent(new CustomEvent('ez:auth-change', { detail: { authenticated: false } }));
      window.location.href = '/login';
    }
  },

  dashboard: {
    async getStats() {
      return await apiRequest('/api/dashboard/stats');
    }
  },

  documents: {
    async upload(file) {
      const formData = new FormData();
      formData.append('file', file);
      return await apiRequest('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
    },

    async list() {
      return await apiRequest('/api/documents');
    },

    async getById(id) {
      return await apiRequest(`/api/documents/${id}`);
    },

    async process(id) {
      return await apiRequest(`/api/documents/${id}/process`, {
        method: 'POST'
      });
    }
  },

  items: {
    async create(payload) {
      return await apiRequest('/api/items', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async list() {
      return await apiRequest('/api/items');
    },

    async delete(id) {
      return await apiRequest(`/api/items/${id}`, {
        method: 'DELETE'
      });
    }
  },

  categories: {
    async list() {
      return await apiRequest('/api/categories');
    }
  }
};
