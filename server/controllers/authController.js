import { Users, Subscriptions, Items } from '../database/db.js';
import { hashPassword, verifyPassword, signJwt } from '../utils/authUtils.js';

export const authController = {
  /**
   * Cadastro de novos usuários com atribuição do Plano Gratuito (limite 10 itens)
   */
  async register(req, res) {
    try {
      const { name, email, password, termsAccepted } = req.body || {};

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_NAME', message: 'Por favor, informe seu nome completo.' }
        });
      }

      if (!email || !email.includes('@') || !email.includes('.')) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_EMAIL', message: 'Por favor, informe um e-mail válido.' }
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'A senha deve conter no mínimo 6 caracteres.' }
        });
      }

      if (!termsAccepted) {
        return res.status(400).json({
          success: false,
          error: { code: 'TERMS_REQUIRED', message: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD).' }
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = Users.findOne(u => u.email.toLowerCase() === normalizedEmail);

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Este endereço de e-mail já está cadastrado.' }
        });
      }

      const passwordHash = hashPassword(password);

      const newUser = Users.insert({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'user',
        termsAcceptedAt: new Date().toISOString()
      });

      // Cria assinatura padrão do Plano Gratuito
      const subscription = Subscriptions.insert({
        userId: newUser.id,
        plan: 'free',
        status: 'active',
        itemsLimit: 10,
        features: {
          aiProcessing: false,
          unlimitedItems: false,
          advancedReminders: false,
          exportData: false
        }
      });

      const token = signJwt({ userId: newUser.id });

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          },
          token,
          subscription: {
            plan: subscription.plan,
            itemsLimit: subscription.itemsLimit,
            status: subscription.status
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[authController.register]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro interno ao realizar cadastro.' }
      });
    }
  },

  /**
   * Login com validação de credenciais e emissão de token JWT
   */
  async login(req, res) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_CREDENTIALS', message: 'E-mail e senha são obrigatórios.' }
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = Users.findOne(u => u.email.toLowerCase() === normalizedEmail);

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' }
        });
      }

      let subscription = Subscriptions.findOne(s => s.userId === user.id);
      if (!subscription) {
        subscription = Subscriptions.insert({
          userId: user.id,
          plan: 'free',
          status: 'active',
          itemsLimit: 10,
          features: { aiProcessing: false, unlimitedItems: false }
        });
      }

      const token = signJwt({ userId: user.id });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token,
          subscription: {
            plan: subscription.plan,
            itemsLimit: subscription.itemsLimit,
            status: subscription.status
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[authController.login]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro interno ao autenticar usuário.' }
      });
    }
  },

  /**
   * Retorna dados do usuário autenticado e uso do plano atual
   */
  async me(req, res) {
    try {
      const user = Users.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' }
        });
      }

      let subscription = Subscriptions.findOne(s => s.userId === user.id);
      if (!subscription) {
        subscription = Subscriptions.insert({
          userId: user.id,
          plan: 'free',
          status: 'active',
          itemsLimit: 10,
          features: { aiProcessing: false, unlimitedItems: false }
        });
      }

      const itemsCount = Items.count(i => i.userId === user.id);

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          },
          subscription: {
            plan: subscription.plan,
            itemsLimit: subscription.itemsLimit,
            status: subscription.status,
            features: subscription.features
          },
          usage: {
            itemsCount,
            itemsLimit: subscription.itemsLimit,
            remaining: subscription.itemsLimit === -1 ? 9999 : Math.max(0, subscription.itemsLimit - itemsCount),
            isLimitReached: subscription.itemsLimit !== -1 && itemsCount >= subscription.itemsLimit
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[authController.me]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao obter dados do usuário.' }
      });
    }
  }
};
