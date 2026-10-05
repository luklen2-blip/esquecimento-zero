export function renderTerms() {
  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
        
        <div class="border-b border-slate-200 pb-5">
          <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Documento Legal</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Termos de Uso e Condições de Serviço</h1>
          <p class="text-xs text-slate-500 mt-1">Última atualização: Outubro de 2026 • Em conformidade com o Código Civil e Marco Civil da Internet</p>
        </div>

        <div class="prose prose-slate max-w-none text-sm text-slate-600 space-y-4 leading-relaxed">
          <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <strong>Aviso de Isenção e Escopo de Aplicação:</strong> O <em>Esquecimento Zero</em> é uma ferramenta tecnológica de apoio à organização pessoal de notas fiscais, garantias, lembretes e tarefas. O software não oferece, não constitui e não substitui diagnósticos, tratamentos médicos ou aconselhamento jurídico.
          </div>

          <h2 class="text-base font-bold text-slate-800">1. Aceite e Capacidade Civil</h2>
          <p>
            Ao se cadastrar no <strong>Esquecimento Zero</strong>, você declara ter no mínimo <strong>13 (treze) anos de idade</strong>. A contratação de planos pagos (quando ativos) é estritamente restrita a maiores de 18 anos ou menores devidamente assistidos ou representados por seus pais ou responsáveis legais, nos termos do Código Civil Brasileiro e do Estatuto da Criança e do Adolescente (ECA).
          </p>

          <h2 class="text-base font-bold text-slate-800">2. Estrutura de Planos e Uso</h2>
          <p>
            O serviço disponibiliza o <strong>Plano Gratuito</strong> limitado a até 10 (dez) itens cadastrados e funcionalidades essenciais. Planos superiores (Premium) poderão ser contratados sob assinatura com recursos adicionais de inteligência artificial e capacidade ilimitada.
          </p>

          <h2 class="text-base font-bold text-slate-800">3. Responsabilidade sobre os Dados</h2>
          <p>
            O usuário é o único responsável pela veracidade e exatidão das informações, fotos de notas fiscais e documentos enviados. O sistema utiliza automações e OCR como ferramentas de auxílio, cabendo ao usuário a conferência final dos prazos cadastrados.
          </p>

          <h2 class="text-base font-bold text-slate-800">4. Modificações e Encerramento</h2>
          <p>
            O usuário poderá encerrar sua conta a qualquer momento por meio do painel do usuário ou solicitando a exclusão definitiva através do nosso canal de suporte.
          </p>
        </div>

        <div class="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
          <a href="/dashboard" class="font-semibold text-brand-600 hover:underline">← Voltar ao Início</a>
          <a href="/privacidade" class="font-semibold text-slate-600 hover:text-brand-600">Ver Política de Privacidade →</a>
        </div>

      </div>
    </div>
  `;
}

export function renderPrivacy() {
  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
        
        <div class="border-b border-slate-200 pb-5">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">Privacidade & Dados Pessoais</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Política de Privacidade (LGPD)</h1>
          <p class="text-xs text-slate-500 mt-1">Conformidade integral com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
        </div>

        <div class="prose prose-slate max-w-none text-sm text-slate-600 space-y-4 leading-relaxed">
          <h2 class="text-base font-bold text-slate-800">1. Princípios e Coleta Mínima (Art. 6º LGPD)</h2>
          <p>
            O <strong>Esquecimento Zero</strong> coleta estritamente os dados necessários para o funcionamento do serviço: nome, e-mail, senha criptografada e os dados das compras e documentos que você optar por registrar voluntariamente. Não compartilhamos, não vendemos e não comercializamos dados pessoais com terceiros para fins publicitários.
          </p>

          <h2 class="text-base font-bold text-slate-800">2. Tratamento de Dados de Menores (Art. 14 LGPD)</h2>
          <p>
            O tratamento de dados pessoais de crianças e adolescentes é realizado em seu melhor interesse, para a finalidade exclusiva de organização pessoal e com indicação expressa de faixa etária (13+ anos).
          </p>

          <h2 class="text-base font-bold text-slate-800">3. Armazenamento Seguro e Criptografia</h2>
          <p>
            Todas as senhas são armazenadas com algoritmo scrypt e os dados transitam sob conexões seguras criptografadas (HTTPS / TLS). Cada usuário possui isolamento de seus registros em nível de banco de dados.
          </p>

          <h2 class="text-base font-bold text-slate-800">4. Seus Direitos como Titular (Art. 18 LGPD)</h2>
          <p>
            Você tem o direito de solicitar a qualquer momento: confirmação da existência de tratamento, acesso aos dados, correção de dados incompletos ou inexatos e a <strong>eliminação definitiva dos seus dados pessoais</strong>.
          </p>

          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <strong>Canal do Encarregado de Proteção de Dados (DPO):</strong><br>
            Para exercer seus direitos ou solicitar exclusão completa da sua conta, contate:
            <span class="font-mono text-brand-700 font-semibold">privacidade@esquecimentozero.com.br</span>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
          <a href="/dashboard" class="font-semibold text-brand-600 hover:underline">← Voltar ao Início</a>
          <a href="/termos" class="font-semibold text-slate-600 hover:text-brand-600">Ver Termos de Uso →</a>
        </div>

      </div>
    </div>
  `;
}
