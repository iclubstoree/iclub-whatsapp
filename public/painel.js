// painel.js - SISTEMA MULTI-USUÁRIO COM FIREBASE SINCRONIZADO
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuração Firebase do cliente
const firebaseConfig = {
  // Substitua pelas suas configurações reais
  apiKey: "FAKE-API-KEY",
  authDomain: "iclub-fake.firebaseapp.com",
  projectId: "iclub-fake",
  storageBucket: "iclub-fake.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:000000000000"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variáveis globais
let categorias = ["Aluguel", "Energia", "Internet"];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";
let usuarioFiltroAtual = "";
let listaSaidasMultiplas = [];

// Sistema de usuários
let usuariosAutorizados = {
  '5511999999999': {
    nome: 'Usuário Principal',
    email: 'usuario@iclub.com',
    perfil: 'admin',
    ativo: true,
    cor: '#10b981'
  },
  '5511888888888': {
    nome: 'Sócia',
    email: 'socia@iclub.com', 
    perfil: 'admin',
    ativo: true,
    cor: '#8b5cf6'
  }
};

// ============================================================================
// SISTEMA DE SINCRONIZAÇÃO FIREBASE
// ============================================================================

// Carregar dados do Firebase em tempo real
async function inicializarFirebaseSync() {
  try {
    console.log('🔄 Iniciando sincronização Firebase...');
    
    // 1. Carregar configurações (categorias, lojas, usuários)
    await carregarConfiguracoes();
    
    // 2. Carregar saídas em tempo real
    await configurarListenersTempoReal();
    
    // 3. Atualizar interface
    atualizarInterfaceCompleta();
    
    console.log('✅ Firebase sincronizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na sincronização Firebase:', error);
    // Fallback para localStorage se Firebase falhar
    carregarDadosLocal();
  }
}

// Carregar configurações do Firebase
async function carregarConfiguracoes() {
  try {
    // Carregar categorias
    const categoriasSnapshot = await getDocs(collection(db, 'configuracoes'));
    categoriasSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.tipo === 'categorias') {
        categorias = data.lista || categorias;
      }
      if (data.tipo === 'lojas') {
        lojas = data.lista || lojas;
      }
      if (data.tipo === 'usuarios') {
        usuariosAutorizados = data.lista || usuariosAutorizados;
      }
    });
    
    console.log('📋 Configurações carregadas do Firebase');
    
  } catch (error) {
    console.warn('⚠️ Erro ao carregar configurações, usando padrão:', error);
  }
}

// Configurar listeners em tempo real
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

// Salvar configurações no Firebase
async function salvarConfiguracoes() {
  try {
    // Salvar categorias
    await salvarConfiguracao('categorias', categorias);
    
    // Salvar lojas  
    await salvarConfiguracao('lojas', lojas);
    
    // Salvar usuários
    await salvarConfiguracao('usuarios', usuariosAutorizados);
    
    console.log('💾 Configurações salvas no Firebase');
    
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
    // Fallback para localStorage
    salvarDadosLocal();
  }
}

// Salvar configuração específica
async function salvarConfiguracao(tipo, lista) {
  try {
    // Verificar se já existe
    const configSnapshot = await getDocs(
      query(collection(db, 'configuracoes'), where('tipo', '==', tipo))
    );
    
    if (!configSnapshot.empty) {
      // Atualizar existente
      const docRef = configSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        lista: lista,
        ultimaAtualizacao: new Date().toISOString()
      });
    } else {
      // Criar novo
      await addDoc(collection(db, 'configuracoes'), {
        tipo: tipo,
        lista: lista,
        criadoEm: new Date().toISOString(),
        ultimaAtualizacao: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error(`❌ Erro ao salvar ${tipo}:`, error);
  }
}

// Adicionar saída no Firebase
async function adicionarSaidaFirebase(saida) {
  try {
    console.log('💾 Salvando saída no Firebase...');
    
    // Preparar dados para Firebase
    const saidaFirebase = {
      ...saida,
      timestamp: new Date(),
      dataProcessamento: new Date().toISOString(),
      processadoEm: new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo' 
      }),
      origem: saida.origem || 'painel',
      multiUsuario: true
    };
    
    // Adicionar no Firebase
    const docRef = await addDoc(collection(db, 'saidasProfissional'), saidaFirebase);
    
    console.log('✅ Saída salva no Firebase:', docRef.id);
    
    // Não precisa atualizar interface - o listener fará isso automaticamente
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Erro ao salvar no Firebase:', error);
    // Fallback para local se Firebase falhar
    return null;
  }
}

// Atualizar saída no Firebase
async function atualizarSaidaFirebase(firestoreId, dadosAtualizados) {
  try {
    const docRef = doc(db, 'saidasProfissional', firestoreId);
    await updateDoc(docRef, {
      ...dadosAtualizados,
      ultimaAtualizacao: new Date().toISOString()
    });
    
    console.log('✅ Saída atualizada no Firebase:', firestoreId);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar no Firebase:', error);
  }
}

// Excluir saída no Firebase
async function excluirSaidaFirebase(firestoreId) {
  try {
    await deleteDoc(doc(db, 'saidasProfissional', firestoreId));
    console.log('✅ Saída excluída do Firebase:', firestoreId);
    
  } catch (error) {
    console.error('❌ Erro ao excluir do Firebase:', error);
  }
}

// ============================================================================
// FUNÇÕES DE FALLBACK (localStorage)
// ============================================================================

function salvarDadosLocal() {
  const dados = {
    categorias,
    lojas,
    saidas,
    saidasPendentes,
    usuariosAutorizados
  };
  localStorage.setItem('iclubSaidas', JSON.stringify(dados));
  console.log('💾 Dados salvos localmente (fallback)');
}

function carregarDadosLocal() {
  const dadosSalvos = localStorage.getItem('iclubSaidas');
  if (dadosSalvos) {
    const dados = JSON.parse(dadosSalvos);
    categorias = dados.categorias || categorias;
    lojas = dados.lojas || lojas;
    saidas = dados.saidas || [];
    saidasPendentes = dados.saidasPendentes || [];
    usuariosAutorizados = dados.usuariosAutorizados || usuariosAutorizados;
    
    console.log('📋 Dados carregados localmente (fallback)');
  }
}

// ============================================================================
// FUNÇÕES DE SAÍDAS ATUALIZADAS PARA FIREBASE
// ============================================================================

async function adicionarSaidaComUsuario() {
  const loja = document.getElementById("loja").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value;
  const valorInput = document.getElementById("valor").value;
  const valor = extrairValorNumerico(valorInput);
  const data = document.getElementById("data").value;
  const recorrente = document.getElementById("recorrente").value;
  const tipoRecorrencia = document.getElementById("tipoRecorrencia").value;
  const pago = document.getElementById("pago").value;

  // Validações
  if (!loja || !categoria || !descricao || !valorInput || !data) {
    alert("Por favor, preencha todos os campos obrigatórios!");
    return;
  }

  if (valor <= 0) {
    alert("Por favor, insira um valor válido!");
    return;
  }

  if (recorrente === "Sim" && (!tipoRecorrencia || tipoRecorrencia === "Selecione")) {
    alert("Por favor, selecione o tipo de recorrência!");
    return;
  }

  try {
    // Mostrar loading
    const botaoSalvar = document.querySelector('button[onclick="adicionarSaida()"]');
    const textoOriginal = botaoSalvar.innerHTML;
    botaoSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    botaoSalvar.disabled = true;

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
      
      // Informações de usuário para entrada manual
      usuarioNumero: 'manual',
      usuarioNome: 'Entrada Manual',
      usuarioEmail: null,
      usuarioPerfil: 'admin',
      origem: 'painel',
      multiUsuario: true,
      usuarioId: 'manual'
    };

    // Salvar no Firebase
    const firestoreId = await adicionarSaidaFirebase(saida);
    
    if (firestoreId) {
      // Sucesso - Firebase salvou
      mostrarMensagemSucesso('✅ Saída salva no Firebase!');
      
      // Se for recorrente, gerar recorrências futuras
      if (recorrente === "Sim") {
        await gerarRecorrenciasFuturasFirebase(saida);
      }
      
    } else {
      // Fallback para localStorage
      if (pago === "Sim" && recorrente === "Não") {
        saidas.push(saida);
      } else if (pago === "Sim" && recorrente === "Sim") {
        saidas.push(saida);
        gerarRecorrenciasFuturas(saida);
      } else if (pago === "Não") {
        saidasPendentes.push(saida);
        if (recorrente === "Sim") {
          gerarRecorrenciasFuturas(saida);
        }
      }
      
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      mostrarMensagemSucesso('✅ Saída salva localmente!');
    }

    // Restaurar botão
    botaoSalvar.innerHTML = textoOriginal;
    botaoSalvar.disabled = false;
    
    limparFormulario();
    
  } catch (error) {
    console.error('❌ Erro ao adicionar saída:', error);
    alert('Erro ao salvar saída. Tente novamente.');
    
    // Restaurar botão
    const botaoSalvar = document.querySelector('button[onclick="adicionarSaida()"]');
    botaoSalvar.innerHTML = '<i class="fas fa-plus"></i> Adicionar Saída';
    botaoSalvar.disabled = false;
  }
}

// Gerar recorrências no Firebase
async function gerarRecorrenciasFuturasFirebase(saidaBase) {
  try {
    const dataBase = new Date(saidaBase.data);
    const hoje = new Date();
    const tresMesesFuture = new Date();
    tresMesesFuture.setMonth(hoje.getMonth() + 3);

    const recorrencias = [];

    for (let i = 1; i <= 12; i++) {
      let proximaData = new Date(dataBase);
      
      if (saidaBase.tipoRecorrencia === "Diária") {
        proximaData.setDate(dataBase.getDate() + i);
      } else if (saidaBase.tipoRecorrencia === "Semanal") {
        proximaData.setDate(dataBase.getDate() + (i * 7));
      } else if (saidaBase.tipoRecorrencia === "Mensal") {
        proximaData.setMonth(dataBase.getMonth() + i);
      } else if (saidaBase.tipoRecorrencia === "Anual") {
        proximaData.setFullYear(dataBase.getFullYear() + i);
      }

      if (proximaData <= tresMesesFuture) {
        const recorrencia = {
          ...saidaBase,
          id: Date.now() + i + Math.random() * 1000,
          data: proximaData.toISOString().split('T')[0],
          pago: "Não",
          origem: saidaBase.origem || 'painel'
        };
        
        recorrencias.push(recorrencia);
      }
    }

    // Salvar todas as recorrências no Firebase
    for (const recorrencia of recorrencias) {
      await adicionarSaidaFirebase(recorrencia);
    }
    
    console.log(`✅ ${recorrencias.length} recorrências geradas no Firebase`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar recorrências no Firebase:', error);
  }
}

// Atualizar função de pagar saída
async function pagarSaida(id) {
  // Encontrar saída pendente
  const saida = saidasPendentes.find(s => s.id === id);
  if (!saida) return;
  
  const titulo = "✅ Confirmar Pagamento";
  const texto = `<strong>Descrição:</strong> ${saida.descricao}<br>
                 <strong>Valor:</strong> ${formatarMoedaBR(saida.valor)}<br>
                 <strong>Loja:</strong> ${saida.loja}<br><br>
                 <span style="color: #10b981; font-weight: bold;">🎉 Saída foi realizada com sucesso!</span>`;
  const botoes = `
    <button class="btn btn-success-modern btn-modern" onclick="confirmarPagamentoFirebase('${saida.firestoreId || id}')">
      <i class="fas fa-check"></i> Confirmar
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      <i class="fas fa-times"></i> Fechar
    </button>
  `;
  
  mostrarModal(titulo, texto, botoes);
}

// Confirmar pagamento no Firebase
async function confirmarPagamentoFirebase(firestoreId) {
  try {
    if (firestoreId && firestoreId !== 'undefined') {
      // Atualizar no Firebase
      await atualizarSaidaFirebase(firestoreId, {
        pago: "Sim",
        dataPagamento: new Date().toISOString()
      });
    } else {
      // Fallback para localStorage
      const index = saidasPendentes.findIndex(s => s.id === firestoreId);
      if (index !== -1) {
        const saida = saidasPendentes[index];
        saida.pago = "Sim";
        saidas.push(saida);
        saidasPendentes.splice(index, 1);
        salvarDadosLocal();
        atualizarInterfaceCompleta();
      }
    }
    
    fecharModal();
    mostrarMensagemSucesso('✅ Pagamento confirmado!');
    
  } catch (error) {
    console.error('❌ Erro ao confirmar pagamento:', error);
    alert('Erro ao confirmar pagamento. Tente novamente.');
  }
}

// Função para excluir saída
async function executarEdicao(id, origem, acao) {
  let saida;
  let firestoreId;
  
  if (origem === 'paga') {
    saida = saidas.find(s => s.id === id);
    firestoreId = saida?.firestoreId;
  } else {
    saida = saidasPendentes.find(s => s.id === id);
    firestoreId = saida?.firestoreId;
  }
  
  if (!saida) return;
  
  if (acao === 'editar') {
    // Preencher formulário para edição
    document.getElementById("loja").value = saida.loja;
    document.getElementById("categoria").value = saida.categoria;
    document.getElementById("descricao").value = saida.descricao;
    document.getElementById("valor").value = formatarMoedaBR(saida.valor);
    document.getElementById("data").value = saida.data;
    document.getElementById("recorrente").value = saida.recorrente;
    document.getElementById("pago").value = saida.pago;
    
    if (saida.recorrente === "Sim") {
      document.getElementById("colunaTipoRecorrencia").style.display = "block";
      document.getElementById("tipoRecorrencia").value = saida.tipoRecorrencia || "";
    }
    
    // Excluir original do Firebase
    if (firestoreId) {
      await excluirSaidaFirebase(firestoreId);
    }
    
    fecharModal();
    alert("Dados carregados no formulário. Faça as alterações e clique em 'Adicionar Saída'");
    
  } else if (acao === 'excluir') {
    if (confirm(`Tem certeza que deseja EXCLUIR a saída: ${saida.descricao}?`)) {
      
      try {
        if (firestoreId) {
          // Excluir do Firebase
          await excluirSaidaFirebase(firestoreId);
          mostrarMensagemSucesso('✅ Saída excluída do Firebase!');
        } else {
          // Fallback para localStorage
          if (origem === 'paga') {
            const index = saidas.findIndex(s => s.id === id);
            if (index !== -1) saidas.splice(index, 1);
          } else {
            const index = saidasPendentes.findIndex(s => s.id === id);
            if (index !== -1) saidasPendentes.splice(index, 1);
          }
          salvarDadosLocal();
          atualizarInterfaceCompleta();
          mostrarMensagemSucesso('✅ Saída excluída localmente!');
        }
        
        fecharModal();
        
      } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        alert('Erro ao excluir saída. Tente novamente.');
      }
    }
  }
}

// ============================================================================
// FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS COM FIREBASE
// ============================================================================

async function adicionarNovoUsuario() {
  const numero = document.getElementById('novoUsuarioNumero').value.trim();
  const nome = document.getElementById('novoUsuarioNome').value.trim();
  const email = document.getElementById('novoUsuarioEmail').value.trim();
  const perfil = document.getElementById('novoUsuarioPerfil').value;
  
  if (!numero || !nome || !email) {
    alert('Preencha todos os campos!');
    return;
  }
  
  const numeroLimpo = numero.replace(/[^\d]/g, '');
  
  if (numeroLimpo.length < 10) {
    alert('Número de telefone inválido!');
    return;
  }
  
  if (usuariosAutorizados[numeroLimpo]) {
    alert('Usuário já existe!');
    return;
  }
  
  const cores = ['#ef4444', '#f59e0b', '#10b981', '#0891b2', '#8b5cf6', '#ec4899'];
  const coresUsadas = Object.values(usuariosAutorizados).map(u => u.cor);
  const corDisponivel = cores.find(cor => !coresUsadas.includes(cor)) || cores[0];
  
  usuariosAutorizados[numeroLimpo] = {
    nome: nome,
    email: email,
    perfil: perfil,
    ativo: true,
    cor: corDisponivel
  };
  
  // Limpar campos
  document.getElementById('novoUsuarioNumero').value = '';
  document.getElementById('novoUsuarioNome').value = '';
  document.getElementById('novoUsuarioEmail').value = '';
  document.getElementById('novoUsuarioPerfil').value = 'usuario';
  
  // Salvar no Firebase
  await salvarConfiguracoes();
  
  preencherFiltroUsuarios();
  mostrarGerenciadorUsuarios();
  
  alert(`Usuário ${nome} adicionado com sucesso!`);
}

async function editarUsuario(numero) {
  const usuario = usuariosAutorizados[numero];
  if (!usuario) return;
  
  const novoNome = prompt(`Nome atual: ${usuario.nome}\nDigite o novo nome:`, usuario.nome);
  if (novoNome && novoNome.trim() !== '') {
    usuario.nome = novoNome.trim();
    await salvarConfiguracoes();
    preencherFiltroUsuarios();
    mostrarGerenciadorUsuarios();
    alert('Nome atualizado com sucesso!');
  }
}

async function toggleUsuario(numero) {
  const usuario = usuariosAutorizados[numero];
  if (!usuario) return;
  
  usuario.ativo = !usuario.ativo;
  await salvarConfiguracoes();
  preencherFiltroUsuarios();
  mostrarGerenciadorUsuarios();
  
  const status = usuario.ativo ? 'ativado' : 'desativado';
  alert(`Usuário ${usuario.nome} ${status}!`);
}

async function removerUsuario(numero) {
  const usuario = usuariosAutorizados[numero];
  if (!usuario) return;
  
  if (confirm(`Tem certeza que deseja remover o usuário ${usuario.nome}?`)) {
    delete usuariosAutorizados[numero];
    await salvarConfiguracoes();
    preencherFiltroUsuarios();
    mostrarGerenciadorUsuarios();
    alert(`Usuário ${usuario.nome} removido!`);
  }
}

// ============================================================================
// FUNÇÕES DE CATEGORIAS E LOJAS COM FIREBASE
// ============================================================================

async function adicionarLoja() {
  const nova = document.getElementById("novaLoja").value;
  if (nova && !lojas.includes(nova)) {
    lojas.push(nova);
    await salvarConfiguracoes();
    atualizarLojas();
    atualizarFiltroLojas();
    preencherFiltroLojasRecorrentes();
  }
  document.getElementById("novaLoja").value = "";
}

async function adicionarCategoria() {
  const nova = document.getElementById("novaCategoria").value;
  if (nova && !categorias.includes(nova)) {
    categorias.push(nova);
    await salvarConfiguracoes();
    atualizarCategorias();
    preencherFiltroCategorias();
  }
  document.getElementById("novaCategoria").value = "";
}

// ============================================================================
// FUNÇÕES DE INTERFACE ATUALIZADAS
// ============================================================================

function mostrarMensagemSucesso(texto = '✅ Saída adicionada!') {
  const mensagem = document.getElementById("mensagemSucesso");
  mensagem.textContent = texto;
  mensagem.style.display = "block";
  
  setTimeout(() => {
    mensagem.style.display = "none";
  }, 3000);
}

function atualizarInterfaceCompleta() {
  try {
    atualizarCategorias();
    atualizarLojas();
    atualizarFiltroLojas();
    preencherFiltroUsuarios();
    preencherFiltroLojasRecorrentes();
    preencherFiltroUsuariosRecorrentes();
    preencherFiltroCategorias();
    atualizarTodasTabelas();
    atualizarDashboard();
    atualizarGraficos();
    atualizarComparativoLojas();
    atualizarComparativoUsuarios();
  } catch (error) {
    console.error('❌ Erro ao atualizar interface:', error);
  }
}

// ============================================================================
// MANTER TODAS AS OUTRAS FUNÇÕES ORIGINAIS
// ============================================================================

// Todas as funções de modal, filtros, gráficos, etc. permanecem iguais
function mostrarModal(titulo, texto, botoes) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalTexto').innerHTML = texto;
  document.getElementById('modalBotoes').innerHTML = botoes;
  document.getElementById('modalCustom').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalCustom').style.display = 'none';
}

function formatarMoedaBR(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
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
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("data").value = "";
  document.getElementById("recorrente").value = "Não";
  document.getElementById("tipoRecorrencia").selectedIndex = 0;
  document.getElementById("pago").value = "Sim";
  document.getElementById("colunaTipoRecorrencia").style.display = "none";
}

// Substituir função original
function adicionarSaida() {
  adicionarSaidaComUsuario();
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

window.onload = async () => {
  try {
    console.log('🚀 Iniciando aplicação...');
    
    // Tentar inicializar Firebase primeiro
    await inicializarFirebaseSync();
    
    console.log('✅ Aplicação iniciada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização, usando fallback:', error);
    
    // Fallback para localStorage
    carregarDadosLocal();
    atualizarInterfaceCompleta();
  }
};

// Manter todas as outras funções do arquivo original...
// [Todas as funções restantes de filtros, gráficos, tabelas, etc. permanecem iguais]