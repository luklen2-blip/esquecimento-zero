import { COMMERCIAL_CONFIG } from '../config/commercial.js';
import { Subscriptions, Users } from '../database/db.js';

/**
 * Calcula o status de acesso comercial do usuário no modelo de 24 HORAS de teste
 * @param {Object} subscription Registro de assinatura do usuário
 * @param {Object} [user] Dados do usuário (opcional para fallback de datas)
 * @returns {Object} Diagnóstico de acesso comercial com contador baseado no servidor e avisos progressivos
 */
export function getAccessStatus(subscription, user = null) {
  const serverNow = new Date();
  const serverNowMs = serverNow.getTime();

  // 1. Acesso Vitalício Ativo
  if (subscription && subscription.plan === COMMERCIAL_CONFIG.PLANS.LIFETIME && subscription.status === COMMERCIAL_CONFIG.STATUS.ACTIVE) {
    return {
      hasAccess: true,
      plan: 'lifetime',
      status: 'active',
      isLifetime: true,
      isTrial: false,
      isExpired: false,
      trialStartedAt: subscription.trialStartedAt || null,
      trialEndsAt: null,
      lifetimeActivatedAt: subscription.lifetimeActivatedAt || null,
      statusText: 'Vitalício Ativo',
      serverTime: serverNow.toISOString(),
      diffMs: 0,
      hoursRemaining: null,
      minutesRemaining: null,
      checkoutUrl: COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL,
      priceBrl: COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL,
      notice: {
        stage: 'lifetime',
        headline: '⭐ ACESSO VITALÍCIO ATIVO',
        message: 'Você possui acesso permanente com armazenamento e processamento de IA ilimitados.',
        countdownText: 'Acesso vitalício permanente ativo',
        badgeText: '👑 VITALÍCIO',
        ctaText: null
      }
    };
  }

  // 2. Período de Teste Gratuito de 24 Horas Corridas a partir do Cadastro
  let trialStartedMs;
  let trialEndsMs;

  if (subscription && subscription.trialStartedAt) {
    trialStartedMs = new Date(subscription.trialStartedAt).getTime();
  } else if (subscription && subscription.createdAt) {
    trialStartedMs = new Date(subscription.createdAt).getTime();
  } else if (user && user.createdAt) {
    trialStartedMs = new Date(user.createdAt).getTime();
  } else {
    trialStartedMs = serverNowMs;
  }

  if (subscription && subscription.trialEndsAt) {
    trialEndsMs = new Date(subscription.trialEndsAt).getTime();
  } else {
    trialEndsMs = trialStartedMs + COMMERCIAL_CONFIG.TRIAL_DURATION_MS;
  }

  const diffMs = trialEndsMs - serverNowMs;
  const isExpired = diffMs <= 0 || (subscription && subscription.status === COMMERCIAL_CONFIG.STATUS.EXPIRED);
  const hasAccess = !isExpired;

  const totalSecondsRemaining = Math.max(0, Math.floor(diffMs / 1000));
  const hoursRemaining = Math.floor(totalSecondsRemaining / 3600);
  const minutesRemaining = Math.floor((totalSecondsRemaining % 3600) / 60);

  // 3. Comunicação Progressiva de Conversão (5 Estágios)
  let notice;
  let countdownText;
  let badgeText;

  if (isExpired) {
    countdownText = '🔒 Seu período gratuito terminou.';
    badgeText = '🔒 Período Terminou';
    notice = {
      stage: 'expired',
      headline: '🔒 Seu período gratuito terminou.',
      message: 'Continue usando o Esquecimento Zero com acesso vitalício. R$ 19,90 Pagamento único. Sem mensalidade. Sem renovação.',
      countdownText,
      badgeText,
      ctaText: 'QUERO MEU ACESSO VITALÍCIO'
    };
  } else if (hoursRemaining < 1) {
    countdownText = `🔥 Seu teste termina em ${minutesRemaining} minuto${minutesRemaining === 1 ? '' : 's'}.`;
    badgeText = `🔥 ${minutesRemaining} min restantes`;
    notice = {
      stage: 'last_hour',
      headline: '🚨 Seu teste termina em menos de 1 hora.',
      message: 'Garanta agora seu acesso vitalício por R$ 19,90.',
      countdownText,
      badgeText,
      ctaText: 'GARANTIR MEU ACESSO VITALÍCIO'
    };
  } else if (hoursRemaining <= 3) {
    countdownText = `⚠️ Você tem: ${hoursRemaining}h ${minutesRemaining}min restantes`;
    badgeText = `⚠️ ${hoursRemaining}h ${minutesRemaining}min restantes`;
    notice = {
      stage: 'urgent_3h',
      headline: `⚠️ Restam apenas ${hoursRemaining} horas do seu teste gratuito.`,
      message: 'Não perca seu acesso. Acesso vitalício por R$ 19,90.',
      countdownText,
      badgeText,
      ctaText: 'GARANTIR MEU ACESSO VITALÍCIO'
    };
  } else if (hoursRemaining <= 12) {
    countdownText = `⏰ Você tem: ${hoursRemaining}h ${minutesRemaining}min restantes`;
    badgeText = `⏰ ${hoursRemaining}h ${minutesRemaining}min restantes`;
    notice = {
      stage: 'warning_12h',
      headline: `⏰ Seu teste gratuito termina em ${hoursRemaining} horas.`,
      message: 'Gostou do Esquecimento Zero? Garanta seu acesso vitalício por R$ 19,90.',
      countdownText,
      badgeText,
      ctaText: 'GARANTIR MEU ACESSO VITALÍCIO'
    };
  } else {
    // Início do teste (24h a 12h restantes)
    countdownText = `🎁 TESTE GRATUITO Você tem: ${hoursRemaining}h ${minutesRemaining}min restantes`;
    badgeText = `🎁 ${hoursRemaining}h ${minutesRemaining}min restantes`;
    notice = {
      stage: 'initial_24h',
      headline: '🎁 Você ganhou 24 horas grátis!',
      message: 'Experimente o Esquecimento Zero e descubra como manter suas informações importantes organizadas. Você pode adquirir o acesso vitalício por apenas R$ 19,90.',
      countdownText,
      badgeText,
      ctaText: 'GARANTIR MEU ACESSO VITALÍCIO'
    };
  }

  return {
    hasAccess,
    plan: (subscription && subscription.plan) || COMMERCIAL_CONFIG.PLANS.TRIAL,
    status: isExpired ? COMMERCIAL_CONFIG.STATUS.EXPIRED : COMMERCIAL_CONFIG.STATUS.ACTIVE,
    isLifetime: false,
    isTrial: true,
    isExpired,
    trialStartedAt: new Date(trialStartedMs).toISOString(),
    trialEndsAt: new Date(trialEndsMs).toISOString(),
    lifetimeActivatedAt: null,
    serverTime: serverNow.toISOString(),
    diffMs: Math.max(0, diffMs),
    hoursRemaining,
    minutesRemaining,
    statusText: badgeText,
    countdownText,
    checkoutUrl: COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL,
    priceBrl: COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL,
    notice
  };
}

/**
 * Middleware para bloquear operações de criação caso o teste gratuito de 24 horas tenha expirado
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
          headline: access.notice.headline,
          message: access.notice.message,
          checkoutUrl: COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL,
          priceBrl: COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL,
          ctaText: access.notice.ctaText
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
