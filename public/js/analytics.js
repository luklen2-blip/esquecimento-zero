// analytics.js - Sistema Leve de Rastreamento de Eventos (100% Client-Side & Privativo)
// Conformidade estrita com LGPD: Não envia dados para terceiros e não armazena dados pessoais sensíveis.

const STORAGE_KEY = 'ez_events_log';
const MAX_STORED_EVENTS = 100;

export const analytics = {
  track(eventName, properties = {}) {
    try {
      const event = {
        name: eventName,
        timestamp: new Date().toISOString(),
        properties
      };

      // Log no console para depuração em desenvolvimento
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`[Analytics] 📊 Evento registrado: ${eventName}`, properties);
      }

      // Persistência local rotativa para diagnósticos de fluxo
      const raw = localStorage.getItem(STORAGE_KEY);
      let list = [];
      if (raw) {
        try { list = JSON.parse(raw); } catch {}
      }
      list.push(event);
      if (list.length > MAX_STORED_EVENTS) {
        list = list.slice(list.length - MAX_STORED_EVENTS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      // Falha silenciosa para nunca quebrar a interface do usuário
    }
  },

  getRecentEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
};

if (typeof window !== 'undefined') {
  window.ezAnalytics = analytics;
}

