import { Items, Documents, Subscriptions, Reminders, Categories } from '../database/db.js';

export const itemController = {
  /**
   * Cadastro de novo item com verificação rigorosa de quota do plano (10 itens no gratuito)
   */
  async create(req, res) {
    try {
      const userId = req.userId;
      const {
        title,
        categoryId,
        store,
        purchaseDate,
        price,
        quantity,
        invoiceNumber,
        warrantyPeriodMonths,
        warrantyEndDate,
        expirationDate,
        notes,
        documentId
      } = req.body || {};

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'TITLE_REQUIRED', message: 'O título ou nome do produto é obrigatório.' }
        });
      }

      // Verificação de cota do plano
      const subscription = Subscriptions.findOne(s => s.userId === userId) || {
        plan: 'free',
        itemsLimit: 10
      };

      const currentItemCount = Items.count(i => i.userId === userId);
      const isUnlimited = subscription.itemsLimit === -1;

      if (!isUnlimited && currentItemCount >= subscription.itemsLimit) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PLAN_LIMIT_REACHED',
            message: `Você atingiu o limite de ${subscription.itemsLimit} itens cadastrados no Plano Gratuito. Evolua para o Plano Premium para cadastrar itens ilimitados!`
          }
        });
      }

      // Validação de documento vinculado
      if (documentId) {
        const doc = Documents.findById(documentId);
        if (doc && doc.userId === userId) {
          Documents.update(doc.id, { status: 'processed' });
        }
      }

      const newItem = Items.insert({
        userId,
        documentId: documentId || null,
        categoryId: categoryId || 'cat_geral',
        title: title.trim(),
        store: store ? store.trim() : null,
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        price: price ? parseFloat(price) : 0,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        invoiceNumber: invoiceNumber ? invoiceNumber.trim() : null,
        warrantyPeriodMonths: warrantyPeriodMonths ? parseInt(warrantyPeriodMonths, 10) : null,
        warrantyEndDate: warrantyEndDate || null,
        expirationDate: expirationDate || null,
        notes: notes ? notes.trim() : null,
        status: 'active'
      });

      // Criação de lembrete automático preventivo
      const triggerTarget = warrantyEndDate || expirationDate;
      if (triggerTarget) {
        Reminders.insert({
          userId,
          itemId: newItem.id,
          title: `Alerta: Prazo de ${newItem.title}`,
          triggerDate: triggerTarget,
          type: warrantyEndDate ? 'warranty' : 'expiration',
          status: 'pending'
        });
      }

      return res.status(201).json({
        success: true,
        data: newItem,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[itemController.create]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao cadastrar novo item.' }
      });
    }
  },

  /**
   * Lista todos os itens do usuário autenticado
   */
  async list(req, res) {
    try {
      const items = Items.findAll(i => i.userId === req.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const categories = Categories.findAll(c => c.isSystem || c.userId === req.userId);
      const catMap = new Map(categories.map(c => [c.id, c]));

      const enriched = items.map(item => {
        const cat = catMap.get(item.categoryId) || { name: 'Geral', icon: 'tag', color: '#6B7280' };
        return {
          ...item,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          categoryColor: cat.color
        };
      });

      return res.status(200).json({
        success: true,
        data: enriched,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[itemController.list]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao listar itens.' }
      });
    }
  },

  /**
   * Exclui um item garantindo posse
   */
  async delete(req, res) {
    try {
      const item = Items.findById(req.params.id);
      if (!item || item.userId !== req.userId) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Item não encontrado.' }
        });
      }

      Items.delete(item.id);

      // Remove lembretes vinculados
      const userReminders = Reminders.findAll(r => r.itemId === item.id);
      userReminders.forEach(r => Reminders.delete(r.id));

      return res.status(200).json({
        success: true,
        message: 'Item removido com sucesso.',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[itemController.delete]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao remover item.' }
      });
    }
  }
};
