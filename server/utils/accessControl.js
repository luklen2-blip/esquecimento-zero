import { COMMERCIAL_CONFIG } from '../config/commercial.js';
import { Subscriptions, Users } from '../database/db.js';

/**
 * Calcula o status de acesso comercial do usuário
 * @param {Object} subscription Registro de assinatura do usuário
 * @param {Object} [user] Dados do usuário (opcional para fallback de datas)
 * @returns {Object} Diagnóstico de acesso comercial
 */
export function getAccessStatus(subscription, user = null) {
  // 1. Acesso Vitalício Ativo
  if (subscription && subscription.plan === COMMERCIAL_CONFIG.PLANS.LIFETIME && subscription.status === COMMERCIAL_CONFIG.STATUS.ACTIVE) {
    return {
      hasAccess: true,
      plan: 'lifetime',
      status: 'active',
      isLifetime: true,
      isTrial: false,
      isExpired: false,
      daysRemaining: null,
      trialStartedAt: subscription.trialStartedAt || null,
      trialEndsAt: subscription.trialEndsAt || null,
      lifetimeActivatedAt: subscription.lifetimeActivatedAt || null,
      statusText: 'Vitalício Ativo',
      checkoutUrl: COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL,
      priceBrl: COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL
    };
  }

  // 2. Período de Teste Gratuito (7 dias)
  const now = Date.now();
  let trialEndsMs;

  if (subscription && subscription.trialEndsAt) {
    trialEndsMs = new Date(subscription.trialEndsAt).getTime();
  } else if (subscription && subscription.trialStartedAt) {
    trialEndsMs = new Date(subscription.trialStartedAt).getTime() + (COMMERCIAL_CONFIG.TRIAL_DAYS * 24 * 60 * 60 * 1000);
  } else if (subscription && subscription.createdAt) {
    trialEndsMs = new Date(subscription.createdAt).getTime() + (COMMERCIAL_CONFIG.TRIAL_DAYS * 24 * 60 * 60 * 1000);
  } else if (user && user.createdAt) {
    trialEndsMs = new Date(user.createdAt).getTime() + (COMMERCIAL_CONFIG.TRIAL_DAYS * 24 * 60 * 60 * 1000);
  } else {
    trialEndsMs = now + (COMMERCIAL_CONFIG.TRIAL_DAYS * 24 * 60 * 60 * 1000);
  }

  const diffMs = trialEndsMs - now;
  // Considera dias restantes arredondando para cima: se falta 1 hora, resta 1 dia
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0 || (subscription && subscription.status === COMMERCIAL_CONFIG.STATUS.EXPIRED);
  const hasAccess = !isExpired;

  return {
    hasAccess,
    plan: (subscription && subscription.plan) || COMMERCIAL_CONFIG.PLANS.TRIAL,
    status: isExpired ? COMMERCIAL_CONFIG.STATUS.EXPIRED : COMMERCIAL_CONFIG.STATUS.ACTIVE,
    isLifetime: false,
    isTrial: true,
    isExpired,
    daysRemaining,
    trialStartedAt: (subscription && (subscription.trialStartedAt || subscription.createdAt)) || (user && user.createdAt) || new Date().toISOString(),
    trialEndsAt: new Date(trialEndsMs).toISOString(),
    lifetimeActivatedAt: null,
    statusText: isExpired ? 'Teste Expirado' : `Teste Gratuito (${daysRemaining} dia${daysRemaining === 1 ? '' : 's'} restante${daysRemaining === 1 ? '' : 's'})`,
    checkoutUrl: COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL,
    priceBrl: COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL
  };
}

/**
 * Middleware para bloquear operações de criação caso o teste gratuito tenha expirado
 */
export async function requireActiveAccess(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Usuário não autenticado.' }
      });
    }

    const subscription = await Subscriptions.findOne(s => s.userId === userId);
    const user = await Users.findById(userId);
    const access = getAccessStatus(subscription, user);

    req.accessStatus = access;

    if (!access.hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TRIAL_EXPIRED',
          message: 'Seu período de teste gratuito de 7 dias expirou. Adquira o Acesso Vitalício por apenas R$ 19,90 para continuar cadastrando registros.',
          checkoutUrl: COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL,
          priceBrl: COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL
        }
      });
    }

    next();
  } catch (err) {
    console.error('[requireActiveAccess]', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Erro ao validar status de acesso.' }
    });
  }
}
