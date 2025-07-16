// ============================================================================
// SISTEMA DE IA MELHORADO - CENTROS DE CUSTO + CLASSIFICAÇÃO DE STATUS
// ============================================================================

// Variáveis para controle de criação de categorias
let aguardandoCriacaoCategoria = false;
let saidaPendenteCategoria = null;
let categoriaParaCriar = null;

// ============================================================================
// PROCESSAMENTO DE MENSAGEM IA MELHORADO
// ============================================================================

async function processarMensagemIA(mensagem) {
  try {
    console.log('🧠 Processando:', mensagem);
    
    // Se está aguardando criação de categoria
    if (aguardandoCriacaoCategoria) {
      await processarCriacaoCategoria(mensagem);
      return;
    }
    
    const resultado = interpretarMensagemIA(mensagem);
    esconderTyping();
    
    if (!resultado.sucesso) {
      const erro = `❌ ${resultado.erro}

💡 Exemplos válidos:
• "Paguei 500 de aluguel hoje"
• "Venceu 200 de energia ontem"  
• "Preciso pagar 300 de internet dia 15"
• "Lançar 150 de material dia 20"`;
      
      adicionarMensagemChat('system', erro);
      return;
    }
    
    // Verificar se categoria existe
    const categoriaExiste = categorias.includes(resultado.categoria);
    
    if (!categoriaExiste && resultado.categoria !== 'Outros') {
      await solicitarCriacaoCategoria(resultado, mensagem);
      return;
    }
    
    const validacao = validarInformacoesObrigatorias(resultado, mensagem);
    
    if (!validacao.valido) {
      await solicitarInformacoesFaltantes(validacao, resultado, mensagem);
      return;
    }
    
    const lojaMencionada = detectarLojaNaMensagem(mensagem);
    
    if (lojaMencionada) {
      const saidaData = criarDadosSaida(resultado, lojaMencionada);
      await finalizarAdicaoSaida(saidaData);
    } else {
      await solicitarSelecaoLoja(resultado);
    }
    
  } catch (error) {
    console.error('❌ Erro processamento:', error);
    esconderTyping();
    adicionarMensagemChat('system', '❌ Erro ao processar. Tente novamente.');
  }
}

// ============================================================================
// SISTEMA DE CRIAÇÃO DE CATEGORIAS
// ============================================================================

async function solicitarCriacaoCategoria(resultado, mensagem) {
  categoriaParaCriar = resultado.categoria;
  saidaPendenteCategoria = resultado;
  aguardandoCriacaoCategoria = true;
  
  const pergunta = `🏷️ Não encontrei o centro de custo "${resultado.categoria}".

Deseja criar este novo centro de custo?

Digite "sim" para criar ou "não" para cancelar.`;
  
  adicionarMensagemChat('system', pergunta);
}

async function processarCriacaoCategoria(resposta) {
  adicionarMensagemChat('user', resposta);
  
  const respostaLower = resposta.toLowerCase().trim();
  
  if (respostaLower === 'sim' || respostaLower === 's' || respostaLower === 'ok') {
    // Criar nova categoria
    categorias.push(categoriaParaCriar);
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    
    adicionarMensagemChat('system', `✅ Centro de custo "${categoriaParaCriar}" criado com sucesso!`);
    
    // Continuar com a saída
    const validacao = validarInformacoesObrigatorias(saidaPendenteCategoria, '');
    
    if (!validacao.valido) {
      await solicitarInformacoesFaltantes(validacao, saidaPendenteCategoria, '');
    } else {
      await solicitarSelecaoLoja(saidaPendenteCategoria);
    }
    
  } else {
    adicionarMensagemChat('system', '❌ Criação de centro de custo cancelada. Tente novamente com uma categoria existente.');
  }
  
  // Resetar variáveis
  aguardandoCriacaoCategoria = false;
  saidaPendenteCategoria = null;
  categoriaParaCriar = null;
  
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = false;
}

// ============================================================================
// INTERPRETAÇÃO DE MENSAGEM COM CLASSIFICAÇÃO DE STATUS
// ============================================================================

function interpretarMensagemIA(mensagem) {
  try {
    const msgOriginal = mensagem.trim();
    const msgLower = mensagem.toLowerCase().trim();
    
    console.log('🧠 IA analisando:', msgLower.substring(0, 50));

    // Buscar treinamentos
    const treinamentoNatural = buscarTreinamentoNatural(msgLower);
    const treinamentoEncontrado = buscarTreinamento(msgLower);
    
    if (treinamentoEncontrado) {
      console.log('🎓 Usando treinamento manual:', treinamentoEncontrado);
      return {
        sucesso: true,
        categoria: treinamentoEncontrado.categoria,
        valor: treinamentoEncontrado.valor,
        data: new Date().toISOString().split('T')[0],
        descricao: treinamentoEncontrado.categoria,
        pago: detectarStatusPagamento(msgLower),
        recorrente: detectarRecorrencia(msgLower).recorrente,
        tipoRecorrencia: detectarRecorrencia(msgLower).tipo,
        statusSaida: detectarStatusSaida(msgLower),
        fonte: 'treinamento'
      };
    }

    // Padrões de reconhecimento
    const padroes = {
      valor: /(?:r\$?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)\s*(?:reais?|real|pila|conto|pau|dinheiro)?/i,
      
      // Datas específicas
      dataHoje: /\b(?:hoje|hj|agora)\b/i,
      dataOntem: /\b(?:ontem|onte)\b/i,
      dataAmanha: /\b(?:amanhã|amanha|tomorrow)\b/i,
      dataEspecifica: /(?:dia|para\s+dia|no\s+dia|em)\s+(\d{1,2})(?:\/(\d{1,2}))?/i,
      
      // Status de saída - NOVO
      saidaVencida: /\b(?:venceu|vencido|atrasou|atrasado|atrasada|vencida)\b/i,
      saidaFutura: /\b(?:pagar|lançar|adicionar|programar|agendar)\s+(?:pra|para|no|em|dia)/i,
      saidaFuturaSimples: /\b(?:preciso\s+pagar|vou\s+pagar|tem\s+que\s+pagar|devo\s+pagar)\b/i,
      
      // Ações tradicionais
      acoesPago: /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou|saída|despesa|débito|desembolsei?)\b/i,
      acoesNaoPago: /\b(?:devo|deve|preciso\s+pagar|vou\s+pagar|pendente|conta\s+para\s+pagar|a\s+pagar|fatura|boleto)\b/i,
      
      // Recorrência - apenas se mencionada
      recorrente: /\b(?:recorrente|recorrência|mensal|todo\s+mês|mensalmente|fixo|sempre|mensalidade|repetir)\b/i,
      semanal: /\b(?:semanal|toda\s+semana|semanalmente|por\s+semana)\b/i,
      diario: /\b(?:diário|diario|todo\s+dia|diariamente|por\s+dia)\b/i,
      anual: /\b(?:anual|todo\s+ano|anualmente|por\s+ano|anuidade)\b/i
    };

    // Categorias IA (expandidas)
    const categoriasIA = {
      'Aluguel': { regex: /\b(?:aluguel|aluguer|rent|locação|arrendamento)\b/i, confianca: 0.95 },
      'Energia': { regex: /\b(?:energia|luz|elétrica|eletricidade|conta\s+de\s+luz|enel|cpfl|cemig)\b/i, confianca: 0.9 },
      'Internet': { regex: /\b(?:internet|wifi|banda\s+larga|provedor|vivo\s+fibra|claro\s+net|tim\s+live)\b/i, confianca: 0.9 },
      'Água': { regex: /\b(?:água|agua|saneamento|conta\s+de\s+água|sabesp|cedae|sanepar)\b/i, confianca: 0.9 },
      'Combustível': { regex: /\b(?:combustível|gasolina|etanol|diesel|posto|abasteci|álcool|combustivel|gas)\b/i, confianca: 0.9 },
      'Material': { regex: /\b(?:material|escritório|papelaria|equipamento|ferramenta|suprimento)\b/i, confianca: 0.8 },
      'Transporte': { regex: /\b(?:transporte|uber|taxi|ônibus|onibus|metrô|metro|passagem|viagem|corrida)\b/i, confianca: 0.85 },
      'Alimentação': { regex: /\b(?:alimentação|comida|mercado|supermercado|restaurante|lanche|café|delivery)\b/i, confianca: 0.8 },
      'Marketing': { regex: /\b(?:marketing|publicidade|anúncio|anuncio|propaganda|google\s+ads|facebook\s+ads)\b/i, confianca: 0.8 },
      'Saúde': { regex: /\b(?:saúde|saude|médico|medico|hospital|farmácia|farmacia|remédio|remedio)\b/i, confianca: 0.85 }
    };

    // STEP 1: Extrair valor
    const matchValor = msgLower.match(padroes.valor);
    if (!matchValor) {
      return { sucesso: false, erro: "Não consegui identificar o valor na mensagem" };
    }
    
    const valor = processarValor(matchValor[1]);
    if (isNaN(valor) || valor <= 0) {
      return { sucesso: false, erro: `Valor inválido: ${matchValor[1]}` };
    }

    // STEP 2: Detectar STATUS da saída (NOVO)
    const statusSaida = detectarStatusSaida(msgLower);
    
    // STEP 3: Extrair/calcular data baseada no status
    let data = calcularDataPorStatus(msgLower, statusSaida, padroes);
    
    // STEP 4: Identificar categoria
    let melhorCategoria = treinamentoNatural ? treinamentoNatural.categoria : "Outros";
    let maiorConfianca = treinamentoNatural ? 0.95 : 0;
    
    for (const [categoria, config] of Object.entries(categoriasIA)) {
      if (config.regex.test(msgLower)) {
        if (config.confianca > maiorConfianca) {
          melhorCategoria = categoria;
          maiorConfianca = config.confianca;
        }
      }
    }

    // STEP 5: Determinar status de pagamento baseado no status da saída
    let pago = "Sim"; // Default
    
    if (statusSaida === 'vencida') {
      pago = "Não"; // Saída vencida = não paga
    } else if (statusSaida === 'futura') {
      pago = "Não"; // Saída futura = não paga ainda
    } else if (padroes.acoesNaoPago.test(msgLower)) {
      pago = "Não";
    } else if (padroes.acoesPago.test(msgLower)) {
      pago = "Sim";
    }

    // STEP 6: Identificar recorrência (apenas se mencionada)
    const recorrencia = detectarRecorrencia(msgLower);

    // STEP 7: Gerar descrição
    let descricao = melhorCategoria;
    if (statusSaida === 'vencida') {
      descricao = `${melhorCategoria} (Vencida)`;
    } else if (statusSaida === 'futura') {
      descricao = `${melhorCategoria} (Agendada)`;
    }

    const resultado = {
      sucesso: true,
      categoria: melhorCategoria,
      valor: valor,
      data: data,
      descricao: descricao,
      pago: pago,
      recorrente: recorrencia.recorrente,
      tipoRecorrencia: recorrencia.tipo,
      statusSaida: statusSaida
    };

    console.log('🎯 Resultado IA:', resultado);
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro IA:', error);
    return { sucesso: false, erro: `Erro no processamento: ${error.message}` };
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA CLASSIFICAÇÃO
// ============================================================================

function detectarStatusSaida(mensagem) {
  const padroes = {
    vencida: /\b(?:venceu|vencido|atrasou|atrasado|atrasada|vencida)\b/i,
    futura: /\b(?:pagar|lançar|adicionar|programar|agendar)\s+(?:pra|para|no|em|dia)|(?:preciso\s+pagar|vou\s+pagar|tem\s+que\s+pagar|devo\s+pagar)\b/i
  };
  
  if (padroes.vencida.test(mensagem)) {
    return 'vencida';
  } else if (padroes.futura.test(mensagem)) {
    return 'futura';
  }
  
  return 'atual'; // Default para saídas normais
}

function calcularDataPorStatus(mensagem, statusSaida, padroes) {
  const hoje = new Date();
  let data = hoje.toISOString().split('T')[0]; // Default: hoje
  
  // Verificar datas específicas primeiro
  const matchDataEspecifica = mensagem.match(padroes.dataEspecifica);
  if (matchDataEspecifica) {
    const dia = parseInt(matchDataEspecifica[1]);
    const mes = matchDataEspecifica[2] ? parseInt(matchDataEspecifica[2]) : hoje.getMonth() + 1;
    const ano = hoje.getFullYear();
    
    const dataEspecifica = new Date(ano, mes - 1, dia);
    data = dataEspecifica.toISOString().split('T')[0];
  }
  // Verificar padrões de data relativa
  else if (padroes.dataOntem.test(mensagem)) {
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    data = ontem.toISOString().split('T')[0];
  } else if (padroes.dataAmanha.test(mensagem)) {
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    data = amanha.toISOString().split('T')[0];
  }
  // Ajustar baseado no status se não há data específica
  else {
    if (statusSaida === 'vencida') {
      // Se é vencida mas não tem data específica, assumir ontem
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      data = ontem.toISOString().split('T')[0];
    } else if (statusSaida === 'futura') {
      // Se é futura mas não tem data específica, assumir próxima semana
      const proximaSemana = new Date(hoje);
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      data = proximaSemana.toISOString().split('T')[0];
    }
  }
  
  return data;
}

function detectarRecorrencia(mensagem) {
  const padroes = {
    mensal: /\b(?:recorrente|recorrência|mensal|todo\s+mês|mensalmente|fixo|sempre|mensalidade|repetir)\b/i,
    semanal: /\b(?:semanal|toda\s+semana|semanalmente|por\s+semana)\b/i,
    diario: /\b(?:diário|diario|todo\s+dia|diariamente|por\s+dia)\b/i,
    anual: /\b(?:anual|todo\s+ano|anualmente|por\s+ano|anuidade)\b/i
  };
  
  if (padroes.mensal.test(mensagem)) {
    return { recorrente: "Sim", tipo: "Mensal" };
  } else if (padroes.semanal.test(mensagem)) {
    return { recorrente: "Sim", tipo: "Semanal" };
  } else if (padroes.diario.test(mensagem)) {
    return { recorrente: "Sim", tipo: "Diária" };
  } else if (padroes.anual.test(mensagem)) {
    return { recorrente: "Sim", tipo: "Anual" };
  }
  
  return { recorrente: "Não", tipo: null };
}

function processarValor(valorTexto) {
  // Se é um número simples >= 10, considerar como valor direto
  if (/^\d+$/.test(valorTexto)) {
    const numeroSimples = parseInt(valorTexto);
    if (numeroSimples >= 10) {
      return numeroSimples;
    }
  }
  
  // Processar valores com formatação
  if (valorTexto.includes('.') && valorTexto.includes(',')) {
    // Ponto como milhares, vírgula como decimal
    valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
  } else if (valorTexto.includes(',') && valorTexto.split(',')[1]?.length === 2) {
    // Vírgula como decimal
    valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
  } else if (valorTexto.includes('.') && valorTexto.split('.')[1]?.length === 2) {
    // Ponto como decimal
    // Já está correto
  } else if (valorTexto.includes(',')) {
    // Vírgula como decimal
    valorTexto = valorTexto.replace(',', '.');
  } else if (valorTexto.includes('.') && valorTexto.split('.')[1]?.length > 2) {
    // Ponto como milhares
    valorTexto = valorTexto.replace(/\./g, '');
  }
  
  return parseFloat(valorTexto);
}

// ============================================================================
// CRIAÇÃO DE DADOS DA SAÍDA ATUALIZADA
// ============================================================================

function criarDadosSaida(resultado, loja) {
  return {
    id: Date.now() + Math.random() * 1000,
    loja: loja,
    categoria: resultado.categoria,
    descricao: resultado.descricao,
    valor: resultado.valor,
    data: resultado.data,
    recorrente: resultado.recorrente || "Não",
    tipoRecorrencia: resultado.tipoRecorrencia || null,
    pago: resultado.pago,
    statusSaida: resultado.statusSaida || 'atual',
    origem: 'chat',
    timestamp: new Date(),
    dataProcessamento: new Date().toISOString()
  };
}

// ============================================================================
// RESPOSTA MELHORADA DO CHAT
// ============================================================================

function gerarRespostaChat(saida) {
  const dataFormatada = new Date(saida.data + 'T00:00:00').toLocaleDateString('pt-BR');
  const valorFormatado = saida.valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  const emojiCategoria = {
    'Aluguel': '🏠', 'Energia': '⚡', 'Internet': '🌐', 'Água': '💧',
    'Combustível': '⛽', 'Material': '📦', 'Transporte': '🚗', 'Alimentação': '🍽️',
    'Marketing': '📢', 'Saúde': '🏥'
  };
  
  const emoji = emojiCategoria[saida.categoria] || '📊';
  
  // Emoji baseado no status
  let statusEmoji = '📊';
  let statusTexto = 'Atual';
  
  if (saida.statusSaida === 'vencida') {
    statusEmoji = '⚠️';
    statusTexto = 'Vencida';
  } else if (saida.statusSaida === 'futura') {
    statusEmoji = '📅';
    statusTexto = 'Agendada';
  }
  
  let resposta = `✅ *Saída ${statusTexto.toLowerCase()} registrada!*\n\n`;
  
  resposta += `💰 *Valor:* ${valorFormatado}\n`;
  resposta += `${emoji} *Centro de Custo:* ${saida.categoria}\n`;
  resposta += `🏪 *Loja:* ${saida.loja}\n`;
  resposta += `📅 *Data:* ${dataFormatada}\n`;
  resposta += `${statusEmoji} *Status:* ${statusTexto}\n`;
  resposta += `💳 *Pagamento:* ${saida.pago === "Sim" ? "Pago ✅" : "Pendente ⏳"}\n`;
  
  if (saida.recorrente === "Sim") {
    resposta += `🔄 *Recorrência:* ${saida.tipoRecorrencia}\n`;
  }
  
  resposta += `\n🤖 *Processado pela IA Melhorada*`;
  
  return resposta;
}

console.log('✅ IA Melhorada implementada!');
console.log('🏷️ Sistema de criação de centros de custo ativo');
console.log('📊 Classificação de status implementada');
console.log('🔄 Recorrência apenas quando mencionada');