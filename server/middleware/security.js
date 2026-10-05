/**
 * Middleware de Segurança e Endurecimento (OWASP e Proteção de Headers)
 */
export function applySecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=*, microphone=(), geolocation=()');
  next();
}

/**
 * Limitador em memória para proteção contra força bruta
 */
const rateLimitBuckets = new Map();

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutos
  const maxRequests = options.max || 100;
  const message = options.message || 'Muitas requisições deste endereço. Tente novamente mais tarde.';

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = rateLimitBuckets.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitBuckets.set(ip, record);
    } else {
      record.count++;
    }

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message
        }
      });
    }

    next();
  };
}

export const globalLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 400 });
export const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 25, message: 'Muitas tentativas de autenticação. Aguarde 15 minutos.' });
