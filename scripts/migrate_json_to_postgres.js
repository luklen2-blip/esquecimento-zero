import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { initPostgresSchema } from '../server/database/postgres.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const DATA_DIR = path.join(projectRoot, 'server', 'database', 'data');

export async function runMigration(targetDatabaseUrl = null) {
  const dbUrl = targetDatabaseUrl || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ ERRO CRÍTICO: Variável DATABASE_URL não definida.');
    console.error('Para executar a migração, defina DATABASE_URL no ambiente ou passe a URL como argumento:');
    console.error('Ex: node scripts/migrate_json_to_postgres.js "postgresql://user:pass@host:5432/dbname"');
    return {
      success: false,
      error: 'DATABASE_URL_NOT_CONFIGURED',
      summary: { totalEncontrado: 0, totalImportado: 0, totalRejeitado: 0, totalComErro: 1 }
    };
  }

  process.env.DATABASE_URL = dbUrl;
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  console.log(`================================================================`);
  console.log(`🐘 INICIANDO MIGRAÇÃO DE DADOS: JsonDB ➔ POSTGRESQL`);
  console.log(`📁 Origem dos dados: ${DATA_DIR}`);
  console.log(`🔗 Alvo: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`⏱️ Data/Hora: ${new Date().toISOString()}`);
  console.log(`================================================================\n`);

  const summary = {
    totalEncontrado: 0,
    totalImportado: 0,
    totalRejeitado: 0,
    totalComErro: 0,
    entities: {}
  };

  const client = await pool.connect();

  try {
    // 1. Garante que o schema e tabelas existem
    console.log('📌 [1/7] Validando e criando schema relacional...');
    const schemaPath = path.join(projectRoot, 'server', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await client.query(schemaSql);
    console.log('  ✅ Schema relacional, constraints e índices validados.');

    // Helper para leitura segura
    const readCollection = (colName) => {
      const file = path.join(DATA_DIR, `${colName}.json`);
      if (!fs.existsSync(file)) return [];
      try {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn(`[Aviso] Falha ao ler ${colName}.json:`, err.message);
        return [];
      }
    };

    // 2. MIGRAR USERS
    console.log('\n📌 [2/7] Migrando Usuários (users)...');
    const users = readCollection('users');
    summary.entities.users = { encontrado: users.length, importado: 0, rejeitado: 0, erro: 0 };
    summary.totalEncontrado += users.length;

    const importedUserIds = new Set();

    for (const u of users) {
      if (!u.id || !u.email || !u.passwordHash) {
        summary.entities.users.rejeitado++;
        summary.totalRejeitado++;
        continue;
      }
      try {
        const query = `
          INSERT INTO users (id, name, email, password_hash, role, terms_accepted_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(query, [
          u.id,
          u.name || 'Usuário Sem Nome',
          u.email.toLowerCase(),
          u.passwordHash,
          u.role || 'user',
          u.termsAcceptedAt || u.createdAt || new Date().toISOString(),
          u.createdAt || new Date().toISOString(),
          u.updatedAt || new Date().toISOString()
        ]);
        summary.entities.users.importado++;
        summary.totalImportado++;
        importedUserIds.add(u.id);
      } catch (err) {
        console.error(`  ❌ Erro ao importar usuário ${u.id}:`, err.message);
        summary.entities.users.erro++;
        summary.totalComErro++;
      }
    }
    console.log(`  ✅ Users: ${summary.entities.users.importado}/${users.length} importados.`);

    // 3. MIGRAR CATEGORIES
    console.log('\n📌 [3/7] Migrando Categorias (categories)...');
    const categories = readCollection('categories');
    summary.entities.categories = { encontrado: categories.length, importado: 0, rejeitado: 0, erro: 0 };
    summary.totalEncontrado += categories.length;

    const importedCategoryIds = new Set();

    for (const c of categories) {
      if (!c.id || !c.name) {
        summary.entities.categories.rejeitado++;
        summary.totalRejeitado++;
        continue;
      }
      try {
        const query = `
          INSERT INTO categories (id, name, icon, color, is_system, user_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            icon = EXCLUDED.icon,
            color = EXCLUDED.color,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(query, [
          c.id,
          c.name,
          c.icon || 'tag',
          c.color || '#6B7280',
          c.isSystem !== false,
          c.userId && importedUserIds.has(c.userId) ? c.userId : null,
          c.createdAt || new Date().toISOString(),
          c.updatedAt || new Date().toISOString()
        ]);
        summary.entities.categories.importado++;
        summary.totalImportado++;
        importedCategoryIds.add(c.id);
      } catch (err) {
        console.error(`  ❌ Erro ao importar categoria ${c.id}:`, err.message);
        summary.entities.categories.erro++;
        summary.totalComErro++;
      }
    }
    console.log(`  ✅ Categories: ${summary.entities.categories.importado}/${categories.length} importadas.`);

    // 4. MIGRAR SUBSCRIPTIONS
    console.log('\n📌 [4/7] Migrando Assinaturas (subscriptions)...');
    const subscriptions = readCollection('subscriptions');
    summary.entities.subscriptions = { encontrado: subscriptions.length, importado: 0, rejeitado: 0, erro: 0 };
    summary.totalEncontrado += subscriptions.length;

    for (const s of subscriptions) {
      if (!s.userId || !importedUserIds.has(s.userId)) {
        summary.entities.subscriptions.rejeitado++;
        summary.totalRejeitado++;
        continue;
      }
      try {
        const subId = s.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const featuresJson = JSON.stringify(s.features || { aiProcessing: false, unlimitedItems: false });
        const query = `
          INSERT INTO subscriptions (id, user_id, plan, status, items_limit, features, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id) DO UPDATE SET
            plan = EXCLUDED.plan,
            status = EXCLUDED.status,
            items_limit = EXCLUDED.items_limit,
            features = EXCLUDED.features,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(query, [
          subId,
          s.userId,
          s.plan || 'free',
          s.status || 'active',
          s.itemsLimit || 10,
          featuresJson,
          s.createdAt || new Date().toISOString(),
          s.updatedAt || new Date().toISOString()
        ]);
        summary.entities.subscriptions.importado++;
        summary.totalImportado++;
      } catch (err) {
        console.error(`  ❌ Erro ao importar assinatura do user ${s.userId}:`, err.message);
        summary.entities.subscriptions.erro++;
        summary.totalComErro++;
      }
    }
    console.log(`  ✅ Subscriptions: ${summary.entities.subscriptions.importado}/${subscriptions.length} importadas.`);

    // 5. MIGRAR DOCUMENTS
    console.log('\n📌 [5/7] Migrando Documentos (documents)...');
    const documents = readCollection('documents');
    summary.entities.documents = { encontrado: documents.length, importado: 0, rejeitado: 0, erro: 0 };
    summary.totalEncontrado += documents.length;

    const importedDocIds = new Set();

    for (const d of documents) {
      if (!d.id || !d.userId || !importedUserIds.has(d.userId)) {
        summary.entities.documents.rejeitado++;
        summary.totalRejeitado++;
        continue;
      }
      try {
        const query = `
          INSERT INTO documents (id, user_id, file_name, file_type, file_size, file_path, status, ocr_raw_text, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            file_name = EXCLUDED.file_name,
            status = EXCLUDED.status,
            ocr_raw_text = EXCLUDED.ocr_raw_text,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(query, [
          d.id,
          d.userId,
          d.fileName || 'documento.pdf',
          d.fileType || 'application/pdf',
          Number(d.fileSize || 0),
          d.filePath || '/uploads/default.pdf',
          d.status || 'pending',
          d.ocrRawText || null,
          d.createdAt || new Date().toISOString(),
          d.updatedAt || new Date().toISOString()
        ]);
        summary.entities.documents.importado++;
        summary.totalImportado++;
        importedDocIds.add(d.id);
      } catch (err) {
        console.error(`  ❌ Erro ao importar documento ${d.id}:`, err.message);
        summary.entities.documents.erro++;
        summary.totalComErro++;
      }
    }
    console.log(`  ✅ Documents: ${summary.entities.documents.importado}/${documents.length} importados.`);

    // 6. MIGRAR ITEMS
    console.log('\n📌 [6/7] Migrando Itens e Prazos (items)...');
    const items = readCollection('items');
    summary.entities.items = { encontrado: items.length, importado: 0, rejeitado: 0, erro: 0 };
    summary.totalEncontrado += items.length;

    const importedItemIds = new Set();

    for (const item of items) {
      if (!item.id || !item.userId || !importedUserIds.has(item.userId)) {
        summary.entities.items.rejeitado++;
        summary.totalRejeitado++;
        continue;
      }
      try {
        const validDocId = item.documentId && importedDocIds.has(item.documentId) ? item.documentId : null;
        const validCatId = item.categoryId && importedCategoryIds.has(item.categoryId) ? item.categoryId : 'cat_geral';

        const query = `
          INSERT INTO items (
            id, user_id, document_id, category_id, title, store,
            purchase_date, price, quantity, invoice_number,
            warranty_period_months, warranty_end_date, expiration_date,
            notes, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            store = EXCLUDED.store,
            price = EXCLUDED.price,
            quantity = EXCLUDED.quantity,
            invoice_number = EXCLUDED.invoice_number,
            warranty_period_months = EXCLUDED.warranty_period_months,
            warranty_end_date = EXCLUDED.warranty_end_date,
            expiration_date = EXCLUDED.expiration_date,
            notes = EXCLUDED.notes,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(query, [
          item.id,
          item.userId,
          validDocId,
          validCatId,
          item.title,
          item.store || null,
          item.purchaseDate || null,
          Number(item.price || 0),
          Number(item.quantity || 1),
          item.invoiceNumber || null,
          item.warrantyPeriodMonths || null,
          item.warrantyEndDate || null,
          item.expirationDate || null,
          item.notes || null,
          item.status || 'active',
          item.createdAt || new Date().toISOString(),
          item.updatedAt || new Date().toISOString()
        ]);
        summary.entities.items.importado++;
        summary.totalImportado++;
        importedItemIds.add(item.id);
      } catch (err) {
        console.error(`  ❌ Erro ao importar item ${item.id}:`, err.message);
        summary.entities.items.erro++;
        summary.totalComErro++;
      }
    }
    console.log(`  ✅ Items: ${summary.entities.items.importado}/${items.length} importados.`);

    // 7. MIGRAR REMINDERS
    console.log('\n📌 [7/7] Migrando Lembretes (reminders)...');
    const reminders = readCollection('reminders');
    summary.entities.reminders = { encontrado: reminders.length, importado: 0, rejeitado: 0, erro: 0 };
    summary.totalEncontrado += reminders.length;

    for (const rem of reminders) {
      if (!rem.id || !rem.userId || !importedUserIds.has(rem.userId)) {
        summary.entities.reminders.rejeitado++;
        summary.totalRejeitado++;
        continue;
      }
      try {
        const validItemId = rem.itemId && importedItemIds.has(rem.itemId) ? rem.itemId : null;
        const query = `
          INSERT INTO reminders (id, user_id, item_id, title, trigger_date, type, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            trigger_date = EXCLUDED.trigger_date,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at;
        `;
        await client.query(query, [
          rem.id,
          rem.userId,
          validItemId,
          rem.title,
          rem.triggerDate || new Date().toISOString().split('T')[0],
          rem.type || 'warranty',
          rem.status || 'pending',
          rem.createdAt || new Date().toISOString(),
          rem.updatedAt || new Date().toISOString()
        ]);
        summary.entities.reminders.importado++;
        summary.totalImportado++;
      } catch (err) {
        console.error(`  ❌ Erro ao importar lembrete ${rem.id}:`, err.message);
        summary.entities.reminders.erro++;
        summary.totalComErro++;
      }
    }
    console.log(`  ✅ Reminders: ${summary.entities.reminders.importado}/${reminders.length} importados.`);

    // RELATÓRIO CONSOLIDADO
    console.log(`\n================================================================`);
    console.log(`📊 RELATÓRIO CONSOLIDADO DE MIGRAÇÃO`);
    console.log(`================================================================`);
    console.log(`TOTAL ENCONTRADO: ${summary.totalEncontrado}`);
    console.log(`TOTAL IMPORTADO:  ${summary.totalImportado}`);
    console.log(`TOTAL REJEITADO:  ${summary.totalRejeitado}`);
    console.log(`TOTAL COM ERRO:   ${summary.totalComErro}`);
    console.log(`================================================================`);

    const isSuccess = summary.totalComErro === 0 && (summary.totalImportado + summary.totalRejeitado === summary.totalEncontrado);
    if (isSuccess) {
      console.log(`🎉 MIGRAÇÃO CONCLUÍDA COM 100% DE INTEGRIDADE!\n`);
    } else {
      console.error(`⚠️ ALERTA: Foram detectados erros ou divergências durante a migração!\n`);
    }

    return {
      success: isSuccess,
      summary
    };

  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate_json_to_postgres.js')) {
  const customUrl = process.argv[2] || process.env.DATABASE_URL;
  runMigration(customUrl).then(res => {
    if (!res.success) process.exit(1);
    process.exit(0);
  }).catch(err => {
    console.error('Falha catastrófica na migração:', err);
    process.exit(1);
  });
}
