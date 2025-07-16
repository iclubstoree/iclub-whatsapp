// ============================================================================
// SISTEMA DE TREINAMENTO IA MELHORADO
// ============================================================================

function mostrarTreinamentoIA() {
  const modal = document.getElementById('modalTreinamentoIA');
  if (modal) {
    modal.style.display = 'block';
    preencherSelectTreinamento();
    listarTreinamentos();
  }
}

function fecharTreinamentoIA() {
  const modal = document.getElementById('modalTreinamentoIA');
  if (modal) {
    modal.style.display = 'none';
    limparFormularioTreinamento();
  }
}

function preencherSelectTreinamento() {
  const selectCat = document.getElementById('treinamentoCategoria');
  if (selectCat) {
    selectCat.innerHTML = '<option value="">Selecione categoria...</option>';
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      selectCat.appendChild(option);
    });
  }
  
  const selectLoja = document.getElementById('treinamentoLoja');
  if (selectLoja) {
    selectLoja.innerHTML = '<option value="">Selecione loja...</option>';
    lojas.forEach(loja => {
      const option = document.createElement('option');
      option.value = loja;
      option.textContent = loja;
      selectLoja.appendChild(option);
    });
  }
}

function salvarTreinamentoNatural() {
  const textoTreinamento = document.getElementById('treinamentoNatural')?.value.trim();
  
  if (!textoTreinamento) {
    alert('Digite o texto de treinamento!');
    return;
  }
  
  const padroesTreinamento = processarTreinamentoNatural(textoTreinamento);
  
  if (padroesTreinamento.length === 0) {
    alert('Não consegui identificar padrões válidos no texto. Tente ser mais específico.');
    return;
  }
  
  padroesTreinamento.forEach(padrao => {
    treinamentosNaturais.push({
      id: Date.now() + Math.random(),
      textoOriginal: textoTreinamento,
      palavra: padrao.palavra,
      categoria: padrao.categoria,
      criadoEm: new Date().toISOString()
    });
  });
  
  localStorage.setItem('treinamentosNaturais', JSON.stringify(treinamentosNaturais));
  
  mostrarMensagemSucesso(`✅ IA treinada! ${padroesTreinamento.length} padrões aprendidos.`);
  document.getElementById('treinamentoNatural').value = '';
  listarTreinamentos();
}

function processarTreinamentoNatural(texto) {
  const padroes = [];
  const textoLower = texto.toLowerCase();
  
  const regexPadroes = [
    /quando\s+eu\s+falar\s+([^,]+?)\s+(?:você\s+vai\s+adicionar|adicione)\s+(?:ao\s+centro\s+de\s+custos?|na\s+categoria)\s+([^,.]+)/gi,
    /quando\s+falar\s+([^,]+?)\s+(?:adicione|vai\s+para)\s+(?:na\s+categoria|ao\s+centro\s+de\s+custos?)\s+([^,.]+)/gi,
    /([^,]+?)\s+vai\s+para\s+(?:categoria|centro\s+de\s+custos?)\s+([^,.]+)/gi
  ];
  
  regexPadroes.forEach(regex => {
    let match;
    while ((match = regex.exec(textoLower)) !== null) {
      const palavra = match[1].trim();
      const categoria = match[2].trim();
      
      if (palavra && categoria) {
        padroes.push({
          palavra: palavra,
          categoria: categoria.charAt(0).toUpperCase() + categoria.slice(1)
        });
      }
    }
  });
  
  return padroes;
}

function salvarTreinamentoManual() {
  const frase = document.getElementById('treinamentoFrase')?.value.trim();
  const valor = document.getElementById('treinamentoValor')?.value.trim();
  const categoria = document.getElementById('treinamentoCategoria')?.value;
  const loja = document.getElementById('treinamentoLoja')?.value;
  
  if (!frase || !valor || !categoria || !loja) {
    alert('Preencha todos os campos para treinar a IA!');
    return;
  }
  
  const treinamento = {
    id: Date.now(),
    frase: frase.toLowerCase(),
    valor: parseFloat(valor.replace(/[^0-9,]/g, '').replace(',', '.')),
    categoria,
    loja,
    criadoEm: new Date().toISOString()
  };
  
  treinamentosIA.push(treinamento);
  localStorage.setItem('treinamentosIA', JSON.stringify(treinamentosIA));
  
  mostrarMensagemSucesso('✅ Treinamento manual salvo!');
  limparFormularioTreinamento();
  listarTreinamentos();
}

function limparFormularioTreinamento() {
  const campos = ['treinamentoFrase', 'treinamentoValor', 'treinamentoCategoria', 'treinamentoLoja'];
  campos.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) elemento.value = '';
  });
}

function listarTreinamentos() {
  const lista = document.getElementById('listaTreinamentos');
  if (!lista) return;
  
  const totalTreinamentos = treinamentosIA.length + treinamentosNaturais.length;
  
  if (totalTreinamentos === 0) {
    lista.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #6b7280;">
        <i class="fas fa-lightbulb" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <p>Nenhum treinamento ainda. Adicione exemplos para melhorar a IA!</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <h6 style="color: #667eea; font-weight: 700; margin-bottom: 15px;">
      📚 Treinamentos Salvos (${totalTreinamentos})
    </h6>
  `;
  
  if (treinamentosNaturais.length > 0) {
    html += '<h6 style="color: #10b981; font-weight: 600; margin-bottom: 10px;">🧠 Treinamentos Naturais:</h6>';
    treinamentosNaturais.slice(-3).reverse().forEach(t => {
      html += `
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
          <div style="font-weight: 600; color: #065f46; margin-bottom: 5px;">
            "${t.palavra}" → ${t.categoria}
          </div>
          <div style="font-size: 0.8rem; color: #6b7280;">
            Texto: "${t.textoOriginal.substring(0, 50)}..."
          </div>
        </div>
      `;
    });
  }
  
  if (treinamentosIA.length > 0) {
    html += '<h6 style="color: #667eea; font-weight: 600; margin-bottom: 10px;">📝 Treinamentos Manuais:</h6>';
    treinamentosIA.slice(-3).reverse().forEach(t => {
      html += `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
          <div style="font-weight: 600; color: #374151; margin-bottom: 5px;">
            "${t.frase}"
          </div>
          <div style="font-size: 0.85rem; color: #6b7280;">
            💰 R$ ${t.valor.toFixed(2)} • 🏷️ ${t.categoria} • 🏪 ${t.loja}
          </div>
        </div>
      `;
    });
  }
  
  lista.innerHTML = html;
}

// ============================================================================
// CHAT IA INTELIGENTE - MELHORADO
// ============================================================================

function enviarMensagemChat() {
  const input = document.getElementById('chatInput');
  const mensagem = input?.value.trim();
  
  if (!mensagem) return;
  
  input.value = '';
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  
  // NOVO: Verificar se está aguardando criação de categoria
  if (aguardandoCriacaoCategoria) {
    processarCriacaoCategoria(mensagem);
    return;
  }
  
  if (aguardandoSelecaoLoja) {
    processarSelecaoLoja(mensagem);
    return;
  }
  
  adicionarMensagemChat('user', mensagem);
  mostrarTyping();
  
  setTimeout(() => {
    processarMensagemIA(mensagem);
  }, 1500);
}

function adicionarMensagemChat(tipo, texto) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const agora = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${tipo}`;
  
  messageDiv.innerHTML = `
    <div class="chat-bubble">
      <div>${texto}</div>
      <div class="chat-time">${agora}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function mostrarTyping() {
  const typing = document.getElementById('typingIndicator');
  if (typing) {
    typing.style.display = 'flex';
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
}

function esconderTyping() {
  const typing = document.getElementById('typingIndicator');
  if (typing) {
    typing.style.display = 'none';
  }
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = false;
}

// ============================================================================
// PROCESSAMENTO DE MENSAGEM IA MELHORADO
// ============================================================================

async function processarMensagemIA(mensagem) {
  try {
    console.log('🧠 Processando:', mensagem);
    
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
    
    // NOVO: Verificar se categoria existe
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
// SISTEMA DE CRIAÇÃO DE CATEGORIAS - NOVO
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
// INTERPRETAÇÃO DE MENSAGEM COM CLASSIFICAÇÃO DE STATUS - MELHORADO
// ============================================================================

function interpretarMensagemIA(mensagem) {
  try {
    const msgOriginal = mensagem.trim();
    const msgLower = mensagem.toLowerCase().trim();
    
    console.log('🧠 IA analisando:', msgLower.substring(0, 50));

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

    const padroes = {
      valor: /(?:r\$?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)\s*(?:reais?|real|pila|conto|pau|dinheiro)?/i,
      
      // Datas específicas
      dataHoje: /\b(?:hoje|hj|agora)\b/i,
      dataOntem: /\b(?:ontem|onte)\b/i,
      dataAmanha: /\b(?:amanhã|amanha|tomorrow)\b/i,
      dataEspecifica: /(?:dia|para\s+dia|no\s+dia|em)\s+(\d{1,2})(?:\/(\d{1,2}))?/i,
      
      // Status de saída - NOVO
      saidaVencida: /\b(?:venceu|vencido|atrasou|atrasado|atrasada|vencida)\b/i,
      saidaFutura: /\b(?:pagar|lançar|adicionar|programar|agendar)\s+(?:pra|para|no|em|dia)|(?:preciso\s+pagar|vou\s+pagar|tem\s+que\s+pagar|devo\s+pagar)\b/i,
      
      // Ações tradicionais
      acoesPago: /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou|saída|despesa|débito|desembolsei?)\b/i,
      acoesNaoPago: /\b(?:devo|deve|preciso\s+pagar|vou\s+pagar|pendente|conta\s+para\s+pagar|a\s+pagar|fatura|boleto)\b/i,
      
      // Recorrência - apenas se mencionada
      recorrente: /\b(?:recorrente|recorrência|mensal|todo\s+mês|mensalmente|fixo|sempre|mensalidade|repetir)\b/i,
      semanal: /\b(?:semanal|toda\s+semana|semanalmente|por\s+semana)\b/i,
      diario: /\b(?:diário|diario|todo\s+dia|diariamente|por\s+dia)\b/i,
      anual: /\b(?:anual|todo\s+ano|anualmente|por\s+ano|anuidade)\b/i
    };

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
    
    // STEP 4: Identificar categoria (incluindo novas categorias)
    let melhorCategoria = treinamentoNatural ? treinamentoNatural.categoria : null;
    let maiorConfianca = treinamentoNatural ? 0.95 : 0;
    
    // Verificar se mencionou uma categoria conhecida
    for (const [categoria, config] of Object.entries(categoriasIA)) {
      if (config.regex.test(msgLower)) {
        if (config.confianca > maiorConfianca) {
          melhorCategoria = categoria;
          maiorConfianca = config.confianca;
        }
      }
    }
    
    // Se não encontrou categoria conhecida, extrair possível categoria da mensagem
    if (!melhorCategoria) {
      melhorCategoria = extrairCategoriaDaMensagem(msgLower);
    }
    
    // Fallback para "Outros" se ainda não encontrou
    if (!melhorCategoria) {
      melhorCategoria = "Outros";
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
// FUNÇÕES AUXILIARES PARA CLASSIFICAÇÃO - NOVAS
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

function extrairCategoriaDaMensagem(mensagem) {
  // Tentar extrair categoria de palavras-chave não mapeadas
  const palavras = mensagem.split(' ').filter(p => p.length > 3);
  
  // Procurar por substantivos que possam ser categorias
  const possiveisCategoria = ['contador', 'advogado', 'consultoria', 'software', 'ferramenta', 'equipamento'];
  
  for (const palavra of palavras) {
    for (const categoria of possiveisCategoria) {
      if (palavra.includes(categoria)) {
        return categoria.charAt(0).toUpperCase() + categoria.slice(1);
      }
    }
  }
  
  // Se não encontrou nada específico, pegar a primeira palavra não comum
  const palavrasComuns = ['paguei', 'gastei', 'comprei', 'venceu', 'atrasou', 'pagar', 'lançar', 'hoje', 'ontem', 'amanhã'];
  
  for (const palavra of palavras) {
    if (!palavrasComuns.includes(palavra.toLowerCase()) && !/\d/.test(palavra)) {
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    }
  }
  
  return null;
}

// ============================================================================
// FUNÇÕES AUXILIARES EXISTENTES (mantidas)
// ============================================================================

function buscarTreinamentoNatural(mensagem) {
  for (const treinamento of treinamentosNaturais) {
    if (mensagem.includes(treinamento.palavra.toLowerCase())) {
      return treinamento;
    }
  }
  return null;
}

function buscarTreinamento(mensagem) {
  let melhorTreinamento = null;
  let melhorScore = 0;
  
  for (const treinamento of treinamentosIA) {
    const score = calcularSimilaridade(mensagem, treinamento.frase);
    if (score > melhorScore && score > 0.7) {
      melhorScore = score;
      melhorTreinamento = treinamento;
    }
  }
  
  return melhorTreinamento;
}

function calcularSimilaridade(str1, str2) {
  const palavras1 = str1.toLowerCase().split(' ').filter(p => p.length > 2);
  const palavras2 = str2.toLowerCase().split(' ').filter(p => p.length > 2);
  
  let matches = 0;
  for (const palavra1 of palavras1) {
    for (const palavra2 of palavras2) {
      if (palavra1.includes(palavra2) || palavra2.includes(palavra1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / Math.max(palavras1.length, palavras2.length);
}

function detectarStatusPagamento(mensagem) {
  const padroesPago = /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou)\b/i;
  const padroesNaoPago = /\b(?:devo|deve|preciso\s+pagar|vou\s+pagar|pendente)\b/i;
  
  if (padroesNaoPago.test(mensagem)) return "Não";
  if (padroesPago.test(mensagem)) return "Sim";
  return "Sim";
}

function validarInformacoesObrigatorias(resultado, mensagem) {
  const problemas = [];
  
  if (!resultado.valor || resultado.valor <= 0) {
    problemas.push('valor');
  }
  
  if (!resultado.categoria || resultado.categoria === 'Outros') {
    problemas.push('categoria');
  }
  
  return {
    valido: problemas.length === 0,
    problemas: problemas,
    resultado: resultado
  };
}

async function solicitarInformacoesFaltantes(validacao, resultado, mensagem) {
  const problemas = validacao.problemas;
  
  if (problemas.includes('valor')) {
    adicionarMensagemChat('system', '💰 Não consegui identificar o valor. Qual o valor da saída?\n\n📝 Exemplo: "R$ 500" ou "500"');
    return;
  }
  
  if (problemas.includes('categoria')) {
    adicionarMensagemChat('system', `🏷️ Não consegui identificar a categoria. Para que é esta saída?\n\n📝 Categorias disponíveis:\n${categorias.map(c => `• ${c}`).join('\n')}`);
    return;
  }
}

async function solicitarSelecaoLoja(resultado) {
  const saidaData = criarDadosSaida(resultado, null);
  
  saidaPendenteLoja = saidaData;
  aguardandoSelecaoLoja = true;
  
  const pergunta = `✅ Entendi! Saída de ${formatarMoedaBR(resultado.valor)} para ${resultado.categoria}.

📍 Para qual loja é esta saída?`;
  
  adicionarMensagemChat('system', pergunta);
  
  const opcoesTexto = lojas.map((loja, index) => `${index + 1}. ${loja}`).join('\n');
  adicionarMensagemChat('system', `Escolha uma opção:\n\n${opcoesTexto}`);
}

function processarSelecaoLoja(resposta) {
  const numeroEscolhido = parseInt(resposta.trim());
  
  if (numeroEscolhido >= 1 && numeroEscolhido <= lojas.length) {
    const lojaEscolhida = lojas[numeroEscolhido - 1];
    saidaPendenteLoja.loja = lojaEscolhida;
    
    adicionarMensagemChat('user', resposta);
    finalizarAdicaoSaida(saidaPendenteLoja);
    
    aguardandoSelecaoLoja = false;
    saidaPendenteLoja = null;
    
  } else {
    adicionarMensagemChat('user', resposta);
    adicionarMensagemChat('system', `❌ Opção inválida. Digite um número de 1 a ${lojas.length}:`);
    
    const opcoesTexto = lojas.map((loja, index) => `${index + 1}. ${loja}`).join('\n');
    adicionarMensagemChat('system', opcoesTexto);
  }
  
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = false;
}

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

function detectarLojaNaMensagem(mensagem) {
  const msgLower = mensagem.toLowerCase();
  
  for (const loja of lojas) {
    if (msgLower.includes(loja.toLowerCase())) {
      return loja;
    }
  }
  
  if (msgLower.includes('centro')) {
    const lojasCentro = lojas.filter(l => l.toLowerCase().includes('centro'));
    if (lojasCentro.length > 0) return lojasCentro[0];
  }
  
  if (msgLower.includes('shopping')) {
    const lojasShoppingas = lojas.filter(l => l.toLowerCase().includes('shopping'));
    if (lojasShoppingas.length > 0) return lojasShoppingas[0];
  }
  
  if (msgLower.includes('bairro')) {
    const lojasBairro = lojas.filter(l => l.toLowerCase().includes('bairro'));
    if (lojasBairro.length > 0) return lojasBairro[0];
  }
  
  return null;
}

async function finalizarAdicaoSaida(saidaData) {
  try {
    if (saidaData.pago === 'Sim') {
      saidas.unshift(saidaData);
    } else {
      saidasPendentes.unshift(saidaData);
    }
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    
    const resposta = gerarRespostaChat(saidaData);
    adicionarMensagemChat('system', resposta);
    mostrarMensagemSucesso('✅ Saída adicionada via Chat IA!');
    
  } catch (error) {
    console.error('❌ Erro finalizar:', error);
    adicionarMensagemChat('system', '❌ Erro ao salvar. Tente novamente.');
  }
}

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

function limparChat() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="chat-message system">
        <div class="chat-bubble">
          <div>👋 Olá! Eu sou a IA do iClub MELHORADA! Agora entendo "venceu", "atrasou", "pagar dia X" e crio centros de custo automaticamente!</div>
          <div class="chat-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `;
  }
}

// ============================================================================
// SISTEMA "VER MAIS" PARA SAÍDAS DO MÊS - NOVO
// ============================================================================

function toggleVerMais() {
  const tabela = document.getElementById('saidasMesTabela');
  const botao = document.getElementById('btnVerMais');
  
  if (!tabela || !botao) return;
  
  if (saidasMesLimitadas) {
    // Expandir
    tabela.classList.remove('limitado');
    botao.innerHTML = '<i class="fas fa-chevron-up"></i> Ver Menos Saídas';
    botao.className = 'btn-ver-menos';
    saidasMesLimitadas = false;
  } else {
    // Limitar
    tabela.classList.add('limitado');
    botao.innerHTML = '<i class="fas fa-chevron-down"></i> Ver Mais Saídas';
    botao.className = 'btn-ver-mais';
    saidasMesLimitadas = true;
  }
}

function atualizarContadorSaidas() {
  const contador = document.getElementById('contadorSaidas');
  const btnVerMais = document.getElementById('btnVerMais');
  
  if (!contador) return;
  
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });

  if (lojaFiltroAtual) {
    saidasMes = saidasMes.filter(s => s.loja === lojaFiltroAtual);
  }
  
  contador.textContent = `📊 ${saidasMes.length} saídas encontradas`;
  
  // Mostrar/esconder botão "Ver mais" baseado na quantidade
  if (btnVerMais) {
    if (saidasMes.length > 5) {
      btnVerMais.style.display = 'block';
    } else {
      btnVerMais.style.display = 'none';
    }
  }
}

// ============================================================================
// FUNÇÕES PRINCIPAIS DO SISTEMA (mantidas iguais)
// ============================================================================

function adicionarSaida() {
  const loja = document.getElementById("loja")?.value || "Manual";
  const categoria = document.getElementById("categoria")?.value || "Outros";
  const descricao = document.getElementById("descricao")?.value || categoria;
  const valorInput = document.getElementById("valor")?.value || "0";
  const valor = extrairValorNumerico(valorInput);
  const data = document.getElementById("data")?.value || new Date().toISOString().split('T')[0];
  const recorrente = document.getElementById("recorrente")?.value || "Não";
  const tipoRecorrencia = document.getElementById("tipoRecorrencia")?.value || null;
  const pago = document.getElementById("pago")?.value || "Sim";

  if (valor <= 0) {
    alert("Por favor, insira um valor válido!");
    return;
  }

  const saida = { 
    id: Date.now() + Math.random() * 1000, 
    loja, categoria, 
    descricao: descricao || categoria,
    valor, data, recorrente,
    tipoRecorrencia: recorrente === "Sim" ? tipoRecorrencia : null,
    pago, origem: 'manual', timestamp: new Date()
  };

  try {
    if (pago === "Sim") {
      saidas.unshift(saida);
    } else {
      saidasPendentes.unshift(saida);
    }
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarMensagemSucesso('✅ Saída adicionada com sucesso!');
    limparFormulario();
    
  } catch (error) {
    console.error('❌ Erro adicionar saída:', error);
    alert('Erro ao salvar saída. Tente novamente.');
  }
}

function excluirSaida(firestoreId, saidaId) {
  if (!confirm('Tem certeza que deseja excluir esta saída?')) return;

  try {
    saidas = saidas.filter(s => s.id !== saidaId);
    saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarMensagemSucesso('✅ Saída excluída!');
  } catch (error) {
    console.error('❌ Erro excluir:', error);
    alert('Erro ao excluir saída. Tente novamente.');
  }
}

function marcarComoPago(firestoreId, saidaId) {
  if (!confirm('Marcar esta saída como paga?')) return;

  try {
    const saida = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
    if (saida) {
      saida.pago = 'Sim';
      saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
      saidas.unshift(saida);
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      mostrarMensagemSucesso('✅ Saída marcada como paga!');
    }
  } catch (error) {
    console.error('❌ Erro marcar como pago:', error);
    alert('Erro ao atualizar saída. Tente novamente.');
  }
}

function editarSaida(firestoreId, saidaId) {
  const saida = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
  
  if (!saida) {
    alert('Saída não encontrada!');
    return;
  }
  
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  document.getElementById('modalTitulo').textContent = 'Editar Saída';
  document.getElementById('modalTexto').innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label fw-bold">Loja:</label>
        <select id="editLoja" class="form-select">
          ${lojas.map(loja => `<option value="${loja}" ${loja === saida.loja ? 'selected' : ''}>${loja}</option>`).join('')}
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">Categoria:</label>
        <select id="editCategoria" class="form-select">
          ${categorias.map(cat => `<option value="${cat}" ${cat === saida.categoria ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      </div>
      <div class="col-md-12">
        <label class="form-label fw-bold">Descrição:</label>
        <input type="text" id="editDescricao" class="form-control" value="${saida.descricao}">
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">Valor (R$):</label>
        <input type="text" id="editValor" class="form-control" value="${formatarMoedaBR(saida.valor)}" oninput="formatarMoeda(this)">
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">Data:</label>
        <input type="date" id="editData" class="form-control" value="${saida.data}">
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">Recorrente:</label>
        <select id="editRecorrente" class="form-select" onchange="toggleEditRecorrencia()">
          <option value="Não" ${saida.recorrente === 'Não' ? 'selected' : ''}>Não</option>
          <option value="Sim" ${saida.recorrente === 'Sim' ? 'selected' : ''}>Sim</option>
        </select>
      </div>
      <div class="col-md-4" id="editTipoRecorrenciaContainer" style="display: ${saida.recorrente === 'Sim' ? 'block' : 'none'};">
        <label class="form-label fw-bold">Tipo:</label>
        <select id="editTipoRecorrencia" class="form-select">
          <option value="Diária" ${saida.tipoRecorrencia === 'Diária' ? 'selected' : ''}>Diária</option>
          <option value="Semanal" ${saida.tipoRecorrencia === 'Semanal' ? 'selected' : ''}>Semanal</option>
          <option value="Mensal" ${saida.tipoRecorrencia === 'Mensal' ? 'selected' : ''}>Mensal</option>
          <option value="Anual" ${saida.tipoRecorrencia === 'Anual' ? 'selected' : ''}>Anual</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">Status:</label>
        <select id="editPago" class="form-select">
          <option value="Sim" ${saida.pago === 'Sim' ? 'selected' : ''}>Pago</option>
          <option value="Não" ${saida.pago === 'Não' ? 'selected' : ''}>Pendente</option>
        </select>
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-success" onclick="salvarEdicaoSaida(${saidaId})">Salvar</button>
    <button class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
  `;
  
  modal.style.display = 'flex';
}

function toggleEditRecorrencia() {
  const recorrente = document.getElementById('editRecorrente');
  const container = document.getElementById('editTipoRecorrenciaContainer');
  
  if (recorrente && container) {
    if (recorrente.value === 'Sim') {
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }
}

function salvarEdicaoSaida(saidaId) {
  const loja = document.getElementById('editLoja')?.value;
  const categoria = document.getElementById('editCategoria')?.value;
  const descricao = document.getElementById('editDescricao')?.value;
  const valorInput = document.getElementById('editValor')?.value;
  const valor = extrairValorNumerico(valorInput);
  const data = document.getElementById('editData')?.value;
  const recorrente = document.getElementById('editRecorrente')?.value;
  const tipoRecorrencia = document.getElementById('editTipoRecorrencia')?.value;
  const pago = document.getElementById('editPago')?.value;
  
  if (!loja || !categoria || !descricao || valor <= 0 || !data) {
    alert('Preencha todos os campos obrigatórios!');
    return;
  }
  
  let saidaEncontrada = saidas.find(s => s.id === saidaId);
  let listaSaidas = saidas;
  
  if (!saidaEncontrada) {
    saidaEncontrada = saidasPendentes.find(s => s.id === saidaId);
    listaSaidas = saidasPendentes;
  }
  
  if (!saidaEncontrada) {
    alert('Saída não encontrada!');
    return;
  }
  
  const indexAtual = listaSaidas.findIndex(s => s.id === saidaId);
  if (indexAtual !== -1) {
    listaSaidas.splice(indexAtual, 1);
  }
  
  saidas = saidas.filter(s => s.id !== saidaId);
  saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
  
  saidaEncontrada.loja = loja;
  saidaEncontrada.categoria = categoria;
  saidaEncontrada.descricao = descricao;
  saidaEncontrada.valor = valor;
  saidaEncontrada.data = data;
  saidaEncontrada.recorrente = recorrente;
  saidaEncontrada.tipoRecorrencia = recorrente === 'Sim' ? tipoRecorrencia : null;
  saidaEncontrada.pago = pago;
  saidaEncontrada.editadoEm = new Date().toISOString();
  
  if (pago === 'Sim') {
    saidas.unshift(saidaEncontrada);
  } else {
    saidasPendentes.unshift(saidaEncontrada);
  }
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  fecharModal();
  mostrarMensagemSucesso('✅ Saída editada com sucesso!');
}

// ============================================================================
// GESTÃO DE CATEGORIAS E LOJAS (mantidas iguais)
// ============================================================================

function mostrarEditorCategoria() {
  const editor = document.getElementById("editor-categoria");
  if (editor) {
    editor.style.display = editor.style.display === "none" ? "block" : "none";
  }
}

function mostrarEditorLoja() {
  const editor = document.getElementById("editor-loja");
  if (editor) {
    editor.style.display = editor.style.display === "none" ? "block" : "none";
  }
}

function adicionarCategoria() {
  const input = document.getElementById("novaCategoria");
  if (!input) return;
  
  const novaCategoria = input.value.trim();
  
  if (!novaCategoria) {
    alert("Digite o nome da categoria!");
    return;
  }
  
  if (categorias.includes(novaCategoria)) {
    alert("Esta categoria já existe!");
    return;
  }
  
  categorias.push(novaCategoria);
  input.value = "";
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarMensagemSucesso(`✅ Categoria "${novaCategoria}" adicionada!`);
}

function adicionarLoja() {
  const input = document.getElementById("novaLoja");
  if (!input) return;
  
  const novaLoja = input.value.trim();
  
  if (!novaLoja) {
    alert("Digite o nome da loja!");
    return;
  }
  
  if (lojas.includes(novaLoja)) {
    alert("Esta loja já existe!");
    return;
  }
  
  lojas.push(novaLoja);
  input.value = "";
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarMensagemSucesso(`✅ Loja "${novaLoja}" adicionada!`);
}

function mostrarEditorCategoriaExistente() {
  const lista = categorias.map((cat, index) => 
    `${index + 1}. ${cat} <button onclick="removerCategoria(${index})" class="btn btn-danger btn-sm">❌</button>`
  ).join('<br>');
  
  const modal = document.getElementById('modalCustom');
  if (modal) {
    document.getElementById('modalTitulo').textContent = 'Editar Categorias';
    document.getElementById('modalTexto').innerHTML = lista || 'Nenhuma categoria cadastrada.';
    document.getElementById('modalBotoes').innerHTML = `
      <button class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
    `;
    modal.style.display = 'flex';
  }
}

function mostrarEditorLojaExistente() {
  const lista = lojas.map((loja, index) => 
    `${index + 1}. ${loja} <button onclick="removerLoja(${index})" class="btn btn-danger btn-sm">❌</button>`
  ).join('<br>');
  
  const modal = document.getElementById('modalCustom');
  if (modal) {
    document.getElementById('modalTitulo').textContent = 'Editar Lojas';
    document.getElementById('modalTexto').innerHTML = lista || 'Nenhuma loja cadastrada.';
    document.getElementById('modalBotoes').innerHTML = `
      <button class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
    `;
    modal.style.display = 'flex';
  }
}

function removerCategoria(index) {
  const categoria = categorias[index];
  if (confirm(`Tem certeza que deseja remover a categoria "${categoria}"?`)) {
    categorias.splice(index, 1);
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarEditorCategoriaExistente();
    mostrarMensagemSucesso(`✅ Categoria "${categoria}" removida!`);
  }
}

function removerLoja(index) {
  const loja = lojas[index];
  if (confirm(`Tem certeza que deseja remover a loja "${loja}"?`)) {
    lojas.splice(index, 1);
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarEditorLojaExistente();
    mostrarMensagemSucesso(`✅ Loja "${loja}" removida!`);
  }
}

function fecharModal() {
  const modal = document.getElementById('modalCustom');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ============================================================================
// MÚLTIPLAS SAÍDAS (mantidas iguais)
// ============================================================================

function iniciarMultiplasSaidas() {
  multiplasSaidasLista = [];
  contadorMultiplas = 0;
  
  const container = document.getElementById("multiplasSaidasContainer");
  if (container) {
    container.style.display = "block";
    adicionarNovaLinha();
  }
}

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
          <select class="form-select form-select-sm loja-select" id="loja-${contadorMultiplas}">
            ${lojas.map(loja => `<option value="${loja}">${loja}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-2">
          <select class="form-select form-select-sm categoria-select" id="categoria-${contadorMultiplas}">
            ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control form-control-sm descricao-input" id="descricao-${contadorMultiplas}" placeholder="Descrição">
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm valor-input" id="valor-${contadorMultiplas}" placeholder="R$ 0,00" oninput="formatarMoedaMultiplas(this)">
        </div>
        <div class="col-md-2">
          <input type="date" class="form-control form-control-sm data-input" id="data-${contadorMultiplas}" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="col-md-1">
          <select class="form-select form-select-sm pago-select" id="pago-${contadorMultiplas}">
            <option>Sim</option>
            <option>Não</option>
          </select>
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

function formatarMoedaMultiplas(input) {
  let valor = input.value.replace(/\D/g, '');
  
  if (valor === '') {
    input.value = '';
    return;
  }
  
  valor = parseInt(valor);
  const valorFormatado = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  input.value = valorFormatado;
}

function removerLinhaSaida(id) {
  const elemento = document.getElementById(`saida-${id}`);
  if (elemento) {
    elemento.remove();
  }
}

function adicionarTodasSaidas() {
  const listaSaidas = document.getElementById("listaSaidas");
  if (!listaSaidas) return;
  
  const linhas = listaSaidas.querySelectorAll('.saida-item');
  
  let sucessos = 0;
  let erros = 0;
  
  for (const linha of linhas) {
    const id = linha.id.split('-')[1];
    
    const loja = document.getElementById(`loja-${id}`)?.value;
    const categoria = document.getElementById(`categoria-${id}`)?.value;
    const descricao = document.getElementById(`descricao-${id}`)?.value || categoria;
    const valorInput = document.getElementById(`valor-${id}`)?.value;
    const valor = extrairValorNumerico(valorInput);
    const data = document.getElementById(`data-${id}`)?.value;
    const pago = document.getElementById(`pago-${id}`)?.value;
    
    if (valor <= 0) {
      erros++;
      continue;
    }
    
    const saida = {
      id: Date.now() + Math.random() * 1000,
      loja: loja || "Manual",
      categoria: categoria || "Outros",
      descricao: descricao || categoria || "Saída",
      valor,
      data: data || new Date().toISOString().split('T')[0],
      recorrente: "Não",
      tipoRecorrencia: null,
      pago: pago || "Sim",
      origem: 'multiplas',
      timestamp: new Date()
    };
    
    try {
      if (saida.pago === 'Sim') {
        saidas.unshift(saida);
      } else {
        saidasPendentes.unshift(saida);
      }
      sucessos++;
    } catch (error) {
      console.error('❌ Erro saída múltipla:', error);
      erros++;
    }
  }
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  
  cancelarMultiplasSaidas();
  mostrarMensagemSucesso(`✅ ${sucessos} saídas adicionadas! ${erros > 0 ? `(${erros} erros)` : ''}`);
}

function cancelarMultiplasSaidas() {
  const container = document.getElementById("multiplasSaidasContainer");
  if (container) {
    container.style.display = "none";
  }
  
  const listaSaidas = document.getElementById("listaSaidas");
  if (listaSaidas) {
    listaSaidas.innerHTML = "";
  }
  
  multiplasSaidasLista = [];
  contadorMultiplas = 0;
}

// ============================================================================
// INTERFACE E ATUALIZAÇÃO (mantidas iguais + atualização do contador)
// ============================================================================

function atualizarInterfaceCompleta() {
  try {
    console.log('🔄 Atualizando interface completa...');
    
    atualizarCategorias();
    atualizarLojas();
    atualizarFiltros();
    atualizarTabela();
    atualizarDashboard();
    atualizarTodosGraficos();
    
    console.log('✅ Interface atualizada');
  } catch (error) {
    console.error('❌ Erro atualizar interface:', error);
  }
}

function atualizarCategorias() {
  const select = document.getElementById("categoria");
  if (!select) return;
  
  select.innerHTML = "";
  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function atualizarLojas() {
  const select = document.getElementById("loja");
  if (!select) return;
  
  select.innerHTML = "";
  lojas.forEach(loja => {
    const option = document.createElement("option");
    option.value = loja;
    option.textContent = loja;
    select.appendChild(option);
  });
}

function atualizarFiltros() {
  const filtroGlobal = document.getElementById("filtroLojaGlobal");
  if (filtroGlobal) {
    const valorAtual = filtroGlobal.value;
    filtroGlobal.innerHTML = '<option value="">📊 Todas as lojas (Consolidado)</option>';
    
    lojas.forEach(loja => {
      const option = document.createElement("option");
      option.value = loja;
      option.textContent = loja;
      if (loja === valorAtual) option.selected = true;
      filtroGlobal.appendChild(option);
    });
  }

  const filtroRecorrentes = document.getElementById("filtroLojaRecorrentes");
  if (filtroRecorrentes) {
    const valorAtual = filtroRecorrentes.value;
    filtroRecorrentes.innerHTML = '<option value="">Todas as lojas</option>';
    
    lojas.forEach(loja => {
      const option = document.createElement("option");
      option.value = loja;
      option.textContent = loja;
      if (loja === valorAtual) option.selected = true;
      filtroRecorrentes.appendChild(option);
    });
  }

  const filtroCategoria = document.getElementById("filtroCategoriaRecorrentes");
  if (filtroCategoria) {
    const valorAtual = filtroCategoria.value;
    filtroCategoria.innerHTML = '<option value="">Todos os centros de custo</option>';
    
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      if (cat === valorAtual) option.selected = true;
      filtroCategoria.appendChild(option);
    });
  }

  const filtroAno = document.getElementById("filtroAnoRecorrentes");
  if (filtroAno) {
    const valorAtual = filtroAno.value;
    const anosDisponiveis = [...new Set([...saidas, ...saidasPendentes].map(s => s.data.substring(0, 4)))].sort().reverse();
    const anoAtual = new Date().getFullYear().toString();
    
    filtroAno.innerHTML = '<option value="">Todos os anos</option>';
    
    if (anosDisponiveis.length === 0) {
      anosDisponiveis.push(anoAtual);
    }
    
    anosDisponiveis.forEach(ano => {
      const option = document.createElement("option");
      option.value = ano;
      option.textContent = ano;
      if (ano === valorAtual || (!valorAtual && ano === anoAtual)) {
        option.selected = true;
      }
      filtroAno.appendChild(option);
    });
  }

  preencherMesesDoAno();
}

function preencherMesesDoAno() {
  const filtroAno = document.getElementById("filtroAnoRecorrentes");
  const filtroMes = document.getElementById("filtroMesRecorrentes");
  
  if (!filtroMes || !filtroAno) return;
  
  const anoSelecionado = filtroAno.value || new Date().getFullYear().toString();
  const valorAtual = filtroMes.value;
  const mesAtual = `${anoSelecionado}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  const meses = [
    { valor: `${anoSelecionado}-01`, nome: 'Janeiro' },
    { valor: `${anoSelecionado}-02`, nome: 'Fevereiro' },
    { valor: `${anoSelecionado}-03`, nome: 'Março' },
    { valor: `${anoSelecionado}-04`, nome: 'Abril' },
    { valor: `${anoSelecionado}-05`, nome: 'Maio' },
    { valor: `${anoSelecionado}-06`, nome: 'Junho' },
    { valor: `${anoSelecionado}-07`, nome: 'Julho' },
    { valor: `${anoSelecionado}-08`, nome: 'Agosto' },
    { valor: `${anoSelecionado}-09`, nome: 'Setembro' },
    { valor: `${anoSelecionado}-10`, nome: 'Outubro' },
    { valor: `${anoSelecionado}-11`, nome: 'Novembro' },
    { valor: `${anoSelecionado}-12`, nome: 'Dezembro' }
  ];
  
  filtroMes.innerHTML = '<option value="">Todos os meses</option>';
  
  meses.forEach(mes => {
    const option = document.createElement("option");
    option.value = mes.valor;
    option.textContent = mes.nome;
    if (mes.valor === valorAtual || (!valorAtual && mes.valor === mesAtual)) {
      option.selected = true;
    }
    filtroMes.appendChild(option);
  });
}

function atualizarTabela() {
  const tbody = document.getElementById("tabelaSaidas");
  const divAtrasadas = document.getElementById("atrasadas");
  const divVencendoHoje = document.getElementById("vencendoHoje");
  const divProximas = document.getElementById("proximas");
  const divPrevisaoRecorrentes = document.getElementById("previsaoRecorrentes");
  
  if (!tbody) return;
  
  tbody.innerHTML = "";
  if (divAtrasadas) divAtrasadas.innerHTML = "";
  if (divVencendoHoje) divVencendoHoje.innerHTML = "";
  if (divProximas) divProximas.innerHTML = "";
  if (divPrevisaoRecorrentes) divPrevisaoRecorrentes.innerHTML = "";
  
  const hoje = new Date();
  const dataHoje = hoje.toISOString().split('T')[0];
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  const saidasMes = [];
  const saidasAtrasadas = [];
  const saidasVencendoHoje = [];
  const saidasProximas = [];
  const saidasRecorrentes = [];
  
  [...saidas, ...saidasPendentes].forEach(s => {
    if (lojaFiltroAtual && s.loja !== lojaFiltroAtual) return;
    
    const dataSaida = s.data;
    
    if (s.recorrente === 'Sim') {
      saidasRecorrentes.push(s);
    }
    
    if (s.pago === 'Não') {
      if (dataSaida < dataHoje) {
        const diasAtrasado = Math.floor((hoje - new Date(dataSaida + 'T00:00:00')) / (1000 * 60 * 60 * 24));
        saidasAtrasadas.push({...s, diasAtrasado});
      } else if (dataSaida === dataHoje) {
        saidasVencendoHoje.push(s);
      } else {
        const diasRestantes = Math.floor((new Date(dataSaida + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 7) {
          saidasProximas.push({...s, diasRestantes});
        }
      }
    }
    
    if (s.data.substring(0, 7) === anoMes) {
      saidasMes.push(s);
    }
  });
  
  saidasMes.sort((a, b) => new Date(b.data) - new Date(a.data));
  saidasAtrasadas.sort((a, b) => b.diasAtrasado - a.diasAtrasado);
  saidasVencendoHoje.sort((a, b) => new Date(a.data) - new Date(b.data));
  saidasProximas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  
  preencherTabelaDoMes(tbody, saidasMes);
  preencherTabelaAtrasadas(divAtrasadas, saidasAtrasadas);
  preencherTabelaVencendoHoje(divVencendoHoje, saidasVencendoHoje);
  preencherTabelaProximas(divProximas, saidasProximas);
  preencherTabelaRecorrentes(divPrevisaoRecorrentes, saidasRecorrentes);
  
  // NOVO: Atualizar contador de saídas
  atualizarContadorSaidas();
}

function preencherTabelaDoMes(tbody, saidas) {
  saidas.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${s.loja}</strong></td>
      <td>${s.categoria}</td>
      <td>${s.descricao}</td>
      <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
      <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td><span class="badge ${s.recorrente === 'Sim' ? 'bg-info' : 'bg-secondary'}">${s.recorrente}</span></td>
      <td>${s.tipoRecorrencia || '-'}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function preencherTabelaAtrasadas(container, saidas) {
  if (!container) return;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Nenhuma saída atrasada.</p>';
    return;
  }
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Dias Atrasado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${saidas.map(s => `
            <tr>
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td><span class="badge bg-danger">${s.diasAtrasado} dias</span></td>
              <td>
                <button class="btn btn-success btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
                  <i class="fas fa-check"></i> Pagar
                </button>
                <button class="btn btn-warning btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tabela;
}

function preencherTabelaVencendoHoje(container, saidas) {
  if (!container) return;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Nenhuma saída vencendo hoje.</p>';
    return;
  }
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${saidas.map(s => `
            <tr>
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>
                <button class="btn btn-success btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
                  <i class="fas fa-check"></i> Pagar
                </button>
                <button class="btn btn-warning btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tabela;
}

function preencherTabelaProximas(container, saidas) {
  if (!container) return;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Nenhuma saída próxima ao vencimento.</p>';
    return;
  }
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Dias Restantes</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${saidas.map(s => `
            <tr>
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td><span class="badge bg-warning">${s.diasRestantes} dias</span></td>
              <td>
                <button class="btn btn-success btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
                  <i class="fas fa-check"></i> Pagar
                </button>
                <button class="btn btn-warning btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tabela;
}

function preencherTabelaRecorrentes(container, saidas) {
  if (!container) return;
  
  let saidasFiltradas = [...saidas];
  
  const filtroLoja = document.getElementById("filtroLojaRecorrentes")?.value;
  const filtroAno = document.getElementById("filtroAnoRecorrentes")?.value;
  const filtroMes = document.getElementById("filtroMesRecorrentes")?.value;
  const filtroCategoria = document.getElementById("filtroCategoriaRecorrentes")?.value;
  
  if (filtroLoja) {
    saidasFiltradas = saidasFiltradas.filter(s => s.loja === filtroLoja);
  }
  
  if (filtroAno) {
    saidasFiltradas = saidasFiltradas.filter(s => s.data.substring(0, 4) === filtroAno);
  }
  
  if (filtroMes) {
    saidasFiltradas = saidasFiltradas.filter(s => s.data.substring(0, 7) === filtroMes);
  }
  
  if (filtroCategoria) {
    saidasFiltradas = saidasFiltradas.filter(s => s.categoria === filtroCategoria);
  }
  
  if (saidasFiltradas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Nenhuma saída recorrente encontrada com os filtros aplicados.</p>';
    atualizarTotalRecorrentes(0);
    return;
  }
  
  saidasFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${saidasFiltradas.map(s => `
            <tr>
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td><span class="badge bg-info">${s.tipoRecorrencia || 'Mensal'}</span></td>
              <td><span class="badge ${s.pago === 'Sim' ? 'bg-success' : 'bg-warning'}">${s.pago}</span></td>
              <td>
                ${s.pago === 'Não' ? `<button class="btn btn-success btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago"><i class="fas fa-check"></i> Pagar</button>` : ''}
                <button class="btn btn-warning btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tabela;
  
  const total = saidasFiltradas.reduce((sum, s) => sum + s.valor, 0);
  atualizarTotalRecorrentes(total);
}

function atualizarTotalRecorrentes(total) {
  const elemento = document.getElementById("totalSaidasRecorrentes");
  if (elemento) {
    elemento.textContent = formatarMoedaBR(total);
  }
}

function filtrarRecorrentesPorFiltros() {
  atualizarTabela();
}

function limparFiltrosRecorrentes() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear().toString();
  const mesAtual = `${anoAtual}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  const filtros = [
    { id: "filtroLojaRecorrentes", valor: "" },
    { id: "filtroAnoRecorrentes", valor: anoAtual },
    { id: "filtroMesRecorrentes", valor: mesAtual },
    { id: "filtroCategoriaRecorrentes", valor: "" }
  ];
  
  filtros.forEach(filtro => {
    const elemento = document.getElementById(filtro.id);
    if (elemento) {
      elemento.value = filtro.valor;
    }
  });
  
  preencherMesesDoAno();
  filtrarRecorrentesPorFiltros();
}

function atualizarDashboard() {
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });

  if (lojaFiltroAtual) {
    saidasMes = saidasMes.filter(s => s.loja === lojaFiltroAtual);
  }

  const totalMes = saidasMes.reduce((sum, s) => sum + s.valor, 0);
  const elementoTotalMes = document.getElementById("totalMes");
  if (elementoTotalMes) {
    elementoTotalMes.textContent = formatarMoedaBR(totalMes);
  }

  const totalRecorrente = saidasMes.filter(s => s.recorrente === 'Sim').reduce((sum, s) => sum + s.valor, 0);
  const elementoTotalRecorrente = document.getElementById("totalRecorrente");
  if (elementoTotalRecorrente) {
    elementoTotalRecorrente.textContent = formatarMoedaBR(totalRecorrente);
  }

  const maiorGasto = saidasMes.length > 0 ? Math.max(...saidasMes.map(s => s.valor)) : 0;
  const elementoMaiorGasto = document.getElementById("maiorGasto");
  if (elementoMaiorGasto) {
    elementoMaiorGasto.textContent = formatarMoedaBR(maiorGasto);
  }

  const categoriaCount = {};
  saidasMes.forEach(s => {
    categoriaCount[s.categoria] = (categoriaCount[s.categoria] || 0) + s.valor;
  });
  
  const categoriaTopo = Object.keys(categoriaCount).length > 0 
    ? Object.keys(categoriaCount).reduce((a, b) => categoriaCount[a] > categoriaCount[b] ? a : b)
    : '-';
  const elementoCategoriaTopo = document.getElementById("categoriaTopo");
  if (elementoCategoriaTopo) {
    elementoCategoriaTopo.textContent = categoriaTopo;
  }

  const elementoTotalSaidas = document.getElementById("totalSaidas");
  if (elementoTotalSaidas) {
    elementoTotalSaidas.textContent = saidasMes.length;
  }
}

function atualizarTodosGraficos() {
  try {
    console.log('📊 Atualizando TODOS os gráficos...');
    
    const hoje = new Date();
    const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    
    let dadosGrafico = [...saidas, ...saidasPendentes].filter(s => {
      const saidaAnoMes = s.data.substring(0, 7);
      return saidaAnoMes === anoMes;
    });

    if (lojaFiltroAtual) {
      dadosGrafico = dadosGrafico.filter(s => s.loja === lojaFiltroAtual);
    }
    
    atualizarGraficoCategoria(dadosGrafico);
    atualizarGraficoTipo(dadosGrafico);
    atualizarGraficoLojas(dadosGrafico);
    atualizarGraficoMeses();
    atualizarGraficoCentrosCusto();
    
    console.log('✅ Todos os gráficos atualizados');
    
  } catch (error) {
    console.error('❌ Erro gráficos:', error);
  }
}

function atualizarGraficoCategoria(dados) {
  const ctx = document.getElementById('graficoCategoria');
  if (!ctx) return;
  
  try {
    if (window.chartCategoria) {
      window.chartCategoria.destroy();
    }
    
    const categoriaValues = {};
    dados.forEach(s => {
      categoriaValues[s.categoria] = (categoriaValues[s.categoria] || 0) + s.valor;
    });
    
    const labels = Object.keys(categoriaValues);
    const values = Object.values(categoriaValues);
    
    if (labels.length === 0) {
      return;
    }
    
    const cores = [
      '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
      '#ef4444', '#06b6d4', '#84cc16', '#f97316',
      '#ec4899', '#6366f1', '#14b8a6', '#eab308'
    ];
    
    window.chartCategoria = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: cores.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro gráfico categoria:', error);
  }
}

function atualizarGraficoTipo(dados) {
  const ctx = document.getElementById('graficoTipo');
  if (!ctx) return;
  
  try {
    if (window.chartTipo) {
      window.chartTipo.destroy();
    }
    
    const pago = dados.filter(s => s.pago === 'Sim').reduce((sum, s) => sum + s.valor, 0);
    const pendente = dados.filter(s => s.pago === 'Não').reduce((sum, s) => sum + s.valor, 0);
    
    if (pago === 0 && pendente === 0) {
      return;
    }
    
    window.chartTipo = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Pago', 'Pendente'],
        datasets: [{
          data: [pago, pendente],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro gráfico tipo:', error);
  }
}

function atualizarGraficoLojas(dados) {
  const ctx = document.getElementById('graficoLojas');
  if (!ctx) return;
  
  try {
    if (window.chartLojas) {
      window.chartLojas.destroy();
    }
    
    const lojaValues = {};
    dados.forEach(s => {
      lojaValues[s.loja] = (lojaValues[s.loja] || 0) + s.valor;
    });
    
    const labels = Object.keys(lojaValues);
    const values = Object.values(lojaValues);
    
    if (labels.length === 0) {
      return;
    }
    
    window.chartLojas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Valor Total',
          data: values,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro gráfico lojas:', error);
  }
}

function atualizarGraficoMeses() {
  const ctx = document.getElementById('graficoMes');
  if (!ctx) return;
  
  try {
    if (window.chartMes) {
      window.chartMes.destroy();
    }
    
    const mesesData = {};
    const hoje = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const mesNome = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      mesesData[mesKey] = { nome: mesNome, valor: 0 };
    }
    
    [...saidas, ...saidasPendentes].forEach(s => {
      const mesKey = s.data.substring(0, 7);
      if (mesesData[mesKey]) {
        if (!lojaFiltroAtual || s.loja === lojaFiltroAtual) {
          mesesData[mesKey].valor += s.valor;
        }
      }
    });
    
    const labels = Object.values(mesesData).map(m => m.nome);
    const values = Object.values(mesesData).map(m => m.valor);
    
    window.chartMes = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Valor Mensal',
          data: values,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10b981',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro gráfico meses:', error);
  }
}

function atualizarGraficoCentrosCusto() {
  const ctx = document.getElementById('graficoCentrosCusto');
  if (!ctx) return;
  
  try {
    if (window.chartCentrosCusto) {
      window.chartCentrosCusto.destroy();
    }
    
    const lojasCategorias = {};
    
    [...saidas, ...saidasPendentes].forEach(s => {
      if (lojaFiltroAtual && s.loja !== lojaFiltroAtual) return;
      
      if (!lojasCategorias[s.loja]) {
        lojasCategorias[s.loja] = {};
      }
      
      if (!lojasCategorias[s.loja][s.categoria]) {
        lojasCategorias[s.loja][s.categoria] = 0;
      }
      
      lojasCategorias[s.loja][s.categoria] += s.valor;
    });
    
    const todasCategorias = [...new Set([...saidas, ...saidasPendentes].map(s => s.categoria))];
    const lojaLabels = Object.keys(lojasCategorias);
    
    const cores = [
      '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
      '#ef4444', '#06b6d4', '#84cc16', '#f97316',
      '#ec4899', '#6366f1', '#14b8a6', '#eab308'
    ];
    
    const datasets = todasCategorias.map((categoria, index) => ({
      label: categoria,
      data: lojaLabels.map(loja => lojasCategorias[loja][categoria] || 0),
      backgroundColor: cores[index % cores.length],
      borderColor: cores[index % cores.length],
      borderWidth: 1
    }));
    
    window.chartCentrosCusto = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lojaLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro gráfico centros de custo:', error);
  }
}

function aplicarFiltroLoja() {
  const filtro = document.getElementById("filtroLojaGlobal");
  lojaFiltroAtual = filtro ? filtro.value : "";
  atualizarTabela();
  atualizarDashboard();
  atualizarTodosGraficos();
}

function toggleTipoRecorrencia() {
  const recorrente = document.getElementById("recorrente");
  const coluna = document.getElementById("colunaTipoRecorrencia");
  
  if (recorrente && coluna) {
    if (recorrente.value === "Sim") {
      coluna.style.display = "block";
    } else {
      coluna.style.display = "none";
      const tipoRecorrencia = document.getElementById("tipoRecorrencia");
      if (tipoRecorrencia) {
        tipoRecorrencia.value = "";
      }
    }
  }
}

function formatarMoedaBR(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function mostrarMensagemSucesso(texto = '✅ Operação realizada!') {
  const mensagem = document.getElementById("mensagemSucesso");
  if (!mensagem) return;
  
  mensagem.textContent = texto;
  mensagem.style.display = "block";
  
  setTimeout(() => {
    mensagem.style.display = "none";
  }, 3000);
}

function formatarMoeda(input) {
  let valor = input.value.replace(/\D/g, '');
  
  if (valor === '') {
    input.value = '';
    return;
  }
  
  valor = parseInt(valor);
  const valorFormatado = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  input.value = valorFormatado;
}

function extrairValorNumerico(valorFormatado) {
  if (!valorFormatado) return 0;
  return parseFloat(valorFormatado.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

function limparFormulario() {
  const campos = ['descricao', 'valor'];
  campos.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) elemento.value = '';
  });
  
  const dataElement = document.getElementById('data');
  if (dataElement) {
    dataElement.value = new Date().toISOString().split('T')[0];
  }
}

function salvarDadosLocal() {
  try {
    const dadosBackup = {
      categorias,
      lojas, 
      saidas,
      saidasPendentes,
      treinamentosIA,
      treinamentosNaturais,
      versao: '1.0.0',
      ultimoBackup: new Date().toISOString(),
      totalSaidas: saidas.length + saidasPendentes.length
    };
    
    localStorage.setItem('iclubSaidas', JSON.stringify(dadosBackup));
    localStorage.setItem('iclubSaidasBackup', JSON.stringify(dadosBackup));
    
    console.log('💾 Backup local salvo:', dadosBackup.totalSaidas, 'saídas');
  } catch (error) {
    console.error('❌ Erro salvar backup:', error);
  }
}

function carregarDadosLocal() {
  try {
    let dadosSalvos = localStorage.getItem('iclubSaidas');
    
    if (!dadosSalvos) {
      dadosSalvos = localStorage.getItem('iclubSaidasBackup');
    }
    
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      
      if (dados.categorias) categorias = dados.categorias;
      if (dados.lojas) lojas = dados.lojas;
      if (dados.saidas) saidas = dados.saidas;
      if (dados.saidasPendentes) saidasPendentes = dados.saidasPendentes;
      if (dados.treinamentosIA) treinamentosIA = dados.treinamentosIA;
      if (dados.treinamentosNaturais) treinamentosNaturais = dados.treinamentosNaturais;
      
      console.log('📂 Backup local carregado:', dados.totalSaidas || 0, 'saídas');
      
      return true;
    } else {
      console.log('📂 Nenhum backup local encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro carregar backup:', error);
    return false;
  }
}

// ============================================================================
// ANÁLISE INTELIGENTE (mantida igual)
// ============================================================================

let dadosParaAnalise = [];
let analiseCompleta = null;

async function abrirAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  const loading = document.getElementById('analiseLoading');
  const resultado = document.getElementById('analiseResultado');
  
  if (!modal || !loading || !resultado) {
    alert('Modal de análise não encontrado');
    return;
  }
  
  modal.style.display = 'block';
  loading.style.display = 'block';
  resultado.style.display = 'none';
  
  const progressoBarra = document.getElementById('progressoBarra');
  if (progressoBarra) {
    progressoBarra.style.width = '0%';
  }
  
  try {
    await simularProgressoAnalise();
    const analise = await executarAnaliseInteligente();
    exibirResultadosAnalise(analise);
    
    loading.style.display = 'none';
    resultado.style.display = 'block';
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    loading.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
        <h4>Erro na Análise</h4>
        <p>Não foi possível processar os dados. Tente novamente.</p>
        <button class="btn-analise-inteligente" onclick="fecharAnaliseInteligente()">Fechar</button>
      </div>
    `;
  }
}

function fecharAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function simularProgressoAnalise() {
  const etapas = [
    { progresso: 10, texto: 'Carregando dados locais...' },
    { progresso: 25, texto: 'Processando padrões de gastos...' },
    { progresso: 45, texto: 'Analisando tendências temporais...' },
    { progresso: 65, texto: 'Identificando oportunidades...' },
    { progresso: 80, texto: 'Gerando insights inteligentes...' },
    { progresso: 95, texto: 'Finalizando análise...' },
    { progresso: 100, texto: 'Análise concluída!' }
  ];

  for (const etapa of etapas) {
    const progressoBarra = document.getElementById('progressoBarra');
    const etapaAnalise = document.getElementById('etapaAnalise');
    
    if (progressoBarra) {
      progressoBarra.style.width = etapa.progresso + '%';
    }
    if (etapaAnalise) {
      etapaAnalise.textContent = etapa.texto;
    }
    
    await new Promise(resolve => setTimeout(resolve, 600));
  }
}

async function executarAnaliseInteligente() {
  dadosParaAnalise = await coletarDadosParaAnalise();
  
  const analise = {
    resumoExecutivo: gerarResumoExecutivo(dadosParaAnalise),
    insights: gerarInsightsPrincipais(dadosParaAnalise)
  };

  analiseCompleta = analise;
  return analise;
}

async function coletarDadosParaAnalise() {
  const todasSaidas = [...saidas, ...saidasPendentes];
  
  const dados = {
    saidas: todasSaidas,
    totalSaidas: todasSaidas.length,
    valorTotal: todasSaidas.reduce((sum, s) => sum + (s.valor || 0), 0),
    categorias: agruparPorCategoria(todasSaidas),
    lojas: agruparPorLoja(todasSaidas),
    statusPagamento: agruparPorStatus(todasSaidas)
  };

  return dados;
}

function agruparPorCategoria(saidas) {
  const grupos = {};
  saidas.forEach(s => {
    if (!grupos[s.categoria]) {
      grupos[s.categoria] = { itens: [], total: 0, count: 0 };
    }
    grupos[s.categoria].itens.push(s);
    grupos[s.categoria].total += s.valor || 0;
    grupos[s.categoria].count++;
  });
  return grupos;
}

function agruparPorLoja(saidas) {
  const grupos = {};
  saidas.forEach(s => {
    if (!grupos[s.loja]) {
      grupos[s.loja] = { itens: [], total: 0, count: 0 };
    }
    grupos[s.loja].itens.push(s);
    grupos[s.loja].total += s.valor || 0;
    grupos[s.loja].count++;
  });
  return grupos;
}

function agruparPorStatus(saidas) {
  const pagos = saidas.filter(s => s.pago === 'Sim');
  const pendentes = saidas.filter(s => s.pago === 'Não');
  
  return {
    pagos: {
      itens: pagos,
      total: pagos.reduce((sum, s) => sum + (s.valor || 0), 0),
      count: pagos.length
    },
    pendentes: {
      itens: pendentes,
      total: pendentes.reduce((sum, s) => sum + (s.valor || 0), 0),
      count: pendentes.length
    }
  };
}

function gerarResumoExecutivo(dados) {
  const ticketMedio = dados.totalSaidas > 0 ? dados.valorTotal / dados.totalSaidas : 0;
  const categoriaTop = Object.keys(dados.categorias).length > 0 ? 
    Object.keys(dados.categorias).reduce((a, b) => 
      dados.categorias[a].total > dados.categorias[b].total ? a : b, 
      Object.keys(dados.categorias)[0]
    ) : 'N/A';
  
  return {
    valorTotal: dados.valorTotal,
    totalSaidas: dados.totalSaidas,
    ticketMedio: ticketMedio,
    categoriaTop: categoriaTop,
    percentualPendente: dados.totalSaidas > 0 ? 
      (dados.statusPagamento.pendentes.count / dados.totalSaidas * 100) : 0
  };
}

function gerarInsightsPrincipais(dados) {
  const insights = [];
  
  if (Object.keys(dados.categorias).length > 0) {
    const categoriaTop = Object.entries(dados.categorias)
      .sort(([,a], [,b]) => b.total - a.total)[0];
    
    if (categoriaTop) {
      const [categoria, dadosCategoria] = categoriaTop;
      const percentual = (dadosCategoria.total / dados.valorTotal * 100);
      
      insights.push({
        tipo: 'insight',
        titulo: 'Categoria Dominante',
        valor: percentual.toFixed(1) + '%',
        descricao: `A categoria "${categoria}" representa ${percentual.toFixed(1)}% dos seus gastos totais (${formatarMoedaBR(dadosCategoria.total)}). Essa concentração pode indicar oportunidades de otimização.`,
        acoes: ['Analisar fornecedores', 'Buscar alternativas', 'Negociar preços']
      });
    }
  }

  if (dados.statusPagamento.pendentes.count > 0) {
    const percentualPendente = (dados.statusPagamento.pendentes.count / dados.totalSaidas * 100);
    
    if (percentualPendente > 30) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Alto Volume de Pendências',
        valor: dados.statusPagamento.pendentes.count + ' saídas',
        descricao: `Você tem ${dados.statusPagamento.pendentes.count} saídas pendentes (${percentualPendente.toFixed(1)}%), totalizando ${formatarMoedaBR(dados.statusPagamento.pendentes.total)}. Isso pode impactar seu fluxo de caixa.`,
        acoes: ['Priorizar pagamentos', 'Renegociar prazos', 'Organizar cronograma']
      });
    }
  }

  if (Object.keys(dados.lojas).length > 1) {
    const lojasOrdenadas = Object.entries(dados.lojas)
      .sort(([,a], [,b]) => b.total - a.total);
    
    const lojaTop = lojasOrdenadas[0];
    const percentualLojaTop = (lojaTop[1].total / dados.valorTotal * 100);
    
    insights.push({
      tipo: 'tendencia',
      titulo: 'Loja com Maior Movimento',
      valor: percentualLojaTop.toFixed(1) + '%',
      descricao: `A "${lojaTop[0]}" concentra ${percentualLojaTop.toFixed(1)}% dos gastos (${formatarMoedaBR(lojaTop[1].total)}). Verifique se essa distribuição está alinhada com o planejamento.`,
      acoes: ['Revisar distribuição', 'Balancear investimentos', 'Analisar rentabilidade']
    });
  }

  return insights;
}

function exibirResultadosAnalise(analise) {
  const container = document.getElementById('analiseResultado');
  
  if (!container) return;
  
  let html = `
    <div class="resumo-executivo">
      <h4 class="resumo-titulo">📊 Resumo Executivo</h4>
      <p>Análise completa dos dados do sistema iClub</p>
      <div class="resumo-stats">
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${analise.resumoExecutivo.totalSaidas}</div>
          <div class="resumo-stat-label">Total Saídas</div>
        </div>
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${formatarMoedaBR(analise.resumoExecutivo.ticketMedio)}</div>
          <div class="resumo-stat-label">Ticket Médio</div>
        </div>
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${analise.resumoExecutivo.categoriaTop}</div>
          <div class="resumo-stat-label">Categoria Top</div>
        </div>
      </div>
    </div>
  `;

  if (analise.insights && analise.insights.length > 0) {
    analise.insights.forEach(insight => {
      html += `
        <div class="insight-card tipo-${insight.tipo}">
          <div class="insight-header">
            <div class="insight-icon ${insight.tipo}">
              <i class="fas fa-${insight.tipo === 'alerta' ? 'exclamation-triangle' : insight.tipo === 'tendencia' ? 'chart-line' : 'lightbulb'}"></i>
            </div>
            <div>
              <h6 class="insight-titulo">${insight.titulo}</h6>
              <p class="insight-valor">${insight.valor}</p>
            </div>
          </div>
          <div class="insight-descricao">
            ${insight.descricao}
          </div>
          <div class="insight-acoes">
            ${insight.acoes.map(acao => `<span class="insight-acao">${acao}</span>`).join('')}
          </div>
        </div>
      `;
    });
  } else {
    html += `
      <div class="insight-card">
        <div class="insight-header">
          <div class="insight-icon insight">
            <i class="fas fa-info-circle"></i>
          </div>
          <div>
            <h6 class="insight-titulo">Sistema Funcionando</h6>
            <p class="insight-valor">Dados insuficientes</p>
          </div>
        </div>
        <div class="insight-descricao">
          Adicione mais saídas para gerar insights mais detalhados. O sistema precisa de dados para criar análises inteligentes.
        </div>
        <div class="insight-acoes">
          <span class="insight-acao">Adicionar mais dados</span>
          <span class="insight-acao">Usar Chat IA</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ============================================================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================================================

window.addEventListener('load', async () => {
  try {
    console.log('🚀 Iniciando aplicação iClub...');
    
    const dataElement = document.getElementById('data');
    if (dataElement && !dataElement.value) {
      dataElement.value = new Date().toISOString().split('T')[0];
    }
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          enviarMensagemChat();
        }
      });
    }
    
    const backupOK = carregarDadosLocal();
    if (backupOK) {
      console.log('✅ Dados carregados do backup local');
    }
    
    atualizarInterfaceCompleta();
    
    const totalSaidas = saidas.length + saidasPendentes.length;
    console.log('✅ Sistema carregado:', totalSaidas, 'saídas total');
    
    if (totalSaidas > 0) {
      mostrarMensagemSucesso(`✅ Sistema carregado! ${totalSaidas} saídas encontradas.`);
    } else {
      mostrarMensagemSucesso('✅ Sistema carregado! Pronto para uso.');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    mostrarMensagemSucesso('❌ Erro ao carregar. Verifique o console.');
  }
});

// ============================================================================
// EXPORTAÇÃO DE FUNÇÕES GLOBAIS
// ============================================================================

window.mostrarTreinamentoIA = mostrarTreinamentoIA;
window.fecharTreinamentoIA = fecharTreinamentoIA;
window.salvarTreinamentoNatural = salvarTreinamentoNatural;
window.salvarTreinamentoManual = salvarTreinamentoManual;
window.enviarMensagemChat = enviarMensagemChat;
window.limparChat = limparChat;
window.adicionarSaida = adicionarSaida;
window.excluirSaida = excluirSaida;
window.editarSaida = editarSaida;
window.toggleEditRecorrencia = toggleEditRecorrencia;
window.salvarEdicaoSaida = salvarEdicaoSaida;
window.marcarComoPago = marcarComoPago;
window.mostrarEditorCategoria = mostrarEditorCategoria;
window.mostrarEditorLoja = mostrarEditorLoja;
window.adicionarCategoria = adicionarCategoria;
window.adicionarLoja = adicionarLoja;
window.mostrarEditorCategoriaExistente = mostrarEditorCategoriaExistente;
window.mostrarEditorLojaExistente = mostrarEditorLojaExistente;
window.removerCategoria = removerCategoria;
window.removerLoja = removerLoja;
window.fecharModal = fecharModal;
window.iniciarMultiplasSaidas = iniciarMultiplasSaidas;
window.adicionarNovaLinha = adicionarNovaLinha;
window.removerLinhaSaida = removerLinhaSaida;
window.adicionarTodasSaidas = adicionarTodasSaidas;
window.cancelarMultiplasSaidas = cancelarMultiplasSaidas;
window.formatarMoedaMultiplas = formatarMoedaMultiplas;
window.aplicarFiltroLoja = aplicarFiltroLoja;
window.toggleTipoRecorrencia = toggleTipoRecorrencia;
window.filtrarRecorrentesPorFiltros = filtrarRecorrentesPorFiltros;
window.limparFiltrosRecorrentes = limparFiltrosRecorrentes;
window.preencherMesesDoAno = preencherMesesDoAno;
window.formatarMoeda = formatarMoeda;
window.abrirAnaliseInteligente = abrirAnaliseInteligente;
window.fecharAnaliseInteligente = fecharAnaliseInteligente;
window.toggleVerMais = toggleVerMais; // NOVO

console.log('✅ Sistema iClub TOTALMENTE FUNCIONAL + MELHORIAS!');
console.log('🧠 IA com treinamento natural implementado');
console.log('🏷️ Sistema de criação automática de centros de custo');
console.log('📊 Classificação de status (vencida/futura/atual)');
console.log('🎨 Nova cor rosa para análise inteligente');
console.log('📄 Sistema "Ver mais" para saídas do mês');
console.log('🔧 Todas as funcionalidades operacionais');// painel.js - SISTEMA ICLUB CORRIGIDO E FUNCIONAL + MELHORIAS
// ============================================================================
// SISTEMA PRINCIPAL ICLUB - TOTALMENTE REVISADO + MELHORIAS ADICIONADAS
// ============================================================================

// Variáveis globais
let categorias = [
  "Aluguel", "Energia", "Internet", "Combustível", "Material", 
  "Transporte", "Alimentação", "Marketing", "Saúde"
];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";
let multiplasSaidasLista = [];
let contadorMultiplas = 0;

// Treinamento IA Melhorado
let treinamentosIA = JSON.parse(localStorage.getItem('treinamentosIA') || '[]');
let treinamentosNaturais = JSON.parse(localStorage.getItem('treinamentosNaturais') || '[]');

// Chat IA + MELHORIAS ADICIONADAS
let aguardandoSelecaoLoja = false;
let saidaPendenteLoja = null;

// ===== NOVAS VARIÁVEIS PARA MELHORIAS =====
let aguardandoCriacaoCategoria = false;
let saidaPendenteCategoria = null;
let categoriaParaCriar = null;
let saidasMesLimitadas = true; // Para controle do "Ver mais"