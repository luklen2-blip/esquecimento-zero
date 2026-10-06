process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../server/server.js';
import { runSeed } from '../server/database/seed.js';

const TEST_PORT = 3099;
let serverInstance = null;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isBuffer = Buffer.isBuffer(body);
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        ...(isBuffer ? {} : { 'Content-Type': 'application/json' }),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json || data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(isBuffer ? body : (typeof body === 'string' ? body : JSON.stringify(body)));
    }
    req.end();
  });
}

function makeMultipartUpload(filename, fileBuffer, mimeType, headers = {}) {
  const boundary = '----EZUploadBoundary' + Math.random().toString(36).substring(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
    'utf-8'
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const payload = Buffer.concat([head, fileBuffer, tail]);

  return makeRequest('POST', '/api/documents/upload', payload, {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': payload.length,
    ...headers
  });
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 INICIANDO SUÍTE DE TESTES DE INTEGRIDADE - ESQUECIMENTO ZERO');
  console.log('================================================================\n');

  // Garante dados semente prontos
  await runSeed(false);

  // Inicia servidor em porta de teste
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, '127.0.0.1', resolve);
  });

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${message}`);
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Falha no teste: ${message}`);
    }
  }

  try {
    // 1. Health Check
    console.log('📋 Testando Health Check & Monitoramento Cloud:');
    const health = await makeRequest('GET', '/api/health');
    assert(health.statusCode === 200, 'Endpoint /api/health respondeu HTTP 200');
    assert(health.body.status === 'ok', 'Status da aplicação reportado como "ok"');
    assert(health.body.app === 'Esquecimento Zero', 'Nome da aplicação validado');
    assert(typeof health.body.uptime_seconds === 'number', 'Uptime em segundos presente');
    assert(health.body.database === 'POSTGRESQL' || health.body.database === 'JSONDB FALLBACK', 'Diagnóstico de motor de banco presente');

    // 2. Resolução de Arquivos Estáticos e SPA Fallback
    console.log('\n🌐 Testando Resolução SPA e Arquivos Estáticos:');
    const indexRes = await makeRequest('GET', '/');
    assert(indexRes.statusCode === 200, 'Rota raiz / retorna HTTP 200');
    assert(typeof indexRes.body === 'string' && indexRes.body.includes('Esquecimento Zero'), 'SPA HTML carregado na raiz');

    const spaFallback = await makeRequest('GET', '/dashboard');
    assert(spaFallback.statusCode === 200, 'Fallback SPA responde HTTP 200 para rotas de cliente');
    assert(typeof spaFallback.body === 'string' && spaFallback.body.includes('Esquecimento Zero'), 'SPA HTML servido no fallback');

    // 3. Autenticação - Login do Usuário Demo
    console.log('\n🔑 Testando Autenticação e Login Demo:');
    const demoLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'demo@esquecimentozero.com.br',
      password: 'demo123'
    });
    assert(demoLogin.statusCode === 200, 'Login do usuário demo efetuado com sucesso (HTTP 200)');
    assert(demoLogin.body.data.token, 'Token JWT emitido para usuário demo');
    assert(demoLogin.body.data.subscription.plan === 'free', 'Assinatura do plano gratuito atribuída');
    const demoToken = demoLogin.body.data.token;

    // 4. Perfil e Validação de Sessão
    console.log('\n👤 Testando Rota Protegida /api/auth/me:');
    const unauthMe = await makeRequest('GET', '/api/auth/me');
    assert(unauthMe.statusCode === 401, 'Acesso sem token bloqueado com HTTP 401');

    const authMe = await makeRequest('GET', '/api/auth/me', null, { Authorization: `Bearer ${demoToken}` });
    assert(authMe.statusCode === 200, 'Acesso autenticado ao perfil permitido com HTTP 200');
    assert(authMe.body.data.user.email === 'demo@esquecimentozero.com.br', 'Dados corretos retornados no perfil');
    assert(authMe.body.data.usage.itemsLimit === 10, 'Limite de 10 itens do plano gratuito validado');

    // 5. Dashboard e Estatísticas
    console.log('\n📊 Testando Métricas do Dashboard:');
    const dashStats = await makeRequest('GET', '/api/dashboard/stats', null, { Authorization: `Bearer ${demoToken}` });
    assert(dashStats.statusCode === 200, 'Estatísticas do dashboard retornadas com HTTP 200');
    assert(dashStats.body.data.metrics.totalItems > 0, 'Total de itens cadastrados contabilizado');
    assert(Array.isArray(dashStats.body.data.warrantiesEnding), 'Lista de garantias a vencer presente');
    assert(Array.isArray(dashStats.body.data.expirationsNear), 'Lista de validades próximas presente');

    // 6. Cadastro de Novo Usuário e Isolamento Estrito
    console.log('\n🛡️ Testando Cadastro e Isolamento de Dados Multi-tenant:');
    const randomUserEmail = `teste_${Date.now()}@esquecimentozero.com.br`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Novo Usuário Teste',
      email: randomUserEmail,
      password: 'senhaSegura123',
      termsAccepted: true
    });
    assert(regRes.statusCode === 201, 'Novo usuário cadastrado com sucesso (HTTP 201)');
    assert(regRes.body.data.token, 'Token JWT gerado para novo usuário');
    const newUserToken = regRes.body.data.token;

    // Verifica isolamento: o novo usuário DEVE ter 0 itens e NUNCA ver os itens do demoUser
    const newUserDash = await makeRequest('GET', '/api/dashboard/stats', null, { Authorization: `Bearer ${newUserToken}` });
    assert(newUserDash.statusCode === 200, 'Dashboard do novo usuário carregado com sucesso');
    assert(newUserDash.body.data.metrics.totalItems === 0, 'Isolamento estrito confirmado: novo usuário possui 0 itens');
    assert(newUserDash.body.data.warrantiesEnding.length === 0, 'Isolamento estrito: nenhum item do usuário demo vazou');

    // 7. Upload de Documento (Foto/Nota Fiscal)
    console.log('\n📎 Testando Upload de Documentos (/api/documents/upload):');
    const fakePdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const uploadRes = await makeMultipartUpload('NotaFiscal_Teste.pdf', fakePdf, 'application/pdf', {
      Authorization: `Bearer ${newUserToken}`
    });
    assert(uploadRes.statusCode === 201, 'Upload de documento realizado com sucesso (HTTP 201)');
    assert(uploadRes.body.data.fileName === 'NotaFiscal_Teste.pdf', 'Nome original do arquivo preservado');
    assert(uploadRes.body.data.status === 'pending', 'Status inicial do documento como pending');
    const uploadedDocId = uploadRes.body.data.id;

    // 8. Processamento Inteligente por IA / OCR do Documento
    console.log('\n🤖 Testando Processamento Inteligente por IA (/api/documents/:id/process):');
    const aiProcessRes = await makeRequest('POST', `/api/documents/${uploadedDocId}/process`, null, {
      Authorization: `Bearer ${newUserToken}`
    });
    assert(aiProcessRes.statusCode === 200, 'Processamento por IA respondeu HTTP 200');
    assert(aiProcessRes.body.data.extracted, 'Dados estruturados extraídos pela IA presentes');
    assert(typeof aiProcessRes.body.data.extracted.title === 'string', 'Nome do produto identificado pela IA');
    assert(typeof aiProcessRes.body.data.extracted.price === 'number', 'Valor monetário identificado pela IA');
    assert(typeof aiProcessRes.body.data.extracted.warrantyEndDate === 'string', 'Data final de garantia calculada pela IA');
    assert(aiProcessRes.body.data.confidence >= 0.8, 'Confiança da extração acima de 80%');

    // 9. Listagem de Documentos com Isolamento
    console.log('\n📂 Testando Listagem de Documentos (/api/documents):');
    const docsList = await makeRequest('GET', '/api/documents', null, { Authorization: `Bearer ${newUserToken}` });
    assert(docsList.statusCode === 200, 'Listagem de documentos respondeu HTTP 200');
    assert(docsList.body.data.length === 1, 'Novo usuário visualiza apenas seu próprio documento');
    assert(docsList.body.data[0].id === uploadedDocId, 'ID do documento listado confere com o upload');

    // 9. Cadastro de Item Vinculado ao Documento
    console.log('\n📦 Testando Cadastro de Item e Lembrete (/api/items):');
    const createItemRes = await makeRequest('POST', '/api/items', {
      title: 'Micro-ondas 30L Inox',
      categoryId: 'cat_eletrodomesticos',
      store: 'Casas Bahia',
      purchaseDate: '2026-09-15',
      price: 650.00,
      quantity: 1,
      invoiceNumber: 'NF-88219',
      warrantyEndDate: '2027-09-15',
      notes: 'Garantia de 12 meses direto com o fabricante',
      documentId: uploadedDocId
    }, { Authorization: `Bearer ${newUserToken}` });

    assert(createItemRes.statusCode === 201, 'Item cadastrado com sucesso (HTTP 201)');
    assert(createItemRes.body.data.documentId === uploadedDocId, 'Item vinculado ao documento com sucesso');
    const createdItemId = createItemRes.body.data.id;

    // 10. Verificação do Item no Dashboard e Lista
    console.log('\n📊 Testando Atualização de Métricas após Cadastro:');
    const updatedDash = await makeRequest('GET', '/api/dashboard/stats', null, { Authorization: `Bearer ${newUserToken}` });
    assert(updatedDash.body.data.metrics.totalItems === 1, 'Total de itens do usuário incrementado para 1');
    assert(updatedDash.body.data.metrics.remainingQuota === 9, 'Cota restante reduzida corretamente (9 de 10)');

    // 11. Exclusão de Item
    console.log('\n🗑️ Testando Remoção de Item (/api/items/:id):');
    const delRes = await makeRequest('DELETE', `/api/items/${createdItemId}`, null, {
      Authorization: `Bearer ${newUserToken}`
    });
    assert(delRes.statusCode === 200, 'Item excluído com sucesso (HTTP 200)');

    const afterDelDash = await makeRequest('GET', '/api/dashboard/stats', null, { Authorization: `Bearer ${newUserToken}` });
    assert(afterDelDash.body.data.metrics.totalItems === 0, 'Total de itens retornou a 0 após exclusão');

    // 12. Categorias
    console.log('\n🏷️ Testando Categorias do Sistema:');
    const catRes = await makeRequest('GET', '/api/categories', null, { Authorization: `Bearer ${demoToken}` });
    assert(catRes.statusCode === 200, 'Categorias listadas com HTTP 200');
    assert(catRes.body.data.length >= 5, 'Categorias padrão do sistema presentes');

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES PASSARAM COM 100% DE SUCESSO!`);
    console.log('================================================================\n');

  } finally {
    if (serverInstance) {
      await new Promise(resolve => serverInstance.close(resolve));
    }
  }
}

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES:', err.message);
    process.exit(1);
  });
