import { Items, Documents, Categories, Subscriptions } from '../database/db.js';

export const dashboardController = {
  /**
   * Agrupa métricas analíticas e prazos prioritários do usuário autenticado
   */
  async getStats(req, res) {
    try {
      const userId = req.userId;
      const now = new Date();

      // Busca apenas itens pertencentes ao usuário logado
      const userItems = Items.findAll(i => i.userId === userId);
      const userDocs = Documents.findAll(d => d.userId === userId);
      const subscription = Subscriptions.findOne(s => s.userId === userId) || {
        plan: 'free',
        itemsLimit: 10,
        status: 'active'
      };

      const categories = Categories.findAll(c => c.isSystem || c.userId === userId);
      const categoryMap = new Map(categories.map(c => [c.id, c]));

      // 1. Garantias próximas do fim (próximos 60 dias)
      const warrantiesEnding = [];
      // 2. Produtos próximos da validade (alimentos, remédios, cosméticos nos próximos 30 dias)
      const expirationsNear = [];
      // 3. Vencimentos gerais e tarefas
      const upcomingDue = [];

      userItems.forEach(item => {
        const cat = categoryMap.get(item.categoryId) || { name: 'Geral', icon: 'tag', color: '#6B7280' };
        const enriched = {
          ...item,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          categoryColor: cat.color
        };

        // Verifica garantia
        if (item.warrantyEndDate) {
          const wDate = new Date(item.warrantyEndDate);
          const diffDays = Math.ceil((wDate - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 60) {
            warrantiesEnding.push({
              ...enriched,
              daysRemaining: diffDays,
              isUrgent: diffDays <= 15
            });
          }
        }

        // Verifica validade de produtos
        if (item.expirationDate) {
          const expDate = new Date(item.expirationDate);
          const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= -5 && diffDays <= 30) {
            expirationsNear.push({
              ...enriched,
              daysRemaining: diffDays,
              isExpired: diffDays < 0,
              isUrgent: diffDays <= 7
            });
          }
        }

        // Vencimentos gerais (data de garantia ou validade mais próxima)
        const targetDate = item.expirationDate || item.warrantyEndDate;
        if (targetDate) {
          const tDate = new Date(targetDate);
          const diffDays = Math.ceil((tDate - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 30) {
            upcomingDue.push({
              ...enriched,
              dueDate: targetDate,
              daysRemaining: diffDays
            });
          }
        }
      });

      // Ordenação cronológica (os mais urgentes primeiro)
      warrantiesEnding.sort((a, b) => a.daysRemaining - b.daysRemaining);
      expirationsNear.sort((a, b) => a.daysRemaining - b.daysRemaining);
      upcomingDue.sort((a, b) => a.daysRemaining - b.daysRemaining);

      // Documentos recentes ordenados por data de criação descrescente
      const recentDocuments = [...userDocs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Itens recentes cadastrados
      const recentItems = [...userItems]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(item => {
          const cat = categoryMap.get(item.categoryId) || { name: 'Geral', icon: 'tag', color: '#6B7280' };
          return {
            ...item,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categoryColor: cat.color
          };
        });

      const totalItems = userItems.length;
      const itemsLimit = subscription.itemsLimit;
      const isUnlimited = itemsLimit === -1;
      const remainingQuota = isUnlimited ? 9999 : Math.max(0, itemsLimit - totalItems);
      const usagePercentage = isUnlimited ? 0 : Math.min(100, Math.round((totalItems / itemsLimit) * 100));

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalItems,
            itemsLimit: isUnlimited ? 'Ilimitado' : itemsLimit,
            remainingQuota,
            usagePercentage,
            plan: subscription.plan,
            totalDocuments: userDocs.length,
            warrantiesCount: warrantiesEnding.length,
            expirationsCount: expirationsNear.length,
            upcomingDueCount: upcomingDue.length
          },
          warrantiesEnding: warrantiesEnding.slice(0, 5),
          expirationsNear: expirationsNear.slice(0, 5),
          upcomingDue: upcomingDue.slice(0, 5),
          recentDocuments,
          recentItems
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[dashboardController.getStats]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao carregar dados do dashboard.' }
      });
    }
  }
};
