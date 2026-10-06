import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isPostgresConfigured,
  PgUsers,
  PgCategories,
  PgSubscriptions,
  PgDocuments,
  PgItems,
  PgReminders,
  PgPaymentTransactions
} from './postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_DIR = path.join(__dirname, 'data');

/**
 * JsonDB Atômico e Resiliente para Windows e Nuvem (Modo Fallback / Local)
 * Grava em arquivo temporário (.tmp) antes do renomeio atômico (renameSync)
 * Previne corrupção em falhas de processo ou desligamento.
 */
export class JsonDB {
  constructor(collectionName, baseDir = DEFAULT_DATA_DIR) {
    this.collectionName = collectionName;
    this.baseDir = baseDir;
    this.filePath = path.join(this.baseDir, `${collectionName}.json`);
    this.cache = [];
    this._init();
  }

  _init() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      this._persist([]);
    } else {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = JSON.parse(raw);
      } catch (err) {
        console.error(`[JsonDB] Erro ao carregar coleção ${this.collectionName}:`, err.message);
        this.cache = [];
      }
    }
  }

  _persist(data) {
    this.cache = data;
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.cache, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.filePath);
  }

  findAll(predicate) {
    return predicate ? this.cache.filter(predicate) : [...this.cache];
  }

  findById(id) {
    return this.cache.find(item => item.id === id) || null;
  }

  findOne(predicate) {
    return this.cache.find(predicate) || null;
  }

  count(predicate) {
    return predicate ? this.cache.filter(predicate).length : this.cache.length;
  }

  insert(record) {
    const prefix = this.collectionName.slice(0, 3);
    const id = record.id || `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const doc = {
      ...record,
      id,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this._persist([...this.cache, doc]);
    return doc;
  }

  update(id, updates) {
    const idx = this.cache.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.cache[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const newCache = [...this.cache];
    newCache[idx] = updated;
    this._persist(newCache);
    return updated;
  }

  delete(id) {
    const initialLen = this.cache.length;
    const filtered = this.cache.filter(item => item.id !== id);
    if (filtered.length === initialLen) return false;
    this._persist(filtered);
    return true;
  }

  clear() {
    this._persist([]);
  }
}

// Instâncias internas locais (JsonDB) para fallback e rollback
const jsonUsers = new JsonDB('users');
const jsonDocuments = new JsonDB('documents');
const jsonItems = new JsonDB('items');
const jsonReminders = new JsonDB('reminders');
const jsonCategories = new JsonDB('categories');
const jsonSubscriptions = new JsonDB('subscriptions');
const jsonPaymentTransactions = new JsonDB('payment_transactions');

// ===================================================================
// CAMADA UNIFICADA DE ACESSO A DADOS (DAL - REPOSITÓRIO ADAPTATIVO)
// Se DATABASE_URL estiver presente -> opera no PostgreSQL persistente
// Se DATABASE_URL estiver ausente  -> opera no JsonDB (fallback/local)
// ===================================================================

export const Users = {
  async findById(id) {
    if (isPostgresConfigured()) return await PgUsers.findById(id);
    return jsonUsers.findById(id);
  },
  async findOne(predicate) {
    if (isPostgresConfigured()) return await PgUsers.findOne(predicate);
    return jsonUsers.findOne(predicate);
  },
  async findByEmail(email) {
    if (isPostgresConfigured()) return await PgUsers.findByEmail(email);
    return jsonUsers.findOne(u => u.email.toLowerCase() === email.toLowerCase());
  },
  async insert(doc) {
    if (isPostgresConfigured()) return await PgUsers.insert(doc);
    return jsonUsers.insert(doc);
  },
  async update(id, updates) {
    if (isPostgresConfigured()) return await PgUsers.update(id, updates);
    return jsonUsers.update(id, updates);
  },
  async delete(id) {
    if (isPostgresConfigured()) return await PgUsers.delete(id);
    return jsonUsers.delete(id);
  },
  async count(predicate) {
    if (isPostgresConfigured()) return await PgUsers.count(predicate);
    return jsonUsers.count(predicate);
  },
  async clear() {
    if (isPostgresConfigured()) return await PgUsers.clear();
    return jsonUsers.clear();
  }
};

export const Categories = {
  async findAll(predicate) {
    if (isPostgresConfigured()) return await PgCategories.findAll(predicate);
    return jsonCategories.findAll(predicate);
  },
  async findById(id) {
    if (isPostgresConfigured()) return await PgCategories.findById(id);
    return jsonCategories.findById(id);
  },
  async insert(doc) {
    if (isPostgresConfigured()) return await PgCategories.insert(doc);
    return jsonCategories.insert(doc);
  },
  async clear() {
    if (isPostgresConfigured()) return await PgCategories.clear();
    return jsonCategories.clear();
  }
};

export const Subscriptions = {
  async findOne(predicate) {
    if (isPostgresConfigured()) return await PgSubscriptions.findOne(predicate);
    return jsonSubscriptions.findOne(predicate);
  },
  async findByUserId(userId) {
    if (isPostgresConfigured()) return await PgSubscriptions.findByUserId(userId);
    return jsonSubscriptions.findOne(s => s.userId === userId);
  },
  async insert(doc) {
    if (isPostgresConfigured()) return await PgSubscriptions.insert(doc);
    return jsonSubscriptions.insert(doc);
  },
  async updateByUserId(userId, updates) {
    if (isPostgresConfigured()) return await PgSubscriptions.updateByUserId(userId, updates);
    const sub = jsonSubscriptions.findOne(s => s.userId === userId);
    if (!sub) return null;
    return jsonSubscriptions.update(sub.id, updates);
  },
  async upgradeToLifetime(userId, { paymentId, paymentProvider = 'kiwify' } = {}) {
    if (isPostgresConfigured()) return await PgSubscriptions.upgradeToLifetime(userId, { paymentId, paymentProvider });
    const sub = jsonSubscriptions.findOne(s => s.userId === userId);
    const now = new Date().toISOString();
    const lifetimeData = {
      plan: 'lifetime',
      status: 'active',
      itemsLimit: -1,
      lifetimeActivatedAt: now,
      paymentId: paymentId || null,
      paymentProvider: paymentProvider || 'kiwify',
      features: {
        aiProcessing: true,
        unlimitedItems: true,
        advancedReminders: true,
        exportData: true
      },
      updatedAt: now
    };
    if (!sub) {
      return jsonSubscriptions.insert({
        userId,
        ...lifetimeData
      });
    }
    return jsonSubscriptions.update(sub.id, lifetimeData);
  },
  async clear() {
    if (isPostgresConfigured()) return await PgSubscriptions.clear();
    return jsonSubscriptions.clear();
  }
};

export const PaymentTransactions = {
  async findByOrderId(orderId) {
    if (isPostgresConfigured()) return await PgPaymentTransactions.findByOrderId(orderId);
    return jsonPaymentTransactions.findOne(t => t.orderId === orderId);
  },
  async insert(doc) {
    if (isPostgresConfigured()) return await PgPaymentTransactions.insert(doc);
    return jsonPaymentTransactions.insert(doc);
  },
  async findAll(predicate) {
    if (isPostgresConfigured()) return await PgPaymentTransactions.findAll(predicate);
    return jsonPaymentTransactions.findAll(predicate);
  },
  async clear() {
    if (isPostgresConfigured()) return await PgPaymentTransactions.clear();
    return jsonPaymentTransactions.clear();
  }
};

export const Documents = {
  async findById(id) {
    if (isPostgresConfigured()) return await PgDocuments.findById(id);
    return jsonDocuments.findById(id);
  },
  async findAll(predicate) {
    if (isPostgresConfigured()) return await PgDocuments.findAll(predicate);
    return jsonDocuments.findAll(predicate);
  },
  async findOne(predicate) {
    if (isPostgresConfigured()) return await PgDocuments.findOne(predicate);
    return jsonDocuments.findOne(predicate);
  },
  async insert(doc) {
    if (isPostgresConfigured()) return await PgDocuments.insert(doc);
    return jsonDocuments.insert(doc);
  },
  async update(id, updates) {
    if (isPostgresConfigured()) return await PgDocuments.update(id, updates);
    return jsonDocuments.update(id, updates);
  },
  async delete(id) {
    if (isPostgresConfigured()) return await PgDocuments.delete(id);
    return jsonDocuments.delete(id);
  },
  async clear() {
    if (isPostgresConfigured()) return await PgDocuments.clear();
    return jsonDocuments.clear();
  }
};

export const Items = {
  async findById(id) {
    if (isPostgresConfigured()) return await PgItems.findById(id);
    return jsonItems.findById(id);
  },
  async findAll(predicate) {
    if (isPostgresConfigured()) return await PgItems.findAll(predicate);
    return jsonItems.findAll(predicate);
  },
  async findOne(predicate) {
    if (isPostgresConfigured()) return await PgItems.findOne(predicate);
    return jsonItems.findOne(predicate);
  },
  async count(predicate) {
    if (isPostgresConfigured()) return await PgItems.count(predicate);
    return jsonItems.count(predicate);
  },
  async insert(doc) {
    if (isPostgresConfigured()) return await PgItems.insert(doc);
    return jsonItems.insert(doc);
  },
  async update(id, updates) {
    if (isPostgresConfigured()) return await PgItems.update(id, updates);
    return jsonItems.update(id, updates);
  },
  async delete(id) {
    if (isPostgresConfigured()) return await PgItems.delete(id);
    return jsonItems.delete(id);
  },
  async clear() {
    if (isPostgresConfigured()) return await PgItems.clear();
    return jsonItems.clear();
  }
};

export const Reminders = {
  async findAll(predicate) {
    if (isPostgresConfigured()) return await PgReminders.findAll(predicate);
    return jsonReminders.findAll(predicate);
  },
  async findById(id) {
    if (isPostgresConfigured()) return await PgReminders.findById(id);
    return jsonReminders.findById(id);
  },
  async insert(doc) {
    if (isPostgresConfigured()) return await PgReminders.insert(doc);
    return jsonReminders.insert(doc);
  },
  async delete(id) {
    if (isPostgresConfigured()) return await PgReminders.delete(id);
    return jsonReminders.delete(id);
  },
  async clear() {
    if (isPostgresConfigured()) return await PgReminders.clear();
    return jsonReminders.clear();
  }
};
