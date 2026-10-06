process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../server/server.js';
import { Users, Subscriptions, Items, Reminders } from '../server/database/db.js';
import { calculateCalendarDaysDiff, categorizeReminder } from '../server/utils/dateUtils.js';

const TEST_PORT = 3396;
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

function addDays(days, baseDate = new Date()) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function runRemindersCenterTests() {
  console.log('\n================================================================');
  console.log('🔔 SUÍTE DE TESTES DA CENTRAL DE ALERTAS E SINO - FASE 1');
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
    // 1. Utilitário de Datas (Cálculo Puro de Calendário UTC)
    console.log('📌 [1/7] Testando Utilitário de Datas (dateUtils.js):');
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = addDays(-1);
    const in5DaysStr = addDays(5);
    const in20DaysStr = addDays(20);

    assert(calculateCalendarDaysDiff(todayStr) === 0, 'Diferença para hoje é 0 dias');
    assert(calculateCalendarDaysDiff(yesterdayStr) === -1, 'Diferença para ontem é -1 dias (vencido)');
    assert(calculateCalendarDaysDiff(in5DaysStr) === 5, 'Diferença para 5 dias é +5');

    const catToday = categorizeReminder(todayStr);
    assert(catToday.group === 'today' && catToday.isToday === true, 'Categorização para hoje correta');

    const catOverdue = categorizeReminder(yesterdayStr);
    assert(catOverdue.group === 'overdue' && catOverdue.daysOverdue === 1, 'Categorização para vencido correta');

    const catNext7 = categorizeReminder(in5DaysStr);
    assert(catNext7.group === 'next7Days' && catNext7.isUrgent === true, 'Categorização para próximos 7 dias correta');

    const catNext30 = categorizeReminder(in20DaysStr);
    assert(catNext30.group === 'next30Days' && catNext30.isUrgent === false, 'Categorização para próximos 30 dias correta');

    // 2. Autenticação e Proteção da Rota /api/reminders
    console.log('\n📌 [2/7] Testando Segurança e Autenticação (GET /api/reminders):');
    const unauthRes = await makeRequest('GET', '/api/reminders');
    assert(unauthRes.statusCode === 401, 'Acesso sem token JWT rejeitado com HTTP 401');

    // 3. Cadastro do Usuário A e Estado Alerta Zero
    console.log('\n📌 [3/7] Testando Estado Alerta Zero (Usuário sem itens):');
    const userAEmail = `usuario_a_${Date.now()}@teste.com`;
    const regResA = await makeRequest('POST', '/api/auth/register', {
      name: 'Usuário Alertas A',
      email: userAEmail,
      password: 'senhaSegura123',
      termsAccepted: true
    });
    assert(regResA.statusCode === 201, 'Usuário A cadastrado com sucesso');
    const tokenA = regResA.body.data.token;

    const zeroRes = await makeRequest('GET', '/api/reminders', null, {
      Authorization: `Bearer ${tokenA}`
    });
    assert(zeroRes.statusCode === 200, 'GET /api/reminders responde HTTP 200');
    assert(zeroRes.body.summary.total === 0, 'Total de alertas do Usuário A inicia zerado');
    assert(zeroRes.body.summary.attentionCount === 0, 'Contagem do sino inicia em 0');
    assert(zeroRes.body.groups.overdue.length === 0, 'Grupo overdue vazio');
    assert(zeroRes.body.groups.today.length === 0, 'Grupo today vazio');
    assert(zeroRes.body.groups.next7Days.length === 0, 'Grupo next7Days vazio');
    assert(zeroRes.body.groups.next30Days.length === 0, 'Grupo next30Days vazio');

    // 4. Criação de Itens com Prazos e Categorização Completa
    console.log('\n📌 [4/7] Testando Categorização dos 4 Grupos de Severidade:');

    // Item 1: Vencido ontem (-1 dia)
    const itemOverdue = await makeRequest('POST', '/api/items', {
      title: 'Remédio Gotas Vencido',
      expirationDate: addDays(-1),
      notes: 'Item vencido para teste'
    }, { Authorization: `Bearer ${tokenA}` });
    assert(itemOverdue.statusCode === 201, 'Item vencido cadastrado');

    // Item 2: Vence Hoje (0 dias)
    const itemToday = await makeRequest('POST', '/api/items', {
      title: 'Seguro Residencial',
      warrantyEndDate: todayStr,
      notes: 'Vence hoje'
    }, { Authorization: `Bearer ${tokenA}` });
    assert(itemToday.statusCode === 201, 'Item vencendo hoje cadastrado');

    // Item 3: Próximos 7 dias (vence em 5 dias)
    const itemNext7 = await makeRequest('POST', '/api/items', {
      title: 'Garantia Celular Novo',
      warrantyEndDate: addDays(5),
      store: 'Loja Tech'
    }, { Authorization: `Bearer ${tokenA}` });
    assert(itemNext7.statusCode === 201, 'Item com garantia em 5 dias cadastrado');

    // Item 4: Próximos 30 dias (vence em 18 dias)
    const itemNext30 = await makeRequest('POST', '/api/items', {
      title: 'Revisão do Veículo',
      expirationDate: addDays(18),
      notes: 'Troca de correia'
    }, { Authorization: `Bearer ${tokenA}` });
    assert(itemNext30.statusCode === 201, 'Item com vencimento em 18 dias cadastrado');

    // Item 5: Fora da janela da central (> 30 dias, ex: 45 dias)
    const itemFar = await makeRequest('POST', '/api/items', {
      title: 'Garantia Geladeira 2 Anos',
      warrantyEndDate: addDays(45)
    }, { Authorization: `Bearer ${tokenA}` });
    assert(itemFar.statusCode === 201, 'Item com garantia para 45 dias cadastrado');

    // 5. Validação da Central e da Lógica do Sino
    console.log('\n📌 [5/7] Testando Contagem do Sino e Estrutura dos Grupos:');
    const alertsRes = await makeRequest('GET', '/api/reminders', null, {
      Authorization: `Bearer ${tokenA}`
    });
    assert(alertsRes.statusCode === 200, 'Central de alertas respondeu com sucesso');
    const summary = alertsRes.body.summary;
    const groups = alertsRes.body.groups;

    assert(summary.overdue === 1, 'Grupo overdue possui exatamente 1 alerta');
    assert(summary.today === 1, 'Grupo today possui exatamente 1 alerta');
    assert(summary.next7Days === 1, 'Grupo next7Days possui exatamente 1 alerta');
    assert(summary.next30Days === 1, 'Grupo next30Days possui exatamente 1 alerta');

    // REGRA DE OURO: Sino conta overdue + today + next7Days = 1 + 1 + 1 = 3 (NÃO conta os de 18 dias)
    assert(summary.attentionCount === 3, 'Contagem do sino é exatamente 3 (overdue + today + next7Days)');
    assert(summary.total === 4, 'Total exibido na Central é 4 (dentro da janela de até 30 dias)');

    assert(groups.overdue[0].title === 'Remédio Gotas Vencido', 'Item vencido identificado corretamente');
    assert(groups.today[0].title === 'Seguro Residencial', 'Item de hoje identificado corretamente');
    assert(groups.next7Days[0].title === 'Garantia Celular Novo', 'Item dos próx. 7 dias identificado corretamente');
    assert(groups.next30Days[0].title === 'Revisão do Veículo', 'Item dos próx. 30 dias identificado corretamente');

    // 6. Testando Isolamento Multi-tenant Estrito
    console.log('\n📌 [6/7] Testando Isolamento Multi-tenant (Usuário B não vê Usuário A):');
    const userBEmail = `usuario_b_${Date.now()}@teste.com`;
    const regResB = await makeRequest('POST', '/api/auth/register', {
      name: 'Usuário Alertas B',
      email: userBEmail,
      password: 'senhaSegura123',
      termsAccepted: true
    });
    const tokenB = regResB.body.data.token;

    const alertsResB = await makeRequest('GET', '/api/reminders', null, {
      Authorization: `Bearer ${tokenB}`
    });
    assert(alertsResB.body.summary.total === 0, 'Usuário B possui 0 alertas');
    assert(alertsResB.body.summary.attentionCount === 0, 'Sino do Usuário B é 0');
    assert(alertsResB.body.reminders.length === 0, 'Nenhum lembrete do Usuário A vazou para o Usuário B');

    // 7. Exclusão em Cascata e Atualização de Lembretes
    console.log('\n📌 [7/7] Testando Atualização após Exclusão de Item:');
    const deleteRes = await makeRequest('DELETE', `/api/items/${itemToday.body.data.id}`, null, {
      Authorization: `Bearer ${tokenA}`
    });
    assert(deleteRes.statusCode === 200, 'Item do dia de hoje excluído com sucesso');

    const updatedRes = await makeRequest('GET', '/api/reminders', null, {
      Authorization: `Bearer ${tokenA}`
    });
    assert(updatedRes.body.summary.today === 0, 'Grupo today zerou após exclusão');
    assert(updatedRes.body.summary.attentionCount === 2, 'Contagem do sino decrementou para 2 (1 overdue + 1 next7Days)');
    assert(updatedRes.body.summary.total === 3, 'Total da Central reduziu para 3');

  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
  }

  console.log(`\n================================================================`);
  console.log(`🎉 TODOS OS ${passedTests}/${totalTests} TESTES DA CENTRAL DE ALERTAS FORAM APROVADOS!`);
  console.log(`================================================================\n`);
}

runRemindersCenterTests().catch((err) => {
  console.error('\n❌ ERRO NA EXECUÇÃO DOS TESTES DA CENTRAL DE ALERTAS:', err);
  process.exit(1);
});
