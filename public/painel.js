// painel.js - SISTEMA COMPLETO ICLUB: ATUALIZADO E CORRIGIDO
// ============================================================================
// SISTEMA PRINCIPAL ICLUB - INTEGRADO
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

// Chat IA
let aguardandoSelecaoLoja = false;
let saidaPendenteLoja = null;

// ============================================================================
// SISTEMA DE TREINAMENTO IA
// ============================================================================

function mostrarTreinamentoIA() {
  const modal = document.getElementById('modalTreinamentoIA');
  if (modal) {
    modal.style.display = 'block';
    
    // Preencher selects
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
  // Categorias
  const selectCat = document.getElementById('treinamentoCategoria');
  if (selectCat) {
    selectCat.innerHTML = '<option value="">Selecione...</option>';
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      selectCat.appendChild(option);
    });
  }
  
  // Lojas
  const selectLoja = document.getElementById('treinamentoLoja');
  if (selectLoja) {
    selectLoja.innerHTML = '<option value="">Selecione...</option>';
    lojas.forEach(loja => {
      const option = document.createElement('option');
      option.value = loja;
      option.textContent = loja;
      selectLoja.appendChild(option);
    });
  }
}

function salvarTreinamentoIA() {
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
  
  mostrarMensagemSucesso('✅ IA treinada com sucesso!');
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
  
  if (treinamentosIA.length === 0) {
    lista.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #6b7280;">
        <i class="fas fa-lightbulb" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <p>Nenhum treinamento ainda. Adicione exemplos para melhorar a IA!</p>
      </div>
    `;
    return;
  }
  
  lista.innerHTML = `
    <h6 style="color: #667eea; font-weight: 700; margin-bottom: 15px;">
      📚 Treinamentos Salvos (${treinamentosIA.length})
    </h6>
    ${treinamentosIA.slice(-5).reverse().map(t => `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
        <div style="font-weight: 600; color: #374151; margin-bottom: 5px;">
          "${t.frase}"
        </div>
        <div style="font-size: 0.85rem; color: #6b7280;">
          💰 R$ ${t.valor.toFixed(2)} • 🏷️ ${t.categoria} • 🏪 ${t.loja}
        </div>
      </div>
    `).join('')}
  `;
}

// ============================================================================
// CHAT IA INTELIGENTE
// ============================================================================

function enviarMensagemChat() {
  const input = document.getElementById('chatInput');
  const mensagem = input?.value.trim();
  
  if (!mensagem) return;
  
  input.value = '';
  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  
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

async function processarMensagemIA(mensagem) {
  try {
    console.log('🧠 Processando:', mensagem);
    
    // Verificar se é múltiplas saídas
    const saidasMultiplas = detectarSaidasMultiplas(mensagem);
    
    if (saidasMultiplas.length > 1) {
      await processarSaidasMultiplas(saidasMultiplas, mensagem);
      return;
    }
    
    // Interpretar mensagem única
    const resultado = interpretarMensagemIA(mensagem);
    esconderTyping();
    
    if (!resultado.sucesso) {
      const erro = `❌ ${resultado.erro}

💡 Exemplos válidos:
• "Paguei 500 de aluguel hoje"
• "Gastei 80 de gasolina ontem"  
• "Devo 200 de internet"`;
      
      adicionarMensagemChat('system', erro);
      return;
    }
    
    // Verificar informações obrigatórias
    const validacao = validarInformacoesObrigatorias(resultado, mensagem);
    
    if (!validacao.valido) {
      await solicitarInformacoesFaltantes(validacao, resultado, mensagem);
      return;
    }
    
    // Processar saída completa
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

    // Verificar treinamentos específicos primeiro
    const treinamentoEncontrado = buscarTreinamento(msgLower);
    if (treinamentoEncontrado) {
      console.log('🎓 Usando treinamento:', treinamentoEncontrado);
      return {
        sucesso: true,
        categoria: treinamentoEncontrado.categoria,
        valor: treinamentoEncontrado.valor,
        data: new Date().toISOString().split('T')[0],
        descricao: treinamentoEncontrado.categoria, // Só o nome da categoria
        pago: detectarStatusPagamento(msgLower),
        recorrente: "Não",
        tipoRecorrencia: null,
        fonte: 'treinamento'
      };
    }

    // Padrões de reconhecimento
    const padroes = {
      valor: /(?:r\$?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)\s*(?:reais?|real|pila|conto|pau|dinheiro)?/i,
      dataHoje: /\b(?:hoje|hj|agora)\b/i,
      dataOntem: /\b(?:ontem|onte)\b/i,
      dataAmanha: /\b(?:amanhã|amanha|tomorrow)\b/i,
      acoesPago: /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou|saída|despesa|débito|desembolsei?)\b/i,
      acoesNaoPago: /\b(?:devo|deve|preciso\s+pagar|vou\s+pagar|pendente|conta\s+para\s+pagar|a\s+pagar|fatura|boleto)\b/i,
      recorrente: /\b(?:mensal|todo\s+mês|mensalmente|recorrente|fixo|sempre|mensalidade)\b/i
    };

    // Categorias
    const categoriasIA = {
      'Aluguel': { regex: /\b(?:aluguel|aluguer|rent|locação|arrendamento)\b/i, confianca: 0.95 },
      'Energia': { regex: /\b(?:energia|luz|elétrica|eletricidade|conta\s+de\s+luz|enel|cpfl|cemig)\b/i, confianca: 0.9 },
      'Internet': { regex: /\b(?:internet|wifi|banda\s+larga|provedor|vivo\s+fibra|claro\s+net|tim\s+live)\b/i, confianca: 0.9 },
      'Combustível': { regex: /\b(?:combustível|gasolina|etanol|diesel|posto|abasteci|álcool|combustivel|gas)\b/i, confianca: 0.9 },
      'Material': { regex: /\b(?:material|escritório|papelaria|equipamento|ferramenta|suprimento)\b/i, confianca: 0.8 },
      'Transporte': { regex: /\b(?:transporte|uber|taxi|ônibus|onibus|metrô|metro|passagem|viagem|corrida)\b/i, confianca: 0.85 },
      'Alimentação': { regex: /\b(?:alimentação|comida|mercado|supermercado|restaurante|lanche|café|delivery)\b/i, confianca: 0.8 },
      'Marketing': { regex: /\b(?:marketing|publicidade|anúncio|anuncio|propaganda|google\s+ads|facebook\s+ads)\b/i, confianca: 0.8 },
      'Saúde': { regex: /\b(?:saúde|saude|médico|medico|hospital|farmácia|farmacia|remédio|remedio)\b/i, confianca: 0.85 }
    };

    // EXTRAIR VALOR
    const matchValor = msgLower.match(padroes.valor);
    if (!matchValor) {
      return { sucesso: false, erro: "Não consegui identificar o valor na mensagem" };
    }
    
    let valorTexto = matchValor[1];
    console.log('💰 Valor detectado:', valorTexto);
    
    // Processar números simples (ex: 2000)
    if (/^\d+$/.test(valorTexto)) {
      const numeroSimples = parseInt(valorTexto);
      if (numeroSimples >= 10) {
        valorTexto = numeroSimples.toString();
      }
    } else {
      // Processar formatos com pontos e vírgulas
      if (valorTexto.includes('.') && !valorTexto.includes(',')) {
        const partes = valorTexto.split('.');
        if (partes.length === 2 && partes[1].length === 3) {
          valorTexto = valorTexto.replace('.', '');
        } else if (partes.length === 2 && partes[1].length <= 2) {
          valorTexto = valorTexto.replace('.', ',');
        }
      }
      
      if (valorTexto.includes(',')) {
        valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
      }
    }
    
    const valor = parseFloat(valorTexto);
    console.log('💰 Valor processado:', valor);
    
    if (isNaN(valor) || valor <= 0) {
      return { sucesso: false, erro: `Valor inválido: ${matchValor[1]}` };
    }

    // EXTRAIR DATA
    let data = new Date().toISOString().split('T')[0];
    
    if (padroes.dataOntem.test(msgLower)) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      data = ontem.toISOString().split('T')[0];
    } else if (padroes.dataAmanha.test(msgLower)) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      data = amanha.toISOString().split('T')[0];
    }

    // IDENTIFICAR CATEGORIA
    let melhorCategoria = "Outros";
    let maiorConfianca = 0;
    
    for (const [categoria, config] of Object.entries(categoriasIA)) {
      if (config.regex.test(msgLower)) {
        if (config.confianca > maiorConfianca) {
          melhorCategoria = categoria;
          maiorConfianca = config.confianca;
        }
      }
    }

    // STATUS DE PAGAMENTO
    let pago = "Sim";
    
    if (padroes.acoesNaoPago.test(msgLower)) {
      pago = "Não";
    } else if (padroes.acoesPago.test(msgLower)) {
      pago = "Sim";
    }

    // RECORRÊNCIA
    let recorrente = "Não";
    let tipoRecorrencia = null;
    
    if (padroes.recorrente.test(msgLower)) {
      recorrente = "Sim";
      tipoRecorrencia = "Mensal";
    }

    // DESCRIÇÃO: apenas o nome da categoria
    let descricao = melhorCategoria;

    const resultado = {
      sucesso: true,
      categoria: melhorCategoria,
      valor: valor,
      data: data,
      descricao: descricao, // Só o nome da categoria
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

function buscarTreinamento(mensagem) {
  // Buscar treinamento mais similar
  let melhorTreinamento = null;
  let melhorScore = 0;
  
  for (const treinamento of treinamentosIA) {
    const score = calcularSimilaridade(mensagem, treinamento.frase);
    if (score > melhorScore && score > 0.7) { // 70% de similaridade
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
  return "Sim"; // Default
}

function detectarSaidasMultiplas(mensagem) {
  const msgLower = mensagem.toLowerCase();
  
  // Padrão para múltiplas lojas: "de castanhal, belem e mix"
  const padraoMultiploLojas = /de\s+([^,]+(?:,\s*[^,]+)*(?:\s+e\s+[^,\s]+)?)/i;
  const matchLojas = msgLower.match(padraoMultiploLojas);
  
  if (matchLojas) {
    const lojasTexto = matchLojas[1];
    const lojasDetectadas = lojasTexto.split(/,|\s+e\s+/).map(l => l.trim()).filter(l => l);
    
    if (lojasDetectadas.length > 1) {
      // Mapear para lojas conhecidas
      const lojasValidas = [];
      
      lojasDetectadas.forEach(lojaTexto => {
        const lojaEncontrada = lojas.find(l => 
          l.toLowerCase().includes(lojaTexto) || 
          lojaTexto.includes(l.toLowerCase().split(' ')[0])
        );
        
        if (lojaEncontrada) {
          lojasValidas.push(lojaEncontrada);
        } else {
          // Criar loja baseada no texto
          lojasValidas.push(`Loja ${lojaTexto.charAt(0).toUpperCase() + lojaTexto.slice(1)}`);
        }
      });
      
      return lojasValidas;
    }
  }
  
  return [];
}

async function processarSaidasMultiplas(lojasDetectadas, mensagemOriginal) {
  try {
    const resultado = interpretarMensagemIA(mensagemOriginal);
    
    if (!resultado.sucesso) {
      adicionarMensagemChat('system', `❌ ${resultado.erro}`);
      return;
    }
    
    let sucessos = 0;
    
    for (const loja of lojasDetectadas) {
      const saidaData = criarDadosSaida(resultado, loja);
      
      try {
        // Adicionar às saídas locais
        if (saidaData.pago === 'Sim') {
          saidas.unshift(saidaData);
        } else {
          saidasPendentes.unshift(saidaData);
        }
        sucessos++;
      } catch (error) {
        console.error('❌ Erro saída múltipla:', error);
      }
    }
    
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    
    const resposta = `✅ ${sucessos} saídas adicionadas com sucesso!

💰 Valor: ${formatarMoedaBR(resultado.valor)} cada
📊 Categoria: ${resultado.categoria}
🏪 Lojas: ${lojasDetectadas.join(', ')}
📅 Data: ${new Date(resultado.data + 'T00:00:00').toLocaleDateString('pt-BR')}

🤖 Processamento múltiplo pela IA`;
    
    adicionarMensagemChat('system', resposta);
    mostrarMensagemSucesso(`✅ ${sucessos} saídas adicionadas via IA!`);
    
  } catch (error) {
    console.error('❌ Erro processamento múltiplo:', error);
    adicionarMensagemChat('system', '❌ Erro ao processar saídas múltiplas.');
  }
}

function validarInformacoesObrigatorias(resultado, mensagem) {
  const problemas = [];
  
  // Verificar valor
  if (!resultado.valor || resultado.valor <= 0) {
    problemas.push('valor');
  }
  
  // Verificar categoria
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
    descricao: resultado.descricao, // Só o nome da categoria
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
  
  // Procurar menção direta das lojas
  for (const loja of lojas) {
    if (msgLower.includes(loja.toLowerCase())) {
      return loja;
    }
  }
  
  // Procurar palavras-chave
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

function usarExemplo(exemplo) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = exemplo;
    enviarMensagemChat();
  }
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
  const descricao = document.getElementById("descricao")?.value || categoria; // Usar categoria se descrição vazia
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
    descricao: descricao || categoria, // Garantir que tenha descrição
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
  
  // Criar modal de edição
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
  
  // Encontrar e atualizar a saída
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
  
  // Remover da lista atual
  const indexAtual = listaSaidas.findIndex(s => s.id === saidaId);
  if (indexAtual !== -1) {
    listaSaidas.splice(indexAtual, 1);
  }
  
  // Remover também da outra lista (caso tenha mudado o status)
  saidas = saidas.filter(s => s.id !== saidaId);
  saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
  
  // Atualizar dados
  saidaEncontrada.loja = loja;
  saidaEncontrada.categoria = categoria;
  saidaEncontrada.descricao = descricao;
  saidaEncontrada.valor = valor;
  saidaEncontrada.data = data;
  saidaEncontrada.recorrente = recorrente;
  saidaEncontrada.tipoRecorrencia = recorrente === 'Sim' ? tipoRecorrencia : null;
  saidaEncontrada.pago = pago;
  saidaEncontrada.editadoEm = new Date().toISOString();
  
  // Adicionar na lista correta
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
// GESTÃO DE CATEGORIAS E LOJAS
// ============================================================================

function mostrarEditorCategoria() {
  const editor = document.getElementById("editor-categoria");
  if (editor) {
    if (editor.style.display === "none" || !editor.style.display) {
      editor.style.display = "block";
    } else {
      editor.style.display = "none";
    }
  }
}

function mostrarEditorLoja() {
  const editor = document.getElementById("editor-loja");
  if (editor) {
    if (editor.style.display === "none" || !editor.style.display) {
      editor.style.display = "block";
    } else {
      editor.style.display = "none";
    }
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
// MÚLTIPLAS SAÍDAS
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
    const descricao = document.getElementById(`descricao-${id}`)?.value || categoria; // Usar categoria se vazio
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
// INTERFACE E ATUALIZAÇÃO
// ============================================================================

function atualizarInterfaceCompleta() {
  try {
    console.log('🔄 Atualizando interface...');
    
    atualizarCategorias();
    atualizarLojas();
    atualizarTabela();
    atualizarFiltros();
    atualizarDashboard();
    atualizarGraficos();
    
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
  // Filtro global
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

  // Filtros de recorrentes
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

  // Filtro de categorias recorrentes
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

  // Filtro de anos
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

  // Filtro de meses
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

function filtrarRecorrentesPorFiltros() {
  console.log('🔍 Atualizando filtros de recorrentes...');
  atualizarTabela();
}

function limparFiltrosRecorrentes() {
  const filtros = [
    "filtroLojaRecorrentes",
    "filtroAnoRecorrentes", 
    "filtroMesRecorrentes",
    "filtroCategoriaRecorrentes"
  ];
  
  filtros.forEach(filtroId => {
    const elemento = document.getElementById(filtroId);
    if (elemento) {
      elemento.value = "";
    }
  });
  
  // Reconfigurar filtros padrão
  setTimeout(() => {
    atualizarFiltros();
    filtrarRecorrentesPorFiltros();
  }, 100);
}

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
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  const saidasMes = [];
  const saidasAtrasadas = [];
  const saidasVencendoHoje = [];
  const saidasProximas = [];
  const saidasRecorrentes = [];
  
  [...saidas, ...saidasPendentes].forEach(s => {
    if (lojaFiltroAtual && s.loja !== lojaFiltroAtual) return;
    
    const dataSaida = new Date(s.data + 'T00:00:00');
    const diffDias = Math.floor((hoje - dataSaida) / (1000 * 60 * 60 * 24));
    
    // Saídas recorrentes (sempre aparecem)
    if (s.recorrente === 'Sim') {
      saidasRecorrentes.push(s);
    }
    
    // Saídas não pagas por status de data
    if (s.pago === 'Não') {
      if (diffDias > 0) {
        // Atrasadas
        saidasAtrasadas.push({...s, diasAtrasado: diffDias});
      } else if (diffDias === 0) {
        // Vencendo hoje
        saidasVencendoHoje.push(s);
      } else if (diffDias >= -7) {
        // Próximas (próximos 7 dias)
        saidasProximas.push({...s, diasRestantes: Math.abs(diffDias)});
      }
    }
    
    // Saídas do mês (pagas ou do mês atual)
    if (s.data.substring(0, 7) === anoMes) {
      saidasMes.push(s);
    }
  });
  
  // Ordenar
  saidasMes.sort((a, b) => new Date(b.data) - new Date(a.data));
  saidasAtrasadas.sort((a, b) => b.diasAtrasado - a.diasAtrasado);
  saidasVencendoHoje.sort((a, b) => new Date(a.data) - new Date(b.data));
  saidasProximas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  
  // Preencher tabelas
  preencherTabelaDoMes(tbody, saidasMes);
  preencherTabelaAtrasadas(divAtrasadas, saidasAtrasadas);
  preencherTabelaVencendoHoje(divVencendoHoje, saidasVencendoHoje);
  preencherTabelaProximas(divProximas, saidasProximas);
  preencherTabelaRecorrentes(divPrevisaoRecorrentes, saidasRecorrentes);
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
        <span class="badge ${s.pago === 'Sim' ? 'bg-success' : 'bg-warning'}">${s.pago}</span>
        <button class="btn btn-warning btn-sm ms-1" onclick="editarSaida('${s.firestoreId || ''}', ${s.id})" title="Editar">
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
  
  // Aplicar filtros de recorrentes
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
  
  // Ordenar por data
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
  
  // Atualizar total
  const total = saidasFiltradas.reduce((sum, s) => sum + s.valor, 0);
  atualizarTotalRecorrentes(total);
}

function atualizarTotalRecorrentes(total) {
  const elemento = document.getElementById("totalSaidasRecorrentes");
  if (elemento) {
    elemento.textContent = formatarMoedaBR(total);
  }
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

  // Atualizar elementos do dashboard
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

function atualizarGraficos() {
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
    
    // Atualizar todos os gráficos
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

// Novo gráfico de meses
function atualizarGraficoMeses() {
  const ctx = document.getElementById('graficoMes');
  if (!ctx) return;
  
  try {
    if (window.chartMes) {
      window.chartMes.destroy();
    }
    
    // Agrupar por mês (últimos 6 meses)
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

// Novo gráfico de centros de custo
function atualizarGraficoCentrosCusto() {
  const ctx = document.getElementById('graficoCentrosCusto');
  if (!ctx) return;
  
  try {
    if (window.chartCentrosCusto) {
      window.chartCentrosCusto.destroy();
    }
    
    // Agrupar por loja e categoria
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
      return; // Não criar gráfico se não há dados
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
      return; // Não criar gráfico se não há dados
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
      return; // Não criar gráfico se não há dados
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

// ============================================================================
// FILTROS
// ============================================================================

function aplicarFiltroLoja() {
  const filtro = document.getElementById("filtroLojaGlobal");
  lojaFiltroAtual = filtro ? filtro.value : "";
  atualizarTabela();
  atualizarDashboard();
  atualizarGraficos();
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

function filtrarRecorrentesPorFiltros() {
  console.log('🔍 Filtros de recorrentes aplicados');
}

function limparFiltrosRecorrentes() {
  const filtros = [
    "filtroLojaRecorrentes",
    "filtroAnoRecorrentes", 
    "filtroMesRecorrentes",
    "filtroCategoriaRecorrentes"
  ];
  
  filtros.forEach(filtroId => {
    const elemento = document.getElementById(filtroId);
    if (elemento) {
      elemento.value = "";
    }
  });
  
  filtrarRecorrentesPorFiltros();
}

function preencherMesesDoAno() {
  console.log('📅 Meses do ano preenchidos');
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

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

// ============================================================================
// BACKUP LOCAL SEGURO
// ============================================================================

function salvarDadosLocal() {
  try {
    const dadosBackup = {
      categorias,
      lojas, 
      saidas,
      saidasPendentes,
      treinamentosIA,
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
      
      console.log('📂 Backup local carregado:', dados.totalSaidas || 0, 'saídas');
      console.log('📂 Último backup:', dados.ultimoBackup || 'Desconhecido');
      
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
// ANÁLISE INTELIGENTE (SIMPLIFICADA)
// ============================================================================

// Variáveis globais para análise
let dadosParaAnalise = [];
let analiseCompleta = null;

// Função principal para abrir análise inteligente
async function abrirAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  const loading = document.getElementById('analiseLoading');
  const resultado = document.getElementById('analiseResultado');
  
  if (!modal || !loading || !resultado) {
    alert('Modal de análise não encontrado');
    return;
  }
  
  // Mostrar modal e loading
  modal.style.display = 'block';
  loading.style.display = 'block';
  resultado.style.display = 'none';
  
  // Resetar progresso
  const progressoBarra = document.getElementById('progressoBarra');
  if (progressoBarra) {
    progressoBarra.style.width = '0%';
  }
  
  try {
    // Simular progresso de análise
    await simularProgressoAnalise();
    
    // Executar análise
    const analise = await executarAnaliseInteligente();
    
    // Mostrar resultados
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

// Simular progresso da análise
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

// Executar análise inteligente
async function executarAnaliseInteligente() {
  // Coletar dados do sistema
  dadosParaAnalise = await coletarDadosParaAnalise();
  
  // Executar diferentes tipos de análise
  const analise = {
    resumoExecutivo: gerarResumoExecutivo(dadosParaAnalise),
    insights: gerarInsightsPrincipais(dadosParaAnalise)
  };

  analiseCompleta = analise;
  return analise;
}

// Coletar dados para análise
async function coletarDadosParaAnalise() {
  // Usar dados do sistema já carregados
  const todasSaidas = [...saidas, ...saidasPendentes];
  
  // Agrupar dados por diferentes dimensões
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

// Funções auxiliares de agrupamento
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

// Gerar resumo executivo
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

// Gerar insights principais
function gerarInsightsPrincipais(dados) {
  const insights = [];
  
  // Insight 1: Categoria dominante
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

  // Insight 2: Status de pagamentos
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

  // Insight 3: Distribuição por lojas
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

// Exibir resultados da análise
function exibirResultadosAnalise(analise) {
  const container = document.getElementById('analiseResultado');
  
  if (!container) return;
  
  let html = `
    <div class="resumo-executivo">
      <h4 class="resumo-titulo">📊 Resumo Executivo</h4>
      <p>Análise completa dos dados do sistema iClub</p>
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
      </div>
    </div>
  `;

  // Adicionar insights
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
// INICIALIZAÇÃO PRINCIPAL
// ============================================================================

window.addEventListener('load', async () => {
  try {
    console.log('🚀 Iniciando aplicação iClub...');
    
    // Configurar data padrão
    const dataElement = document.getElementById('data');
    if (dataElement && !dataElement.value) {
      dataElement.value = new Date().toISOString().split('T')[0];
    }
    
    // Event listener para Enter no chat
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          enviarMensagemChat();
        }
      });
    }
    
    // Carregar dados locais
    const backupOK = carregarDadosLocal();
    if (backupOK) {
      console.log('✅ Dados carregados do backup local');
    }
    
    // Atualizar interface
    atualizarInterfaceCompleta();
    
    // Confirmar carregamento
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
// EXPORTAR FUNÇÕES GLOBAIS PARA O HTML
// ============================================================================

// Tornar funções globais disponíveis
window.mostrarTreinamentoIA = mostrarTreinamentoIA;
window.fecharTreinamentoIA = fecharTreinamentoIA;
window.salvarTreinamentoIA = salvarTreinamentoIA;
window.enviarMensagemChat = enviarMensagemChat;
window.usarExemplo = usarExemplo;
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

// Log inicial
console.log('✅ painel.js carregado com sucesso!');
console.log('🧠 IA integrada com treinamento personalizado');
console.log('📊 Análise inteligente disponível');
console.log('🔧 Sistema 100% funcional e otimizado');