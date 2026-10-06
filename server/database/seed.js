import { Users, Subscriptions, Categories, Items, Documents, Reminders } from './db.js';
import { isPostgresConfigured, initPostgresSchema } from './postgres.js';
import { hashPassword } from '../utils/authUtils.js';

export async function runSeed(reset = false) {
  if (isPostgresConfigured()) {
    try {
      await initPostgresSchema();
    } catch (err) {
      console.warn('[Seed] Aviso ao inicializar schema PostgreSQL:', err.message);
    }
  }

  if (reset) {
    await Users.clear();
    await Subscriptions.clear();
    await Categories.clear();
    await Items.clear();
    await Documents.clear();
    await Reminders.clear();
    console.log('[Seed] Banco de dados limpo com sucesso.');
  }

  // 1. Categorias Padrão do Sistema
  const defaultCategories = [
    { id: 'cat_eletronicos', name: 'Eletrônicos & Tecnologia', icon: 'laptop', color: '#3B82F6', isSystem: true },
    { id: 'cat_eletrodomesticos', name: 'Eletrodomésticos & Casa', icon: 'home', color: '#10B981', isSystem: true },
    { id: 'cat_alimentos', name: 'Alimentos & Despensa', icon: 'apple', color: '#F59E0B', isSystem: true },
    { id: 'cat_saude', name: 'Medicamentos & Saúde', icon: 'pill', color: '#EF4444', isSystem: true },
    { id: 'cat_veiculos', name: 'Veículos & Transporte', icon: 'car', color: '#8B5CF6', isSystem: true },
    { id: 'cat_documentos', name: 'Documentos & Contratos', icon: 'file-text', color: '#06B6D4', isSystem: true },
    { id: 'cat_geral', name: 'Geral & Diversos', icon: 'tag', color: '#6B7280', isSystem: true }
  ];

  for (const cat of defaultCategories) {
    const existing = await Categories.findById(cat.id);
    if (!existing) {
      await Categories.insert(cat);
    }
  }

  // 2. Usuário de Demonstração
  const demoEmail = 'demo@esquecimentozero.com.br';
  let demoUser = await Users.findOne(u => u.email === demoEmail);

  if (!demoUser) {
    demoUser = await Users.insert({
      id: 'usr_demo_esquecimento',
      name: 'Luciano Antigravity (Demonstração)',
      email: demoEmail,
      passwordHash: hashPassword('demo123'),
      role: 'user',
      termsAcceptedAt: new Date().toISOString()
    });
    console.log('[Seed] Usuário de demonstração criado:', demoEmail, '(Senha: demo123)');
  }

  // 3. Assinatura do Usuário Demo (Plano Gratuito com 7 Dias de Teste)
  let demoSub = await Subscriptions.findOne(s => s.userId === demoUser.id);
  const now = new Date();
  const trialEnds = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  if (!demoSub) {
    demoSub = await Subscriptions.insert({
      id: 'sub_demo_free',
      userId: demoUser.id,
      plan: 'free',
      status: 'active',
      itemsLimit: 10,
      trialStartedAt: now.toISOString(),
      trialEndsAt: trialEnds.toISOString(),
      features: {
        aiProcessing: false,
        unlimitedItems: false,
        advancedReminders: false,
        exportData: false
      }
    });
  } else if (!demoSub.trialEndsAt) {
    await Subscriptions.updateByUserId(demoUser.id, {
      trialStartedAt: now.toISOString(),
      trialEndsAt: trialEnds.toISOString()
    });
  }

  // 4. Documento de Exemplo
  let demoDoc = await Documents.findOne(d => d.userId === demoUser.id);
  if (!demoDoc) {
    demoDoc = await Documents.insert({
      id: 'doc_demo_nf_samsung',
      userId: demoUser.id,
      fileName: 'Nota_Fiscal_Samsung_Crystal_UHD.pdf',
      fileType: 'application/pdf',
      fileSize: 1024 * 350,
      filePath: '/uploads/demo_nf_samsung.pdf',
      ocrRawText: 'DANFE NOTA FISCAL ELETRONICA MAGAZINE LUIZA SMART TV SAMSUNG 55 4K NF 49281',
      status: 'processed'
    });
  }

  // 5. Itens Realistas com Prazos Variados
  const existingItems = await Items.findAll(i => i.userId === demoUser.id);
  if (existingItems.length === 0) {
    const today = new Date();

    const addDays = (d, days) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy.toISOString().split('T')[0];
    };

    // Item 1: Smart TV (Garantia terminando em 18 dias)
    await Items.insert({
      id: 'itm_tv_samsung',
      userId: demoUser.id,
      documentId: demoDoc.id,
      categoryId: 'cat_eletronicos',
      title: 'Smart TV 55 4K Crystal UHD',
      store: 'Magazine Luiza',
      purchaseDate: addDays(today, -347),
      price: 2499.00,
      quantity: 1,
      invoiceNumber: 'NF-49281',
      warrantyPeriodMonths: 12,
      warrantyEndDate: addDays(today, 18),
      expirationDate: null,
      notes: 'Garantia de fábrica de 1 ano. Em caso de defeito, acionar suporte Samsung.',
      status: 'active'
    });

    // Item 2: Cafeteira (Garantia terminando em 45 dias)
    await Items.insert({
      id: 'itm_cafeteira_nespresso',
      userId: demoUser.id,
      documentId: null,
      categoryId: 'cat_eletrodomesticos',
      title: 'Cafeteira Nespresso Essenza Mini',
      store: 'Nespresso Brasil',
      purchaseDate: addDays(today, -320),
      price: 420.00,
      quantity: 1,
      invoiceNumber: 'NF-10923',
      warrantyPeriodMonths: 12,
      warrantyEndDate: addDays(today, 45),
      expirationDate: null,
      notes: 'Comprada na promoção com 50 cápsulas de brinde.',
      status: 'active'
    });

    // Item 3: Medicamento (Validade em 5 dias - Crítico!)
    await Items.insert({
      id: 'itm_amoxicilina',
      userId: demoUser.id,
      documentId: null,
      categoryId: 'cat_saude',
      title: 'Antibiótico Amoxicilina 500mg',
      store: 'Farmácia Popular',
      purchaseDate: addDays(today, -20),
      price: 45.00,
      quantity: 2,
      invoiceNumber: null,
      warrantyPeriodMonths: null,
      warrantyEndDate: null,
      expirationDate: addDays(today, 5),
      notes: 'Uso oral prescrito. Descartar após o término do tratamento.',
      status: 'active'
    });

    // Item 4: Suplemento (Validade em 24 dias)
    await Items.insert({
      id: 'itm_vitamina_d3',
      userId: demoUser.id,
      documentId: null,
      categoryId: 'cat_saude',
      title: 'Suplemento Vitamina D3 2000UI (120 caps)',
      store: 'Farmácia Central',
      purchaseDate: addDays(today, -60),
      price: 68.00,
      quantity: 1,
      invoiceNumber: null,
      warrantyPeriodMonths: null,
      warrantyEndDate: null,
      expirationDate: addDays(today, 24),
      notes: 'Tomar 1 cápsula ao dia pela manhã com refeição.',
      status: 'active'
    });

    console.log('[Seed] Itens demonstrativos criados com sucesso.');
  }

  console.log('[Seed] Inicialização de dados concluída.');
}

// Se executado diretamente via terminal
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().catch(err => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}
