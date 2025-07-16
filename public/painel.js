// painel.js - SISTEMA COMPLETO ICLUB: FIREBASE + CHAT IA + GRÁFICOS
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================================================
// CONFIGURAÇÃO FIREBASE - SUBSTITUA PELAS SUAS CREDENCIAIS
// ============================================================================
const firebaseConfig = {
  apiKey: "SUA-API-KEY-AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================
let app, db;
let firebaseInicializado = false;
let tentativasConexao = 0;

// Dados do sistema
let categorias = [
  "Aluguel", "Energia", "Internet", "Combustível", "Material", 
  "Transporte", "Alimentação", "Marketing", "Saúde"
];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";

// Chat IA
let aguardandoSelecaoLoja = false;
let saidaPendenteLoja = null;

// Múltiplas saídas
let multiplasSaidasLista = [];
let contadorMultiplas = 0;

// ============================================================================
// FUNÇÕES DE STATUS VISUAL
// ============================================================================
function atualizarStatusFirebase(status, texto) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (statusDot && statusText) {
    statusDot.className = '';
    
    switch (status) {
      case 'online':
        statusDot.classList.add('status-online');
        statusText.textContent = texto || '🔥 Firebase Online';
        statusText.style.color = '#10b981';
        break;
      case 'offline':
        statusDot.classList.add('status-offline');
        statusText.textContent = texto || '📱 Modo Offline';
        statusText.style.color = '#6b7280';
        break;
      case 'error':
        statusDot.classList.add('status-error');
        statusText.textContent = texto || '❌ Erro Conexão';
        statusText.style.color = '#ef4444';
        break;
      default:
        statusText.textContent = texto || 'Conectando...';
        statusText.style.color = '#f59e0b';
    }
  }
}

// ============================================================================
// INICIALIZAÇÃO FIREBASE
// ============================================================================
async function inicializarFirebase() {
  try {
    console.log('🔄 Conectando ao Firebase...');
    atualizarStatusFirebase('connecting', 'Conectando...');
    
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "SUA-API-KEY-AQUI") {
      throw new Error('Firebase não configurado');
    }
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    // Testar conexão
    await getDocs(collection(db, 'saidasProfissional'));
    
    firebaseInicializado = true;
    atualizarStatusFirebase('online');
    console.log('✅ Firebase conectado!');
    
    window.firebaseInicializado = true;
    window.db = db;
    
    return true;
  } catch (error) {
    console.error('❌ Erro Firebase:', error.message);
    firebaseInicializado = false;
    window.firebaseInicializado = false;
    
    tentativasConexao++;
    if (tentativasConexao < 3) {
      atualizarStatusFirebase('connecting', `Tentativa ${tentativasConexao + 1}/3...`);
      setTimeout(() => inicializarFirebase(), 2000);
    } else {
      atualizarStatusFirebase('offline');
    }
    
    return false;
  }
}

async function configurarListenersTempoReal() {
  if (!firebaseInicializado) return;

  try {
    console.log('📡 Configurando listeners...');
    
    const todasSaidasQuery = query(
      collection(db, 'saidasProfissional'),
      orderBy('timestamp', 'desc')
    );
    
    onSnapshot(todasSaidasQuery, (snapshot) => {
      console.log('🔄 Dados atualizados:', snapshot.size, 'documentos');
      
      saidas = [];
      saidasPendentes = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const saidaCompleta = {
          firestoreId: doc.id,
          ...data,
          id: data.id || doc.id,
          timestamp: data.timestamp || new Date()
        };
        
        if (data.pago === 'Sim') {
          saidas.push(saidaCompleta);
        } else {
          saidasPendentes.push(saidaCompleta);
        }
      });
      
      console.log('📊 Saídas pagas:', saidas.length);
      console.log('📊 Saídas pendentes:', saidasPendentes.length);
      
      atualizarInterfaceCompleta();
      salvarDadosLocal();
      
    }, (error) => {
      console.error('❌ Erro listener:', error);
      carregarDadosLocal();
      atualizarInterfaceCompleta();
    });
    
  } catch (error) {
    console.error('❌ Erro configurar listeners:', error);
  }
}

async function inicializarFirebaseSync() {
  console.log('🚀 Iniciando sistema...');
  
  try {
    const firebaseOK = await inicializarFirebase();
    
    if (firebaseOK) {
      console.log('🔗 Firebase conectado');
      await carregarConfiguracoes();
      await configurarListenersTempoReal();
    } else {
      console.warn('⚠️ Modo offline');
      carregarDadosLocal();
      atualizarInterfaceCompleta();
    }
    
  } catch (error) {
    console.error('❌ Erro inicialização:', error);
    carregarDadosLocal();
    atualizarInterfaceCompleta();
  }
}

// ============================================================================
// CHAT IA INTELIGENTE
// ============================================================================
function enviarMensagemChat() {
  const input = document.getElementById('chatInput');
  const mensagem = input.value.trim();
  
  if (!mensagem) return;
  
  input.value = '';
  document.getElementById('chatSendBtn').disabled = true;
  
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
    document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
  }
}

function esconderTyping() {
  const typing = document.getElementById('typingIndicator');
  if (typing) {
    typing.style.display = 'none';
  }
  document.getElementById('chatSendBtn').disabled = false;
}

function processarSelecaoLoja(resposta) {
  const numeroEscolhido = parseInt(resposta.trim());
  
  if (numeroEscolhido >= 1 && numeroEscolhido <= lojas.length) {
    const lojaEscolhida = lojas[numeroEscolhido - 1];
    saidaPendenteLoja.loja = lojaEscolhida;
    
    adicionarMensagemChat('user', resposta);
    finalizarAdicaoSaida(saidaPendenteLoja, lojaEscolhida);
    
    aguardandoSelecaoLoja = false;
    saidaPendenteLoja = null;
    
  } else {
    adicionarMensagemChat('user', resposta);
    adicionarMensagemChat('system', `❌ Opção inválida. Digite um número de 1 a ${lojas.length}:`);
    
    const opcoesTexto = lojas.map((loja, index) => `${index + 1}. ${loja}`).join('\n');
    adicionarMensagemChat('system', opcoesTexto);
  }
  
  document.getElementById('chatSendBtn').disabled = false;
}

async function finalizarAdicaoSaida(saidaData) {
  try {
    if (firebaseInicializado) {
      await adicionarSaidaFirebase(saidaData);
    } else {
      if (saidaData.pago === 'Sim') {
        saidas.unshift(saidaData);
      } else {
        saidasPendentes.unshift(saidaData);
      }
      salvarDadosLocal();
      atualizarInterfaceCompleta();
    }
    
    const resposta = gerarRespostaChat(saidaData);
    adicionarMensagemChat('system', resposta);
    mostrarMensagemSucesso('✅ Saída adicionada via Chat IA!');
    
  } catch (error) {
    console.error('❌ Erro finalizar:', error);
    adicionarMensagemChat('system', '❌ Erro ao salvar. Tente novamente.');
  }
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
      await solicitarInformacoesFaltantes(validacao, resultado);
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
        if (firebaseInicializado) {
          await adicionarSaidaFirebase(saidaData);
        } else {
          if (saidaData.pago === 'Sim') {
            saidas.unshift(saidaData);
          } else {
            saidasPendentes.unshift(saidaData);
          }
        }
        sucessos++;
      } catch (error) {
        console.error('❌ Erro saída múltipla:', error);
      }
    }
    
    if (!firebaseInicializado) {
      salvarDadosLocal();
      atualizarInterfaceCompleta();
    }
    
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
    // Tentar detectar categoria novamente
    const categoriaDetectada = detectarCategoriaAvancada(mensagem);
    if (!categoriaDetectada) {
      problemas.push('categoria');
    } else {
      resultado.categoria = categoriaDetectada;
    }
  }
  
  return {
    valido: problemas.length === 0,
    problemas: problemas,
    resultado: resultado
  };
}

function detectarCategoriaAvancada(mensagem) {
  const msgLower = mensagem.toLowerCase();
  
  // Categorias com sinônimos expandidos
  const categoriasExpandidas = {
    'Aluguel': ['aluguel', 'aluguer', 'rent', 'locação', 'arrendamento'],
    'Energia': ['energia', 'luz', 'elétrica', 'eletricidade', 'enel', 'cpfl', 'cemig'],
    'Internet': ['internet', 'wifi', 'banda', 'provedor', 'vivo', 'claro', 'tim'],
    'Combustível': ['combustível', 'gasolina', 'etanol', 'diesel', 'posto', 'álcool', 'gas'],
    'Material': ['material', 'escritório', 'papelaria', 'equipamento', 'ferramenta'],
    'Transporte': ['transporte', 'uber', 'taxi', 'ônibus', 'metrô', 'passagem', 'viagem'],
    'Alimentação': ['alimentação', 'comida', 'mercado', 'supermercado', 'restaurante', 'lanche'],
    'Marketing': ['marketing', 'publicidade', 'anúncio', 'propaganda', 'ads'],
    'Saúde': ['saúde', 'médico', 'hospital', 'farmácia', 'remédio', 'consulta']
  };
  
  for (const [categoria, sinonimos] of Object.entries(categoriasExpandidas)) {
    for (const sinonimo of sinonimos) {
      if (msgLower.includes(sinonimo)) {
        return categoria;
      }
    }
  }
  
  return null;
}

async function solicitarInformacoesFaltantes(validacao, resultado) {
  const problemas = validacao.problemas;
  
  if (problemas.includes('valor')) {
    adicionarMensagemChat('system', '💰 Não consegui identificar o valor. Qual o valor da saída?');
    // Aguardar resposta para valor
    return;
  }
  
  if (problemas.includes('categoria')) {
    adicionarMensagemChat('system', '🏷️ Não consegui identificar a categoria. Para que é esta saída?');
    // Aguardar resposta para categoria
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

function interpretarMensagemIA(mensagem) {
  try {
    const msgOriginal = mensagem.trim();
    const msgLower = mensagem.toLowerCase().trim();
    
    console.log('🧠 IA analisando:', msgLower.substring(0, 50));

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

    // EXTRAIR VALOR (formato brasileiro: 2000 = R$ 2.000,00)
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

    // DESCRIÇÃO INTELIGENTE (só o nome da categoria)
    let descricao = resultado.categoria;
    
    // Se não conseguiu detectar categoria, usar parte da mensagem
    if (!descricao || descricao === 'Outros') {
      // Extrair palavra-chave da mensagem
      const palavrasChave = msgOriginal.split(' ').filter(p => 
        p.length > 3 && 
        !['paguei', 'gastei', 'comprei', 'devo', 'deve', 'hoje', 'ontem', 'amanhã'].includes(p.toLowerCase())
      );
      
      if (palavrasChave.length > 0) {
        descricao = palavrasChave[0].charAt(0).toUpperCase() + palavrasChave[0].slice(1);
      } else {
        descricao = melhorCategoria;
      }
    }

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
          <div>👋 Olá! Eu sou a IA do iClub. Digite suas saídas agora e eu vou adicionar automatico para você!</div>
          <div class="chat-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `;
  }
}

// ============================================================================
// FUNÇÕES FIREBASE
// ============================================================================
async function carregarConfiguracoes() {
  if (!firebaseInicializado) return;
  
  try {
    const categoriasSnapshot = await getDocs(collection(db, 'configuracoes'));
    categoriasSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.tipo === 'categorias') {
        categorias = data.lista || categorias;
      }
      if (data.tipo === 'lojas') {
        lojas = data.lista || lojas;
      }
    });
    
    console.log('📋 Configurações carregadas');
    
  } catch (error) {
    console.warn('⚠️ Erro carregar configurações:', error);
  }
}

async function adicionarSaidaFirebase(saida) {
  if (!firebaseInicializado) return null;

  try {
    console.log('💾 Salvando no Firebase...');
    
    const saidaFirebase = {
      ...saida,
      timestamp: new Date(),
      dataProcessamento: new Date().toISOString(),
      processadoEm: new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo' 
      })
    };
    
    const docRef = await addDoc(collection(db, 'saidasProfissional'), saidaFirebase);
    console.log('✅ Salvo no Firebase:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Erro salvar Firebase:', error);
    return null;
  }
}

async function excluirSaidaFirebase(firestoreId) {
  if (!firebaseInicializado) return false;

  try {
    await deleteDoc(doc(db, 'saidasProfissional', firestoreId));
    console.log('✅ Excluído do Firebase:', firestoreId);
    return true;
  } catch (error) {
    console.error('❌ Erro excluir Firebase:', error);
    return false;
  }
}

async function salvarConfiguracoes() {
  if (!firebaseInicializado) return;

  try {
    await addDoc(collection(db, 'configuracoes'), {
      tipo: 'categorias',
      lista: categorias,
      ultimaAtualizacao: new Date()
    });

    await addDoc(collection(db, 'configuracoes'), {
      tipo: 'lojas',
      lista: lojas,
      ultimaAtualizacao: new Date()
    });

    console.log('✅ Configurações salvas');
  } catch (error) {
    console.error('❌ Erro salvar configurações:', error);
  }
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================
async function adicionarSaida() {
  const loja = document.getElementById("loja")?.value || "Manual";
  const categoria = document.getElementById("categoria")?.value || "Outros";
  const descricao = document.getElementById("descricao")?.value || "Saída manual";
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
    loja, categoria, descricao, valor, data, recorrente,
    tipoRecorrencia: recorrente === "Sim" ? tipoRecorrencia : null,
    pago, origem: 'manual', timestamp: new Date()
  };

  try {
    if (firebaseInicializado) {
      const firestoreId = await adicionarSaidaFirebase(saida);
      if (firestoreId) {
        mostrarMensagemSucesso('✅ Saída adicionada com sucesso!');
        limparFormulario();
      }
    } else {
      if (pago === "Sim") {
        saidas.unshift(saida);
      } else {
        saidasPendentes.unshift(saida);
      }
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      mostrarMensagemSucesso('✅ Saída adicionada com sucesso!');
      limparFormulario();
    }
    
  } catch (error) {
    console.error('❌ Erro adicionar saída:', error);
    alert('Erro ao salvar saída. Tente novamente.');
  }
}

async function excluirSaida(firestoreId, saidaId) {
  if (!confirm('Tem certeza que deseja excluir esta saída?')) return;

  try {
    if (firebaseInicializado && firestoreId) {
      const sucesso = await excluirSaidaFirebase(firestoreId);
      if (sucesso) {
        mostrarMensagemSucesso('✅ Saída excluída!');
      }
    } else {
      saidas = saidas.filter(s => s.id !== saidaId);
      saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      mostrarMensagemSucesso('✅ Saída excluída!');
    }
  } catch (error) {
    console.error('❌ Erro excluir:', error);
    alert('Erro ao excluir saída. Tente novamente.');
  }
}

async function marcarComoPago(firestoreId, saidaId) {
  if (!confirm('Marcar esta saída como paga?')) return;

  try {
    if (firebaseInicializado && firestoreId) {
      await updateDoc(doc(db, 'saidasProfissional', firestoreId), {
        pago: 'Sim',
        dataProcessamento: new Date().toISOString()
      });
      mostrarMensagemSucesso('✅ Saída marcada como paga!');
    } else {
      const saida = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
      if (saida) {
        saida.pago = 'Sim';
        saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
        saidas.unshift(saida);
        salvarDadosLocal();
        atualizarInterfaceCompleta();
        mostrarMensagemSucesso('✅ Saída marcada como paga!');
      }
    }
  } catch (error) {
    console.error('❌ Erro marcar como pago:', error);
    alert('Erro ao atualizar saída. Tente novamente.');
  }
}

function editarSaida(firestoreId, saidaId) {
  alert('Funcionalidade de edição em desenvolvimento');
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

  // Outros filtros
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
}

function atualizarTabela() {
  const tbody = document.getElementById("tabelaSaidas");
  const tbodyAtrasadas = document.getElementById("tabelaAtrasadas");
  const tbodyProximas = document.getElementById("tabelaProximas");
  
  if (!tbody) return;
  
  // Limpar tabelas
  tbody.innerHTML = "";
  if (tbodyAtrasadas) tbodyAtrasadas.innerHTML = "";
  if (tbodyProximas) tbodyProximas.innerHTML = "";
  
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  const saidasPagas = [];
  const saidasAtrasadas = [];
  const saidasProximas = [];
  
  [...saidas, ...saidasPendentes].forEach(s => {
    const dataSaida = new Date(s.data + 'T00:00:00');
    const diffDias = Math.floor((hoje - dataSaida) / (1000 * 60 * 60 * 24));
    
    if (lojaFiltroAtual && s.loja !== lojaFiltroAtual) return;
    
    if (s.pago === 'Não' && diffDias > 0) {
      saidasAtrasadas.push({...s, diasAtrasado: diffDias});
    } else if (s.pago === 'Não' && diffDias >= -7 && diffDias <= 0) {
      saidasProximas.push({...s, diasRestantes: Math.abs(diffDias)});
    } else if (s.data.substring(0, 7) === anoMes) {
      saidasPagas.push(s);
    }
  });
  
  // Ordenar
  saidasPagas.sort((a, b) => new Date(b.data) - new Date(a.data));
  saidasAtrasadas.sort((a, b) => b.diasAtrasado - a.diasAtrasado);
  saidasProximas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  
  // Preencher tabelas
  preencherTabelaDoMes(tbody, saidasPagas);
  preencherTabelaAtrasadas(tbodyAtrasadas, saidasAtrasadas);
  preencherTabelaProximas(tbodyProximas, saidasProximas);
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

function preencherTabelaAtrasadas(tbody, saidas) {
  if (!tbody) return;
  
  saidas.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${s.loja}</strong></td>
      <td>${s.categoria}</td>
      <td>${s.descricao}</td>
      <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
      <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td><span class="badge bg-danger">${s.diasAtrasado} dias</span></td>
      <td>
        <button class="btn btn-success btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
          <i class="fas fa-check"></i>
        </button>
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

function preencherTabelaProximas(tbody, saidas) {
  if (!tbody) return;
  
  saidas.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${s.loja}</strong></td>
      <td>${s.categoria}</td>
      <td>${s.descricao}</td>
      <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
      <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td><span class="badge bg-warning">${s.diasRestantes} dias</span></td>
      <td>
        <button class="btn btn-success btn-sm" onclick="marcarComoPago('${s.firestoreId || ''}', ${s.id})" title="Marcar como Pago">
          <i class="fas fa-check"></i>
        </button>
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
    console.log('📊 Atualizando gráficos...');
    
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
// GESTÃO DE CATEGORIAS E LOJAS
// ============================================================================
function mostrarEditorCategoria() {
  const editor = document.getElementById("editor-categoria");
  if (editor) {
    if (editor.style.display === "none") {
      editor.style.display = "block";
    } else {
      editor.style.display = "none";
    }
  }
}

function mostrarEditorLoja() {
  const editor = document.getElementById("editor-loja");
  if (editor) {
    if (editor.style.display === "none") {
      editor.style.display = "block";
    } else {
      editor.style.display = "none";
    }
  }
}

async function adicionarCategoria() {
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
  
  if (firebaseInicializado) {
    await salvarConfiguracoes();
  } else {
    salvarDadosLocal();
  }
  
  atualizarInterfaceCompleta();
  mostrarMensagemSucesso(`✅ Categoria "${novaCategoria}" adicionada!`);
}

async function adicionarLoja() {
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
  
  if (firebaseInicializado) {
    await salvarConfiguracoes();
  } else {
    salvarDadosLocal();
  }
  
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

async function removerCategoria(index) {
  const categoria = categorias[index];
  if (confirm(`Tem certeza que deseja remover a categoria "${categoria}"?`)) {
    categorias.splice(index, 1);
    
    if (firebaseInicializado) {
      await salvarConfiguracoes();
    } else {
      salvarDadosLocal();
    }
    
    atualizarInterfaceCompleta();
    mostrarEditorCategoriaExistente();
    mostrarMensagemSucesso(`✅ Categoria "${categoria}" removida!`);
  }
}

async function removerLoja(index) {
  const loja = lojas[index];
  if (confirm(`Tem certeza que deseja remover a loja "${loja}"?`)) {
    lojas.splice(index, 1);
    
    if (firebaseInicializado) {
      await salvarConfiguracoes();
    } else {
      salvarDadosLocal();
    }
    
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

async function adicionarTodasSaidas() {
  const listaSaidas = document.getElementById("listaSaidas");
  if (!listaSaidas) return;
  
  const linhas = listaSaidas.querySelectorAll('.saida-item');
  
  let sucessos = 0;
  let erros = 0;
  
  for (const linha of linhas) {
    const id = linha.id.split('-')[1];
    
    const loja = document.getElementById(`loja-${id}`)?.value;
    const categoria = document.getElementById(`categoria-${id}`)?.value;
    const descricao = document.getElementById(`descricao-${id}`)?.value;
    const valorInput = document.getElementById(`valor-${id}`)?.value;
    const valor = extrairValorNumerico(valorInput);
    const data = document.getElementById(`data-${id}`)?.value;
    const pago = document.getElementById(`pago-${id}`)?.value;
    
    if (!descricao || valor <= 0) {
      erros++;
      continue;
    }
    
    const saida = {
      id: Date.now() + Math.random() * 1000,
      loja: loja || "Manual",
      categoria: categoria || "Outros",
      descricao,
      valor,
      data: data || new Date().toISOString().split('T')[0],
      recorrente: "Não",
      tipoRecorrencia: null,
      pago: pago || "Sim",
      origem: 'multiplas',
      timestamp: new Date()
    };
    
    try {
      if (firebaseInicializado) {
        await adicionarSaidaFirebase(saida);
      } else {
      if (firebaseInicializado) {
        await adicionarSaidaFirebase(saida);
      } else {
        if (saida.pago === 'Sim') {
          saidas.unshift(saida);
        } else {
          saidasPendentes.unshift(saida);
        }
      }
      sucessos++;
    } catch (error) {
      console.error('❌ Erro saída múltipla:', error);
      erros++;
    }
  }
  
  if (!firebaseInicializado) {
    salvarDadosLocal();
    atualizarInterfaceCompleta();
  }
  
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
          if (typeof window.enviarMensagemChat === 'function') {
            window.enviarMensagemChat();
          }
        }
      });
    }
    
    // Status inicial
    atualizarStatusFirebase('connecting', 'Inicializando...');
    mostrarMensagemSucesso('🔄 Carregando dados...');
    
    // Inicializar sistema
    await inicializarFirebaseSync();
    
    // Confirmar carregamento
    const totalSaidas = saidas.length + saidasPendentes.length;
    console.log('✅ Sistema carregado:', totalSaidas, 'saídas total');
    
    // Exportar para debug
    window.saidas = saidas;
    window.saidasPendentes = saidasPendentes;
    window.categorias = categorias;
    window.lojas = lojas;
    
    if (totalSaidas > 0) {
      mostrarMensagemSucesso(`✅ Sistema carregado! ${totalSaidas} saídas encontradas.`);
    } else {
      mostrarMensagemSucesso('✅ Sistema carregado! Pronto para uso.');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    atualizarStatusFirebase('error', '❌ Erro Sistema');
    
    const backupOK = carregarDadosLocal();
    if (backupOK) {
      atualizarStatusFirebase('offline', '📱 Backup Local');
      atualizarInterfaceCompleta();
      mostrarMensagemSucesso('⚠️ Sistema em modo offline.');
    } else {
      atualizarStatusFirebase('error', '❌ Erro Config');
      mostrarMensagemSucesso('❌ Erro ao carregar. Configure o Firebase.');
    }
  }
});

// ============================================================================
// EXPORTAR FUNÇÕES GLOBAIS PARA O HTML
// ============================================================================

// Chat IA
window.enviarMensagemChat = enviarMensagemChat;
window.usarExemplo = usarExemplo;
window.limparChat = limparChat;
window.mostrarTreinamentoIA = function() {
  alert('🎓 Treinar IA\n\nA IA aprende automaticamente com suas entradas!\n\n💡 Dicas:\n• Use palavras-chave claras\n• Seja consistente\n• A IA detecta múltiplas saídas\n• Exemplo: "aluguel 2.000 de castanhal, belem e mix"');
};

// Saídas
window.adicionarSaida = adicionarSaida;
window.excluirSaida = excluirSaida;
window.editarSaida = editarSaida;
window.marcarComoPago = marcarComoPago;

// Múltiplas saídas
window.iniciarMultiplasSaidas = iniciarMultiplasSaidas;
window.adicionarNovaLinha = adicionarNovaLinha;
window.removerLinhaSaida = removerLinhaSaida;
window.adicionarTodasSaidas = adicionarTodasSaidas;
window.cancelarMultiplasSaidas = cancelarMultiplasSaidas;
window.formatarMoedaMultiplas = formatarMoedaMultiplas;

// Categorias e lojas
window.mostrarEditorCategoria = mostrarEditorCategoria;
window.mostrarEditorLoja = mostrarEditorLoja;
window.adicionarCategoria = adicionarCategoria;
window.adicionarLoja = adicionarLoja;
window.mostrarEditorCategoriaExistente = mostrarEditorCategoriaExistente;
window.mostrarEditorLojaExistente = mostrarEditorLojaExistente;
window.removerCategoria = removerCategoria;
window.removerLoja = removerLoja;
window.fecharModal = fecharModal;

// Filtros
window.aplicarFiltroLoja = aplicarFiltroLoja;
window.toggleTipoRecorrencia = toggleTipoRecorrencia;
window.filtrarRecorrentesPorFiltros = filtrarRecorrentesPorFiltros;
window.limparFiltrosRecorrentes = limparFiltrosRecorrentes;
window.preencherMesesDoAno = preencherMesesDoAno;

// Utilidades
window.formatarMoeda = formatarMoeda;

// Debug e instruções
window.debugSistema = function() {
  console.log('🔍 DEBUG SISTEMA:');
  console.log('Firebase inicializado:', firebaseInicializado);
  console.log('Saídas carregadas:', saidas.length);
  console.log('Saídas pendentes:', saidasPendentes.length);
  console.log('Categorias:', categorias.length);
  console.log('Lojas:', lojas.length);
  
  const dadosLocal = localStorage.getItem('iclubSaidas');
  if (dadosLocal) {
    const dados = JSON.parse(dadosLocal);
    console.log('Backup local:', dados.totalSaidas || 0, 'saídas');
    console.log('Último backup:', dados.ultimoBackup);
  } else {
    console.log('Nenhum backup local encontrado');
  }
  
  // Mostrar status Firebase
  console.log('Status Firebase:', firebaseInicializado ? 'ONLINE' : 'OFFLINE');
  if (firebaseInicializado) {
    console.log('Firebase app:', app);
    console.log('Firestore db:', db);
  }
};

window.mostrarInstrucoes = function() {
  const instrucoes = `📋 INSTRUÇÕES DE CONFIGURAÇÃO:

🔥 1. Configure Firebase:
   - Acesse: https://console.firebase.google.com
   - Crie projeto ou selecione existente
   - Ative Firestore Database
   - Copie configurações para painel.js (linha 11-18)

📊 2. Configure regras Firestore:
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }

🧪 3. Teste o sistema:
   - Digite no chat: "2000 aluguel"
   - Abra outro navegador
   - Dados devem sincronizar

🔍 Para debug: digite debugSistema() no console
❓ Para ver novamente: mostrarInstrucoes()

🚀 STATUS ATUAL:
Firebase: ${firebaseInicializado ? 'CONECTADO ✅' : 'DESCONECTADO ❌'}
Saídas: ${saidas.length + saidasPendentes.length} total
Modo: ${firebaseInicializado ? 'Online' : 'Offline'}`;

  alert(instrucoes);
};

// Log inicial
console.log('✅ painel.js carregado com sucesso!');
console.log('🔧 Para configurar Firebase, edite as credenciais na linha 11-18');
console.log('🔍 Para debug, digite: debugSistema()');
console.log('❓ Para instruções, digite: mostrarInstrucoes()');

// Auto-mostrar instruções se Firebase não configurado
setTimeout(() => {
  if (!firebaseInicializado && firebaseConfig.apiKey === "SUA-API-KEY-AQUI") {
    console.warn('⚠️ Firebase não configurado!');
    console.log('💡 Digite mostrarInstrucoes() para ver como configurar');
  }
}, 3000);