import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_DIR = path.join(__dirname, 'data');

/**
 * JsonDB Atômico e Resiliente para Windows e Nuvem
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

// Instâncias singleton das coleções do sistema
export const Users = new JsonDB('users');
export const Documents = new JsonDB('documents');
export const Items = new JsonDB('items');
export const Reminders = new JsonDB('reminders');
export const Categories = new JsonDB('categories');
export const Subscriptions = new JsonDB('subscriptions');
