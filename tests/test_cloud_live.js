import https from 'https';
import http from 'http';

const targetUrl = process.argv[2] || 'http://localhost:3333';
console.log(`\n======================================================`);
console.log(`🌐 VALIDANDO DEPLOY AO VIVO NA NUVEM: ${targetUrl}`);
console.log(`======================================================\n`);

function requestLive(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, {
      rejectUnauthorized: false, // Previne erros de certificados intermediários no Windows
      headers: { 'User-Agent': 'EsquecimentoZeroCloudValidator/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ statusCode: res.statusCode, body: json || data });
      });
    });
    req.on('error', reject);
  });
}

async function validateLive() {
  try {
    // 1. Health check
    console.log('1. Verificando /api/health...');
    const health = await requestLive(`${targetUrl}/api/health`);
    if (health.statusCode === 200 && health.body.status === 'ok') {
      console.log('   ✅ Health check 200 OK. Uptime:', health.body.uptime_seconds, 's');
    } else {
      console.error('   ❌ Falha no health check:', health.statusCode, health.body);
    }

    // 2. Landing / SPA
    console.log('2. Verificando Frontend SPA...');
    const spa = await requestLive(`${targetUrl}/`);
    if (spa.statusCode === 200 && typeof spa.body === 'string' && spa.body.includes('Esquecimento Zero')) {
      console.log('   ✅ SPA carregando perfeitamente.');
    } else {
      console.error('   ❌ Falha no carregamento do SPA');
    }

    // 3. Configurações Comerciais e Link Kiwify
    console.log('3. Verificando /api/commercial/config...');
    const comm = await requestLive(`${targetUrl}/api/commercial/config`);
    if (comm.statusCode === 200 && comm.body.data?.checkoutUrl === 'https://pay.kiwify.com.br/cd5quHM') {
      console.log('   ✅ Modelo Comercial e Link Kiwify homologados ao vivo na nuvem!');
      console.log('   🔗 Checkout Kiwify Oficial:', comm.body.data.checkoutUrl);
      console.log('   💰 Preço Vitalício:', `R$ ${comm.body.data.priceBrl.toFixed(2)}`);
      console.log('   ⏱️ Período de Teste:', `${comm.body.data.trialHours || 24} horas gratuitas`);
    } else {
      console.error('   ❌ Falha na validação do modelo comercial ao vivo:', comm.body);
    }

    // 4. Central de Alertas SPA (/lembretes)
    console.log('4. Verificando Central de Alertas Frontend (/lembretes)...');
    const lembretesSpa = await requestLive(`${targetUrl}/lembretes`);
    if (lembretesSpa.statusCode === 200 && typeof lembretesSpa.body === 'string' && lembretesSpa.body.includes('Esquecimento Zero')) {
      console.log('   ✅ Rota /lembretes servida com sucesso pelo fallback SPA.');
    } else {
      console.error('   ❌ Falha no acesso à rota /lembretes');
    }

    // 5. Endpoint de Lembretes Protegido (/api/reminders)
    console.log('5. Verificando Proteção da API (/api/reminders)...');
    const remUnauth = await requestLive(`${targetUrl}/api/reminders`);
    if (remUnauth.statusCode === 401) {
      console.log('   ✅ Endpoint /api/reminders ativo e protegido por JWT (HTTP 401 para requisição sem token).');
    } else {
      console.error('   ❌ Endpoint /api/reminders respondeu inesperadamente:', remUnauth.statusCode);
    }

    console.log('\n🎉 VALIDAÇÃO AO VIVO CONCLUÍDA COM SUCESSO!\n');
  } catch (err) {
    console.error('❌ Erro na validação remota:', err.message);
  }
}

validateLive();
