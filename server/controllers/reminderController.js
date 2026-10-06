import { Reminders, Items, Categories, Documents } from '../database/db.js';
import { calculateCalendarDaysDiff, categorizeReminder } from '../utils/dateUtils.js';

export const reminderController = {
  /**
   * Lista e agrupa os lembretes da Central de Alertas para o usuário autenticado.
   * Isolamento rigoroso multi-tenant por req.userId.
   */
  async list(req, res) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' }
        });
      }

      const now = new Date();

      // 1. Busca itens ativos do usuário
      const userItems = await Items.findAll(i => i.userId === userId && i.status === 'active');
      const itemMap = new Map(userItems.map(i => [i.id, i]));

      // 2. Busca categorias e documentos para enriquecimento
      const categories = await Categories.findAll(c => c.isSystem || c.userId === userId);
      const catMap = new Map(categories.map(c => [c.id, c]));

      const userDocs = await Documents.findAll(d => d.userId === userId);
      const docMap = new Map(userDocs.map(d => [d.id, d]));

      // 3. Busca e sincroniza a tabela reminders como fonte de verdade
      let userReminders = await Reminders.findAll(r => r.userId === userId);

      // Sincronização: garante que todo item com garantia ou validade possua registro em reminders
      for (const item of userItems) {
        // Garantia
        if (item.warrantyEndDate) {
          const hasRem = userReminders.some(r => r.itemId === item.id && r.type === 'warranty');
          if (!hasRem) {
            const created = await Reminders.insert({
              userId,
              itemId: item.id,
              title: `Garantia: ${item.title}`,
              triggerDate: item.warrantyEndDate,
              type: 'warranty',
              status: 'pending'
            });
            userReminders.push(created);
          }
        }

        // Validade
        if (item.expirationDate) {
          const hasRem = userReminders.some(r => r.itemId === item.id && r.type === 'expiration');
          if (!hasRem) {
            const created = await Reminders.insert({
              userId,
              itemId: item.id,
              title: `Validade: ${item.title}`,
              triggerDate: item.expirationDate,
              type: 'expiration',
              status: 'pending'
            });
            userReminders.push(created);
          }
        }
      }

      // 4. Enriquecimento e Categorização dos Lembretes
      const overdue = [];
      const today = [];
      const next7Days = [];
      const next30Days = [];
      const enrichedAll = [];

      for (const rem of userReminders) {
        const item = itemMap.get(rem.itemId);
        // Limpeza de lembrete órfão (se o item foi removido)
        if (!item) {
          await Reminders.delete(rem.id);
          continue;
        }

        const cat = catMap.get(item.categoryId) || { name: 'Geral', icon: 'tag', color: '#6B7280' };
        const doc = item.documentId ? docMap.get(item.documentId) : null;
        const timing = categorizeReminder(rem.triggerDate, now);
        if (!timing) continue;

        const enriched = {
          id: rem.id,
          itemId: item.id,
          title: item.title,
          reminderTitle: rem.title,
          triggerDate: rem.triggerDate,
          type: rem.type,
          status: rem.status,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          categoryColor: cat.color,
          store: item.store || null,
          price: item.price || 0,
          invoiceNumber: item.invoiceNumber || null,
          purchaseDate: item.purchaseDate || null,
          notes: item.notes || null,
          document: doc ? { id: doc.id, fileName: doc.fileName, filePath: doc.filePath, fileType: doc.fileType } : null,
          ...timing
        };

        enrichedAll.push(enriched);

        // Agrupamento temporal com janela de relevância
        // Vencidos há até 90 dias
        if (timing.group === 'overdue' && timing.diffDays >= -90) {
          overdue.push(enriched);
        } else if (timing.group === 'today') {
          today.push(enriched);
        } else if (timing.group === 'next7Days') {
          next7Days.push(enriched);
        } else if (timing.group === 'next30Days') {
          next30Days.push(enriched);
        }
      }

      // Ordenação cronológica prioritária
      // Vencidos: os que venceram mais recentemente primeiro (ex: -1 antes de -10)
      overdue.sort((a, b) => b.diffDays - a.diffDays);
      // Próximos: os que vencem mais cedo primeiro (ex: +1 antes de +7)
      next7Days.sort((a, b) => a.diffDays - b.diffDays);
      next30Days.sort((a, b) => a.diffDays - b.diffDays);

      // Contagem crítica para o Sino de Notificações:
      // Apenas o que exige ação imediata (Vencidos + Hoje + Próximos 7 dias)
      const attentionCount = overdue.length + today.length + next7Days.length;
      const total = attentionCount + next30Days.length;

      return res.status(200).json({
        success: true,
        summary: {
          attentionCount,
          total,
          overdue: overdue.length,
          today: today.length,
          next7Days: next7Days.length,
          next30Days: next30Days.length
        },
        groups: {
          overdue,
          today,
          next7Days,
          next30Days
        },
        reminders: enrichedAll,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[reminderController.list]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao carregar central de alertas.' }
      });
    }
  }
};
