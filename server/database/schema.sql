-- ===================================================================
-- SCHEMA RELACIONAL POSTGRESQL - PROJETO ESQUECIMENTO ZERO
-- Compatível com PostgreSQL 14+, Neon, Supabase, Railway e Render Postgres
-- ===================================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  is_system BOOLEAN DEFAULT TRUE,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE ASSINATURAS E COTAS
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  items_limit INTEGER NOT NULL DEFAULT 10,
  features JSONB NOT NULL DEFAULT '{"aiProcessing": false, "unlimitedItems": false, "advancedReminders": false, "exportData": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE DOCUMENTOS E NOTAS FISCAIS
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  ocr_raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE ITENS, PRODUTOS E PRAZOS
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id VARCHAR(100) REFERENCES documents(id) ON DELETE SET NULL,
  category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  store VARCHAR(255),
  purchase_date VARCHAR(50),
  price NUMERIC(12, 2) DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  invoice_number VARCHAR(100),
  warranty_period_months INTEGER,
  warranty_end_date VARCHAR(50),
  expiration_date VARCHAR(50),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA DE LEMBRETES E NOTIFICAÇÕES PREVENTIVAS
CREATE TABLE IF NOT EXISTS reminders (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id VARCHAR(100) REFERENCES items(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  trigger_date VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES DE PERFORMANCE E CONSULTA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_item_id ON reminders(item_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
