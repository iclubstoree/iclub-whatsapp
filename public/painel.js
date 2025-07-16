// painel.js - SISTEMA ICLUB VERSÃO COMPLETA E CORRIGIDA
// ============================================================================
// TODAS AS FUNCIONALIDADES IMPLEMENTADAS E FUNCIONANDO
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

// Treinamento IA
let treinamentosIA = JSON.parse(localStorage.getItem('treinamentosIA') || '[]');
let treinamentosNaturais = JSON.parse(localStorage.getItem('treinamentosNaturais') || '[]');

// Chat IA
let aguardandoSelecaoLoja = false;
let saidaPendenteLoja = null;
let ultimaMensagemUsuario = '';
let ultimoValorDetectado = 0;

// Sistema de paginação
let paginacao = {
  saidasMes: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 },
  proximasSaidas: { mostrandoTodos: false, limite: 7 }
};

// Dias da semana em português
const diasSemana = {
  'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3, 
  'quinta': 4, 'sexta': 5, 'sabado': 6,
  'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6, 'dom': 0
};

// ============================================================================
// SISTEMA DE NOTIFICAÇÕES INTELIGENTES
// ============================================================================

function mostrarNotificacaoInteligente(texto = '✅ Operação realizada!', tipo = 'success') {
  const notificacao = document.getElementById("notificacaoInteligente");
  const textoElement = document.getElementById("textoNotificacao");
  
  if (!notificacao || !textoElement) return;
  
  // Configurar tipo de notificação
  notificacao.className = 'notificacao-inteligente';
  
  if (tipo === 'error') {
    notificacao.classList.add('error');
    textoElement.innerHTML = `<i class="fas fa-exclamation-circle" style="margin-right: 10px;"></i>${texto}`;
  } else if (tipo === 'warning') {
    notificacao.classList.add('warning');
    textoElement.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>${texto}`;
  } else {
    textoElement.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 10px;"></i>${texto}`;
  }
  
  // Mostrar notificação
  notificacao.classList.add('show');
  
  // Ocultar após 4 segundos
  setTimeout(() => {
    notificacao.classList.remove('show');
  }, 4000);
}

// ============================================================================
// MODAL TREINAMENTO IA
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
    mostrarNotificacaoInteligente('Digite o texto de treinamento!', 'error');
    return;
  }
  
  const padroesTreinamento = processarTreinamentoNatural(textoTreinamento);
  
  if (padroesTreinamento.length === 0) {
    mostrarNotificacaoInteligente('Não consegui identificar padrões válidos no texto. Tente ser mais específico.', 'warning');
    return;
  }
  
  padroesTreinamento.forEach(padrao => {
    // Adicionar categoria se não existir
    if (!categorias.includes(padrao.categoria)) {
      categorias.push(padrao.categoria);
    }
    
    treinamentosNaturais.push({
      id: Date.now() + Math.random(),
      textoOriginal: textoTreinamento,
      palavra: padrao.palavra,
      categoria: padrao.categoria,
      criadoEm: new Date().toISOString()
    });
  });
  
  localStorage.setItem('treinamentosNaturais', JSON.stringify(treinamentosNaturais));
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  
  mostrarNotificacaoInteligente(`✅ IA treinada! ${padroesTreinamento.length} padrão(ões) aprendido(s).`);
  document.getElementById('treinamentoNatural').value = '';
  listarTreinamentos();
}

function processarTreinamentoNatural(texto) {
  const padroes = [];
  const textoLower = texto.toLowerCase();
  
  const regexPadroes = [
    /quando\s+eu\s+falar\s+([^,]+?)\s+(?:você\s+vai\s+adicionar|adicione)\s+(?:ao\s+centro\s+de\s+custos?|na\s+categoria)\s+([^,.]+)/gi,
    /quando\s+falar\s+([^,]+?)\s+(?:adicione|vai\s+para)\s+(?:na\s+categoria|ao\s+centro\s+de\s+custos?)\s+([^,.]+)/gi,
    /([^,]+?)\s+vai\s+para\s+(?:categoria|centro\s+de\s+custos?)\s+([^,.]+)/gi,
    /adicione\s+centro\s+de\s+custo\s+([^,]+?)\s+e\s+quando\s+falar\s+([^,]+?)\s+adicione\s+no\s+centro\s+de\s+custo\s+([^,.]+)/gi
  ];
  
  regexPadroes.forEach(regex => {
    let match;
    while ((match = regex.exec(textoLower)) !== null) {
      if (match.length >= 3) {
        let palavra, categoria;
        
        if (match.length === 4) {
          // Para o regex com 3 grupos: adicione centro de custo X e quando falar Y adicione no centro de custo Z
          categoria = match[1].trim();
          palavra = match[2].trim();
        } else {
          // Para outros regex
          palavra = match[1].trim();
          categoria = match[2].trim();
        }
        
        if (palavra && categoria) {
          padroes.push({
            palavra: palavra,
            categoria: categoria.charAt(0).toUpperCase() + categoria.slice(1).trim()
          });
        }
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
    mostrarNotificacaoInteligente('Preencha todos os campos para treinar a IA!', 'warning');
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
  
  mostrarNotificacaoInteligente('✅ Treinamento manual salvo!');
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
// CHAT IA INTELIGENTE COMPLETO
// ============================================================================

function enviarMensagemChat() {
  const input = document.getElementById('chatInput');
  const mensagem = input?.value.trim();
  
  if (!mensagem) return;
  
  input.value = '';
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  
  // Comando direto de treinamento
  if (mensagem.toLowerCase().includes('adicione centro de custo')) {
    processarComandoTreinamentoDireto(mensagem);
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

function processarComandoTreinamentoDireto(mensagem) {
  adicionarMensagemChat('user', mensagem);
  
  const padroesTreinamento = processarTreinamentoNatural(mensagem);
  
  if (padroesTreinamento.length > 0) {
    padroesTreinamento.forEach(padrao => {
      // Adicionar categoria se não existir
      if (!categorias.includes(padrao.categoria)) {
        categorias.push(padrao.categoria);
        atualizarCategorias();
      }
      
      treinamentosNaturais.push({
        id: Date.now() + Math.random(),
        textoOriginal: mensagem,
        palavra: padrao.palavra,
        categoria: padrao.categoria,
        criadoEm: new Date().toISOString()
      });
    });
    
    localStorage.setItem('treinamentosNaturais', JSON.stringify(treinamentosNaturais));
    salvarDadosLocal();
    
    const resposta = `✅ Perfeito! Aprendi ${padroesTreinamento.length} novo(s) padrão(ões):

${padroesTreinamento.map(p => `• "${p.palavra}" → ${p.categoria}`).join('\n')}

🧠 Agora quando você falar essas palavras, eu vou categorizar automaticamente!`;
    
    adicionarMensagemChat('system', resposta);
    mostrarNotificacaoInteligente(`✅ IA aprendeu ${padroesTreinamento.length} padrão(ões)!`);
  } else {
    adicionarMensagemChat('system', '❌ Não consegui entender o comando de treinamento. Tente usar o formato: "adicione centro de custo Marketing e quando falar tráfego adicione no centro de custo Marketing"');
  }
  
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = false;
}

function adicionarMensagemChat(tipo, texto) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const agora = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${tipo} fade-in-up`;
  
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

async function processarMensagemIA(mensagem) {
  try {
    console.log('🧠 Processando:', mensagem);
    
    const resultado = interpretarMensagemIA(mensagem);
    esconderTyping();
    
    if (!resultado.sucesso) {
      const erro = `❌ ${resultado.erro}

💡 Exemplos válidos:
• "Paguei 500 de aluguel hoje"
• "Gastei 80 de gasolina ontem"  
• "Devo 200 de internet"
• "pagas hoje pra castanhal aluguel 100 marketing 200"`;
      
      adicionarMensagemChat('system', erro);
      return;
    }
    
    // Múltiplas lojas em uma frase
    if (resultado.multiplasLojas) {
      await processarMultiplasLojas(resultado);
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

function interpretarMensagemIA(mensagem) {
  try {
    const msgOriginal = mensagem.trim();
    const msgLower = mensagem.toLowerCase().trim();
    
    console.log('🧠 IA analisando:', msgLower.substring(0, 50));

    // Detectar múltiplas lojas
    const multiplasLojas = detectarMultiplasLojas(msgLower);
    if (multiplasLojas.length > 0) {
      return {
        sucesso: true,
        multiplasLojas: true,
        lojas: multiplasLojas,
        fonte: 'multiplas_lojas'
      };
    }

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
        recorrente: "Não",
        tipoRecorrencia: null,
        fonte: 'treinamento'
      };
    }

    const padroes = {
      valor: /(?:r\$?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{1,2})?)\s*(?:reais?|real|pila|conto|pau|dinheiro)?/i,
      dataHoje: /\b(?:hoje|hj|agora)\b/i,
      dataOntem: /\b(?:ontem|onte)\b/i,
      dataAmanha: /\b(?:amanhã|amanha|tomorrow)\b/i,
      diaSemana: /\b(?:segunda|terca|quarta|quinta|sexta|sabado|domingo|seg|ter|qua|qui|sex|sab|dom)\b/i,
      acoesPago: /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou|saída|despesa|débito|desembolsei?|pagas?)\b/i,
      acoesNaoPago: /\b(?:devo|deve|preciso\s+pagar|vou\s+pagar|pendente|conta\s+para\s+pagar|a\s+pagar|fatura|boleto)\b/i,
      recorrente: /\b(?:mensal|todo\s+mês|mensalmente|recorrente|fixo|sempre|mensalidade)\b/i
    };

    const categoriasIA = {
      'Aluguel': { regex: /\b(?:aluguel|aluguer|rent|locação|arrendamento)\b/i, confianca: 0.95 },
      'Energia': { regex: /\b(?:energia|luz|elétrica|eletricidade|conta\s+de\s+luz|enel|cpfl|cemig)\b/i, confianca: 0.9 },
      'Internet': { regex: /\b(?:internet|wifi|banda\s+larga|provedor|vivo\s+fibra|claro\s+net|tim\s+live)\b/i, confianca: 0.9 },
      'Combustível': { regex: /\b(?:combustível|gasolina|etanol|diesel|posto|abasteci|álcool|combustivel|gas)\b/i, confianca: 0.9 },
      'Material': { regex: /\b(?:material|escritório|papelaria|equipamento|ferramenta|suprimento)\b/i, confianca: 0.8 },
      'Transporte': { regex: /\b(?:transporte|uber|taxi|ônibus|onibus|metrô|metro|passagem|viagem|corrida)\b/i, confianca: 0.85 },
      'Alimentação': { regex: /\b(?:alimentação|comida|mercado|supermercado|restaurante|lanche|café|delivery)\b/i, confianca: 0.8 },
      'Marketing': { regex: /\b(?:marketing|publicidade|anúncio|anuncio|propaganda|google\s+ads|facebook\s+ads|tráfego)\b/i, confianca: 0.8 },
      'Saúde': { regex: /\b(?:saúde|saude|médico|medico|hospital|farmácia|farmacia|remédio|remedio)\b/i, confianca: 0.85 }
    };

    const matchValor = msgLower.match(padroes.valor);
    if (!matchValor) {
      return { sucesso: false, erro: "Não consegui identificar o valor na mensagem" };
    }
    
    let valorTexto = matchValor[1];
    const valor = processarValorBrasileiro(valorTexto);
    
    if (isNaN(valor) || valor <= 0) {
      return { sucesso: false, erro: `Valor inválido: ${matchValor[1]}` };
    }

    // Reconhecimento de dias da semana
    let data = new Date().toISOString().split('T')[0];
    
    if (padroes.dataOntem.test(msgLower)) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      data = ontem.toISOString().split('T')[0];
    } else if (padroes.dataAmanha.test(msgLower)) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      data = amanha.toISOString().split('T')[0];
    } else if (padroes.diaSemana.test(msgLower)) {
      data = calcularDataDiaSemana(msgLower);
    }

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

    let pago = "Sim";
    
    if (padroes.acoesNaoPago.test(msgLower)) {
      pago = "Não";
    } else if (padroes.acoesPago.test(msgLower)) {
      pago = "Sim";
    }

    let recorrente = "Não";
    let tipoRecorrencia = null;
    
    if (padroes.recorrente.test(msgLower)) {
      recorrente = "Sim";
      tipoRecorrencia = "Mensal";
    }

    let descricao = melhorCategoria;

    const resultado = {
      sucesso: true,
      categoria: melhorCategoria,
      valor: valor,
      data: data,
      descricao: descricao,
      pago: pago,
      recorrente: recorrente,
      tipoRecorrencia: tipoRecorrencia
    };

    console.log('🎯 Resultado IA:', resultado);
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro IA:', error);
    return { sucesso: false, erro: `Erro no processamento: ${error.message}` };
  }
}

function processarValorBrasileiro(valorTexto) {
  // Remove espaços e converte para string
  let valor = valorTexto.toString().trim();
  
  // Casos especiais para valores brasileiros
  if (/^\d+$/.test(valor)) {
    // Número simples: 500 → 500
    return parseInt(valor);
  }
  
  if (/^\d{1,3}[.,]\d{3}[.,]\d{2}$/.test(valor)) {
    // Formato: 1.597,11 ou 1,597.11
    if (valor.includes(',') && valor.lastIndexOf(',') > valor.lastIndexOf('.')) {
      // 1.597,11 → 1597.11
      valor = valor.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,597.11 → 1597.11
      valor = valor.replace(/,/g, '');
    }
  } else if (/^\d{1,3}[.,]\d{3}$/.test(valor)) {
    // Formato: 1.597 ou 1,597 (milhares)
    valor = valor.replace(/[.,]/, '');
  } else if (/^\d+[.,]\d{1,2}$/.test(valor)) {
    // Formato: 500,50 ou 500.50 (decimais)
    valor = valor.replace(',', '.');
  }
  
  return parseFloat(valor) || 0;
}

function calcularDataDiaSemana(mensagem) {
  const hoje = new Date();
  const diaHoje = hoje.getDay(); // 0 = domingo, 1 = segunda, etc.
  
  for (const [nomeDia, numeroDia] of Object.entries(diasSemana)) {
    if (mensagem.includes(nomeDia)) {
      let diasParaAdicionar = numeroDia - diaHoje;
      
      // Se o dia já passou esta semana, vai para próxima semana
      if (diasParaAdicionar <= 0) {
        diasParaAdicionar += 7;
      }
      
      const dataCalculada = new Date(hoje);
      dataCalculada.setDate(hoje.getDate() + diasParaAdicionar);
      
      return dataCalculada.toISOString().split('T')[0];
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

function detectarMultiplasLojas(mensagem) {
  const padroesMultiplas = [
    /pagas?\s+(?:hoje\s+)?pra\s+(\w+)\s+([^,]+?)(?:\s+e\s+pra\s+(\w+)\s+([^,]+))?/gi,
    /lançar?\s+pra\s+(\w+)\s+([^,]+?)(?:\s+e\s+pra\s+(\w+)\s+([^,]+))?/gi
  ];
  
  const lojasEncontradas = [];
  
  for (const regex of padroesMultiplas) {
    let match;
    while ((match = regex.exec(mensagem)) !== null) {
      if (match[1] && match[2]) {
        lojasEncontradas.push({
          loja: match[1],
          texto: match[2]
        });
      }
      if (match[3] && match[4]) {
        lojasEncontradas.push({
          loja: match[3],
          texto: match[4]
        });
      }
    }
  }
  
  return lojasEncontradas;
}

async function processarMultiplasLojas(resultado) {
  let sucessos = 0;
  let erros = [];
  
  for (const item of resultado.lojas) {
    const lojaNormalizada = normalizarNomeLoja(item.loja);
    const interpretacao = interpretarMensagemIA(item.texto);
    
    if (interpretacao.sucesso) {
      const saidaData = criarDadosSaida(interpretacao, lojaNormalizada);
      
      try {
        if (saidaData.pago === 'Sim') {
          saidas.unshift(saidaData);
        } else {
          saidasPendentes.unshift(saidaData);
        }
        sucessos++;
      } catch (error) {
        erros.push(`Erro ao salvar para ${lojaNormalizada}: ${error.message}`);
      }
    } else {
      erros.push(`Não consegui processar "${item.texto}" para ${lojaNormalizada}`);
    }
  }
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  
  let resposta = `✅ Processamento múltiplas lojas concluído!

✅ ${sucessos} saídas adicionadas com sucesso`;
  
  if (erros.length > 0) {
    resposta += `\n\n❌ ${erros.length} erro(s):\n${erros.join('\n')}`;
  }
  
  adicionarMensagemChat('system', resposta);
  mostrarNotificacaoInteligente(`✅ ${sucessos} saídas adicionadas!`);
}

function normalizarNomeLoja(nomeOriginal) {
  const mapeamentoLojas = {
    'castanhal': 'Loja Centro',
    'centro': 'Loja Centro',
    'shopping': 'Loja Shopping',
    'bairro': 'Loja Bairro'
  };
  
  const nomeNormalizado = nomeOriginal.toLowerCase();
  
  for (const [chave, loja] of Object.entries(mapeamentoLojas)) {
    if (nomeNormalizado.includes(chave)) {
      return loja;
    }
  }
  
  // Se não encontrar, procura loja existente similar
  for (const loja of lojas) {
    if (loja.toLowerCase().includes(nomeNormalizado) || 
        nomeNormalizado.includes(loja.toLowerCase())) {
      return loja;
    }
  }
  
  return nomeOriginal;
}

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
  const padroesPago = /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou|pagas?)\b/i;
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
    const perguntaInteligente = criarPerguntaInteligente(
      '🏷️ Não consegui identificar a categoria. Para que é esta saída?',
      categorias,
      'categoria'
    );
    
    adicionarMensagemChat('system', perguntaInteligente);
    return;
  }
}

function criarPerguntaInteligente(titulo, opcoes, tipo) {
  let html = `<div class="pergunta-inteligente">
    <div class="pergunta-titulo">${titulo}</div>
    <div class="pergunta-opcoes">`;
  
  opcoes.slice(0, 6).forEach(opcao => {
    html += `<span class="pergunta-opcao" onclick="responderPerguntaInteligente('${opcao}', '${tipo}')">${opcao}</span>`;
  });
  
  html += `</div>
    <input type="text" class="pergunta-input" placeholder="Ou digite uma nova ${tipo}..." 
           onkeypress="if(event.key==='Enter') responderPerguntaInteligente(this.value, '${tipo}')">
  </div>`;
  
  return html;
}

function responderPerguntaInteligente(resposta, tipo) {
  if (!resposta || !resposta.trim()) return;
  
  adicionarMensagemChat('user', resposta);
  
  if (tipo === 'categoria') {
    if (!categorias.includes(resposta)) {
      categorias.push(resposta);
      atualizarCategorias();
      salvarDadosLocal();
      
      adicionarMensagemChat('system', `✅ Nova categoria "${resposta}" criada e adicionada!`);
    }
    
    // Continuar processamento com a categoria escolhida
    const lojaMencionada = detectarLojaNaMensagem(ultimaMensagemUsuario || '');
    
    const saidaData = {
      id: Date.now() + Math.random() * 1000,
      loja: lojaMencionada || 'Manual',
      categoria: resposta,
      descricao: resposta,
      valor: ultimoValorDetectado || 0,
      data: new Date().toISOString().split('T')[0],
      recorrente: "Não",
      tipoRecorrencia: null,
      pago: "Sim",
      origem: 'chat',
      timestamp: new Date()
    };
    
    finalizarAdicaoSaida(saidaData);
  }
}

async function solicitarSelecaoLoja(resultado) {
  ultimaMensagemUsuario = '';
  ultimoValorDetectado = resultado.valor;
  
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
  
  const mapeamentoLojas = {
    'castanhal': 'Loja Centro',
    'centro': 'Loja Centro', 
    'shopping': 'Loja Shopping',
    'bairro': 'Loja Bairro'
  };
  
  for (const [chave, loja] of Object.entries(mapeamentoLojas)) {
    if (msgLower.includes(chave)) {
      return loja;
    }
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
    mostrarNotificacaoInteligente('✅ Saída adicionada via Chat IA!');
    
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
    'Aluguel': '🏠', 'Energia': '⚡', 'Internet': '🌐', 'Combustível': '⛽',
    'Material': '📦', 'Transporte': '🚗', 'Alimentação': '🍽️', 'Marketing': '📢', 'Saúde': '🏥'
  };
  
  const emoji = emojiCategoria[saida.categoria] || '📊';
  
  return `✅ Saída registrada com sucesso!

💰 Valor: ${valorFormatado}
${emoji} Categoria: ${saida.categoria}
🏪 Loja: ${saida.loja}
📅 Data: ${dataFormatada}
💳 Status: ${saida.pago === "Sim" ? "Pago ✅" : "Pendente ⏳"}

🤖 Processado pela IA`;
}

function limparChat() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="chat-message system">
        <div class="chat-bubble">
          <div>👋 Olá! Eu sou a IA do iClub. Digite suas saídas agora e eu vou adicionar automaticamente para você!</div>
          <div class="chat-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `;
  }
}

// ============================================================================
// FUNÇÕES PRINCIPAIS DO SISTEMA
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

  // Validação visual
  if (valor <= 0) {
    mostrarNotificacaoInteligente("Por favor, insira um valor válido!", 'error');
    const campoValor = document.getElementById("valor");
    if (campoValor) {
      campoValor.classList.add('campo-obrigatorio');
      setTimeout(() => campoValor.classList.remove('campo-obrigatorio'), 3000);
    }
    return;
  }

  // Recorrência personalizada
  let tipoFinal = tipoRecorrencia;
  if (tipoRecorrencia === 'Personalizada') {
    const recorrenciaCustom = document.getElementById('recorrenciaCustom')?.value;
    tipoFinal = recorrenciaCustom || 'Personalizada';
  }

  const saida = { 
    id: Date.now() + Math.random() * 1000, 
    loja, categoria, 
    descricao: descricao || categoria,
    valor, data, recorrente,
    tipoRecorrencia: recorrente === "Sim" ? tipoFinal : null,
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
    mostrarNotificacaoInteligente('✅ Saída adicionada com sucesso!');
    limparFormulario();
    
  } catch (error) {
    console.error('❌ Erro adicionar saída:', error);
    mostrarNotificacaoInteligente('Erro ao salvar saída. Tente novamente.', 'error');
  }
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
      // Esconder recorrência personalizada também
      const recorrenciaPersonalizada = document.getElementById("recorrenciaPersonalizada");
      if (recorrenciaPersonalizada) {
        recorrenciaPersonalizada.style.display = "none";
      }
    }
  }
}

function toggleRecorrenciaPersonalizada() {
  const tipoRecorrencia = document.getElementById("tipoRecorrencia");
  const recorrenciaPersonalizada = document.getElementById("recorrenciaPersonalizada");
  
  if (tipoRecorrencia && recorrenciaPersonalizada) {
    if (tipoRecorrencia.value === "Personalizada") {
      recorrenciaPersonalizada.style.display = "block";
    } else {
      recorrenciaPersonalizada.style.display = "none";
    }
  }
}

function excluirSaida(firestoreId, saidaId) {
  if (!confirm('Tem certeza que deseja excluir esta saída?')) return;

  try {
    saidas = saidas.filter(s => s.id !== saidaId);
    saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente('✅ Saída excluída!');
  } catch (error) {
    console.error('❌ Erro excluir:', error);
    mostrarNotificacaoInteligente('Erro ao excluir saída. Tente novamente.', 'error');
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
      mostrarNotificacaoInteligente('✅ Saída marcada como paga!');
    }
  } catch (error) {
    console.error('❌ Erro marcar como pago:', error);
    mostrarNotificacaoInteligente('Erro ao atualizar saída. Tente novamente.', 'error');
  }
}

function editarSaida(firestoreId, saidaId) {
  const saida = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
  
  if (!saida) {
    mostrarNotificacaoInteligente('Saída não encontrada!', 'error');
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
        <select id="editTipoRecorrencia" class="form-select" onchange="toggleEditRecorrenciaPersonalizada()">
          <option value="Diária" ${saida.tipoRecorrencia === 'Diária' ? 'selected' : ''}>Diária</option>
          <option value="Semanal" ${saida.tipoRecorrencia === 'Semanal' ? 'selected' : ''}>Semanal</option>
          <option value="Mensal" ${saida.tipoRecorrencia === 'Mensal' ? 'selected' : ''}>Mensal</option>
          <option value="Anual" ${saida.tipoRecorrencia === 'Anual' ? 'selected' : ''}>Anual</option>
          <option value="Personalizada" ${!['Diária', 'Semanal', 'Mensal', 'Anual'].includes(saida.tipoRecorrencia) && saida.tipoRecorrencia ? 'selected' : ''}>Personalizada</option>
        </select>
        <div id="editRecorrenciaPersonalizada" class="recorrencia-personalizada" style="display: ${!['Diária', 'Semanal', 'Mensal', 'Anual'].includes(saida.tipoRecorrencia) && saida.tipoRecorrencia ? 'block' : 'none'};">
          <input type="text" id="editRecorrenciaCustom" placeholder="Ex: A cada 15 dias" value="${!['Diária', 'Semanal', 'Mensal', 'Anual'].includes(saida.tipoRecorrencia) ? saida.tipoRecorrencia || '' : ''}">
        </div>
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
    <button class="btn btn-success-modern btn-modern" onclick="salvarEdicaoSaida(${saidaId})">Salvar</button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">Cancelar</button>
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

function toggleEditRecorrenciaPersonalizada() {
  const tipoRecorrencia = document.getElementById('editTipoRecorrencia');
  const recorrenciaPersonalizada = document.getElementById('editRecorrenciaPersonalizada');
  
  if (tipoRecorrencia && recorrenciaPersonalizada) {
    if (tipoRecorrencia.value === "Personalizada") {
      recorrenciaPersonalizada.style.display = "block";
    } else {
      recorrenciaPersonalizada.style.display = "none";
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
    mostrarNotificacaoInteligente('Preencha todos os campos obrigatórios!', 'warning');
    return;
  }
  
  let saidaEncontrada = saidas.find(s => s.id === saidaId);
  let listaSaidas = saidas;
  
  if (!saidaEncontrada) {
    saidaEncontrada = saidasPendentes.find(s => s.id === saidaId);
    listaSaidas = saidasPendentes;
  }
  
  if (!saidaEncontrada) {
    mostrarNotificacaoInteligente('Saída não encontrada!', 'error');
    return;
  }
  
  const indexAtual = listaSaidas.findIndex(s => s.id === saidaId);
  if (indexAtual !== -1) {
    listaSaidas.splice(indexAtual, 1);
  }
  
  saidas = saidas.filter(s => s.id !== saidaId);
  saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
  
  // Recorrência personalizada na edição
  let tipoFinal = tipoRecorrencia;
  if (tipoRecorrencia === 'Personalizada') {
    const recorrenciaCustom = document.getElementById('editRecorrenciaCustom')?.value;
    tipoFinal = recorrenciaCustom || 'Personalizada';
  }
  
  saidaEncontrada.loja = loja;
  saidaEncontrada.categoria = categoria;
  saidaEncontrada.descricao = descricao;
  saidaEncontrada.valor = valor;
  saidaEncontrada.data = data;
  saidaEncontrada.recorrente = recorrente;
  saidaEncontrada.tipoRecorrencia = recorrente === 'Sim' ? tipoFinal : null;
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
  mostrarNotificacaoInteligente('✅ Saída editada com sucesso!');
}

// ============================================================================
// GESTÃO DE CATEGORIAS E LOJAS
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
    mostrarNotificacaoInteligente("Digite o nome da categoria!", 'warning');
    return;
  }
  
  if (categorias.includes(novaCategoria)) {
    mostrarNotificacaoInteligente("Esta categoria já existe!", 'warning');
    return;
  }
  
  categorias.push(novaCategoria);
  input.value = "";
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarNotificacaoInteligente(`✅ Categoria "${novaCategoria}" adicionada!`);
}

function adicionarLoja() {
  const input = document.getElementById("novaLoja");
  if (!input) return;
  
  const novaLoja = input.value.trim();
  
  if (!novaLoja) {
    mostrarNotificacaoInteligente("Digite o nome da loja!", 'warning');
    return;
  }
  
  if (lojas.includes(novaLoja)) {
    mostrarNotificacaoInteligente("Esta loja já existe!", 'warning');
    return;
  }
  
  lojas.push(novaLoja);
  input.value = "";
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarNotificacaoInteligente(`✅ Loja "${novaLoja}" adicionada!`);
}

function mostrarEditorCategoriaExistente() {
  const lista = categorias.map((cat, index) => 
    `${index + 1}. ${cat} <button onclick="removerCategoria(${index})" class="btn btn-danger-modern btn-sm">❌</button>`
  ).join('<br>');
  
  const modal = document.getElementById('modalCustom');
  if (modal) {
    document.getElementById('modalTitulo').textContent = 'Editar Categorias';
    document.getElementById('modalTexto').innerHTML = lista || 'Nenhuma categoria cadastrada.';
    document.getElementById('modalBotoes').innerHTML = `
      <button class="btn btn-secondary btn-modern" onclick="fecharModal()">Fechar</button>
    `;
    modal.style.display = 'flex';
  }
}

function mostrarEditorLojaExistente() {
  const lista = lojas.map((loja, index) => 
    `${index + 1}. ${loja} <button onclick="removerLoja(${index})" class="btn btn-danger-modern btn-sm">❌</button>`
  ).join('<br>');
  
  const modal = document.getElementById('modalCustom');
  if (modal) {
    document.getElementById('modalTitulo').textContent = 'Editar Lojas';
    document.getElementById('modalTexto').innerHTML = lista || 'Nenhuma loja cadastrada.';
    document.getElementById('modalBotoes').innerHTML = `
      <button class="btn btn-secondary btn-modern" onclick="fecharModal()">Fechar</button>
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
    mostrarNotificacaoInteligente(`✅ Categoria "${categoria}" removida!`);
  }
}

function removerLoja(index) {
  const loja = lojas[index];
  if (confirm(`Tem certeza que deseja remover a loja "${loja}"?`)) {
    lojas.splice(index, 1);
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarEditorLojaExistente();
    mostrarNotificacaoInteligente(`✅ Loja "${loja}" removida!`);
  }
}

function fecharModal() {
  const modal = document.getElementById('modalCustom');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ============================================================================
// MÚLTIPLAS SAÍDAS APRIMORADAS
// ============================================================================

function iniciarMultiplasSaidas() {
  multiplasSaidasLista = [];
  contadorMultiplas = 0;
  
  const container = document.getElementById("multiplasSaidasContainer");
  if (container) {
    container.style.display = "block";
    container.classList.add('fade-in-up');
    adicionarNovaLinha();
  }
}

function adicionarNovaLinha() {
  contadorMultiplas++;
  const listaSaidas = document.getElementById("listaSaidas");
  if (!listaSaidas) return;
  
  const novaLinha = document.createElement("div");
  novaLinha.className = "saida-item fade-in-up";
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
          <select class="form-select form-select-sm recorrente-select" id="recorrente-${contadorMultiplas}" onchange="toggleRecorrenciaMultipla(${contadorMultiplas})">
            <option>Não</option>
            <option>Sim</option>
          </select>
        </div>
      </div>
      <div class="row g-2 mt-2" id="recorrenciaContainer-${contadorMultiplas}" style="display:none;">
        <div class="col-md-3">
          <select class="form-select form-select-sm" id="tipoRecorrencia-${contadorMultiplas}" onchange="toggleRecorrenciaMultiplaPersonalizada(${contadorMultiplas})">
            <option>Diária</option>
            <option>Semanal</option>
            <option>Mensal</option>
            <option>Anual</option>
            <option>Personalizada</option>
          </select>
        </div>
        <div class="col-md-6" id="recorrenciaPersonalizadaContainer-${contadorMultiplas}" style="display:none;">
          <input type="text" class="form-control form-control-sm" id="recorrenciaCustom-${contadorMultiplas}" placeholder="Ex: A cada 15 dias">
        </div>
        <div class="col-md-3">
          <select class="form-select form-select-sm pago-select" id="pago-${contadorMultiplas}">
            <option>Sim</option>
            <option>Não</option>
          </select>
        </div>
      </div>
    </div>
    <div class="saida-actions">
      <button class="btn btn-danger-modern btn-sm" onclick="removerLinhaSaida(${contadorMultiplas})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  listaSaidas.appendChild(novaLinha);
}

function toggleRecorrenciaMultipla(id) {
  const recorrente = document.getElementById(`recorrente-${id}`);
  const container = document.getElementById(`recorrenciaContainer-${id}`);
  
  if (recorrente && container) {
    if (recorrente.value === "Sim") {
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
  }
}

function toggleRecorrenciaMultiplaPersonalizada(id) {
  const tipoRecorrencia = document.getElementById(`tipoRecorrencia-${id}`);
  const container = document.getElementById(`recorrenciaPersonalizadaContainer-${id}`);
  
  if (tipoRecorrencia && container) {
    if (tipoRecorrencia.value === "Personalizada") {
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
  }
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
    elemento.classList.add('fade-out');
    setTimeout(() => elemento.remove(), 300);
  }
}

function adicionarTodasSaidas() {
  const listaSaidas = document.getElementById("listaSaidas");
  if (!listaSaidas) return;
  
  const linhas = listaSaidas.querySelectorAll('.saida-item');
  
  let sucessos = 0;
  let erros = [];
  
  for (const linha of linhas) {
    const id = linha.id.split('-')[1];
    
    const loja = document.getElementById(`loja-${id}`)?.value;
    const categoria = document.getElementById(`categoria-${id}`)?.value;
    const descricao = document.getElementById(`descricao-${id}`)?.value || categoria;
    const valorInput = document.getElementById(`valor-${id}`)?.value;
    const valor = extrairValorNumerico(valorInput);
    const data = document.getElementById(`data-${id}`)?.value;
    const recorrente = document.getElementById(`recorrente-${id}`)?.value || "Não";
    const tipoRecorrencia = document.getElementById(`tipoRecorrencia-${id}`)?.value;
    const pago = document.getElementById(`pago-${id}`)?.value;
    
    // Validação visual
    if (valor <= 0) {
      const campoValor = document.getElementById(`valor-${id}`);
      if (campoValor) {
        campoValor.classList.add('campo-obrigatorio');
      }
      erros.push(`Linha ${id}: Valor inválido`);
      continue;
    }
    
    // Recorrência personalizada
    let tipoFinal = tipoRecorrencia;
    if (tipoRecorrencia === 'Personalizada') {
      const recorrenciaCustom = document.getElementById(`recorrenciaCustom-${id}`)?.value;
      tipoFinal = recorrenciaCustom || 'Personalizada';
    }
    
    const saida = {
      id: Date.now() + Math.random() * 1000,
      loja: loja || "Manual",
      categoria: categoria || "Outros",
      descricao: descricao || categoria || "Saída",
      valor,
      data: data || new Date().toISOString().split('T')[0],
      recorrente: recorrente,
      tipoRecorrencia: recorrente === 'Sim' ? tipoFinal : null,
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
      erros.push(`Linha ${id}: ${error.message}`);
    }
  }
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  
  cancelarMultiplasSaidas();
  
  if (erros.length > 0) {
    mostrarNotificacaoInteligente(`✅ ${sucessos} saídas adicionadas! ${erros.length} erros encontrados.`, 'warning');
  } else {
    mostrarNotificacaoInteligente(`✅ ${sucessos} saídas adicionadas com sucesso!`);
  }
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
// INTERFACE E ATUALIZAÇÃO COMPLETA
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
  
  // Separação correta das seções
  const saidasMes = []; // APENAS saídas pagas do mês atual
  const saidasAtrasadas = []; // APENAS saídas vencidas não pagas
  const saidasVencendoHoje = []; // APENAS saídas vencendo hoje não pagas
  const saidasProximas = []; // APENAS saídas futuras não pagas (próximos 30 dias)
  const saidasRecorrentes = []; // Saídas recorrentes (separadas)
  
  [...saidas, ...saidasPendentes].forEach(s => {
    if (lojaFiltroAtual && s.loja !== lojaFiltroAtual) return;
    
    const dataSaida = s.data;
    
    // Separar recorrentes primeiro
    if (s.recorrente === 'Sim') {
      saidasRecorrentes.push(s);
    }
    
    // Saídas do mês: APENAS pagas do mês atual
    if (s.data.substring(0, 7) === anoMes && s.pago === 'Sim') {
      saidasMes.push(s);
    }
    
    // Saídas pendentes por status de data
    if (s.pago === 'Não') {
      if (dataSaida < dataHoje) {
        // Atrasadas
        const diasAtrasado = Math.floor((hoje - new Date(dataSaida + 'T00:00:00')) / (1000 * 60 * 60 * 24));
        saidasAtrasadas.push({...s, diasAtrasado});
      } else if (dataSaida === dataHoje) {
        // Vencendo hoje
        saidasVencendoHoje.push(s);
      } else {
        // Próximas (futuras)
        const diasRestantes = Math.floor((new Date(dataSaida + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 30) { // Próximos 30 dias
          saidasProximas.push({...s, diasRestantes});
        }
      }
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
}

function preencherTabelaDoMes(tbody, saidas) {
  const itensPorPagina = paginacao.saidasMes.itensPorPagina;
  const paginaAtual = paginacao.saidasMes.paginaAtual;
  const totalItens = saidas.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  
  paginacao.saidasMes.totalItens = totalItens;
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const saidasPagina = saidas.slice(inicio, fim);
  
  saidasPagina.forEach(s => {
    const tr = document.createElement("tr");
    tr.className = "fade-in-up";
    tr.innerHTML = `
      <td><strong>${s.loja}</strong></td>
      <td>${s.categoria}</td>
      <td>${s.descricao}</td>
      <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
      <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td><span class="badge ${s.recorrente === 'Sim' ? 'bg-info' : 'bg-secondary'}">${s.recorrente}</span></td>
      <td>${s.tipoRecorrencia || '-'}</td>
      <td>
        <button class="btn btn-warning-modern btn-sm" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Mostrar/ocultar paginação
  const paginacaoContainer = document.getElementById('paginacaoSaidasMes');
  if (paginacaoContainer) {
    if (totalPaginas > 1) {
      paginacaoContainer.style.display = 'flex';
      document.getElementById('paginaAtualSaidasMes').textContent = paginaAtual;
      document.getElementById('totalPaginasSaidasMes').textContent = totalPaginas;
    } else {
      paginacaoContainer.style.display = 'none';
    }
  }
}

function paginacaoAnterior(tipo) {
  if (tipo === 'saidasMes' && paginacao.saidasMes.paginaAtual > 1) {
    paginacao.saidasMes.paginaAtual--;
    atualizarTabela();
  }
}

function paginacaoProxima(tipo) {
  if (tipo === 'saidasMes') {
    const totalPaginas = Math.ceil(paginacao.saidasMes.totalItens / paginacao.saidasMes.itensPorPagina);
    if (paginacao.saidasMes.paginaAtual < totalPaginas) {
      paginacao.saidasMes.paginaAtual++;
      atualizarTabela();
    }
  }
}

function preencherTabelaAtrasadas(container, saidas) {
  if (!container) return;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">✅ Nenhuma saída atrasada. Parabéns!</p>';
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
            <tr class="fade-in-up">
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td><span class="badge bg-danger">${s.diasAtrasado} dias</span></td>
              <td>
                <button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
                  <i class="fas fa-check"></i> Pagar
                </button>
                <button class="btn btn-warning-modern btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
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
    container.innerHTML = '<p class="text-muted text-center">✅ Nenhuma saída vencendo hoje.</p>';
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
            <tr class="fade-in-up">
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>
                <button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
                  <i class="fas fa-check"></i> Pagar
                </button>
                <button class="btn btn-warning-modern btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
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
    container.innerHTML = '<p class="text-muted text-center">✅ Nenhuma saída próxima ao vencimento.</p>';
    esconderVerMaisProximas();
    return;
  }
  
  const limite = paginacao.proximasSaidas.limite;
  const saidasVisiveis = saidas.slice(0, limite);
  const saidasExtras = saidas.slice(limite);
  
  // Tabela principal (primeiros 7 itens)
  const tabelaPrincipal = `
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
          ${saidasVisiveis.map(s => `
            <tr class="fade-in-up">
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td><span class="badge bg-warning">${s.diasRestantes} dias</span></td>
              <td>
                <button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
                  <i class="fas fa-check"></i> Pagar
                </button>
                <button class="btn btn-warning-modern btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tabelaPrincipal;
  
  // Itens extras (escondidos inicialmente)
  const proximasExtras = document.getElementById('proximasExtras');
  if (proximasExtras && saidasExtras.length > 0) {
    const tabelaExtras = `
      <div class="table-responsive">
        <table class="table table-modern">
          <tbody>
            ${saidasExtras.map(s => `
              <tr class="fade-in-up">
                <td><strong>${s.loja}</strong></td>
                <td>${s.categoria}</td>
                <td>${s.descricao}</td>
                <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
                <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td><span class="badge bg-warning">${s.diasRestantes} dias</span></td>
                <td>
                  <button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
                    <i class="fas fa-check"></i> Pagar
                  </button>
                  <button class="btn btn-warning-modern btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    proximasExtras.innerHTML = tabelaExtras;
    
    // Mostrar botão "Ver Mais"
    mostrarVerMaisProximas(saidasExtras.length);
  } else {
    esconderVerMaisProximas();
  }
}

function mostrarVerMaisProximas(quantidadeExtras) {
  const btnVerMais = document.getElementById('btnVerMaisProximas');
  const contador = document.getElementById('contadorProximas');
  
  if (btnVerMais) {
    btnVerMais.style.display = 'inline-block';
    btnVerMais.innerHTML = `Ver Mais ${quantidadeExtras} <i class="fas fa-chevron-down"></i>`;
  }
  
  if (contador) {
    contador.textContent = `Mostrando ${paginacao.proximasSaidas.limite} de ${paginacao.proximasSaidas.limite + quantidadeExtras} saídas`;
  }
}

function esconderVerMaisProximas() {
  const btnVerMais = document.getElementById('btnVerMaisProximas');
  const contador = document.getElementById('contadorProximas');
  
  if (btnVerMais) {
    btnVerMais.style.display = 'none';
  }
  
  if (contador) {
    contador.textContent = '';
  }
}

function toggleVerMaisProximas() {
  const proximasExtras = document.getElementById('proximasExtras');
  const btnVerMais = document.getElementById('btnVerMaisProximas');
  
  if (!proximasExtras || !btnVerMais) return;
  
  if (paginacao.proximasSaidas.mostrandoTodos) {
    // Ocultar extras
    proximasExtras.style.display = 'none';
    btnVerMais.innerHTML = `Ver Mais <i class="fas fa-chevron-down"></i>`;
    paginacao.proximasSaidas.mostrandoTodos = false;
  } else {
    // Mostrar extras
    proximasExtras.style.display = 'block';
    btnVerMais.innerHTML = `Ver Menos <i class="fas fa-chevron-up"></i>`;
    paginacao.proximasSaidas.mostrandoTodos = true;
  }
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
            <tr class="fade-in-up">
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td><span class="badge bg-info">${s.tipoRecorrencia || 'Mensal'}</span></td>
              <td><span class="badge ${s.pago === 'Sim' ? 'bg-success' : 'bg-warning'}">${s.pago}</span></td>
              <td>
                ${s.pago === 'Não' ? `<button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago"><i class="fas fa-check"></i> Pagar</button>` : ''}
                <button class="btn btn-warning-modern btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
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

function aplicarFiltroLoja() {
  const filtro = document.getElementById("filtroLojaGlobal");
  lojaFiltroAtual = filtro ? filtro.value : "";
  
  // Resetar paginação ao aplicar filtro
  paginacao.saidasMes.paginaAtual = 1;
  
  atualizarTabela();
  atualizarDashboard();
  atualizarTodosGraficos();
}

// ============================================================================
// GRÁFICOS E VISUALIZAÇÕES
// ============================================================================

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

// ============================================================================
// ANÁLISE INTELIGENTE
// ============================================================================

let dadosParaAnalise = [];
let analiseCompleta = null;

async function abrirAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  const loading = document.getElementById('analiseLoading');
  const resultado = document.getElementById('analiseResultado');
  
  if (!modal || !loading || !resultado) {
    mostrarNotificacaoInteligente('Modal de análise não encontrado', 'error');
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
    { progresso: 15, texto: 'Carregando dados locais...' },
    { progresso: 30, texto: 'Processando padrões de gastos...' },
    { progresso: 50, texto: 'Analisando tendências temporais...' },
    { progresso: 70, texto: 'Identificando oportunidades de economia...' },
    { progresso: 85, texto: 'Gerando insights inteligentes...' },
    { progresso: 95, texto: 'Criando recomendações personalizadas...' },
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
    
    await new Promise(resolve => setTimeout(resolve, 700));
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
    statusPagamento: agruparPorStatus(todasSaidas),
    tendenciaMensal: analisarTendenciaMensal(todasSaidas),
    recorrentes: todasSaidas.filter(s => s.recorrente === 'Sim')
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

function analisarTendenciaMensal(saidas) {
  const meses = {};
  
  saidas.forEach(s => {
    const mes = s.data.substring(0, 7); // YYYY-MM
    if (!meses[mes]) {
      meses[mes] = { total: 0, count: 0 };
    }
    meses[mes].total += s.valor || 0;
    meses[mes].count++;
  });
  
  const mesesOrdenados = Object.keys(meses).sort();
  const tendencia = mesesOrdenados.length > 1 ? 
    (meses[mesesOrdenados[mesesOrdenados.length - 1]].total > meses[mesesOrdenados[0]].total ? 'crescente' : 'decrescente') 
    : 'estável';
  
  return { meses, tendencia };
}

function gerarResumoExecutivo(dados) {
  const ticketMedio = dados.totalSaidas > 0 ? dados.valorTotal / dados.totalSaidas : 0;
  const categoriaTop = Object.keys(dados.categorias).length > 0 ? 
    Object.keys(dados.categorias).reduce((a, b) => 
      dados.categorias[a].total > dados.categorias[b].total ? a : b, 
      Object.keys(dados.categorias)[0]
    ) : 'N/A';
  
  const totalRecorrente = dados.recorrentes.reduce((sum, s) => sum + (s.valor || 0), 0);
  const percentualRecorrente = dados.valorTotal > 0 ? (totalRecorrente / dados.valorTotal * 100) : 0;
  
  return {
    valorTotal: dados.valorTotal,
    totalSaidas: dados.totalSaidas,
    ticketMedio: ticketMedio,
    categoriaTop: categoriaTop,
    percentualPendente: dados.totalSaidas > 0 ? 
      (dados.statusPagamento.pendentes.count / dados.totalSaidas * 100) : 0,
    percentualRecorrente: percentualRecorrente,
    tendencia: dados.tendenciaMensal.tendencia
  };
}

function gerarInsightsPrincipais(dados) {
  const insights = [];
  
  // Insight: Categoria dominante
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
        descricao: `A categoria "${categoria}" representa ${percentual.toFixed(1)}% dos seus gastos totais (${formatarMoedaBR(dadosCategoria.total)}). ${percentual > 40 ? 'Esta alta concentração pode indicar oportunidades de otimização ou renegociação.' : 'Distribuição equilibrada de gastos.'}`,
        acoes: percentual > 40 ? ['Analisar fornecedores', 'Buscar alternativas', 'Negociar preços'] : ['Manter controle', 'Monitorar tendências']
      });
    }
  }

  // Insight: Pendências críticas
  if (dados.statusPagamento.pendentes.count > 0) {
    const percentualPendente = (dados.statusPagamento.pendentes.count / dados.totalSaidas * 100);
    
    if (percentualPendente > 20) {
      insights.push({
        tipo: 'alerta',
        titulo: 'Alto Volume de Pendências',
        valor: dados.statusPagamento.pendentes.count + ' saídas',
        descricao: `Você tem ${dados.statusPagamento.pendentes.count} saídas pendentes (${percentualPendente.toFixed(1)}%), totalizando ${formatarMoedaBR(dados.statusPagamento.pendentes.total)}. Isso pode impactar significativamente seu fluxo de caixa e planejamento financeiro.`,
        acoes: ['Priorizar pagamentos críticos', 'Renegociar prazos', 'Criar cronograma de pagamentos', 'Revisar política de compras']
      });
    }
  }

  // Insight: Distribuição entre lojas
  if (Object.keys(dados.lojas).length > 1) {
    const lojasOrdenadas = Object.entries(dados.lojas)
      .sort(([,a], [,b]) => b.total - a.total);
    
    const lojaTop = lojasOrdenadas[0];
    const percentualLojaTop = (lojaTop[1].total / dados.valorTotal * 100);
    
    const tipo = percentualLojaTop > 60 ? 'alerta' : percentualLojaTop > 40 ? 'tendencia' : 'oportunidade';
    
    insights.push({
      tipo: tipo,
      titulo: 'Distribuição por Loja',
      valor: percentualLojaTop.toFixed(1) + '%',
      descricao: `A "${lojaTop[0]}" concentra ${percentualLojaTop.toFixed(1)}% dos gastos (${formatarMoedaBR(lojaTop[1].total)}). ${percentualLojaTop > 60 ? 'Alta concentração pode indicar necessidade de balanceamento.' : percentualLojaTop > 40 ? 'Concentração moderada, monitore a evolução.' : 'Distribuição equilibrada entre as lojas.'}`,
      acoes: percentualLojaTop > 60 ? ['Revisar distribuição de recursos', 'Balancear investimentos', 'Analisar rentabilidade por loja'] : ['Monitorar performance', 'Otimizar operações']
    });
  }

  // Insight: Gastos recorrentes
  if (dados.recorrentes.length > 0) {
    const totalRecorrente = dados.recorrentes.reduce((sum, s) => sum + (s.valor || 0), 0);
    const percentualRecorrente = (totalRecorrente / dados.valorTotal * 100);
    
    insights.push({
      tipo: percentualRecorrente > 70 ? 'alerta' : 'insight',
      titulo: 'Gastos Recorrentes',
      valor: percentualRecorrente.toFixed(1) + '%',
      descricao: `${percentualRecorrente.toFixed(1)}% dos seus gastos são recorrentes (${formatarMoedaBR(totalRecorrente)}), representando ${dados.recorrentes.length} saídas fixas. ${percentualRecorrente > 70 ? 'Alto percentual de gastos fixos pode limitar flexibilidade financeira.' : 'Percentual adequado de gastos fixos proporciona previsibilidade.'}`,
      acoes: percentualRecorrente > 70 ? ['Revisar contratos fixos', 'Renegociar termos', 'Buscar alternativas mais flexíveis'] : ['Manter controle mensal', 'Revisar anualmente']
    });
  }

  // Insight: Tendência mensal
  if (dados.tendenciaMensal.tendencia !== 'estável') {
    const tipo = dados.tendenciaMensal.tendencia === 'crescente' ? 'alerta' : 'oportunidade';
    const titulo = dados.tendenciaMensal.tendencia === 'crescente' ? 'Tendência de Crescimento' : 'Tendência de Redução';
    
    insights.push({
      tipo: tipo,
      titulo: titulo,
      valor: dados.tendenciaMensal.tendencia === 'crescente' ? '📈 Crescendo' : '📉 Reduzindo',
      descricao: `Seus gastos apresentam uma tendência ${dados.tendenciaMensal.tendencia === 'crescente' ? 'de crescimento' : 'de redução'} nos últimos meses. ${dados.tendenciaMensal.tendencia === 'crescente' ? 'É importante monitorar e controlar este crescimento para manter a saúde financeira.' : 'Parabéns pela redução! Continue monitorando para manter esta tendência positiva.'}`,
      acoes: dados.tendenciaMensal.tendencia === 'crescente' ? ['Analisar causas do crescimento', 'Implementar controles mais rígidos', 'Revisar orçamento'] : ['Manter disciplina atual', 'Identificar melhores práticas', 'Reinvestir economias']
    });
  }

  // Se não há insights suficientes, adicionar insights gerais
  if (insights.length === 0) {
    insights.push({
      tipo: 'insight',
      titulo: 'Sistema Operacional',
      valor: 'Funcionando',
      descricao: 'Seu sistema está funcionando corretamente. Continue adicionando dados para gerar análises mais detalhadas e insights personalizados sobre seus padrões de gastos.',
      acoes: ['Adicionar mais saídas', 'Usar Chat IA', 'Configurar categorias personalizadas']
    });
  }

  return insights;
}

function exibirResultadosAnalise(analise) {
  const container = document.getElementById('analiseResultado');
  
  if (!container) return;
  
  let html = `
    <div class="resumo-executivo">
      <h4 class="resumo-titulo">📊 Resumo Executivo Inteligente</h4>
      <p>Análise completa baseada em ${analise.resumoExecutivo.totalSaidas} saídas processadas</p>
      <div class="resumo-stats">
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${formatarMoedaBR(analise.resumoExecutivo.valorTotal)}</div>
          <div class="resumo-stat-label">Valor Total</div>
        </div>
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
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${analise.resumoExecutivo.percentualPendente.toFixed(1)}%</div>
          <div class="resumo-stat-label">Pendentes</div>
        </div>
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${analise.resumoExecutivo.tendencia === 'crescente' ? '📈' : analise.resumoExecutivo.tendencia === 'decrescente' ? '📉' : '📊'}</div>
          <div class="resumo-stat-label">Tendência</div>
        </div>
      </div>
    </div>
  `;

  if (analise.insights && analise.insights.length > 0) {
    analise.insights.forEach(insight => {
      html += `
        <div class="insight-card tipo-${insight.tipo} fade-in-up">
          <div class="insight-header">
            <div class="insight-icon ${insight.tipo}">
              <i class="fas fa-${insight.tipo === 'alerta' ? 'exclamation-triangle' : insight.tipo === 'tendencia' ? 'chart-line' : insight.tipo === 'oportunidade' ? 'lightbulb' : 'brain'}"></i>
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
  }

  container.innerHTML = html;
}

// ============================================================================
// UTILITÁRIOS E FORMATAÇÃO
// ============================================================================

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

function formatarMoedaBR(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function limparFormulario() {
  const campos = ['descricao', 'valor'];
  campos.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      elemento.value = '';
      elemento.classList.remove('campo-obrigatorio');
    }
  });
  
  const dataElement = document.getElementById('data');
  if (dataElement) {
    dataElement.value = new Date().toISOString().split('T')[0];
  }
  
  const recorrenteElement = document.getElementById('recorrente');
  if (recorrenteElement) {
    recorrenteElement.value = 'Não';
  }
  
  const tipoRecorrenciaElement = document.getElementById('tipoRecorrencia');
  if (tipoRecorrenciaElement) {
    tipoRecorrenciaElement.selectedIndex = 0;
  }
  
  const colunaRecorrencia = document.getElementById('colunaTipoRecorrencia');
  if (colunaRecorrencia) {
    colunaRecorrencia.style.display = 'none';
  }
  
  const recorrenciaPersonalizada = document.getElementById('recorrenciaPersonalizada');
  if (recorrenciaPersonalizada) {
    recorrenciaPersonalizada.style.display = 'none';
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
      versao: '2.0.0',
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
// INICIALIZAÇÃO DO SISTEMA
// ============================================================================

window.addEventListener('load', async () => {
  try {
    console.log('🚀 Iniciando sistema iClub COMPLETO...');
    
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
      mostrarNotificacaoInteligente(`✅ Sistema carregado! ${totalSaidas} saídas encontradas.`);
    } else {
      mostrarNotificacaoInteligente('✅ Sistema completo carregado! Todas as funcionalidades prontas.');
    }
    
    // Aplicar animações fade-in
    document.querySelectorAll('.card-modern, .status-section').forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('fade-in-up');
      }, index * 100);
    });
    
    console.log('🎉 TODAS AS FUNCIONALIDADES IMPLEMENTADAS E FUNCIONANDO:');
    console.log('🧠 IA com treinamento automático e comandos diretos');
    console.log('📅 Reconhecimento de dias da semana');
    console.log('🏢 Múltiplas lojas em uma frase');
    console.log('💰 Valores brasileiros avançados');
    console.log('❓ Perguntas inteligentes');
    console.log('🎨 Interface modernizada com gradientes');
    console.log('🔄 Recorrência personalizada');
    console.log('👀 Sistema "Ver Mais" inteligente');
    console.log('🔧 Separação correta das seções');
    console.log('📊 Análise inteligente completa');
    console.log('🔔 Notificações modernas');
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    mostrarNotificacaoInteligente('❌ Erro ao carregar. Verifique o console.', 'error');
  }
});

// ============================================================================
// EXPOSIÇÃO DAS FUNÇÕES GLOBAIS
// ============================================================================

// Funções principais do Chat IA
window.mostrarTreinamentoIA = mostrarTreinamentoIA;
window.fecharTreinamentoIA = fecharTreinamentoIA;
window.salvarTreinamentoNatural = salvarTreinamentoNatural;
window.salvarTreinamentoManual = salvarTreinamentoManual;
window.enviarMensagemChat = enviarMensagemChat;
window.limparChat = limparChat;
window.responderPerguntaInteligente = responderPerguntaInteligente;

// Funções principais CRUD
window.adicionarSaida = adicionarSaida;
window.excluirSaida = excluirSaida;
window.editarSaida = editarSaida;
window.salvarEdicaoSaida = salvarEdicaoSaida;
window.marcarComoPago = marcarComoPago;

// Gestão de categorias e lojas
window.mostrarEditorCategoria = mostrarEditorCategoria;
window.mostrarEditorLoja = mostrarEditorLoja;
window.adicionarCategoria = adicionarCategoria;
window.adicionarLoja = adicionarLoja;
window.mostrarEditorCategoriaExistente = mostrarEditorCategoriaExistente;
window.mostrarEditorLojaExistente = mostrarEditorLojaExistente;
window.removerCategoria = removerCategoria;
window.removerLoja = removerLoja;
window.fecharModal = fecharModal;

// Múltiplas saídas
window.iniciarMultiplasSaidas = iniciarMultiplasSaidas;
window.adicionarNovaLinha = adicionarNovaLinha;
window.removerLinhaSaida = removerLinhaSaida;
window.adicionarTodasSaidas = adicionarTodasSaidas;
window.cancelarMultiplasSaidas = cancelarMultiplasSaidas;
window.formatarMoedaMultiplas = formatarMoedaMultiplas;

// Funções de recorrência
window.toggleTipoRecorrencia = toggleTipoRecorrencia;
window.toggleRecorrenciaPersonalizada = toggleRecorrenciaPersonalizada;
window.toggleEditRecorrencia = toggleEditRecorrencia;
window.toggleEditRecorrenciaPersonalizada = toggleEditRecorrenciaPersonalizada;
window.toggleRecorrenciaMultipla = toggleRecorrenciaMultipla;
window.toggleRecorrenciaMultiplaPersonalizada = toggleRecorrenciaMultiplaPersonalizada;

// Filtros e navegação
window.aplicarFiltroLoja = aplicarFiltroLoja;
window.filtrarRecorrentesPorFiltros = filtrarRecorrentesPorFiltros;
window.limparFiltrosRecorrentes = limparFiltrosRecorrentes;
window.preencherMesesDoAno = preencherMesesDoAno;

// Sistema "Ver Mais" e paginação
window.toggleVerMaisProximas = toggleVerMaisProximas;
window.paginacaoAnterior = paginacaoAnterior;
window.paginacaoProxima = paginacaoProxima;

// Análise inteligente
window.abrirAnaliseInteligente = abrirAnaliseInteligente;
window.fecharAnaliseInteligente = fecharAnaliseInteligente;

// Utilitários
window.formatarMoeda = formatarMoeda;

console.log('🎯 SISTEMA ICLUB VERSÃO FINAL - TODAS AS FUNCIONALIDADES IMPLEMENTADAS E CORRIGIDAS!');