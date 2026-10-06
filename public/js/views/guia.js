import { authStorage } from '../api.js';

export function renderGuia() {
  const isAuth = authStorage.isAuthenticated();

  return `
    <div class="view-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- 1. Hero / Cabeçalho do Guia -->
      <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10 space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
            <span class="text-base">🧠</span> Guia Oficial do Usuário
          </div>
          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Como usar o Esquecimento Zero no dia a dia
          </h1>
          <p class="text-sm sm:text-base text-slate-300 font-medium max-w-2xl leading-relaxed">
            Seu guia rápido para organizar informações importantes e não depender apenas da memória.
          </p>
          <div class="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="p-3.5 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-xs sm:text-sm text-slate-200 font-semibold">
              ✨ <em>"Cadastre uma vez e deixe o Esquecimento Zero ajudar você."</em>
            </div>
            <a href="${isAuth ? '/adicionar' : '/cadastro'}" class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-transform hover:scale-105 whitespace-nowrap">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>${isAuth ? 'Cadastrar Item Agora' : 'Começar Gratuitamente'}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Sumário dos 15 Passos -->
      <div class="space-y-6">

        <!-- Passo 1 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">
              🚀
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Passo 1</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Primeiro Passo — Crie sua Conta</h2>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ao entrar no Esquecimento Zero:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium text-slate-700">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
              <span>Faça seu cadastro com e-mail seguro.</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold">2</span>
              <span>Entre na sua conta autenticada.</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <span>Conheça o painel principal (Dashboard).</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[11px] font-bold">4</span>
              <span>Comece cadastrando algo importante para você.</span>
            </div>
          </div>
          <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <span class="text-base flex-shrink-0">💡</span>
            <div>
              <strong>Dica valiosa:</strong> Não tente cadastrar tudo de uma vez. Comece por uma informação ou compra recente que você costuma esquecer.
            </div>
          </div>
        </div>

        <!-- Passo 2 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
              📦
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">Passo 2</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Cadastre um Produto</h2>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Comprou alguma coisa? <strong>Cadastre imediatamente.</strong> Pode ser qualquer produto importante do seu cotidiano:
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-700">
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">📱 Celular</div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">💻 Computador</div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">📺 Televisão</div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">🧊 Geladeira</div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">🧺 Máquina de lavar</div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">🎮 Videogame</div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">🛋️ Móveis</div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">🔧 Ferramentas</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <p class="font-bold text-slate-900">Como fazer na prática?</p>
            <p>Acesse o menu <strong>Adicionar item</strong>, preencha nome, data da compra, categoria, garantia e observações. Clique em <strong>Salvar</strong>. Pronto! A informação agora está segura na nuvem.</p>
          </div>
        </div>

        <!-- Passo 3 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg">
              🧾
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-purple-600">Passo 3</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Guarde a Nota Fiscal e Documentos</h2>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tem uma nota fiscal? Um documento eletrônico DANFE em PDF? Uma foto do cupom fiscal? Guarde no sistema!
          </p>
          <div class="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs sm:text-sm text-purple-900 italic">
            "Onde foi que eu guardei essa nota fiscal?" — Você nunca mais precisará fazer essa pergunta revirando gavetas ou caixas de e-mail antigas.
          </div>
        </div>

        <!-- Passo 4 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
              🛡️
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Passo 4</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Acompanhe a Garantia</h2>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Essa é uma das funções mais valiosas do sistema. Ao comprar uma TV com garantia de 12 meses, você cadastra o produto e a data da compra. O Esquecimento Zero calcula a data exata de encerramento da cobertura.
          </p>
          <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
            <strong>⚠️ Evite prejuízos:</strong> A maioria das pessoas só descobre um defeito ou procura assistência <em>dias depois que o prazo de garantia acabou</em>. Com o Esquecimento Zero, você se antecipa e aciona o fabricante em tempo hábil.
          </div>
        </div>

        <!-- Passo 5 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg">
              ⏰
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-amber-600">Passo 5</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Use os Lembretes</h2>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Não confie apenas na memória biológica para datas futuras. Cadastre lembretes preventivos para:
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-700 font-medium">
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">📅 Renovação de CNH / RG</div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">🛡️ Fim da garantia legal</div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">💳 Vencimento de contratos</div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">🚗 Revisão veicular</div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">🏠 Manutenção do imóvel</div>
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100">📦 Devolução no prazo (CDC)</div>
          </div>
          <p class="text-xs text-slate-500 font-semibold">A lógica é simples: <strong>você registra agora para não se estressar depois.</strong></p>
        </div>

        <!-- Passo 6: Organizar a Casa -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-lg">
              🏠
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-teal-600">Passo 6</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Use para Organizar sua Casa (Inventário)</h2>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            O Esquecimento Zero funciona como seu inventário pessoal estruturado por cômodos:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p class="font-bold text-slate-900 flex items-center gap-1.5">🛋️ Sala</p>
              <p class="text-slate-500">Smart TV, console de videogame, home theater, ar-condicionado.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p class="font-bold text-slate-900 flex items-center gap-1.5">🧊 Cozinha</p>
              <p class="text-slate-500">Geladeira, micro-ondas, lava-louças, cafeteira, airfryer.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p class="font-bold text-slate-900 flex items-center gap-1.5">💻 Escritório</p>
              <p class="text-slate-500">Notebook, monitor, teclado, impressora, tablet.</p>
            </div>
          </div>
        </div>

        <!-- Passo 7 & 8: Família e Trabalho -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">👨‍👩‍👧</span>
              <h3 class="text-base font-bold text-slate-900">7. Use para a Família</h3>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Organize os itens das pessoas que você ama: material escolar eletrônico, notebook dos filhos, aparelhos médicos dos pais e documentos familiares centralizados.
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">💼</span>
              <h3 class="text-base font-bold text-slate-900">8. Use no Trabalho</h3>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Ideal para autônomos e pequenos negócios. Cadastre ferramentas de trabalho, maquinários e computadores da equipe sabendo exatamente custo, fornecedor e garantia ativa.
            </p>
          </div>
        </div>

        <!-- Passo 9, 10, 11, 12: Hábitos e Dashboard -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span class="text-base">🔧</span> 9. Não Espere Esquecer
              </h4>
              <p class="text-xs text-slate-600">Comprou? Cadastre. Recebeu nota? Suba o anexo. Não adie o registro para quando o problema surgir.</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span class="text-base">🔍</span> 10. Consulte Quando Precisar
              </h4>
              <p class="text-xs text-slate-600">Surgiu uma dúvida? Em vez de procurar recibos velhos, basta abrir o aplicativo e ver todos os dados em segundos.</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span class="text-base">📊</span> 11. Use o Dashboard
              </h4>
              <p class="text-xs text-slate-600">O painel inicial consolida em tempo real o que precisa da sua atenção imediata nos próximos 30 ou 60 dias.</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span class="text-base">📅</span> 12. Crie o Hábito
              </h4>
              <p class="text-xs text-slate-600">Reserve 1 minuto após qualquer compra importante. Esse hábito simples economiza tempo e dinheiro.</p>
            </div>
          </div>
        </div>

        <!-- Passo 13: A Regra de Ouro -->
        <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl p-6 sm:p-8 shadow-lg text-center space-y-2">
          <span class="px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 font-black text-xs uppercase tracking-wider">
            ⭐ 13. A Regra de Ouro do Esquecimento Zero
          </span>
          <h2 class="text-lg sm:text-2xl font-black text-slate-950 max-w-xl mx-auto pt-1 leading-snug">
            “Se eu sei que vou precisar lembrar disso depois, eu cadastro agora.”
          </h2>
        </div>

        <!-- Passo 14: Exemplo Completo da TV -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🎯</span>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Passo 14</span>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">Exemplo Prático Completo</h2>
            </div>
          </div>
          <div class="relative pl-6 border-l-2 border-brand-500 space-y-4 text-xs sm:text-sm text-slate-700">
            <div>
              <span class="font-bold text-slate-900 block">Hoje:</span>
              <span>Você compra uma TV e recebe a nota fiscal eletrônica. Em 30 segundos, cadastra o item no aplicativo.</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 block">Nos meses seguintes:</span>
              <span>Você consulta dados do aparelho ou comprovação fiscal quando precisar sem preocupações.</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 block">Próximo ao fim da garantia:</span>
              <span>O sistema sinaliza no painel com antecedência se a garantia está perto de expirar.</span>
            </div>
            <div>
              <span class="font-bold text-emerald-700 block">Resultado final:</span>
              <span>Tranquilidade absoluta. Você não depende de gavetas, papéis perdidos ou da sua memória.</span>
            </div>
          </div>
        </div>

        <!-- Passo 15: O Jeito Mais Fácil de Começar -->
        <div class="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-brand-400">Passo 15</span>
            <h2 class="text-xl sm:text-2xl font-black text-white mt-1">O Jeito Mais Fácil de Começar</h2>
            <p class="text-xs sm:text-sm text-slate-300 mt-1">Não tente organizar a vida inteira em um único dia. Comece com <strong>3 coisas</strong>:</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-200 font-semibold">
            <div class="p-4 rounded-xl bg-white/10 border border-white/10 flex items-center gap-3">
              <span class="text-xl">1️⃣</span>
              <span>Cadastre uma compra importante recente.</span>
            </div>
            <div class="p-4 rounded-xl bg-white/10 border border-white/10 flex items-center gap-3">
              <span class="text-xl">2️⃣</span>
              <span>Cadastre um prazo de garantia ativo.</span>
            </div>
            <div class="p-4 rounded-xl bg-white/10 border border-white/10 flex items-center gap-3">
              <span class="text-xl">3️⃣</span>
              <span>Crie um lembrete para algo que não pode esquecer.</span>
            </div>
          </div>
        </div>

        <!-- Dica Final & CTA -->
        <div class="bg-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <span class="text-2xl">💡</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-900">O Esquecimento Zero foi feito para simplificar sua vida</h3>
          <p class="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            O objetivo não é passar horas dentro do app, mas sim seguir o fluxo natural:<br/>
            <strong>registrar ➜ organizar ➜ lembrar ➜ consultar quando precisar.</strong>
          </p>
          <div class="pt-2 flex flex-wrap justify-center gap-3">
            <a href="${isAuth ? '/adicionar' : '/cadastro'}" class="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all">
              ${isAuth ? 'Cadastrar Meu Primeiro Item' : 'Criar Minha Conta Grátis'}
            </a>
            <a href="${isAuth ? '/dashboard' : '/login'}" class="px-5 py-3 bg-white hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 transition-all">
              ${isAuth ? 'Voltar ao Dashboard' : 'Já Tenho Conta (Entrar)'}
            </a>
          </div>
        </div>

      </div>

    </div>
  `;
}
