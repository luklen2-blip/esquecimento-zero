/**
 * Configurações Centrais do Modelo Comercial - Esquecimento Zero
 */

export const COMMERCIAL_CONFIG = {
  // Link oficial de checkout Kiwify
  LIFETIME_CHECKOUT_URL: 'https://pay.kiwify.com.br/cd5quHM',

  // Preço comercial do Acesso Vitalício (pagamento único)
  LIFETIME_PRICE_BRL: 19.90,

  // Duração do teste gratuito: 24 horas corridas a partir do cadastro
  TRIAL_HOURS: 24,
  TRIAL_DURATION_MS: 24 * 60 * 60 * 1000,

  // Planos disponíveis no sistema
  PLANS: {
    FREE: 'free',
    TRIAL: 'trial',
    LIFETIME: 'lifetime'
  },

  // Status de assinatura
  STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  },

  // Provedores suportados
  PROVIDERS: {
    KIWIFY: 'kiwify',
    MANUAL: 'manual'
  }
};
