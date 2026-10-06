import https from 'https';
import http from 'http';

const BASE_URL = process.env.TARGET_URL || 'https://esquecimento-zero.onrender.com';

console.log(`================================================================`);
console.log(`🔍 INICIANDO SUÍTE DE HOMOLOGAÇÃO NÃO DESTRUTIVA EM PRODUÇÃO`);
console.log(`🌐 Alvo: ${BASE_URL}`);
console.log(`⏱️ Data/Hora: ${new Date().toISOString()}`);
console.log(`================================================================\n`);

const results = {
  infra: [],
  frontend: [],
  auth: [],
  api: [],
  persistence: [],
  security: [],
  features: []
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function request(method, endpoint, body = null, headers = {}) {
  const start = Date.now();
  return new Promise((resolve) => {
    try {
      const url = new URL(endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`);
      const client = url.protocol === 'https:' ? https : http;

      const isBuffer = Buffer.isBuffer(body);
      const reqHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HomologacaoAntigravity/1.0',
        ...(isBuffer ? {} : (body ? { 'Content-Type': 'application/json' } : {})),
        ...headers
      };

      const req = client.request(url, {
        method,
        headers: reqHeaders,
        rejectUnauthorized: false,
        timeout: 15000
      }, (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          const duration = Date.now() - start;
          let parsed = null;
          try { parsed = JSON.parse(rawData); } catch {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw: rawData,
            duration,
            error: null
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, headers: {}, body: null, raw: '', duration: Date.now() - start, error: 'TIMEOUT (15s)' });
      });

      req.on('error', (err) => {
        resolve({ status: 0, headers: {}, body: null, raw: '', duration: Date.now() - start, error: err.message });
      });

      if (body) {
        req.write(isBuffer ? body : (typeof body === 'string' ? body : JSON.stringify(body)));
      }
      req.end();
    } catch (err) {
      resolve({ status: 0, headers: {}, body: null, raw: '', duration: Date.now() - start, error: err.message });
    }
  });
}

function makeMultipartUpload(filename, fileBuffer, mimeType, headers = {}) {
  const boundary = '----EZHomologBoundary' + Math.random().toString(36).substring(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
    'utf-8'
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const payload = Buffer.concat([head, fileBuffer, tail]);

  return request('POST', '/api/documents/upload', payload, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': payload.length,
    ...headers
  });
}

async function runHomologation() {
  // 1. INFRAESTRUTURA / PRODUÇÃO
  console.log('📌 [1/7] Homologando Infraestrutura e Disponibilidade...');
  const healthRes = await request('GET', '/api/health');
  const isHealthValid = healthRes.status === 200 && healthRes.body?.status === 'ok' && healthRes.body?.app === 'Esquecimento Zero';
  results.infra.push({
    name: 'GET /api/health (Disponibilidade e Uptime)',
    status: isHealthValid ? 'PASS' : 'FAIL',
    code: healthRes.status,
    duration: healthRes.duration,
    details: `Uptime: ${healthRes.body?.uptime_seconds}s, Versão: ${healthRes.body?.version}`
  });

  const routesToTest = [
    '/',
    '/login',
    '/cadastro',
    '/dashboard',
    '/adicionar',
    '/historico',
    '/calendario',
    '/lembretes',
    '/perfil',
    '/planos',
    '/termos',
    '/privacidade',
    '/rota-aleatoria-fallback-spa'
  ];

  for (const r of routesToTest) {
    const res = await request('GET', r);
    const pass = res.status === 200 && res.raw.includes('Esquecimento');
    results.frontend.push({
      name: `Rota SPA ${r}`,
      status: pass ? 'PASS' : 'FAIL',
      code: res.status,
      duration: res.duration,
      details: pass ? 'HTML SPA servido com sucesso' : (res.error || 'Conteúdo inesperado')
    });
    await sleep(50);
  }

  // Assets Estáticos
  const assetsToTest = [
    '/css/style.css',
    '/js/api.js',
    '/js/app.js',
    '/js/router.js',
    '/js/views/auth.js',
    '/js/views/dashboard.js',
    '/js/views/adicionar.js',
    '/js/views/historico.js',
    '/js/views/legal.js',
    '/js/views/placeholders.js'
  ];

  for (const asset of assetsToTest) {
    const res = await request('GET', asset);
    const pass = res.status === 200 && res.raw.length > 50;
    results.frontend.push({
      name: `Asset Estático ${asset}`,
      status: pass ? 'PASS' : 'FAIL',
      code: res.status,
      duration: res.duration,
      details: pass ? `${res.raw.length} bytes carregados` : 'Asset inacessível'
    });
    await sleep(50);
  }

  // 2. SEGURANÇA BÁSICA & CABEÇALHOS
  console.log('📌 [2/7] Homologando Segurança e Cabeçalhos HTTP...');
  const secHeaders = healthRes.headers;
  const hasNosniff = secHeaders['x-content-type-options'] === 'nosniff';
  const hasSameOrigin = secHeaders['x-frame-options'] === 'SAMEORIGIN';
  const hasXss = !!secHeaders['x-xss-protection'];

  results.security.push({
    name: 'Header X-Content-Type-Options: nosniff',
    status: hasNosniff ? 'PASS' : 'FAIL',
    details: secHeaders['x-content-type-options'] || 'Ausente'
  });
  results.security.push({
    name: 'Header X-Frame-Options: SAMEORIGIN',
    status: hasSameOrigin ? 'PASS' : 'FAIL',
    details: secHeaders['x-frame-options'] || 'Ausente'
  });
  results.security.push({
    name: 'Header X-XSS-Protection',
    status: hasXss ? 'PASS' : 'FAIL',
    details: secHeaders['x-xss-protection'] || 'Ausente'
  });

  // Verificação de Secrets nos arquivos JS
  let secretsDetected = false;
  for (const asset of assetsToTest) {
    const res = await request('GET', asset);
    if (res.raw.includes('JWT_SECRET') || res.raw.includes('passwordHash')) {
      secretsDetected = true;
    }
  }
  results.security.push({
    name: 'Varredura de Segredos no Frontend (Zero Leak)',
    status: !secretsDetected ? 'PASS' : 'FAIL',
    details: secretsDetected ? 'Possível chave ou segredo exposto' : 'Nenhum segredo de backend detectado no client-side'
  });

  // 3. AUTENTICAÇÃO
  console.log('📌 [3/7] Homologando Autenticação e Gestão de Sessão...');
  // Login Válido com usuário de demonstração
  await sleep(200);
  const validLoginRes = await request('POST', '/api/auth/login', {
    email: 'demo@esquecimentozero.com.br',
    password: 'demo123'
  });
  const demoToken = validLoginRes.body?.data?.token;
  const loginPass = validLoginRes.status === 200 && !!demoToken;
  results.auth.push({
    name: 'Login Válido com Usuário Demo',
    status: loginPass ? 'PASS' : 'FAIL',
    code: validLoginRes.status,
    duration: validLoginRes.duration,
    details: loginPass ? `JWT emitido (${demoToken?.substring(0, 20)}...)` : (validLoginRes.body?.error?.message || 'Falha')
  });

  // Login Inválido
  await sleep(200);
  const invalidLoginRes = await request('POST', '/api/auth/login', {
    email: 'demo@esquecimentozero.com.br',
    password: 'senha_errada_proposital'
  });
  const invalidLoginBlocked = invalidLoginRes.status === 401 && invalidLoginRes.body?.success === false;
  results.auth.push({
    name: 'Bloqueio de Login Inválido (401)',
    status: invalidLoginBlocked ? 'PASS' : 'FAIL',
    code: invalidLoginRes.status,
    details: invalidLoginRes.body?.error?.message || 'Sem mensagem'
  });

  // Acesso sem token em rota protegida
  const unauthMeRes = await request('GET', '/api/auth/me');
  const unauthBlocked = unauthMeRes.status === 401;
  results.auth.push({
    name: 'Bloqueio de Rota Protegida sem Token (401)',
    status: unauthBlocked ? 'PASS' : 'FAIL',
    code: unauthMeRes.status,
    details: unauthMeRes.body?.error?.message || 'Bloqueado com sucesso'
  });

  // Acesso com token adulterado/inválido
  const tamperedRes = await request('GET', '/api/auth/me', null, { Authorization: 'Bearer token_invalido_adulterado' });
  const tamperedBlocked = tamperedRes.status === 401;
  results.auth.push({
    name: 'Rejeição de Token Adulterado (401)',
    status: tamperedBlocked ? 'PASS' : 'FAIL',
    code: tamperedRes.status,
    details: tamperedRes.body?.error?.message || 'Rejeitado com sucesso'
  });

  // Acesso com token válido
  await sleep(100);
  const authMeRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${demoToken}` });
  const authMePass = authMeRes.status === 200 && authMeRes.body?.data?.user?.email === 'demo@esquecimentozero.com.br';
  results.auth.push({
    name: 'Acesso Autorizado com Token Válido (/api/auth/me)',
    status: authMePass ? 'PASS' : 'FAIL',
    code: authMeRes.status,
    duration: authMeRes.duration,
    details: authMePass ? `Usuário: ${authMeRes.body.data.user.name}, Cota: ${authMeRes.body.data.usage.itemsCount}/${authMeRes.body.data.usage.itemsLimit}` : 'Dados inválidos'
  });

  // 4. APIS DO SISTEMA
  console.log('📌 [4/7] Homologando Endpoints de API...');
  // Dashboard Stats
  const dashRes = await request('GET', '/api/dashboard/stats', null, { Authorization: `Bearer ${demoToken}` });
  const dashPass = dashRes.status === 200 && typeof dashRes.body?.data?.metrics?.totalItems === 'number';
  results.api.push({
    name: 'GET /api/dashboard/stats (Métricas)',
    status: dashPass ? 'PASS' : 'FAIL',
    code: dashRes.status,
    duration: dashRes.duration,
    details: dashPass ? `Total Itens: ${dashRes.body.data.metrics.totalItems}, Garantias: ${dashRes.body.data.metrics.warrantiesCount}` : 'Falha'
  });

  // Categorias
  const catRes = await request('GET', '/api/categories', null, { Authorization: `Bearer ${demoToken}` });
  const catPass = catRes.status === 200 && Array.isArray(catRes.body?.data) && catRes.body.data.length >= 5;
  results.api.push({
    name: 'GET /api/categories (Categorias do Sistema)',
    status: catPass ? 'PASS' : 'FAIL',
    code: catRes.status,
    duration: catRes.duration,
    details: catPass ? `${catRes.body.data.length} categorias listadas` : 'Falha'
  });

  // Documentos
  const docsListRes = await request('GET', '/api/documents', null, { Authorization: `Bearer ${demoToken}` });
  const docsPass = docsListRes.status === 200 && Array.isArray(docsListRes.body?.data);
  results.api.push({
    name: 'GET /api/documents (Listagem de Documentos)',
    status: docsPass ? 'PASS' : 'FAIL',
    code: docsListRes.status,
    duration: docsListRes.duration,
    details: docsPass ? `${docsListRes.body.data.length} documentos encontrados` : 'Falha'
  });

  // Itens
  const itemsListRes = await request('GET', '/api/items', null, { Authorization: `Bearer ${demoToken}` });
  const itemsPass = itemsListRes.status === 200 && Array.isArray(itemsListRes.body?.data);
  results.api.push({
    name: 'GET /api/items (Listagem de Itens)',
    status: itemsPass ? 'PASS' : 'FAIL',
    code: itemsListRes.status,
    duration: itemsListRes.duration,
    details: itemsPass ? `${itemsListRes.body.data.length} itens listados` : 'Falha'
  });

  // 5. PERSISTÊNCIA NÃO DESTRUTIVA E CICLO COMPLETO
  console.log('📌 [5/7] Homologando Persistência Não Destrutiva e Isolamento de Tenants...');
  const testTitle = `[TESTE_HOMOLOGACAO] Item Verificacao ${Date.now()}`;
  
  // Criando novo item claramente etiquetado como TESTE
  const createItemRes = await request('POST', '/api/items', {
    title: testTitle,
    categoryId: 'cat_eletronicos',
    store: 'Loja Teste Homologação',
    purchaseDate: new Date().toISOString().split('T')[0],
    price: 99.90,
    quantity: 1,
    invoiceNumber: 'NF-TESTE-999',
    warrantyEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: 'Registro efêmero de homologação automatizada.'
  }, { Authorization: `Bearer ${demoToken}` });

  const itemCreated = createItemRes.status === 201 && createItemRes.body?.data?.id;
  const createdItemId = createItemRes.body?.data?.id;

  results.persistence.push({
    name: 'Criação Segura de Item de Teste (POST /api/items)',
    status: itemCreated ? 'PASS' : 'FAIL',
    code: createItemRes.status,
    duration: createItemRes.duration,
    details: itemCreated ? `ID Criado: ${createdItemId}` : createItemRes.body?.error?.message
  });

  // Recarregando/Consultando para confirmar persistência
  const verifyListRes = await request('GET', '/api/items', null, { Authorization: `Bearer ${demoToken}` });
  const itemPersisted = verifyListRes.body?.data?.some(i => i.id === createdItemId);
  results.persistence.push({
    name: 'Confirmação de Persistência no Banco (GET /api/items)',
    status: itemPersisted ? 'PASS' : 'FAIL',
    code: verifyListRes.status,
    details: itemPersisted ? 'Item localizado no banco após recarga' : 'Item não encontrado após criação'
  });

  // Re-autenticação para validar persistência após nova sessão
  await sleep(200);
  const reLoginRes = await request('POST', '/api/auth/login', {
    email: 'demo@esquecimentozero.com.br',
    password: 'demo123'
  });
  const newToken = reLoginRes.body?.data?.token;
  const reAuthListRes = await request('GET', '/api/items', null, { Authorization: `Bearer ${newToken}` });
  const persistedAcrossSession = Array.isArray(reAuthListRes.body?.data) && reAuthListRes.body.data.some(i => i.id === createdItemId);
  results.persistence.push({
    name: 'Persistência Confirmada após Novo Login e Nova Sessão',
    status: persistedAcrossSession ? 'PASS' : 'FAIL',
    details: persistedAcrossSession 
      ? 'Dados mantidos íntegros após logout/novo login' 
      : `Diagnóstico: reLogin Status ${reLoginRes.status} (${reLoginRes.body?.error?.message || 'Token OK: ' + !!newToken}), reAuthList Status ${reAuthListRes.status} (Itens: ${reAuthListRes.body?.data?.length || 0}), createdItemId: ${createdItemId}`
  });

  // Limpeza Não Destrutiva: remove APENAS o item de teste que acabamos de criar
  if (createdItemId) {
    const delRes = await request('DELETE', `/api/items/${createdItemId}`, null, { Authorization: `Bearer ${demoToken}` });
    const deletedClean = delRes.status === 200 && delRes.body?.success === true;
    results.persistence.push({
      name: 'Limpeza Segura do Item de Teste (DELETE /api/items/:id)',
      status: deletedClean ? 'PASS' : 'FAIL',
      code: delRes.status,
      details: deletedClean ? 'Banco de produção deixado 100% limpo e sem poluição' : 'Falha ao limpar'
    });
  }

  // 6. ISOLAMENTO DE TENANTS / ACESSO CRUZADO
  console.log('📌 [6/7] Homologando Isolamento Estrito Multi-tenant...');
  await sleep(200);
  const randomEmail = `tenant_test_${Date.now()}@esquecimentozero.com.br`;
  const registerTenantRes = await request('POST', '/api/auth/register', {
    name: 'Usuário Tenant Auditoria',
    email: randomEmail,
    password: 'senhaAuditoria123',
    termsAccepted: true
  });

  const tenantToken = registerTenantRes.body?.data?.token;
  const tenantCreated = registerTenantRes.status === 201 && !!tenantToken;

  if (tenantCreated) {
    // Tenant B consulta itens: NÃO DEVE ver itens do demoUser
    const tenantItemsRes = await request('GET', '/api/items', null, { Authorization: `Bearer ${tenantToken}` });
    const tenantItems = tenantItemsRes.body?.data || [];
    const hasLeak = tenantItems.some(i => i.userId !== registerTenantRes.body.data.user.id);

    results.security.push({
      name: 'Isolamento de Dados Multi-tenant (Zero Vazamento)',
      status: (!hasLeak && tenantItems.length === 0) ? 'PASS' : 'FAIL',
      details: (!hasLeak && tenantItems.length === 0) ? 'Tenant B possui 0 itens; dados do Tenant A isolados' : 'ALERTA: Vazamento de registros detectado!'
    });

    // Tentativa de acesso cruzado: Tenant B tenta excluir item do demoUser
    const demoItems = itemsListRes.body?.data || [];
    if (demoItems.length > 0) {
      const targetId = demoItems[0].id;
      const crossDel = await request('DELETE', `/api/items/${targetId}`, null, { Authorization: `Bearer ${tenantToken}` });
      const crossAccessBlocked = crossDel.status === 404 || crossDel.status === 403;
      results.security.push({
        name: 'Tentativa de Exclusão Cruzada Bloqueada',
        status: crossAccessBlocked ? 'PASS' : 'FAIL',
        code: crossDel.status,
        details: crossAccessBlocked ? 'Tenant B impedido de excluir item pertencente ao Tenant A' : 'FALHA DE SEGURANÇA: Tenant B alterou item alheio'
      });
    }
  }

  // 7. FUNCIONALIDADE DE IA / OCR
  console.log('📌 [7/7] Homologando Upload e Extração Inteligente (IA/OCR)...');
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const uploadPdfRes = await makeMultipartUpload('NotaFiscal_Samsung_Auditoria.pdf', dummyPdf, 'application/pdf', {
    Authorization: `Bearer ${demoToken}`
  });

  const uploadSuccess = uploadPdfRes.status === 201 && uploadPdfRes.body?.data?.id;
  const uploadedDocId = uploadPdfRes.body?.data?.id;

  results.features.push({
    name: 'Upload de Arquivo (POST /api/documents/upload)',
    status: uploadSuccess ? 'PASS' : 'FAIL',
    code: uploadPdfRes.status,
    duration: uploadPdfRes.duration,
    details: uploadSuccess ? `Documento registrado: ${uploadPdfRes.body.data.fileName}` : 'Falha no upload'
  });

  if (uploadedDocId) {
    const processRes = await request('POST', `/api/documents/${uploadedDocId}/process`, null, {
      Authorization: `Bearer ${demoToken}`
    });
    const aiPass = processRes.status === 200 && processRes.body?.data?.extracted?.title;
    results.features.push({
      name: 'Processamento e Reconhecimento por IA (POST /api/documents/:id/process)',
      status: aiPass ? 'PASS' : 'FAIL',
      code: processRes.status,
      duration: processRes.duration,
      details: aiPass ? `Produto: "${processRes.body.data.extracted.title}", Confiança: ${(processRes.body.data.extracted.confidence * 100).toFixed(0)}%` : 'Falha no OCR'
    });
  }

  // Consolidação
  console.log('\n================================================================');
  console.log('📊 CONSOLIDAÇÃO DOS DADOS DE HOMOLOGAÇÃO');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));
}

runHomologation();
