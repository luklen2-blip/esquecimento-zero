import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authController } from '../controllers/authController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { documentController } from '../controllers/documentController.js';
import { itemController } from '../controllers/itemController.js';
import { webhookController } from '../controllers/webhookController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { Categories } from '../database/db.js';
import { COMMERCIAL_CONFIG } from '../config/commercial.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do Multer para armazenamento seguro de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanBase}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Por favor, envie imagens (JPG, PNG) ou arquivos PDF.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // Limite de 15MB
});

const router = express.Router();

// Rotas de Autenticação
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.get('/auth/me', requireAuth, authController.me);

// Rotas do Dashboard
router.get('/dashboard/stats', requireAuth, dashboardController.getStats);

// Rotas de Documentos (Upload, Processamento IA, Listagem e Detalhes)
router.post('/documents/upload', requireAuth, upload.single('file'), documentController.upload);
router.post('/documents/:id/process', requireAuth, documentController.processDocument);
router.get('/documents', requireAuth, documentController.list);
router.get('/documents/:id', requireAuth, documentController.getById);

// Rotas de Itens (Cadastro, Listagem e Remoção)
router.post('/items', requireAuth, itemController.create);
router.get('/items', requireAuth, itemController.list);
router.delete('/items/:id', requireAuth, itemController.delete);

// Categorias disponíveis
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const list = await Categories.findAll(c => c.isSystem || c.userId === req.userId);
    res.json({
      success: true,
      data: list,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
router.get('/commercial/config', (req, res) => {
  res.json({
    success: true,
    data: {
      checkoutUrl: COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL,
      priceBrl: COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL,
      trialDays: COMMERCIAL_CONFIG.TRIAL_DAYS,
      trialHours: COMMERCIAL_CONFIG.TRIAL_HOURS
    },
    timestamp: new Date().toISOString()
  });
});

// Webhook Kiwify (Idempotente e Seguro)
router.post('/webhooks/kiwify', webhookController.handleKiwify);
router.post('/payments/webhook', webhookController.handleKiwify);

export default router;
