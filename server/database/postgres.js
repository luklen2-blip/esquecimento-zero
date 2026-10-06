import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poolInstance = null;

export function getPool() {
  if (!poolInstance && process.env.DATABASE_URL) {
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    poolInstance.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]', err.message);
    });
  }
  return poolInstance;
}

export function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export async function testPostgresConnection() {
  const pool = getPool();
  if (!pool) throw new Error('DATABASE_URL não configurada.');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() AS now, current_database() AS db_name, version() AS version;');
    return res.rows[0];
  } finally {
    client.release();
  }
}

export async function initPostgresSchema() {
  const pool = getPool();
  if (!pool) return false;
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schemaSql);
  return true;
}

// FORMATADORES DE DADOS (Snake_case -> CamelCase)
export function formatUser(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    passwordHash: r.password_hash,
    role: r.role || 'user',
    termsAcceptedAt: r.terms_accepted_at ? new Date(r.terms_accepted_at).toISOString() : null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null
  };
}

export function formatCategory(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    isSystem: r.is_system,
    userId: r.user_id,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null
  };
}

export function formatSubscription(r) {
  if (!r) return null;
  let features = r.features;
  if (typeof features === 'string') {
    try { features = JSON.parse(features); } catch {}
  }
  return {
    id: r.id,
    userId: r.user_id,
    plan: r.plan,
    status: r.status,
    itemsLimit: r.items_limit,
    features: features || { aiProcessing: false, unlimitedItems: false },
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null
  };
}

export function formatDocument(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    fileName: r.file_name,
    fileType: r.file_type,
    fileSize: Number(r.file_size),
    filePath: r.file_path,
    status: r.status,
    ocrRawText: r.ocr_raw_text,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null
  };
}

export function formatItem(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    documentId: r.document_id,
    categoryId: r.category_id,
    title: r.title,
    store: r.store,
    purchaseDate: r.purchase_date,
    price: Number(r.price || 0),
    quantity: Number(r.quantity || 1),
    invoiceNumber: r.invoice_number,
    warrantyPeriodMonths: r.warranty_period_months,
    warrantyEndDate: r.warranty_end_date,
    expirationDate: r.expiration_date,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null
  };
}

export function formatReminder(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    itemId: r.item_id,
    title: r.title,
    triggerDate: r.trigger_date,
    type: r.type,
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null
  };
}

// REPOSITÓRIOS POSTGRESQL
export const PgUsers = {
  async findById(id) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return formatUser(res.rows[0]);
  },
  async findOne(predicate) {
    // Busca por email se houver no predicado
    const pool = getPool();
    const res = await pool.query('SELECT * FROM users');
    const mapped = res.rows.map(formatUser);
    return predicate ? (mapped.find(predicate) || null) : (mapped[0] || null);
  },
  async findByEmail(email) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return formatUser(res.rows[0]);
  },
  async insert(u) {
    const pool = getPool();
    const id = u.id || `use_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO users (id, name, email, password_hash, role, terms_accepted_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      u.name,
      u.email.toLowerCase(),
      u.passwordHash,
      u.role || 'user',
      u.termsAcceptedAt || now,
      u.createdAt || now,
      u.updatedAt || now
    ]);
    return formatUser(res.rows[0]);
  },
  async count(predicate) {
    const pool = getPool();
    if (!predicate) {
      const res = await pool.query('SELECT COUNT(*)::int AS count FROM users');
      return res.rows[0].count;
    }
    const res = await pool.query('SELECT * FROM users');
    return res.rows.map(formatUser).filter(predicate).length;
  },
  async clear() {
    const pool = getPool();
    await pool.query('DELETE FROM users');
  }
};

export const PgCategories = {
  async findAll(predicate) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM categories ORDER BY is_system DESC, name ASC');
    const mapped = res.rows.map(formatCategory);
    return predicate ? mapped.filter(predicate) : mapped;
  },
  async findById(id) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return formatCategory(res.rows[0]);
  },
  async insert(c) {
    const pool = getPool();
    const id = c.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO categories (id, name, icon, color, is_system, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      c.name,
      c.icon,
      c.color,
      c.isSystem !== false,
      c.userId || null,
      c.createdAt || now,
      c.updatedAt || now
    ]);
    return formatCategory(res.rows[0]);
  },
  async clear() {
    const pool = getPool();
    await pool.query('DELETE FROM categories');
  }
};

export const PgSubscriptions = {
  async findOne(predicate) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM subscriptions');
    const mapped = res.rows.map(formatSubscription);
    return predicate ? (mapped.find(predicate) || null) : (mapped[0] || null);
  },
  async findByUserId(userId) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    return formatSubscription(res.rows[0]);
  },
  async insert(s) {
    const pool = getPool();
    const id = s.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const featuresJson = JSON.stringify(s.features || { aiProcessing: false, unlimitedItems: false });
    const query = `
      INSERT INTO subscriptions (id, user_id, plan, status, items_limit, features, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        plan = EXCLUDED.plan,
        status = EXCLUDED.status,
        items_limit = EXCLUDED.items_limit,
        features = EXCLUDED.features,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      s.userId,
      s.plan || 'free',
      s.status || 'active',
      s.itemsLimit || 10,
      featuresJson,
      s.createdAt || now,
      s.updatedAt || now
    ]);
    return formatSubscription(res.rows[0]);
  },
  async clear() {
    const pool = getPool();
    await pool.query('DELETE FROM subscriptions');
  }
};

export const PgDocuments = {
  async findById(id) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    return formatDocument(res.rows[0]);
  },
  async findAll(predicate) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    const mapped = res.rows.map(formatDocument);
    return predicate ? mapped.filter(predicate) : mapped;
  },
  async findOne(predicate) {
    const all = await this.findAll();
    return predicate ? (all.find(predicate) || null) : (all[0] || null);
  },
  async insert(d) {
    const pool = getPool();
    const id = d.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO documents (id, user_id, file_name, file_type, file_size, file_path, status, ocr_raw_text, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        ocr_raw_text = EXCLUDED.ocr_raw_text,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      d.userId,
      d.fileName,
      d.fileType,
      d.fileSize,
      d.filePath,
      d.status || 'pending',
      d.ocrRawText || null,
      d.createdAt || now,
      d.updatedAt || now
    ]);
    return formatDocument(res.rows[0]);
  },
  async update(id, updates) {
    const pool = getPool();
    const current = await this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    const now = new Date().toISOString();
    const query = `
      UPDATE documents
      SET status = $2, ocr_raw_text = $3, updated_at = $4
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      merged.status,
      merged.ocrRawText || null,
      now
    ]);
    return formatDocument(res.rows[0]);
  },
  async delete(id) {
    const pool = getPool();
    const res = await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  },
  async clear() {
    const pool = getPool();
    await pool.query('DELETE FROM documents');
  }
};

export const PgItems = {
  async findById(id) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    return formatItem(res.rows[0]);
  },
  async findAll(predicate) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    const mapped = res.rows.map(formatItem);
    return predicate ? mapped.filter(predicate) : mapped;
  },
  async findOne(predicate) {
    const all = await this.findAll();
    return predicate ? (all.find(predicate) || null) : (all[0] || null);
  },
  async count(predicate) {
    const pool = getPool();
    if (!predicate) {
      const res = await pool.query('SELECT COUNT(*)::int AS count FROM items');
      return res.rows[0].count;
    }
    const all = await this.findAll();
    return all.filter(predicate).length;
  },
  async insert(item) {
    const pool = getPool();
    const id = item.id || `ite_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
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
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      item.userId,
      item.documentId || null,
      item.categoryId || 'cat_geral',
      item.title,
      item.store || null,
      item.purchaseDate || null,
      item.price || 0,
      item.quantity || 1,
      item.invoiceNumber || null,
      item.warrantyPeriodMonths || null,
      item.warrantyEndDate || null,
      item.expirationDate || null,
      item.notes || null,
      item.status || 'active',
      item.createdAt || now,
      item.updatedAt || now
    ]);
    return formatItem(res.rows[0]);
  },
  async update(id, updates) {
    const pool = getPool();
    const current = await this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    const now = new Date().toISOString();
    const query = `
      UPDATE items
      SET title = $2, store = $3, price = $4, quantity = $5,
          invoice_number = $6, warranty_period_months = $7, warranty_end_date = $8,
          expiration_date = $9, notes = $10, status = $11, updated_at = $12
      WHERE id = $1
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      merged.title,
      merged.store,
      merged.price,
      merged.quantity,
      merged.invoiceNumber,
      merged.warrantyPeriodMonths,
      merged.warrantyEndDate,
      merged.expirationDate,
      merged.notes,
      merged.status,
      now
    ]);
    return formatItem(res.rows[0]);
  },
  async delete(id) {
    const pool = getPool();
    const res = await pool.query('DELETE FROM items WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  },
  async clear() {
    const pool = getPool();
    await pool.query('DELETE FROM items');
  }
};

export const PgReminders = {
  async findAll(predicate) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM reminders ORDER BY trigger_date ASC');
    const mapped = res.rows.map(formatReminder);
    return predicate ? mapped.filter(predicate) : mapped;
  },
  async findById(id) {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM reminders WHERE id = $1', [id]);
    return formatReminder(res.rows[0]);
  },
  async insert(r) {
    const pool = getPool();
    const id = r.id || `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const query = `
      INSERT INTO reminders (id, user_id, item_id, title, trigger_date, type, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        trigger_date = EXCLUDED.trigger_date,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const res = await pool.query(query, [
      id,
      r.userId,
      r.itemId || null,
      r.title,
      r.triggerDate,
      r.type,
      r.status || 'pending',
      r.createdAt || now,
      r.updatedAt || now
    ]);
    return formatReminder(res.rows[0]);
  },
  async delete(id) {
    const pool = getPool();
    const res = await pool.query('DELETE FROM reminders WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  },
  async clear() {
    const pool = getPool();
    await pool.query('DELETE FROM reminders');
  }
};
