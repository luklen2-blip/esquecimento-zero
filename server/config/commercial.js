/**
 * Configurações Centrais do Modelo Comercial - Esquecimento Zero
 */

export const COMMERCIAL_CONFIG = {
  // Link oficial de checkout Kiwify
  LIFETIME_CHECKOUT_URL: 'https://pay.kiwify.com.br/cd5quHM',

  // Preço comercial do Acesso Vitalício (pagamento único)
  LIFETIME_PRICE_BRL: 19.90,

  // Duração em dias do teste gratuito padrão
  TRIAL_DAYS: 7,

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
