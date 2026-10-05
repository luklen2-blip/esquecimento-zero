import { verifyJwt } from '../utils/authUtils.js';
import { Users } from '../database/db.js';

/**
 * Middleware para autenticação e isolamento estrito de dados por usuário
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Acesso negado. Token de autenticação não fornecido ou inválido.'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);

  if (!payload || !payload.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID_OR_EXPIRED',
        message: 'Sua sessão expirou ou é inválida. Faça login novamente.'
      }
    });
  }

  const user = Users.findById(payload.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Usuário associado a esta sessão não foi encontrado.'
      }
    });
  }

  // Injeta identificadores seguros do usuário autenticado na requisição
  req.userId = user.id;
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'user'
  };

  next();
}
