import { Users, Subscriptions, PaymentTransactions } from '../database/db.js';
import { COMMERCIAL_CONFIG } from '../config/commercial.js';

export const webhookController = {
  /**
   * Endpoint de recepção de Webhook da Kiwify para ativação do Acesso Vitalício
   * URL: POST /api/webhooks/kiwify
   */
  async handleKiwify(req, res) {
    try {
      const payload = req.body || {};
      const queryToken = req.query.token;
      const configuredToken = process.env.KIWIFY_WEBHOOK_TOKEN;

      // Validação de Token de Segurança (se configurado nas variáveis de ambiente)
      if (configuredToken && configuredToken.trim()) {
        const receivedToken = queryToken || req.headers['x-kiwify-token'] || req.headers['x-kiwify-signature'];
        if (receivedToken !== configuredToken.trim()) {
          console.warn('[Webhook Kiwify] Token de autenticação inválido ou ausente.');
          return res.status(401).json({
            success: false,
            error: { code: 'INVALID_WEBHOOK_TOKEN', message: 'Token de autenticação do webhook inválido.' }
          });
        }
      }

      // Extração resiliente dos dados do pedido Kiwify
      const orderId = payload.order_id || payload.order_ref || payload.id || payload.transaction_id;
      const orderStatus = (payload.order_status || payload.status || '').toLowerCase();
      
      const customer = payload.Customer || payload.customer || {};
      const customerEmail = (customer.email || payload.customer_email || payload.email || '').trim().toLowerCase();
      const amountCents = payload.order_amount || payload.amount || Math.round(COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL * 100);

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_ORDER_ID', message: 'Identificador do pedido (order_id) é obrigatório.' }
        });
      }

      console.log(`[Webhook Kiwify] Recebido evento: Pedido=${orderId}, Status=${orderStatus}, Cliente=${customerEmail}`);

      // 1. Verificação de Idempotência
      const existingTx = await PaymentTransactions.findByOrderId(orderId);
      if (existingTx && existingTx.status === 'paid' && (orderStatus === 'paid' || orderStatus === 'approved')) {
        console.log(`[Webhook Kiwify] Pedido ${orderId} já processado anteriormente (Idempotente).`);
        return res.status(200).json({
          success: true,
          status: 'already_processed',
          message: 'Transação já processada com sucesso anteriormente.',
          orderId
        });
      }

      // 2. Localização do Usuário pelo E-mail
      let user = null;
      if (customerEmail) {
        user = await Users.findByEmail(customerEmail);
      }

      // 3. Processamento conforme Status do Pedido
      const isPaid = orderStatus === 'paid' || orderStatus === 'approved' || orderStatus === 'completed';
      const isRefunded = orderStatus === 'refunded' || orderStatus === 'chargedback';

      let activationResult = null;

      if (isPaid) {
        if (user) {
          // Ativa o Acesso Vitalício permanente
          activationResult = await Subscriptions.upgradeToLifetime(user.id, {
            paymentId: orderId,
            paymentProvider: COMMERCIAL_CONFIG.PROVIDERS.KIWIFY
          });
          console.log(`[Webhook Kiwify] 👑 Acesso Vitalício ativado para usuário ${user.id} (${user.email}).`);
        } else {
          console.log(`[Webhook Kiwify] Pedido aprovado para e-mail ainda não cadastrado: ${customerEmail}.`);
        }

        // Registra transação para garantia de idempotência e auditoria
        await PaymentTransactions.insert({
          orderId,
          provider: COMMERCIAL_CONFIG.PROVIDERS.KIWIFY,
          userId: user ? user.id : null,
          customerEmail,
          amountCents,
          status: 'paid',
          payload
        });

        return res.status(200).json({
          success: true,
          status: 'activated',
          message: user ? 'Acesso Vitalício ativado com sucesso.' : 'Pagamento aprovado registrado. Aguardando cadastro do usuário.',
          orderId,
          userId: user ? user.id : null,
          userFound: Boolean(user)
        });
      }

      if (isRefunded && user) {
        // Reverte acesso em caso de estorno/reembolso
        await Subscriptions.updateByUserId(user.id, {
          status: COMMERCIAL_CONFIG.STATUS.CANCELLED,
          plan: 'expired',
          itemsLimit: 10
        });
        console.log(`[Webhook Kiwify] Acesso revogado devido a reembolso para usuário ${user.id}.`);

        await PaymentTransactions.insert({
          orderId,
          provider: COMMERCIAL_CONFIG.PROVIDERS.KIWIFY,
          userId: user.id,
          customerEmail,
          amountCents,
          status: 'refunded',
          payload
        });

        return res.status(200).json({
          success: true,
          status: 'revoked',
          message: 'Acesso revogado após reembolso.',
          orderId
        });
      }

      // Demais eventos (ex: aguardando pagamento, boleto gerado, abandono)
      await PaymentTransactions.insert({
        orderId,
        provider: COMMERCIAL_CONFIG.PROVIDERS.KIWIFY,
        userId: user ? user.id : null,
        customerEmail,
        amountCents,
        status: orderStatus || 'pending',
        payload
      });

      return res.status(200).json({
        success: true,
        status: 'acknowledged',
        message: `Evento recebido com status: ${orderStatus}`,
        orderId
      });
    } catch (err) {
      console.error('[webhookController.handleKiwify]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'WEBHOOK_ERROR', message: 'Erro ao processar webhook da Kiwify.' }
      });
    }
  }
};
