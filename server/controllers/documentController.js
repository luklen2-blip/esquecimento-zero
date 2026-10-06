import { Documents, Subscriptions, Users } from '../database/db.js';
import { ocrService } from '../services/ocrService.js';
import { getAccessStatus } from '../utils/accessControl.js';

export const documentController = {
  /**
   * Registra arquivo enviado (foto da câmera, galeria ou PDF de nota fiscal)
   */
  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE_UPLOADED', message: 'Nenhum arquivo ou foto foi enviado.' }
        });
      }

      const file = req.file;
      const relativePath = `/uploads/${file.filename}`;

      const newDoc = await Documents.insert({
        userId: req.userId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: relativePath,
        status: 'pending',
        ocrRawText: null
      });

      return res.status(201).json({
        success: true,
        data: newDoc,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[documentController.upload]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: 'Erro ao processar o upload do documento.' }
      });
    }
  },

  /**
   * Processamento inteligente por IA / OCR do documento enviado
   * Identifica produto, categoria, loja, data, valor, NF e prazo de garantia
   */
  async processDocument(req, res) {
    try {
      const subscription = await Subscriptions.findOne(s => s.userId === req.userId);
      const user = await Users.findById(req.userId);
      const access = getAccessStatus(subscription, user);

      if (!access.hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TRIAL_EXPIRED',
            message: 'Seu período de teste de 7 dias expirou. Adquira o Acesso Vitalício por apenas R$ 19,90 para processar documentos com IA.',
            checkoutUrl: access.checkoutUrl,
            priceBrl: access.priceBrl
          }
        });
      }

      const doc = await Documents.findById(req.params.id);
      if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não localizado.' }
        });
      }

      // Executa a análise pelo motor de IA / OCR
      const extraction = await ocrService.analyzeDocument(doc);

      // Atualiza documento com o texto bruto e status
      await Documents.update(doc.id, {
        ocrRawText: extraction.rawText,
        status: 'processed'
      });

      return res.status(200).json({
        success: true,
        data: {
          documentId: doc.id,
          extracted: extraction,
          confidence: extraction.confidence
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[documentController.processDocument]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'OCR_PROCESSING_ERROR', message: 'Falha no processamento inteligente do documento.' }
      });
    }
  },

  /**
   * Lista todos os documentos pertencentes ao usuário logado
   */
  async list(req, res) {
    try {
      const userDocs = await Documents.findAll(d => d.userId === req.userId);
      const docs = [...userDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({
        success: true,
        data: docs,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[documentController.list]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao listar documentos.' }
      });
    }
  },

  /**
   * Obtém detalhes de um documento com verificação estrita de posse
   */
  async getById(req, res) {
    try {
      const doc = await Documents.findById(req.params.id);
      if (!doc || doc.userId !== req.userId) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não localizado.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: doc,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[documentController.getById]', err);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Erro ao obter dados do documento.' }
      });
    }
  }
};
