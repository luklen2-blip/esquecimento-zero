import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DATA_DIR = path.join(projectRoot, 'server', 'database', 'data');
const BACKUPS_DIR = path.join(projectRoot, 'server', 'database', 'backups');

export function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetBackupDir = path.join(BACKUPS_DIR, `backup_${timestamp}`);

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
  fs.mkdirSync(targetBackupDir, { recursive: true });

  console.log(`================================================================`);
  console.log(`🛡️ INICIANDO BACKUP DE SEGURANÇA NÃO DESTRUTIVO (JsonDB)`);
  console.log(`📁 Origem: ${DATA_DIR}`);
  console.log(`💾 Destino: ${targetBackupDir}`);
  console.log(`================================================================\n`);

  const collections = ['users', 'categories', 'subscriptions', 'documents', 'items', 'reminders'];
  const manifest = {
    timestamp: new Date().toISOString(),
    backupDirectory: targetBackupDir,
    collections: {},
    totalRecords: 0
  };

  for (const col of collections) {
    const srcFile = path.join(DATA_DIR, `${col}.json`);
    const destFile = path.join(targetBackupDir, `${col}.json`);

    if (fs.existsSync(srcFile)) {
      const content = fs.readFileSync(srcFile, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      let recordsCount = 0;
      try {
        const parsed = JSON.parse(content);
        recordsCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch (err) {
        console.warn(`[Aviso] Erro ao parsear contagem de ${col}.json:`, err.message);
      }

      fs.copyFileSync(srcFile, destFile);

      manifest.collections[col] = {
        file: `${col}.json`,
        recordsCount,
        sizeBytes: fs.statSync(destFile).size,
        sha256: hash
      };
      manifest.totalRecords += recordsCount;

      console.log(`  ✅ [${col.padEnd(14)}] Copiado: ${recordsCount} registros | Hash: ${hash.substring(0, 16)}...`);
    } else {
      console.warn(`  ⚠️ [${col.padEnd(14)}] Arquivo de origem não encontrado (${srcFile})`);
    }
  }

  const manifestPath = path.join(targetBackupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n================================================================`);
  console.log(`🎉 BACKUP CONCLUÍDO COM SUCESSO!`);
  console.log(`📊 Total de registros salvos: ${manifest.totalRecords}`);
  console.log(`📄 Manifesto salvo em: ${manifestPath}`);
  console.log(`================================================================\n`);

  return { targetBackupDir, manifest };
}

if (process.argv[1] && process.argv[1].endsWith('backup_jsondb.js')) {
  createBackup();
}
