process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../server/server.js';
import { Users, Subscriptions, Items, PaymentTransactions } from '../server/database/db.js';
import { COMMERCIAL_CONFIG } from '../server/config/commercial.js';
import { getAccessStatus } from '../server/utils/accessControl.js';
import { hashPassword } from '../server/utils/authUtils.js';

const TEST_PORT = 3399;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runCommercialTests() {
  console.log('\n================================================================');
  console.log('💎 SUÍTE DE TESTES DO MODELO COMERCIAL - ESQUECIMENTO ZERO');
  console.log('================================================================\n');

  let serverInstance = null;
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
    // 1. Configurações Comerciais Centrais
    console.log('📌 [1/7] Testando Configurações Comerciais Centrais:');
    assert(
      COMMERCIAL_CONFIG.LIFETIME_CHECKOUT_URL === 'https://pay.kiwify.com.br/YXjfu2x',
      'URL oficial de checkout Kiwify centralizada corretamente'
    );
    assert(COMMERCIAL_CONFIG.LIFETIME_PRICE_BRL === 19.90, 'Preço vitalício configurado como R$ 19,90');
    assert(COMMERCIAL_CONFIG.TRIAL_DAYS === 7, 'Período padrão de teste configurado como 7 dias');

    const configRes = await makeRequest('GET', '/api/commercial/config');
    assert(configRes.statusCode === 200, 'Endpoint público /api/commercial/config responde HTTP 200');
    assert(
      configRes.body.data.checkoutUrl === 'https://pay.kiwify.com.br/YXjfu2x',
      'URL Kiwify entregue aos clientes via API pública'
    );

    // 2. Cadastro e Ativação do Teste Gratuito de 7 Dias
    console.log('\n📌 [2/7] Testando Cadastro e Início do Teste Gratuito de 7 Dias:');
    const trialUserEmail = `comercial_${Date.now()}@teste.com`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Cliente em Teste',
      email: trialUserEmail,
      password: 'senhaSegura123',
      termsAccepted: true
    });
    assert(regRes.statusCode === 201, 'Cadastro efetuado com sucesso (HTTP 201)');
    assert(Boolean(regRes.body.data.token), 'Token JWT emitido no cadastro');
    const trialToken = regRes.body.data.token;
    const trialUserId = regRes.body.data.user.id;

    const meRes = await makeRequest('GET', '/api/auth/me', null, { Authorization: `Bearer ${trialToken}` });
    assert(meRes.statusCode === 200, 'GET /api/auth/me responde HTTP 200');
    assert(Boolean(meRes.body.data.access), 'Diagnóstico comercial de acesso presente');
    assert(meRes.body.data.access.hasAccess === true, 'Usuário possui acesso ativo no início do teste');
    assert(meRes.body.data.access.isTrial === true, 'Usuário identificado em período de teste');
    assert(meRes.body.data.access.isExpired === false, 'Teste reportado como não expirado');
    assert(meRes.body.data.access.daysRemaining === 7, 'Contador informa 7 dias restantes');
    assert(
      meRes.body.data.commercial.checkoutUrl === 'https://pay.kiwify.com.br/YXjfu2x',
      'Link Kiwify presente no perfil do usuário'
    );

    // Validação de cálculo das datas de teste
    const sub = await Subscriptions.findByUserId(trialUserId);
    const startMs = new Date(sub.trialStartedAt).getTime();
    const endMs = new Date(sub.trialEndsAt).getTime();
    const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
    assert(diffDays === 7, 'Diferença entre início e fim do teste é de exatamente 7 dias');

    // 3. Criação de Itens Permitida durante o Teste
    console.log('\n📌 [3/7] Testando Operações Permitidas durante o Teste Gratuito:');
    const itemRes = await makeRequest('POST', '/api/items', {
      title: 'Item Criado no Período de Teste',
      categoryId: 'cat_eletronicos',
      price: 150.00
    }, { Authorization: `Bearer ${trialToken}` });
    assert(itemRes.statusCode === 201, 'Criação de item permitida durante o teste (HTTP 201)');
    const createdItemId = itemRes.body.data.id;

    // 4. Bloqueio Suave após Expiração dos 7 Dias (Sem Excluir Dados)
    console.log('\n📌 [4/7] Testando Bloqueio Suave após Expiração do Teste:');
    // Simula expiração alterando trialEndsAt para o passado (8 dias atrás)
    const eightDaysAgo = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)).toISOString();
    await Subscriptions.updateByUserId(trialUserId, {
      trialEndsAt: eightDaysAgo
    });

    const expiredMeRes = await makeRequest('GET', '/api/auth/me', null, { Authorization: `Bearer ${trialToken}` });
    assert(expiredMeRes.body.data.access.hasAccess === false, 'Acesso revogado após expiração');
    assert(expiredMeRes.body.data.access.isExpired === true, 'Status marcado como expirado');
    assert(expiredMeRes.body.data.access.daysRemaining === 0, 'Dias restantes zerados');

    // Tentativa de criar item DEVE ser bloqueada com 403 TRIAL_EXPIRED
    const blockedItemRes = await makeRequest('POST', '/api/items', {
      title: 'Item Bloqueado após Expiração',
      categoryId: 'cat_eletronicos'
    }, { Authorization: `Bearer ${trialToken}` });
    assert(blockedItemRes.statusCode === 403, 'Criação de item bloqueada com HTTP 403 após expiração');
    assert(blockedItemRes.body.error.code === 'TRIAL_EXPIRED', 'Código de erro padronizado TRIAL_EXPIRED retornado');
    assert(
      blockedItemRes.body.error.checkoutUrl === 'https://pay.kiwify.com.br/YXjfu2x',
      'Link Kiwify oficial enviado na mensagem de bloqueio'
    );

    // 5. Preservação de Dados de Usuários Expirados (Modo Somente Leitura)
    console.log('\n📌 [5/7] Testando Preservação de Dados e Modo Leitura para Usuários Expirados:');
    const listRes = await makeRequest('GET', '/api/items', null, { Authorization: `Bearer ${trialToken}` });
    assert(listRes.statusCode === 200, 'Usuário expirado consegue consultar seus itens (HTTP 200)');
    assert(listRes.body.data.length >= 1, 'Itens cadastrados permanecem intactos sem exclusão');
    assert(listRes.body.data.some(i => i.id === createdItemId), 'Item original preservado no banco');

    const dashRes = await makeRequest('GET', '/api/dashboard/stats', null, { Authorization: `Bearer ${trialToken}` });
    assert(dashRes.statusCode === 200, 'Dashboard acessível para usuário expirado em modo leitura');
    assert(dashRes.body.data.access.isExpired === true, 'Dashboard sinaliza estado de expiração para UI');

    // 6. Ativação do Acesso Vitalício via Webhook Kiwify (Idempotência e Persistência)
    console.log('\n📌 [6/7] Testando Ativação do Vitalício via Webhook Kiwify e Idempotência:');
    const simulatedOrderId = `kiwify_order_${Date.now()}`;
    const webhookPayload = {
      order_id: simulatedOrderId,
      order_status: 'paid',
      order_amount: 1990,
      Customer: {
        email: trialUserEmail,
        name: 'Cliente em Teste'
      }
    };

    const webhookRes = await makeRequest('POST', '/api/webhooks/kiwify', webhookPayload);
    assert(webhookRes.statusCode === 200, 'Webhook Kiwify respondeu HTTP 200');
    assert(webhookRes.body.status === 'activated', 'Status de ativação reportado no webhook');

    // Valida status após ativação do vitalício
    const lifetimeMeRes = await makeRequest('GET', '/api/auth/me', null, { Authorization: `Bearer ${trialToken}` });
    assert(lifetimeMeRes.body.data.subscription.plan === 'lifetime', 'Plano atualizado para lifetime');
    assert(lifetimeMeRes.body.data.subscription.status === 'active', 'Status da assinatura como active');
    assert(lifetimeMeRes.body.data.access.hasAccess === true, 'hasAccess reestabelecido como true');
    assert(lifetimeMeRes.body.data.access.isLifetime === true, 'isLifetime confirmado');
    assert(lifetimeMeRes.body.data.access.isExpired === false, 'isExpired desativado');

    // Usuário agora consegue cadastrar novos itens normalmente
    const postLifetimeItem = await makeRequest('POST', '/api/items', {
      title: 'Item Cadastrado no Acesso Vitalício',
      categoryId: 'cat_eletronicos',
      price: 500.00
    }, { Authorization: `Bearer ${trialToken}` });
    assert(postLifetimeItem.statusCode === 201, 'Criação de novos itens liberada com Vitalício ativo');

    // Teste de Idempotência: reenviar o mesmo webhook com o mesmo order_id
    const duplicateWebhookRes = await makeRequest('POST', '/api/webhooks/kiwify', webhookPayload);
    assert(duplicateWebhookRes.statusCode === 200, 'Webhook duplicado responde HTTP 200');
    assert(
      duplicateWebhookRes.body.status === 'already_processed',
      'Idempotência confirmada: evento duplicado não reprocessa'
    );

    // 7. Segurança Anti-Fraude (Client-Side Payload Rejection)
    console.log('\n📌 [7/7] Testando Segurança Anti-Fraude e Validações Estritas:');
    const fraudUserEmail = `fraude_${Date.now()}@teste.com`;
    // Tentativa de injetar plano lifetime no cadastro
    const fraudRegRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Tentativa de Fraude',
      email: fraudUserEmail,
      password: 'senhaSegura123',
      termsAccepted: true,
      plan: 'lifetime',
      status: 'active'
    });
    assert(fraudRegRes.statusCode === 201, 'Cadastro de usuário efetuado');
    // O backend DEVE ignorar o plano injetado e aplicar apenas o teste gratuito
    const fraudSub = await Subscriptions.findByUserId(fraudRegRes.body.data.user.id);
    assert(fraudSub.plan === 'free', 'Injeção de plan=lifetime no payload de cadastro foi ignorada');
    assert(!fraudSub.lifetimeActivatedAt, 'lifetimeActivatedAt permaneceu nulo');

    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${passedTests}/${totalTests} TESTES COMERCIAIS PASSARAM COM SUCESSO!`);
    console.log('================================================================\n');

  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
  }
}

runCommercialTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha na execução da suíte comercial:', err);
    process.exit(1);
  });
