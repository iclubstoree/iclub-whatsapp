// ============================================================================
// MELHORIAS PONTUAIS - SEM ALTERAR ESTRUTURA EXISTENTE
// ============================================================================

// ADICIONAR ESTAS FUNÇÕES AO FINAL DO SEU painel.js ATUAL

// ============================================================================
// 1. TREINAMENTO AUTOMÁTICO DA IA
// ============================================================================

// Adicionar ao processamento da IA existente
function processarTreinamentoAutomaticoMelhorado(mensagem) {
  const msgLower = mensagem.toLowerCase();
  
  // Padrão: "adicione centro de custo X e quando falar Y adicione no centro de custo X"
  const padraoCompleto = /(?:adicione|crie)\s+(?:o\s+)?centro\s+de\s+custos?\s+([^e]+)\s+e\s+quando\s+(?:eu\s+)?falar\s+([^,]+?)(?:\s+ou\s+([^,]+?))?\s+adicione\s+no\s+centro\s+de\s+custos?\s+([^.]+)/gi;
  
  const match = padraoCompleto.exec(msgLower);
  if (match) {
    const categoria = match[1].trim();
    const palavra1 = match[2].trim();
    const palavra2 = match[3] ? match[3].trim() : null;
    
    // Criar categoria se não existe
    const categoriaCapitalizada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    if (!categorias.includes(categoriaCapitalizada)) {
      categorias.push(categoriaCapitalizada);
    }
    
    // Salvar aprendizado
    if (!aprendizadoAutomatico) {
      aprendizadoAutomatico = {};
    }
    
    aprendizadoAutomatico[palavra1] = {
      categoria: categoriaCapitalizada,
      confianca: 0.95,
      criadoEm: new Date().toISOString()
    };
    
    if (palavra2) {
      aprendizadoAutomatico[palavra2] = {
        categoria: categoriaCapitalizada,
        confianca: 0.95,
        criadoEm: new Date().toISOString()
      };
    }
    
    localStorage.setItem('aprendizadoAutomatico', JSON.stringify(aprendizadoAutomatico));
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    
    return {
      sucesso: true,
      resposta: `✅ Aprendi! Centro de custo "${categoriaCapitalizada}" criado e palavras "${palavra1}"${palavra2 ? ` e "${palavra2}"` : ''} associadas.`
    };
  }
  
  return { sucesso: false };
}

// ============================================================================
// 2. RECONHECIMENTO DE DIAS DA SEMANA
// ============================================================================

function calcularDiaSemanaMelhorado(diaSemana) {
  const hoje = new Date();
  const diasSemana = {
    'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3, 
    'quinta': 4, 'sexta': 5, 'sabado': 6
  };
  
  const diaAtual = hoje.getDay();
  const diaDesejado = diasSemana[diaSemana.toLowerCase()];
  
  if (diaDesejado === undefined) return null;
  
  let diasParaAdicionar = diaDesejado - diaAtual;
  
  // Se o dia já passou esta semana, pegar da próxima semana
  if (diasParaAdicionar < 0) {
    diasParaAdicionar += 7;
  }
  
  const dataCalculada = new Date(hoje);
  dataCalculada.setDate(hoje.getDate() + diasParaAdicionar);
  
  return dataCalculada.toISOString().split('T')[0];
}

// ============================================================================
// 3. PROCESSAMENTO DE VALORES MELHORADO
// ============================================================================

function processarValorMelhorado(valorTexto) {
  // Remover espaços e caracteres especiais
  let valor = valorTexto.replace(/[^\d.,]/g, '');
  
  // Diferentes formatos
  if (/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(valor)) {
    // Formato: 1.597,11
    valor = valor.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d{2}$/.test(valor)) {
    // Formato: 1597,11
    valor = valor.replace(',', '.');
  } else if (/^\d+$/.test(valor)) {
    // Formato: 1597
    valor = valor;
  }
  
  const valorNumerico = parseFloat(valor);
  
  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    return null;
  }
  
  return valorNumerico;
}

// ============================================================================
// 4. MÚLTIPLAS LOJAS INTELIGENTE
// ============================================================================

function processarMultiplasLojasMelhorado(mensagem) {
  const msgLower = mensagem.toLowerCase();
  
  // Padrão: "pra loja X valor Y e pra loja A valor B"
  const padraoLojas = /(?:pra|para)\s+loja\s+([^0-9]+?)(?:\s+([^e]+?))?(?:\s+e\s+|$)/gi;
  
  const transacoes = [];
  let match;
  
  while ((match = padraoLojas.exec(msgLower)) !== null) {
    const loja = match[1].trim();
    const conteudo = match[2] ? match[2].trim() : '';
    
    if (conteudo) {
      const transacoesLoja = extrairTransacoesPorLojaMelhorado(conteudo, loja);
      transacoes.push(...transacoesLoja);
    }
  }
  
  return transacoes;
}

function extrairTransacoesPorLojaMelhorado(conteudo, loja) {
  const transacoes = [];
  
  // Extrair padrões como "aluguel 100 marketing 200"
  const padraoValores = /([a-zA-ZÀ-ÿ\s]+?)\s+(\d+(?:[.,]\d+)?)/g;
  
  let match;
  while ((match = padraoValores.exec(conteudo)) !== null) {
    const descricao = match[1].trim();
    const valor = processarValorMelhorado(match[2]);
    
    if (valor) {
      const categoria = determinarCategoriaMelhorada(descricao);
      const lojaEncontrada = encontrarLojaCorretaMelhorada(loja);
      
      transacoes.push({
        loja: lojaEncontrada || loja,
        categoria: categoria || 'Outros',
        descricao: descricao,
        valor: valor,
        origem: 'multiplas_lojas'
      });
    }
  }
  
  return transacoes;
}

function encontrarLojaCorretaMelhorada(lojaNome) {
  const nomeNormalizado = lojaNome.toLowerCase();
  
  // Buscar loja exata
  for (const loja of lojas) {
    if (loja.toLowerCase().includes(nomeNormalizado) || 
        nomeNormalizado.includes(loja.toLowerCase())) {
      return loja;
    }
  }
  
  // Buscar por palavras-chave
  const mapeamento = {
    'centro': 'Centro',
    'shopping': 'Shopping', 
    'bairro': 'Bairro',
    'mix': 'Mix',
    'castanhal': 'Castanhal'
  };
  
  for (const [palavra, loja] of Object.entries(mapeamento)) {
    if (nomeNormalizado.includes(palavra)) {
      const lojaCompleta = lojas.find(l => l.toLowerCase().includes(loja.toLowerCase()));
      if (lojaCompleta) return lojaCompleta;
    }
  }
  
  return null;
}

function determinarCategoriaMelhorada(descricao) {
  const descLower = descricao.toLowerCase();
  
  // Verificar aprendizado automático
  if (aprendizadoAutomatico) {
    for (const [palavra, dados] of Object.entries(aprendizadoAutomatico)) {
      if (descLower.includes(palavra.toLowerCase())) {
        return dados.categoria;
      }
    }
  }
  
  // Padrões conhecidos
  const padroes = {
    'Marketing': ['trafego', 'propaganda', 'anuncio', 'marketing'],
    'Aluguel': ['aluguel', 'locacao'],
    'Energia': ['energia', 'luz'],
    'Internet': ['internet', 'wifi'],
    'Combustível': ['combustivel', 'gasolina'],
    'Material': ['material', 'escritorio']
  };
  
  for (const [categoria, palavras] of Object.entries(padroes)) {
    for (const palavra of palavras) {
      if (descLower.includes(palavra)) {
        return categoria;
      }
    }
  }
  
  return null;
}

// ============================================================================
// 5. ATUALIZAÇÃO DA FUNÇÃO PRINCIPAL DE PROCESSAMENTO
// ============================================================================

// Sobrescrever a função de processamento existente
const processarMensagemOriginal = processarMensagemIA;

async function processarMensagemIA(mensagem) {
  try {
    console.log('🧠 Processando com melhorias:', mensagem);
    
    // 1. Verificar treinamento automático
    const treinamento = processarTreinamentoAutomaticoMelhorado(mensagem);
    if (treinamento.sucesso) {
      adicionarMensagemChat('system', treinamento.resposta);
      return;
    }
    
    // 2. Verificar múltiplas lojas
    const multiplasLojas = processarMultiplasLojasMelhorado(mensagem);
    if (multiplasLojas.length > 0) {
      for (const transacao of multiplasLojas) {
        const saida = {
          id: Date.now() + Math.random() * 1000,
          loja: transacao.loja,
          categoria: transacao.categoria,
          descricao: transacao.descricao,
          valor: transacao.valor,
          data: new Date().toISOString().split('T')[0],
          recorrente: "Não",
          tipoRecorrencia: null,
          pago: "Sim",
          origem: 'chat_melhorado',
          timestamp: new Date()
        };
        
        saidas.unshift(saida);
      }
      
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      
      adicionarMensagemChat('system', `✅ Processadas ${multiplasLojas.length} transações com sucesso!`);
      mostrarMensagemSucesso(`✅ ${multiplasLojas.length} transações adicionadas!`);
      return;
    }
    
    // 3. Processamento normal melhorado
    const resultado = interpretarMensagemMelhorada(mensagem);
    
    if (!resultado.sucesso) {
      adicionarMensagemChat('system', `❌ ${resultado.erro}\n\n💡 Tente: "Paguei 500 de aluguel sexta"`);
      return;
    }
    
    // 4. Criar saída
    const saida = {
      id: Date.now() + Math.random() * 1000,
      loja: resultado.loja || lojas[0],
      categoria: resultado.categoria,
      descricao: resultado.descricao,
      valor: resultado.valor,
      data: resultado.data,
      recorrente: resultado.recorrente || "Não",
      tipoRecorrencia: resultado.tipoRecorrencia || null,
      pago: resultado.pago || "Sim",
      origem: 'chat_melhorado',
      timestamp: new Date()
    };
    
    // 5. Adicionar na lista correta
    if (saida.pago === 'Sim') {
      saidas.unshift(saida);
    } else {
      saidasPendentes.unshift(saida);
    }
    
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    
    // 6. Resposta
    const resposta = `✅ Transação adicionada!\n\n💰 ${formatarMoedaBR(saida.valor)}\n🏪 ${saida.loja}\n🏷️ ${saida.categoria}\n📅 ${new Date(saida.data).toLocaleDateString('pt-BR')}\n💳 ${saida.pago === 'Sim' ? 'Pago' : 'Pendente'}`;
    
    adicionarMensagemChat('system', resposta);
    mostrarMensagemSucesso('✅ Transação processada pela IA!');
    
  } catch (error) {
    console.error('❌ Erro processamento melhorado:', error);
    adicionarMensagemChat('system', '❌ Erro ao processar. Tente novamente.');
  }
}

function interpretarMensagemMelhorada(mensagem) {
  const msgLower = mensagem.toLowerCase().trim();
  
  try {
    // 1. Extrair valor
    const matchValor = msgLower.match(/(?:r\$?\s*)?(\d+(?:[.,]\d+)?)/i);
    if (!matchValor) {
      return { sucesso: false, erro: "Não consegui identificar o valor" };
    }
    
    const valor = processarValorMelhorado(matchValor[1]);
    if (!valor) {
      return { sucesso: false, erro: "Valor inválido" };
    }
    
    // 2. Extrair data com dias da semana
    let data = new Date().toISOString().split('T')[0];
    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    
    for (const dia of diasSemana) {
      if (msgLower.includes(dia)) {
        const dataCalculada = calcularDiaSemanaMelhorado(dia);
        if (dataCalculada) {
          data = dataCalculada;
          break;
        }
      }
    }
    
    // 3. Extrair loja
    const matchLoja = msgLower.match(/(?:loja|da)\s+([^\s\d]+)/i);
    let loja = null;
    
    if (matchLoja) {
      loja = encontrarLojaCorretaMelhorada(matchLoja[1]);
    }
    
    // 4. Extrair categoria
    const categoria = determinarCategoriaMelhorada(msgLower);
    
    // 5. Gerar descrição
    const descricao = categoria || 'Saída';
    
    // 6. Determinar status
    const pago = /paguei|gastei|comprei/i.test(msgLower) ? "Sim" : "Não";
    
    return {
      sucesso: true,
      valor,
      data,
      loja,
      categoria: categoria || 'Outros',
      descricao,
      pago
    };
    
  } catch (error) {
    return { sucesso: false, erro: `Erro: ${error.message}` };
  }
}

// ============================================================================
// 6. CORREÇÃO DO FLUXO DE SAÍDAS
// ============================================================================

// Sobrescrever função de atualização de tabela
const atualizarTabelaOriginal = atualizarTabela;

function atualizarTabela() {
  const tbody = document.getElementById("tabelaSaidas");
  const divAtrasadas = document.getElementById("atrasadas");
  const divVencendoHoje = document.getElementById("vencendoHoje");
  const divProximas = document.getElementById("proximas");
  const divPrevisaoRecorrentes = document.getElementById("previsaoRecorrentes");
  
  if (!tbody) return;
  
  // Limpar tabelas
  tbody.innerHTML = "";
  if (divAtrasadas) divAtrasadas.innerHTML = "";
  if (divVencendoHoje) divVencendoHoje.innerHTML = "";
  if (divProximas) divProximas.innerHTML = "";
  if (divPrevisaoRecorrentes) divPrevisaoRecorrentes.innerHTML = "";
  
  const hoje = new Date();
  const dataHoje = hoje.toISOString().split('T')[0];
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  const saidasDoMes = []; // APENAS PAGAS
  const saidasAtrasadas = [];
  const saidasVencendoHoje = [];
  const saidasProximas = [];
  const saidasRecorrentes = [];
  
  [...saidas, ...saidasPendentes].forEach(s => {
    if (lojaFiltroAtual && s.loja !== lojaFiltroAtual) return;
    
    // CORREÇÃO: Saídas do mês apenas se PAGAS
    if (s.data.substring(0, 7) === anoMes && s.pago === 'Sim') {
      saidasDoMes.push(s);
    }
    
    if (s.recorrente === 'Sim') {
      saidasRecorrentes.push(s);
    }
    
    // Saídas pendentes
    if (s.pago === 'Não') {
      const dataSaida = s.data;
      
      if (dataSaida < dataHoje) {
        const diasAtrasado = Math.floor((hoje - new Date(dataSaida + 'T00:00:00')) / (1000 * 60 * 60 * 24));
        saidasAtrasadas.push({...s, diasAtrasado});
      } else if (dataSaida === dataHoje) {
        saidasVencendoHoje.push(s);
      } else {
        const diasRestantes = Math.floor((new Date(dataSaida + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
        saidasProximas.push({...s, diasRestantes});
      }
    }
  });
  
  // Chamar funções de preenchimento existentes
  preencherTabelaDoMes(tbody, saidasDoMes);
  preencherTabelaAtrasadas(divAtrasadas, saidasAtrasadas);
  preencherTabelaVencendoHoje(divVencendoHoje, saidasVencendoHoje);
  preencherTabelaProximas(divProximas, saidasProximas);
  preencherTabelaRecorrentes(divPrevisaoRecorrentes, saidasRecorrentes);
  
  atualizarContadorSaidas();
}

// ============================================================================
// 7. ADICIONAR RECORRÊNCIA EM MÚLTIPLAS SAÍDAS
// ============================================================================

// Sobrescrever função de nova linha
const adicionarNovaLinhaOriginal = adicionarNovaLinha;

function adicionarNovaLinha() {
  contadorMultiplas++;
  const listaSaidas = document.getElementById("listaSaidas");
  if (!listaSaidas) return;
  
  const novaLinha = document.createElement("div");
  novaLinha.className = "saida-item";
  novaLinha.id = `saida-${contadorMultiplas}`;
  
  novaLinha.innerHTML = `
    <div class="saida-info">
      <div class="row g-2">
        <div class="col-md-2">
          <select class="form-select form-select-sm" id="loja-${contadorMultiplas}">
            ${lojas.map(loja => `<option value="${loja}">${loja}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-2">
          <select class="form-select form-select-sm" id="categoria-${contadorMultiplas}">
            ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm" id="descricao-${contadorMultiplas}" placeholder="Descrição">
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm" id="valor-${contadorMultiplas}" placeholder="R$ 0,00" oninput="formatarMoedaMultiplas(this)">
        </div>
        <div class="col-md-2">
          <input type="date" class="form-control form-control-sm" id="data-${contadorMultiplas}" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="col-md-1">
          <select class="form-select form-select-sm" id="pago-${contadorMultiplas}">
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </select>
        </div>
      </div>
      <div class="row g-2 mt-1">
        <div class="col-md-2">
          <label style="font-size: 0.8rem;">Recorrente:</label>
          <select class="form-select form-select-sm" id="recorrente-${contadorMultiplas}" onchange="toggleRecorrenciaItem(${contadorMultiplas})">
            <option value="Não">Não</option>
            <option value="Sim">Sim</option>
          </select>
        </div>
        <div class="col-md-2" id="tipoContainer-${contadorMultiplas}" style="display: none;">
          <label style="font-size: 0.8rem;">Tipo:</label>
          <select class="form-select form-select-sm" id="tipoRecorrencia-${contadorMultiplas}">
            <option value="Mensal">Mensal</option>
            <option value="Semanal">Semanal</option>
            <option value="Diária">Diária</option>
            <option value="Anual">Anual</option>
            <option value="Personalizada">Personalizada</option>
          </select>
        </div>
        <div class="col-md-3" id="personalContainer-${contadorMultiplas}" style="display: none;">
          <label style="font-size: 0.8rem;">Personalizada:</label>
          <input type="text" class="form-control form-control-sm" id="personalizada-${contadorMultiplas}" placeholder="Ex: A cada 15 dias">
        </div>
      </div>
    </div>
    <div class="saida-actions">
      <button class="btn btn-danger btn-sm" onclick="removerLinhaSaida(${contadorMultiplas})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  listaSaidas.appendChild(novaLinha);
}

function toggleRecorrenciaItem(id) {
  const recorrente = document.getElementById(`recorrente-${id}`);
  const tipoContainer = document.getElementById(`tipoContainer-${id}`);
  const personalContainer = document.getElementById(`personalContainer-${id}`);
  const tipoSelect = document.getElementById(`tipoRecorrencia-${id}`);
  
  if (recorrente.value === 'Sim') {
    tipoContainer.style.display = 'block';
    
    if (tipoSelect) {
      tipoSelect.addEventListener('change', function() {
        if (this.value === 'Personalizada') {
          personalContainer.style.display = 'block';
        } else {
          personalContainer.style.display = 'none';
        }
      });
    }
  } else {
    tipoContainer.style.display = 'none';
    personalContainer.style.display = 'none';
  }
}

// ============================================================================
// 8. INICIALIZAÇÃO DAS MELHORIAS
// ============================================================================

// Variáveis globais necessárias
if (!window.aprendizadoAutomatico) {
  window.aprendizadoAutomatico = JSON.parse(localStorage.getItem('aprendizadoAutomatico') || '{}');
}

// Adicionar ao window para acesso global
window.processarTreinamentoAutomaticoMelhorado = processarTreinamentoAutomaticoMelhorado;
window.calcularDiaSemanaMelhorado = calcularDiaSemanaMelhorado;
window.processarValorMelhorado = processarValorMelhorado;
window.processarMultiplasLojasMelhorado = processarMultiplasLojasMelhorado;
window.toggleRecorrenciaItem = toggleRecorrenciaItem;

console.log('✅ Melhorias pontuais aplicadas!');
console.log('🧠 IA com treinamento automático ativada');
console.log('📅 Reconhecimento de dias da semana ativado');
console.log('💰 Processamento de valores melhorado');
console.log('🏪 Múltiplas lojas funcionando');
console.log('🔄 Recorrência em múltiplas saídas adicionada');
console.log('📊 Fluxo de saídas corrigido');

// Instruções de uso
console.log('');
console.log('🎯 COMO USAR:');
console.log('1. "adicione centro de custo marketing e quando falar trafego adicione no centro de custo marketing"');
console.log('2. "paguei sexta 1.597,11 de aluguel"');
console.log('3. "pagas hoje pra castanhal aluguel 100 marketing 200 e pra shopping marketing 150"');
console.log('');
console.log('✅ PRONTO PARA USO!');