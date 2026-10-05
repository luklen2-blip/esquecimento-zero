import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const desktopCandidates = [
  path.join('C:', 'Users', 'luciano', 'Desktop'),
  path.join(process.env.USERPROFILE || 'C:\\Users\\luciano', 'OneDrive', 'Desktop')
];

console.log('📦 Gerando pacote ultraleve de produção para deploy em nuvem (Render/Railway/GitHub)...');
console.log('Origem do projeto:', projectRoot);

const tempDist = path.join(projectRoot, '.deploy_staging');
if (fs.existsSync(tempDist)) {
  fs.rmSync(tempDist, { recursive: true, force: true });
}
fs.mkdirSync(tempDist, { recursive: true });

const IGNORED = [
  'node_modules',
  '.git',
  '.deploy_staging',
  'scratch',
  'cloudflared.exe',
  'ca-bundle.crt',
  'tunnel_url.txt',
  '.system_generated'
];

function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED.includes(entry.name) || entry.name.endsWith('.log') || entry.name.endsWith('.tmp')) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(projectRoot, tempDist);

desktopCandidates.forEach(desk => {
  if (fs.existsSync(desk)) {
    const zipOut = path.join(desk, 'esquecimento-zero-deploy.zip');
    try {
      if (fs.existsSync(zipOut)) {
        fs.unlinkSync(zipOut);
      }
      const psCommand = `powershell -Command "Compress-Archive -Path '${tempDist}\\*' -DestinationPath '${zipOut}' -Force"`;
      execSync(psCommand, { stdio: 'pipe' });
      const sizeKb = (fs.statSync(zipOut).size / 1024).toFixed(1);
      console.log(`✅ Pacote .zip gerado com sucesso em: ${zipOut} (${sizeKb} KB - ultraleve)`);
    } catch (err) {
      console.error(`Erro ao gerar zip em ${desk}:`, err.message);
    }
  }
});

if (fs.existsSync(tempDist)) {
  fs.rmSync(tempDist, { recursive: true, force: true });
}
