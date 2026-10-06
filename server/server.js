import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { applySecurityHeaders, globalLimiter } from './middleware/security.js';
import { runSeed } from './database/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;
const APP_NAME = process.env.APP_NAME || 'Esquecimento Zero';

// Inicializa sementes de banco (categorias e demo user)
runSeed(false).catch(err => console.error('[Server Seed Error]', err.message));

// Middlewares Globais de Segurança e Parsing
app.use(applySecurityHeaders);
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * 1. Endpoint Obrigatório de Monitoramento 24/7 (/api/health)
 * Padrão Cloud Luciano / UptimeRobot / Render Health Check
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: APP_NAME,
    version: '2.0.0',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Rotas da API REST
app.use('/api', apiRouter);

/**
 * 2. Resolução Universal e Resiliente de Arquivos Estáticos
 * Suporta desenvolvimento local, Docker e deploy direto em nuvem
 */
const staticPaths = [
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, '..'),
  process.cwd()
];

staticPaths.forEach(p => {
  if (fs.existsSync(p)) {
    app.use(express.static(p));
  }
});

/**
 * 3. Fallback Resiliente SPA (Single Page Application)
 * Garante que rotas de frontend (/login, /dashboard, etc.) carreguem o index.html
 */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint da API não encontrado.' }
    });
  }

  const candidateIndexFiles = [
    path.join(__dirname, '..', 'public', 'index.html'),
    path.join(process.cwd(), 'public', 'index.html'),
    path.join(__dirname, '..', 'index.html'),
    path.join(process.cwd(), 'index.html')
  ];

  const foundIndex = candidateIndexFiles.find(p => fs.existsSync(p));
  if (foundIndex) {
    return res.sendFile(foundIndex);
  }

  res.status(404).send('Aplicativo Esquecimento Zero: index.html não localizado.');
});

// Inicialização do Servidor (apenas se executado diretamente via terminal)
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server'));
if (isDirectRun) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 ${APP_NAME} rodando na porta ${PORT}`);
    console.log(`  🌐 Local:   http://localhost:${PORT}`);
    console.log(`  🩺 Health:  http://localhost:${PORT}/api/health`);
    console.log(`  📱 Mobile:  Layout 100% responsivo PWA-ready`);
    console.log(`======================================================\n`);
  });
}

export default app;
