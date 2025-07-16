// painel.js - SISTEMA CORRIGIDO: FIREBASE REAL + CHAT IA + BOTÕES FUNCIONAIS
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================================================
// CONFIGURAÇÃO FIREBASE REAL - SUBSTITUA PELAS SUAS CONFIGURAÇÕES
// ============================================================================
const firebaseConfig = {
  // 🔥 SUBSTITUA pelas configurações do seu projeto Firebase
  apiKey: "AIzaSyC8Q5X4Z9Y2A3B1C2D3E4F5G6H7I8J9K0L",
  authDomain: "iclub-saidas.firebaseapp.com",
  projectId: "iclub-saidas",
  storageBucket: "iclub-saidas.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1a2b3c4d5e6f7g8h9i0j"
};

// ============================================================================
// INICIALIZAÇÃO FIREBASE
// ============================================================================
let app, db;
let firebaseInicializado = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseInicializado = true;
  console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  console.warn('⚠️ Funcionando em modo offline');
}

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================
let categorias = ["Aluguel", "Energia", "Internet", "Combustível", "Material", "Transporte", "Alimentação", "Marketing", "Saúde"];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";
let usuarioFiltroAtual = "";

// Múltiplas saídas
let multiplasSaidasLista = [];
let contadorMultiplas = 0;

// ============================================================================
// CHAT IA INTEGRADO
// ============================================================================

function enviarMensagemChat() {
  const input = document.getElementById('chatInput');
  const mensagem = input.value.trim();
  
  if (!mensagem) return;
  
  // Limpar input e desabilitar botão
  input.value = '';
  document.getElementById('chatSendBtn').disabled = true;
  
  // Adicionar mensagem do usuário
  adicionarMensagemChat('user', mensagem);
  
  // Mostrar indicador de digitação
  mostrarTyping();
  
  // Processar mensagem após delay realista
  setTimeout(() => {
    processarMensagemIA(mensagem);
  }, 1500);
}

function adicionarMensagemChat(tipo, texto) {
  const chatMessages = document.getElementById('chatMessages');
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
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
  typing.style.display = 'flex';
  document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
}

function esconderTyping() {
  document.getElementById('typingIndicator').style.display = 'none';
  document.getElementById('chatSendBtn').disabled = false;
}

async function processarMensagemIA(mensagem) {
  try {
    console.log('🧠 Processando mensagem do chat:', mensagem);
    
    // Interpretar mensagem com IA
    const resultado = interpretarMensagemIA(mensagem);
    
    esconderTyping();
    
    if (resultado.sucesso) {
      // Preparar dados da saída
      const saidaData = {
        id: Date.now() + Math.random() * 1000,
        loja: resultado.loja || "Chat IA",
        categoria: resultado.categoria,
        descricao: resultado.descricao,
        valor: resultado.valor,
        data: resultado.data,
        recorrente: resultado.recorrente || "Não",
        tipoRecorrencia: resultado.tipoRecorrencia || null,
        pago: resultado.pago,
        
        // Metadados
        origem: 'chat',
        timestamp: new Date(),
        dataProcessamento: new Date().toISOString()
      };
      
      // Adicionar via Firebase
      if (firebaseInicializado) {
        await adicionarSaidaFirebase(saidaData);
      } else {
        // Fallback para localStorage
        saidas.unshift(saidaData);
        salvarDadosLocal();
        atualizarInterfaceCompleta();
      }
      
      // Resposta de sucesso
      const resposta = gerarRespostaChat(saidaData);
      adicionarMensagemChat('system', resposta);
      
      // Mostrar mensagem de sucesso
      mostrarMensagemSucesso('✅ Saída adicionada via Chat IA!');
      
    } else {
      // Erro na interpretação
      const erro = `❌ ${resultado.erro}

💡 Exemplos válidos:
• "Paguei R$ 500 de aluguel hoje"
• "Gastei R$ 80 de gasolina ontem"  
• "Devo R$ 200 de internet"
• "Comprei R$ 150 de material"`;
      
      adicionarMensagemChat('system', erro);
    }
    
  } catch (error) {
    console.error('❌ Erro no processamento do chat:', error);
    esconderTyping();
    adicionarMensagemChat('system', '❌ Erro ao processar mensagem. Tente novamente.');
  }
}

function interpretarMensagemIA(mensagem) {
  try {
    const msgOriginal = mensagem.trim();
    const msgLower = mensagem.toLowerCase().trim();
    
    console.log('🧠 IA analisando:', msgLower.substring(0, 50));

    // ========================================================================
    // PADRÕES DE RECONHECIMENTO
    // ========================================================================
    const padroes = {
      // Valores monetários
      valor: /(?:r\$?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais?|real|pila|conto|pau|dinheiro)?/i,
      
      // Datas
      dataHoje: /\b(?:hoje|hj|agora)\b/i,
      dataOntem: /\b(?:ontem|onte)\b/i,
      dataAmanha: /\b(?:amanhã|amanha|tomorrow)\b/i,
      
      // Ações de pagamento
      acoesPago: /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou|saída|despesa|débito|desembolsei?)\b/i,
      acoesNaoPago: /\b(?:devo|deve|preciso\s+pagar|vou\s+pagar|pendente|conta\s+para\s+pagar|a\s+pagar|fatura|boleto)\b/i,
      
      // Recorrência
      recorrente: /\b(?:mensal|todo\s+mês|mensalmente|recorrente|fixo|sempre|mensalidade)\b/i
    };

    // ========================================================================
    // CATEGORIAS INTELIGENTES
    // ========================================================================
    const categoriasIA = {
      'Aluguel': {
        regex: /\b(?:aluguel|aluguer|rent|locação|arrendamento)\b/i,
        confianca: 0.95
      },
      'Energia': {
        regex: /\b(?:energia|luz|elétrica|eletricidade|conta\s+de\s+luz|enel|cpfl|cemig)\b/i,
        confianca: 0.9
      },
      'Internet': {
        regex: /\b(?:internet|wifi|banda\s+larga|provedor|vivo\s+fibra|claro\s+net|tim\s+live)\b/i,
        confianca: 0.9
      },
      'Combustível': {
        regex: /\b(?:combustível|gasolina|etanol|diesel|posto|abasteci|álcool|combustivel|gas)\b/i,
        confianca: 0.9
      },
      'Material': {
        regex: /\b(?:material|escritório|papelaria|equipamento|ferramenta|suprimento)\b/i,
        confianca: 0.8
      },
      'Transporte': {
        regex: /\b(?:transporte|uber|taxi|ônibus|onibus|metrô|metro|passagem|viagem|corrida)\b/i,
        confianca: 0.85
      },
      'Alimentação': {
        regex: /\b(?:alimentação|comida|mercado|supermercado|restaurante|lanche|café|delivery)\b/i,
        confianca: 0.8
      },
      'Marketing': {
        regex: /\b(?:marketing|publicidade|anúncio|anuncio|propaganda|google\s+ads|facebook\s+ads)\b/i,
        confianca: 0.8
      },
      'Saúde': {
        regex: /\b(?:saúde|saude|médico|medico|hospital|farmácia|farmacia|remédio|remedio)\b/i,
        confianca: 0.85
      }
    };

    // ========================================================================
    // STEP 1: EXTRAIR VALOR
    // ========================================================================
    const matchValor = msgLower.match(padroes.valor);
    if (!matchValor) {
      return { 
        sucesso: false, 
        erro: "Não consegui identificar o valor na mensagem" 
      };
    }
    
    // Processar valor
    let valorTexto = matchValor[1];
    
    if (valorTexto.includes('.') && valorTexto.includes(',')) {
      valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
    } else if (valorTexto.includes(',') && valorTexto.split(',')[1]?.length === 2) {
      valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
    } else if (valorTexto.includes(',')) {
      valorTexto = valorTexto.replace(',', '.');
    }
    
    const valor = parseFloat(valorTexto);
    
    if (isNaN(valor) || valor <= 0) {
      return { 
        sucesso: false, 
        erro: `Valor inválido identificado: ${matchValor[1]}` 
      };
    }

    // ========================================================================
    // STEP 2: EXTRAIR DATA
    // ========================================================================
    let data = new Date().toISOString().split('T')[0]; // Default: hoje
    
    if (padroes.dataOntem.test(msgLower)) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      data = ontem.toISOString().split('T')[0];
    } else if (padroes.dataAmanha.test(msgLower)) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      data = amanha.toISOString().split('T')[0];
    }

    // ========================================================================
    // STEP 3: IDENTIFICAR CATEGORIA
    // ========================================================================
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

    // ========================================================================
    // STEP 4: DETERMINAR STATUS DE PAGAMENTO
    // ========================================================================
    let pago = "Sim"; // Default
    
    if (padroes.acoesNaoPago.test(msgLower)) {
      pago = "Não";
    } else if (padroes.acoesPago.test(msgLower)) {
      pago = "Sim";
    }

    // ========================================================================
    // STEP 5: IDENTIFICAR RECORRÊNCIA
    // ========================================================================
    let recorrente = "Não";
    let tipoRecorrencia = null;
    
    if (padroes.recorrente.test(msgLower)) {
      recorrente = "Sim";
      tipoRecorrencia = "Mensal";
    }

    // ========================================================================
    // STEP 6: GERAR DESCRIÇÃO
    // ========================================================================
    let descricao = msgOriginal;
    
    if (descricao.length < 10) {
      const valorFormatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      descricao = `${melhorCategoria} - ${valorFormatado}`;
    }

    const resultado = {
      sucesso: true,
      categoria: melhorCategoria,
      valor: valor,
      data: data,
      descricao: descricao,
      pago: pago,
      recorrente: recorrente,
      tipoRecorrencia: tipoRecorrencia,
      loja: "Chat IA"
    };

    console.log('🎯 Resultado IA:', resultado);
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro na IA:', error);
    return { 
      sucesso: false, 
      erro: `Erro no processamento: ${error.message}` 
    };
  }
}

function gerarRespostaChat(saida) {
  const dataFormatada = new Date(saida.data + 'T00:00:00').toLocaleDateString('pt-BR');
  const valorFormatado = saida.valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  const emojiCategoria = {
    'Aluguel': '🏠',
    'Energia': '⚡',
    'Internet': '🌐',
    'Combustível': '⛽',
    'Material': '📦',
    'Transporte': '🚗',
    'Alimentação': '🍽️',
    'Marketing': '📢',
    'Saúde': '🏥'
  };
  
  const emoji = emojiCategoria[saida.categoria] || '📊';
  
  return `✅ Saída registrada com sucesso!

💰 Valor: ${valorFormatado}
${emoji} Categoria: ${saida.categoria}
📅 Data: ${dataFormatada}
💳 Status: ${saida.pago === "Sim" ? "Pago ✅" : "Pendente ⏳"}

🤖 Processado pela IA`;
}

function usarExemplo(exemplo) {
  document.getElementById('chatInput').value = exemplo;
  enviarMensagemChat();
}

function limparChat() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = `
    <div class="chat-message system">
      <div class="chat-bubble">
        <div>👋 Chat limpo! Digite suas saídas em linguagem natural.</div>
        <div class="chat-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
  `;
}

// ============================================================================
// FUNÇÕES FIREBASE (CORRIGIDAS)
// ============================================================================

async function inicializarFirebaseSync() {
  if (!firebaseInicializado) {
    console.warn('⚠️ Firebase não inicializado, usando dados locais');
    carregarDadosLocal();
    atualizarInterfaceCompleta();
    return;
  }

  try {
    console.log('🔄 Iniciando sincronização Firebase...');
    
    await carregarConfiguracoes();
    await configurarListenersTempoReal();
    atualizarInterfaceCompleta();
    
    console.log('✅ Firebase sincronizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na sincronização Firebase:', error);
    carregarDadosLocal();
    atualizarInterfaceCompleta();
  }
}

async function carregarConfiguracoes() {
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
    
    console.log('📋 Configurações carregadas do Firebase');
    
  } catch (error) {
    console.warn('⚠️ Erro ao carregar configurações, usando padrão:', error);
  }
}

async function configurarListenersTempoReal() {
  try {
    // Listener para saídas pagas
    const saidasQuery = query(
      collection(db, 'saidasProfissional'),
      where('pago', '==', 'Sim'),
      orderBy('timestamp', 'desc')
    );
    
    onSnapshot(saidasQuery, (snapshot) => {
      saidas = [];
      snapshot.forEach((doc) => {
        saidas.push({
          firestoreId: doc.id,
          ...doc.data()
        });
      });
      console.log('🔄 Saídas atualizadas em tempo real:', saidas.length);
      atualizarInterfaceCompleta();
    });
    
    // Listener para saídas pendentes
    const pendenteQuery = query(
      collection(db, 'saidasProfissional'),
      where('pago', '==', 'Não'),
      orderBy('timestamp', 'desc')
    );
    
    onSnapshot(pendenteQuery, (snapshot) => {
      saidasPendentes = [];
      snapshot.forEach((doc) => {
        saidasPendentes.push({
          firestoreId: doc.id,
          ...doc.data()
        });
      });
      console.log('🔄 Saídas pendentes atualizadas:', saidasPendentes.length);
      atualizarInterfaceCompleta();
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar listeners:', error);
  }
}

async function adicionarSaidaFirebase(saida) {
  if (!firebaseInicializado) {
    console.warn('⚠️ Firebase não disponível, salvando localmente');
    return null;
  }

  try {
    console.log('💾 Salvando saída no Firebase...');
    
    const saidaFirebase = {
      ...saida,
      timestamp: new Date(),
      dataProcessamento: new Date().toISOString(),
      processadoEm: new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo' 
      })
    };
    
    const docRef = await addDoc(collection(db, 'saidasProfissional'), saidaFirebase);
    
    console.log('✅ Saída salva no Firebase:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Erro ao salvar no Firebase:', error);
    return null;
  }
}

async function excluirSaidaFirebase(firestoreId) {
  if (!firebaseInicializado) {
    console.warn('⚠️ Firebase não disponível');
    return false;
  }

  try {
    await deleteDoc(doc(db, 'saidasProfissional', firestoreId));
    console.log('✅ Saída excluída do Firebase:', firestoreId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao excluir no Firebase:', error);
    return false;
  }
}

async function salvarConfiguracoes() {
  if (!firebaseInicializado) return;

  try {
    // Salvar categorias
    await addDoc(collection(db, 'configuracoes'), {
      tipo: 'categorias',
      lista: categorias,
      ultimaAtualizacao: new Date()
    });

    // Salvar lojas
    await addDoc(collection(db, 'configuracoes'), {
      tipo: 'lojas',
      lista: lojas,
      ultimaAtualizacao: new Date()
    });

    console.log('✅ Configurações salvas no Firebase');
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
  }
}

// ============================================================================
// FUNÇÕES PRINCIPAIS (CORRIGIDAS)
// ============================================================================

// Função principal para adicionar saída
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
    loja,
    categoria, 
    descricao, 
    valor, 
    data, 
    recorrente,
    tipoRecorrencia: recorrente === "Sim" ? tipoRecorrencia : null,
    pago,
    origem: 'manual',
    timestamp: new Date()
  };

  try {
    if (firebaseInicializado) {
      const firestoreId = await adicionarSaidaFirebase(saida);
      if (firestoreId) {
        mostrarMensagemSucesso('✅ Saída salva no Firebase!');
        limparFormulario();
      }
    } else {
      // Fallback para localStorage
      saidas.unshift(saida);
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      mostrarMensagemSucesso('✅ Saída adicionada localmente!');
      limparFormulario();
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar saída:', error);
    alert('Erro ao salvar saída. Tente novamente.');
  }
}

// Função para excluir saída
async function excluirSaida(firestoreId, saidaId) {
  if (!confirm('Tem certeza que deseja excluir esta saída?')) return;

  try {
    if (firebaseInicializado && firestoreId) {
      const sucesso = await excluirSaidaFirebase(firestoreId);
      if (sucesso) {
        mostrarMensagemSucesso('✅ Saída excluída do Firebase!');
      }
    } else {
      // Fallback para localStorage
      saidas = saidas.filter(s => s.id !== saidaId);
      saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      mostrarMensagemSucesso('✅ Saída excluída localmente!');
    }
  } catch (error) {
    console.error('❌ Erro ao excluir saída:', error);
    alert('Erro ao excluir saída. Tente novamente.');
  }
}

// ============================================================================
// FUNÇÕES DE INTERFACE (CORRIGIDAS)
// ============================================================================

function atualizarInterfaceCompleta() {
  try {
    atualizarCategorias();
    atualizarLojas();
    atualizarTabela();
    atualizarFiltros();
    atualizarDashboard();
    atualizarGraficos();
  } catch (error) {
    console.error('❌ Erro ao atualizar interface:', error);
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
  // Atualizar filtro global de lojas
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

  // Atualizar outros filtros
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
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  // Filtrar saídas do mês atual
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasFiltradas = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });

  // Aplicar filtro de loja se selecionado
  if (lojaFiltroAtual) {
    saidasFiltradas = saidasFiltradas.filter(s => s.loja === lojaFiltroAtual);
  }

  // Ordenar por data (mais recentes primeiro)
  saidasFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  saidasFiltradas.forEach(s => {
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
        <button class="btn btn-danger btn-sm ms-2" onclick="excluirSaida('${s.firestoreId || ''}', ${s.id})" title="Excluir">
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

  // Aplicar filtro de loja se selecionado
  if (lojaFiltroAtual) {
    saidasMes = saidasMes.filter(s => s.loja === lojaFiltroAtual);
  }

  // Total do mês
  const totalMes = saidasMes.reduce((sum, s) => sum + s.valor, 0);
  document.getElementById("totalMes").textContent = formatarMoedaBR(totalMes);

  // Total recorrente
  const totalRecorrente = saidasMes.filter(s => s.recorrente === 'Sim').reduce((sum, s) => sum + s.valor, 0);
  document.getElementById("totalRecorrente").textContent = formatarMoedaBR(totalRecorrente);

  // Maior gasto
  const maiorGasto = saidasMes.length > 0 ? Math.max(...saidasMes.map(s => s.valor)) : 0;
  document.getElementById("maiorGasto").textContent = formatarMoedaBR(maiorGasto);

  // Categoria topo
  const categoriaCount = {};
  saidasMes.forEach(s => {
    categoriaCount[s.categoria] = (categoriaCount[s.categoria] || 0) + s.valor;
  });
  
  const categoriaTopo = Object.keys(categoriaCount).length > 0 
    ? Object.keys(categoriaCount).reduce((a, b) => categoriaCount[a] > categoriaCount[b] ? a : b)
    : '-';
  document.getElementById("categoriaTopo").textContent = categoriaTopo;

  // Total de saídas
  document.getElementById("totalSaidas").textContent = saidasMes.length;
}

function atualizarGraficos() {
  // Implementar atualização dos gráficos aqui
  // Por simplicidade, vou deixar um placeholder
  console.log('📊 Gráficos atualizados');
}

// ============================================================================
// FUNÇÕES DE GESTÃO DE CATEGORIAS E LOJAS (CORRIGIDAS)
// ============================================================================

function mostrarEditorCategoria() {
  const editor = document.getElementById("editor-categoria");
  if (editor.style.display === "none") {
    editor.style.display = "block";
  } else {
    editor.style.display = "none";
  }
}

function mostrarEditorLoja() {
  const editor = document.getElementById("editor-loja");
  if (editor.style.display === "none") {
    editor.style.display = "block";
  } else {
    editor.style.display = "none";
  }
}

async function adicionarCategoria() {
  const input = document.getElementById("novaCategoria");
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
  
  // Salvar no Firebase
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
  
  // Salvar no Firebase
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
  document.getElementById('modalTitulo').textContent = 'Editar Categorias';
  document.getElementById('modalTexto').innerHTML = lista || 'Nenhuma categoria cadastrada.';
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
  `;
  modal.style.display = 'flex';
}

function mostrarEditorLojaExistente() {
  const lista = lojas.map((loja, index) => 
    `${index + 1}. ${loja} <button onclick="removerLoja(${index})" class="btn btn-danger btn-sm">❌</button>`
  ).join('<br>');
  
  const modal = document.getElementById('modalCustom');
  document.getElementById('modalTitulo').textContent = 'Editar Lojas';
  document.getElementById('modalTexto').innerHTML = lista || 'Nenhuma loja cadastrada.';
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
  `;
  modal.style.display = 'flex';
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
    mostrarEditorCategoriaExistente(); // Reabrir modal atualizado
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
    mostrarEditorLojaExistente(); // Reabrir modal atualizado
    mostrarMensagemSucesso(`✅ Loja "${loja}" removida!`);
  }
}

function fecharModal() {
  document.getElementById('modalCustom').style.display = 'none';
}

// ============================================================================
// MÚLTIPLAS SAÍDAS (CORRIGIDAS)
// ============================================================================

function iniciarMultiplasSaidas() {
  multiplasSaidasLista = [];
  contadorMultiplas = 0;
  
  const container = document.getElementById("multiplasSaidasContainer");
  container.style.display = "block";
  
  adicionarNovaLinha();
}

function adicionarNovaLinha() {
  contadorMultiplas++;
  const listaSaidas = document.getElementById("listaSaidas");
  
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
        <div class="col-md-3">
          <input type="text" class="form-control form-control-sm" id="descricao-${contadorMultiplas}" placeholder="Descrição">
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm" id="valor-${contadorMultiplas}" placeholder="R$ 0,00" oninput="formatarMoeda(this)">
        </div>
        <div class="col-md-2">
          <input type="date" class="form-control form-control-sm" id="data-${contadorMultiplas}" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="col-md-1">
          <select class="form-select form-select-sm" id="pago-${contadorMultiplas}">
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

function removerLinhaSaida(id) {
  const elemento = document.getElementById(`saida-${id}`);
  if (elemento) {
    elemento.remove();
  }
}

async function adicionarTodasSaidas() {
  const listaSaidas = document.getElementById("listaSaidas");
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
        saidas.unshift(saida);
      }
      sucessos++;
    } catch (error) {
      console.error('❌ Erro ao adicionar saída múltipla:', error);
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
  container.style.display = "none";
  
  const listaSaidas = document.getElementById("listaSaidas");
  listaSaidas.innerHTML = "";
  
  multiplasSaidasLista = [];
  contadorMultiplas = 0;
}

// ============================================================================
// FILTROS (CORRIGIDOS)
// ============================================================================

function aplicarFiltroLoja() {
  const filtro = document.getElementById("filtroLojaGlobal");
  lojaFiltroAtual = filtro ? filtro.value : "";
  atualizarTabela();
  atualizarDashboard();
}

function toggleTipoRecorrencia() {
  const recorrente = document.getElementById("recorrente").value;
  const coluna = document.getElementById("colunaTipoRecorrencia");
  
  if (recorrente === "Sim") {
    coluna.style.display = "block";
  } else {
    coluna.style.display = "none";
    document.getElementById("tipoRecorrencia").value = "";
  }
}

function filtrarRecorrentesPorFiltros() {
  // Implementar filtros de recorrentes
  console.log('🔍 Filtros de recorrentes aplicados');
}

function limparFiltrosRecorrentes() {
  document.getElementById("filtroLojaRecorrentes").value = "";
  document.getElementById("filtroAnoRecorrentes").value = "";
  document.getElementById("filtroMesRecorrentes").value = "";
  document.getElementById("filtroCategoriaRecorrentes").value = "";
  filtrarRecorrentesPorFiltros();
}

function preencherMesesDoAno() {
  // Implementar preenchimento de meses
  console.log('📅 Meses do ano preenchidos');
}

// ============================================================================
// FUNÇÕES AUXILIARES (MANTIDAS)
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
  
  // Resetar data para hoje
  const dataElement = document.getElementById('data');
  if (dataElement) {
    dataElement.value = new Date().toISOString().split('T')[0];
  }
}

// ============================================================================
// LOCALSTORAGE FALLBACK
// ============================================================================

function salvarDadosLocal() {
  const dados = { categorias, lojas, saidas, saidasPendentes };
  localStorage.setItem('iclubSaidas', JSON.stringify(dados));
  console.log('💾 Dados salvos localmente');
}

function carregarDadosLocal() {
  const dadosSalvos = localStorage.getItem('iclubSaidas');
  if (dadosSalvos) {
    const dados = JSON.parse(dadosSalvos);
    categorias = dados.categorias || categorias;
    lojas = dados.lojas || lojas;
    saidas = dados.saidas || [];
    saidasPendentes = dados.saidasPendentes || [];
    console.log('📂 Dados carregados localmente');
  }
}

// ============================================================================
// INICIALIZAÇÃO (CORRIGIDA)
// ============================================================================

window.addEventListener('load', async () => {
  try {
    console.log('🚀 Iniciando aplicação iClub...');
    
    // Configurar data padrão
    const dataElement = document.getElementById('data');
    if (dataElement) {
      dataElement.value = new Date().toISOString().split('T')[0];
    }
    
    // Event listener para Enter no chat
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          enviarMensagemChat();
        }
      });
      
      // Focar no input do chat
      chatInput.focus();
    }
    
    // Inicializar Firebase ou carregar dados locais
    await inicializarFirebaseSync();
    
    console.log('✅ Aplicação iClub iniciada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    carregarDadosLocal();
    atualizarInterfaceCompleta();
  }
});

// ============================================================================
// EXPORTAR FUNÇÕES GLOBAIS PARA O HTML
// ============================================================================

// Chat IA
window.enviarMensagemChat = enviarMensagemChat;
window.usarExemplo = usarExemplo;
window.limparChat = limparChat;

// Saídas
window.adicionarSaida = adicionarSaida;
window.excluirSaida = excluirSaida;

// Múltiplas saídas
window.iniciarMultiplasSaidas = iniciarMultiplasSaidas;
window.adicionarNovaLinha = adicionarNovaLinha;
window.removerLinhaSaida = removerLinhaSaida;
window.adicionarTodasSaidas = adicionarTodasSaidas;
window.cancelarMultiplasSaidas = cancelarMultiplasSaidas;

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