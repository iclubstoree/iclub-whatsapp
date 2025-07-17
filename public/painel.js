// painel.js - SISTEMA ICLUB CORRIGIDO
let categorias = ["Aluguel", "Energia", "Internet", "Combustível", "Material", "Transporte", "Alimentação", "Marketing", "Saúde"];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";
let contadorMultiplas = 0;
let chatAberto = false;
let treinamentosIA = JSON.parse(localStorage.getItem('treinamentosIA') || '[]');
let treinamentosNaturais = JSON.parse(localStorage.getItem('treinamentosNaturais') || '[]');
let paginacao = {
  saidasMes: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 },
  proximasSaidas: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 }
};

// Chat suspenso
function toggleChat() {
  const chatContainer = document.getElementById('chatContainer');
  const toggleBtn = document.querySelector('.chat-toggle-btn');
  if (!chatContainer || !toggleBtn) return;
  
  chatAberto = !chatAberto;
  if (chatAberto) {
    chatContainer.style.display = 'flex';
    toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
  } else {
    chatContainer.style.display = 'none';
    toggleBtn.innerHTML = '<i class="fas fa-comments"></i>';
  }
}

// Notificações
function mostrarNotificacaoInteligente(texto = '✅ Operação realizada!', tipo = 'success') {
  const notificacao = document.getElementById("notificacaoInteligente");
  const textoElement = document.getElementById("textoNotificacao");
  if (!notificacao || !textoElement) return;
  
  notificacao.className = 'notificacao-inteligente';
  if (tipo === 'error') {
    notificacao.classList.add('error');
    textoElement.innerHTML = `<i class="fas fa-exclamation-circle"></i>${texto}`;
  } else if (tipo === 'warning') {
    notificacao.classList.add('warning');
    textoElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i>${texto}`;
  } else {
    textoElement.innerHTML = `<i class="fas fa-check-circle"></i>${texto}`;
  }
  
  notificacao.classList.add('show');
  setTimeout(() => notificacao.classList.remove('show'), 4000);
}

// CORREÇÃO: Função adicionar saída
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

  if (!valorInput || valorInput.trim() === '' || valor <= 0) {
    mostrarNotificacaoInteligente("Por favor, insira um valor válido!", 'error');
    const campoValor = document.getElementById("valor");
    if (campoValor) {
      campoValor.classList.add('campo-obrigatorio');
      campoValor.focus();
      setTimeout(() => campoValor.classList.remove('campo-obrigatorio'), 3000);
    }
    return;
  }

  let tipoFinal = tipoRecorrencia;
  let duracaoInfo = null;
  
  if (tipoRecorrencia === 'Personalizada') {
    const recorrenciaCustom = document.getElementById('recorrenciaCustom')?.value;
    const duracaoTipo = document.getElementById('duracaoTipo')?.value;
    const duracaoQuantidade = document.getElementById('duracaoQuantidade')?.value;
    
    tipoFinal = recorrenciaCustom || 'Personalizada';
    if (duracaoTipo && duracaoQuantidade) {
      duracaoInfo = {
        tipo: duracaoTipo,
        quantidade: parseInt(duracaoQuantidade),
        dataInicio: data
      };
    }
  }

  const saida = { 
    id: Date.now() + Math.random() * 1000, 
    loja, categoria, 
    descricao: descricao || categoria,
    valor, data, recorrente,
    tipoRecorrencia: recorrente === "Sim" ? tipoFinal : null,
    duracaoInfo: duracaoInfo,
    pago, origem: 'manual', timestamp: new Date()
  };

  try {
    if (recorrente === 'Sim' && tipoRecorrencia) {
      gerarSaidasRecorrentes(saida);
    } else {
      if (pago === "Sim") {
        saidas.unshift(saida);
      } else {
        saidasPendentes.unshift(saida);
      }
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

// CORREÇÃO: Gerar saídas recorrentes para todos os meses
function gerarSaidasRecorrentes(saidaBase) {
  const dataInicio = new Date(saidaBase.data + 'T00:00:00');
  const mesesParaGerar = 12;
  
  let incremento = 1;
  let unidade = 'month';
  
  switch (saidaBase.tipoRecorrencia) {
    case 'Diária': incremento = 1; unidade = 'day'; break;
    case 'Semanal': incremento = 7; unidade = 'day'; break;
    case 'Mensal': incremento = 1; unidade = 'month'; break;
    case 'Anual': incremento = 12; unidade = 'month'; break;
    case 'Personalizada':
      const match = saidaBase.tipoRecorrencia.match(/(\d+)/);
      if (match) {
        incremento = parseInt(match[1]);
        if (saidaBase.tipoRecorrencia.toLowerCase().includes('dia')) {
          unidade = 'day';
        } else if (saidaBase.tipoRecorrencia.toLowerCase().includes('semana')) {
          incremento = incremento * 7;
          unidade = 'day';
        } else if (saidaBase.tipoRecorrencia.toLowerCase().includes('ano')) {
          incremento = incremento * 12;
          unidade = 'month';
        }
      }
      break;
  }
  
  const limite = saidaBase.duracaoInfo ? 
    Math.min(mesesParaGerar, saidaBase.duracaoInfo.quantidade) : 
    mesesParaGerar;
  
  for (let i = 0; i < limite; i++) {
    const dataRecorrente = new Date(dataInicio);
    
    if (unidade === 'month') {
      dataRecorrente.setMonth(dataInicio.getMonth() + (i * incremento));
    } else {
      dataRecorrente.setDate(dataInicio.getDate() + (i * incremento));
    }
    
    if (saidaBase.duracaoInfo) {
      const dataLimite = new Date(dataInicio);
      if (saidaBase.duracaoInfo.tipo === 'meses') {
        dataLimite.setMonth(dataInicio.getMonth() + saidaBase.duracaoInfo.quantidade);
      } else if (saidaBase.duracaoInfo.tipo === 'anos') {
        dataLimite.setFullYear(dataInicio.getFullYear() + saidaBase.duracaoInfo.quantidade);
      }
      
      if (dataRecorrente > dataLimite) break;
    }
    
    const saidaRecorrente = {
      ...saidaBase,
      id: Date.now() + Math.random() * 1000 + i,
      data: dataRecorrente.toISOString().split('T')[0],
      origem: 'recorrente'
    };
    
    if (saidaRecorrente.pago === "Sim") {
      saidas.push(saidaRecorrente);
    } else {
      saidasPendentes.push(saidaRecorrente);
    }
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
  const duracaoTipo = document.getElementById("duracaoTipo");
  const duracaoQuantidade = document.getElementById("duracaoQuantidade");
  
  if (tipoRecorrencia && recorrenciaPersonalizada) {
    if (tipoRecorrencia.value === "Personalizada") {
      recorrenciaPersonalizada.style.display = "block";
    } else {
      recorrenciaPersonalizada.style.display = "none";
    }
  }
  
  if (duracaoTipo) {
    duracaoTipo.addEventListener('change', function() {
      if (duracaoQuantidade) {
        if (this.value) {
          duracaoQuantidade.style.display = 'block';
          duracaoQuantidade.placeholder = `Quantos ${this.value}?`;
        } else {
          duracaoQuantidade.style.display = 'none';
        }
      }
    });
  }
}

// CORREÇÃO: Múltiplas saídas com validação rigorosa
function iniciarMultiplasSaidas() {
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
  novaLinha.className = "saida-item fade-in-up";
  novaLinha.id = `saida-${contadorMultiplas}`;
  
  novaLinha.innerHTML = `
    <div class="saida-info">
      <div class="row g-2">
        <div class="col-md-2">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Loja</label>
          <select class="form-select form-select-sm" id="loja-${contadorMultiplas}">
            ${lojas.map(loja => `<option value="${loja}">${loja}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Categoria</label>
          <select class="form-select form-select-sm" id="categoria-${contadorMultiplas}">
            ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Descrição</label>
          <input type="text" class="form-control form-control-sm" id="descricao-${contadorMultiplas}" placeholder="Descrição">
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Valor</label>
          <input type="text" class="form-control form-control-sm" id="valor-${contadorMultiplas}" placeholder="R$ 0,00" oninput="formatarMoedaMultiplas(this)">
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Data</label>
          <input type="date" class="form-control form-control-sm" id="data-${contadorMultiplas}" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="col-md-2">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Status</label>
          <select class="form-select form-select-sm" id="pago-${contadorMultiplas}">
            <option>Sim</option>
            <option>Não</option>
          </select>
        </div>
      </div>
      <div class="row g-2 mt-2">
        <div class="col-md-3">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Recorrente</label>
          <select class="form-select form-select-sm" id="recorrente-${contadorMultiplas}" onchange="toggleRecorrenciaMultipla(${contadorMultiplas})">
            <option>Não</option>
            <option>Sim</option>
          </select>
        </div>
        <div class="col-md-3" id="tipoRecorrenciaContainer-${contadorMultiplas}" style="display:none;">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Tipo</label>
          <select class="form-select form-select-sm" id="tipoRecorrencia-${contadorMultiplas}">
            <option>Diária</option>
            <option>Semanal</option>
            <option>Mensal</option>
            <option>Anual</option>
            <option>Personalizada</option>
          </select>
        </div>
        <div class="col-md-6" id="recorrenciaPersonalizadaContainer-${contadorMultiplas}" style="display:none;">
          <label class="form-label fw-bold" style="font-size: 0.8rem;">Personalizada</label>
          <input type="text" class="form-control form-control-sm" id="recorrenciaCustom-${contadorMultiplas}" placeholder="Ex: A cada 15 dias">
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
  const container = document.getElementById(`tipoRecorrenciaContainer-${id}`);
  
  if (recorrente && container) {
    container.style.display = recorrente.value === "Sim" ? "block" : "none";
  }
}

function removerLinhaSaida(id) {
  const elemento = document.getElementById(`saida-${id}`);
  if (elemento) elemento.remove();
}

function adicionarTodasSaidas() {
  const listaSaidas = document.getElementById("listaSaidas");
  if (!listaSaidas) return;
  
  const linhas = listaSaidas.querySelectorAll('.saida-item');
  const errosContainer = document.getElementById('errosMultiplas');
  
  let sucessos = 0;
  let erros = [];
  
  if (errosContainer) errosContainer.innerHTML = '';
  
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
    
    const errosLinha = [];
    
    if (!loja) errosLinha.push('Loja obrigatória');
    if (!categoria) errosLinha.push('Categoria obrigatória');
    if (!valorInput || valor <= 0) errosLinha.push('Valor inválido');
    if (!data) errosLinha.push('Data obrigatória');
    if (recorrente === 'Sim' && !tipoRecorrencia) errosLinha.push('Tipo de recorrência obrigatório');
    
    if (errosLinha.length > 0) {
      erros.push(`Linha ${id}: ${errosLinha.join(', ')}`);
      
      const campos = [`loja-${id}`, `categoria-${id}`, `valor-${id}`, `data-${id}`];
      campos.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo && errosLinha.some(erro => erro.toLowerCase().includes(campoId.split('-')[0]))) {
          campo.classList.add('campo-obrigatorio');
        }
      });
      continue;
    }
    
    let tipoFinal = tipoRecorrencia;
    if (tipoRecorrencia === 'Personalizada') {
      const recorrenciaCustom = document.getElementById(`recorrenciaCustom-${id}`)?.value;
      tipoFinal = recorrenciaCustom || 'Personalizada';
    }
    
    const saida = {
      id: Date.now() + Math.random() * 1000,
      loja, categoria,
      descricao: descricao || categoria,
      valor, data,
      recorrente,
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
      erros.push(`Linha ${id}: ${error.message}`);
    }
  }
  
  if (erros.length > 0) {
    if (errosContainer) {
      errosContainer.innerHTML = `
        <div class="erro-item">
          <strong>❌ Erros encontrados - Corrija antes de continuar:</strong><br>
          ${erros.map(erro => `• ${erro}`).join('<br>')}
        </div>
      `;
    }
    mostrarNotificacaoInteligente(`❌ ${erros.length} erro(s) encontrado(s). Corrija os campos destacados.`, 'error');
    return;
  }
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  cancelarMultiplasSaidas();
  mostrarNotificacaoInteligente(`✅ ${sucessos} saídas adicionadas com sucesso!`);
}

function cancelarMultiplasSaidas() {
  const container = document.getElementById("multiplasSaidasContainer");
  if (container) container.style.display = "none";
  
  const listaSaidas = document.getElementById("listaSaidas");
  if (listaSaidas) listaSaidas.innerHTML = "";
  
  contadorMultiplas = 0;
}

function formatarMoedaMultiplas(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor === '') {
    input.value = '';
    return;
  }
  valor = parseInt(valor);
  input.value = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// CORREÇÃO: Editar categorias e lojas
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
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  const lista = categorias.map((cat, index) => 
    `<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
      <span style="font-weight: 600;">${cat}</span>
      <button onclick="removerCategoria(${index})" class="btn btn-danger-modern btn-sm">
        <i class="fas fa-trash"></i> Remover
      </button>
    </div>`
  ).join('');
  
  document.getElementById('modalTitulo').textContent = 'Editar Categorias Existentes';
  document.getElementById('modalTexto').innerHTML = lista || '<p class="text-muted">Nenhuma categoria cadastrada.</p>';
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">Fechar</button>
  `;
  modal.style.display = 'flex';
}

function mostrarEditorLojaExistente() {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  const lista = lojas.map((loja, index) => 
    `<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
      <span style="font-weight: 600;">${loja}</span>
      <button onclick="removerLoja(${index})" class="btn btn-danger-modern btn-sm">
        <i class="fas fa-trash"></i> Remover
      </button>
    </div>`
  ).join('');
  
  document.getElementById('modalTitulo').textContent = 'Editar Lojas Existentes';
  document.getElementById('modalTexto').innerHTML = lista || '<p class="text-muted">Nenhuma loja cadastrada.</p>';
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">Fechar</button>
  `;
  modal.style.display = 'flex';
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
  if (modal) modal.style.display = 'none';
}

// CORREÇÃO: Editar saída completa
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
        <select id="editRecorrente" class="form-select">
          <option value="Não" ${saida.recorrente === 'Não' ? 'selected' : ''}>Não</option>
          <option value="Sim" ${saida.recorrente === 'Sim' ? 'selected' : ''}>Sim</option>
        </select>
      </div>
      <div class="col-md-4">
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
    <button class="btn btn-success-modern btn-modern" onclick="salvarEdicaoSaida(${saidaId})">Salvar</button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">Cancelar</button>
  `;
  
  modal.style.display = 'flex';
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
  if (!saidaEncontrada) {
    saidaEncontrada = saidasPendentes.find(s => s.id === saidaId);
  }
  
  if (!saidaEncontrada) {
    mostrarNotificacaoInteligente('Saída não encontrada!', 'error');
    return;
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
  mostrarNotificacaoInteligente('✅ Saída editada com sucesso!');
}

// Chat IA básico
function enviarMensagemChat() {
  const input = document.getElementById('chatInput');
  const mensagem = input?.value.trim();
  if (!mensagem) return;
  
  input.value = '';
  adicionarMensagemChat('user', mensagem);
  
  setTimeout(() => {
    const resultado = interpretarMensagemIA(mensagem);
    if (resultado.sucesso) {
      const saidaData = {
        id: Date.now(),
        loja: "Loja Centro",
        categoria: resultado.categoria,
        descricao: resultado.categoria,
        valor: resultado.valor,
        data: resultado.data,
        recorrente: "Não",
        tipoRecorrencia: null,
        pago: resultado.pago,
        origem: 'chat',
        timestamp: new Date()
      };
      
      if (saidaData.pago === 'Sim') {
        saidas.unshift(saidaData);
      } else {
        saidasPendentes.unshift(saidaData);
      }
      
      salvarDadosLocal();
      atualizarInterfaceCompleta();
      adicionarMensagemChat('system', `✅ Saída de ${formatarMoedaBR(resultado.valor)} adicionada para ${resultado.categoria}!`);
    } else {
      adicionarMensagemChat('system', `❌ ${resultado.erro}`);
    }
  }, 1000);
}

function interpretarMensagemIA(mensagem) {
  const msgLower = mensagem.toLowerCase();
  
  const matchValor = msgLower.match(/(?:r\$?\s*)?(\d{1,6}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{1,2})?)/i);
  if (!matchValor) {
    return { sucesso: false, erro: "Não consegui identificar o valor" };
  }
  
  const valor = processarValorBrasileiro(matchValor[1]);
  if (valor <= 0) {
    return { sucesso: false, erro: "Valor inválido" };
  }
  
  let categoria = "Outros";
  const categoriasIA = {
    'Aluguel': /aluguel|rent/i,
    'Energia': /energia|luz|elétrica/i,
    'Internet': /internet|wifi/i,
    'Combustível': /combustível|gasolina|posto/i,
    'Transporte': /uber|taxi|transporte/i
  };
  
  for (const [cat, regex] of Object.entries(categoriasIA)) {
    if (regex.test(msgLower)) {
      categoria = cat;
      break;
    }
  }
  
  let data = new Date().toISOString().split('T')[0];
  if (/ontem/i.test(msgLower)) {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    data = ontem.toISOString().split('T')[0];
  }
  
  const pago = /devo|deve|pendente/i.test(msgLower) ? "Não" : "Sim";
  
  return {
    sucesso: true,
    categoria,
    valor,
    data,
    pago
  };
}

function processarValorBrasileiro(valorTexto) {
  let valor = valorTexto.toString().trim();
  if (/^\d+$/.test(valor)) return parseInt(valor);
  
  if (valor.includes('.') && valor.includes(',')) {
    valor = valor.replace(/\./g, '').replace(',', '.');
  } else if (valor.includes(',') && !valor.includes('.')) {
    valor = valor.replace(',', '.');
  }
  
  return parseFloat(valor) || 0;
}

function adicionarMensagemChat(tipo, texto) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${tipo}`;
  messageDiv.innerHTML = `
    <div class="chat-bubble">
      <div>${texto}</div>
      <div class="chat-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function limparChat() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="chat-message system">
        <div class="chat-bubble">
          <div>👋 Olá! Digite suas saídas em linguagem natural</div>
          <div class="chat-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `;
  }
}

// Funções básicas do sistema
function excluirSaida(firestoreId, saidaId) {
  if (!confirm('Excluir esta saída?')) return;
  saidas = saidas.filter(s => s.id !== saidaId);
  saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarNotificacaoInteligente('✅ Saída excluída!');
}

function marcarComoPago(firestoreId, saidaId) {
  if (!confirm('Marcar como paga?')) return;
  const saida = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
  if (saida) {
    saida.pago = 'Sim';
    saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
    saidas.unshift(saida);
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente('✅ Marcada como paga!');
  }
}

function editarSaida(firestoreId, saidaId) {
  mostrarNotificacaoInteligente('Funcionalidade em desenvolvimento', 'warning');
}

// CORREÇÃO: Próximas saídas com paginação
function paginacaoAnteriorProximas() {
  if (paginacao.proximasSaidas.paginaAtual > 1) {
    paginacao.proximasSaidas.paginaAtual--;
    atualizarTabela();
  }
}

function paginacaoProximaProximas() {
  const totalPaginas = Math.ceil(paginacao.proximasSaidas.totalItens / paginacao.proximasSaidas.itensPorPagina);
  if (paginacao.proximasSaidas.paginaAtual < totalPaginas) {
    paginacao.proximasSaidas.paginaAtual++;
    atualizarTabela();
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

// Interface e atualização
function atualizarInterfaceCompleta() {
  atualizarCategorias();
  atualizarLojas();
  atualizarFiltros();
  atualizarTabela();
  atualizarDashboard();
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
    filtroGlobal.innerHTML = '<option value="">📊 Todas as lojas</option>';
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
  
  preencherMesesDoAno();
}

function preencherMesesDoAno() {
  const filtroAno = document.getElementById("filtroAnoRecorrentes");
  const filtroMes = document.getElementById("filtroMesRecorrentes");
  if (!filtroMes || !filtroAno) return;
  
  const anoSelecionado = filtroAno.value || new Date().getFullYear().toString();
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
    filtroMes.appendChild(option);
  });
}

// CORREÇÃO: Atualizou tabela para incluir saídas futuras em próximas
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
  
  // CORREÇÃO: Incluir TODAS as saídas futuras em próximas (recorrentes E não recorrentes)
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes && s.pago === 'Sim';
  });
  
  let saidasAtrasadas = [...saidas, ...saidasPendentes].filter(s => s.pago === 'Não' && s.data < dataHoje);
  let saidasVencendoHoje = [...saidas, ...saidasPendentes].filter(s => s.pago === 'Não' && s.data === dataHoje);
  
  // CORREÇÃO: Próximas saídas incluem TODAS as saídas futuras (independente de recorrência)
  let saidasProximas = [...saidas, ...saidasPendentes].filter(s => {
    if (s.pago === 'Sim') return false; // Só saídas não pagas
    const diasRestantes = Math.floor((new Date(s.data + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
    return diasRestantes > 0; // TODAS as saídas futuras
  });
  
  let saidasRecorrentes = [...saidas, ...saidasPendentes].filter(s => s.recorrente === 'Sim');
  
  if (lojaFiltroAtual) {
    saidasMes = saidasMes.filter(s => s.loja === lojaFiltroAtual);
    saidasAtrasadas = saidasAtrasadas.filter(s => s.loja === lojaFiltroAtual);
    saidasVencendoHoje = saidasVencendoHoje.filter(s => s.loja === lojaFiltroAtual);
    saidasProximas = saidasProximas.filter(s => s.loja === lojaFiltroAtual);
    saidasRecorrentes = saidasRecorrentes.filter(s => s.loja === lojaFiltroAtual);
  }
  
  // Aplicar filtros de recorrentes
  saidasRecorrentes = aplicarFiltrosRecorrentes(saidasRecorrentes);
  
  preencherTabelaDoMes(tbody, saidasMes);
  preencherTabelaSimples(divAtrasadas, saidasAtrasadas, 'Nenhuma saída atrasada');
  preencherTabelaSimples(divVencendoHoje, saidasVencendoHoje, 'Nenhuma saída vencendo hoje');
  preencherTabelaProximas(divProximas, saidasProximas);
  preencherTabelaSimples(divPrevisaoRecorrentes, saidasRecorrentes, 'Nenhuma saída recorrente');
  
  // Atualizar total de recorrentes
  const totalRecorrentes = saidasRecorrentes.reduce((sum, s) => sum + s.valor, 0);
  const elemento = document.getElementById("totalSaidasRecorrentes");
  if (elemento) elemento.textContent = formatarMoedaBR(totalRecorrentes);
}

function aplicarFiltrosRecorrentes(saidas) {
  let saidasFiltradas = [...saidas];
  
  const filtroLoja = document.getElementById("filtroLojaRecorrentes")?.value;
  const filtroAno = document.getElementById("filtroAnoRecorrentes")?.value;
  const filtroMes = document.getElementById("filtroMesRecorrentes")?.value;
  const filtroCategoria = document.getElementById("filtroCategoriaRecorrentes")?.value;
  
  if (filtroLoja) saidasFiltradas = saidasFiltradas.filter(s => s.loja === filtroLoja);
  if (filtroAno) saidasFiltradas = saidasFiltradas.filter(s => s.data.substring(0, 4) === filtroAno);
  if (filtroMes) saidasFiltradas = saidasFiltradas.filter(s => s.data.substring(0, 7) === filtroMes);
  if (filtroCategoria) saidasFiltradas = saidasFiltradas.filter(s => s.categoria === filtroCategoria);
  
  return saidasFiltradas;
}

function preencherTabelaDoMes(tbody, saidas) {
  const itensPorPagina = paginacao.saidasMes.itensPorPagina;
  const paginaAtual = paginacao.saidasMes.paginaAtual;
  const totalItens = saidas.length;
  
  paginacao.saidasMes.totalItens = totalItens;
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const saidasPagina = saidas.slice(inicio, inicio + itensPorPagina);
  
  saidasPagina.forEach(s => {
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
        <button class="btn btn-warning-modern btn-sm" onclick="editarSaida('', ${s.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('', ${s.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  const paginacaoContainer = document.getElementById('paginacaoSaidasMes');
  if (paginacaoContainer) {
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    if (totalPaginas > 1) {
      paginacaoContainer.style.display = 'flex';
      document.getElementById('paginaAtualSaidasMes').textContent = paginaAtual;
      document.getElementById('totalPaginasSaidasMes').textContent = totalPaginas;
    } else {
      paginacaoContainer.style.display = 'none';
    }
  }
}

// CORREÇÃO: Tabelas com botões e descrição completos
function preencherTabelaSimples(container, saidas, mensagemVazia) {
  if (!container) return;
  
  if (saidas.length === 0) {
    container.innerHTML = `<p class="text-muted text-center">✅ ${mensagemVazia}</p>`;
    return;
  }
  
  // Adicionar paginação para cada seção
  const containerName = container.id || 'secao';
  let paginacao = window[`paginacao${containerName}`] || { paginaAtual: 1, itensPorPagina: 10 };
  
  const inicio = (paginacao.paginaAtual - 1) * paginacao.itensPorPagina;
  const saidasPagina = saidas.slice(inicio, inicio + paginacao.itensPorPagina);
  const totalPaginas = Math.ceil(saidas.length / paginacao.itensPorPagina);
  
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
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${saidasPagina.map(s => {
            const diasInfo = calcularDiasInfo(s);
            return `
            <tr>
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')} ${diasInfo}</td>
              <td>
                ${s.pago === 'Não' ? `<button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('', ${s.id})" title="Marcar como Pago"><i class="fas fa-check"></i></button>` : ''}
                <button class="btn btn-warning-modern btn-sm ms-1" onclick="editarSaida('', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('', ${s.id})" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>
    ${totalPaginas > 1 ? `
      <div class="paginacao-container">
        <button class="paginacao-btn" onclick="paginacaoSecao('${containerName}', -1)" ${paginacao.paginaAtual <= 1 ? 'disabled' : ''}>
          <i class="fas fa-chevron-left"></i> Anterior
        </button>
        <span class="paginacao-info">
          Página ${paginacao.paginaAtual} de ${totalPaginas}
        </span>
        <button class="paginacao-btn" onclick="paginacaoSecao('${containerName}', 1)" ${paginacao.paginaAtual >= totalPaginas ? 'disabled' : ''}>
          Próxima <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    ` : ''}
  `;
  
  container.innerHTML = tabela;
  
  // Salvar estado da paginação
  window[`paginacao${containerName}`] = paginacao;
}

function calcularDiasInfo(saida) {
  const hoje = new Date();
  const dataSaida = new Date(saida.data + 'T00:00:00');
  const diferenca = Math.floor((dataSaida - hoje) / (1000 * 60 * 60 * 24));
  
  if (diferenca < 0) {
    return `<span class="badge bg-danger">${Math.abs(diferenca)} dias atrasado</span>`;
  } else if (diferenca === 0) {
    return `<span class="badge bg-warning">Vence hoje</span>`;
  } else if (diferenca <= 30) {
    return `<span class="badge bg-warning">${diferenca} dias</span>`;
  }
  return '';
}

function paginacaoSecao(secaoNome, direcao) {
  let paginacao = window[`paginacao${secaoNome}`];
  if (!paginacao) return;
  
  paginacao.paginaAtual += direcao;
  if (paginacao.paginaAtual < 1) paginacao.paginaAtual = 1;
  
  atualizarTabela();
}

function preencherTabelaProximas(container, saidas) {
  if (!container) return;
  
  paginacao.proximasSaidas.totalItens = saidas.length;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">✅ Nenhuma saída próxima</p>';
    esconderControlesProximas();
    return;
  }
  
  const itensPorPagina = paginacao.proximasSaidas.itensPorPagina;
  const paginaAtual = paginacao.proximasSaidas.paginaAtual;
  const totalPaginas = Math.ceil(saidas.length / itensPorPagina);
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const saidasPagina = saidas.slice(inicio, inicio + itensPorPagina);
  
  mostrarControlesProximas(totalPaginas);
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${saidasPagina.map(s => {
            const diasRestantes = Math.floor((new Date(s.data + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
            return `
            <tr>
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')} <span class="badge bg-warning">${diasRestantes}d</span></td>
              <td>
                <button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('', ${s.id})">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('', ${s.id})">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tabela;
}

function mostrarControlesProximas(totalPaginas) {
  const controles = document.getElementById('proximasControles');
  const paginaAtual = document.getElementById('paginaAtualProximas');
  const totalPaginasElement = document.getElementById('totalPaginasProximas');
  const totalItens = document.getElementById('totalItensProximas');
  
  if (controles) controles.style.display = totalPaginas > 1 ? 'flex' : 'none';
  if (paginaAtual) paginaAtual.textContent = paginacao.proximasSaidas.paginaAtual;
  if (totalPaginasElement) totalPaginasElement.textContent = totalPaginas;
  if (totalItens) totalItens.textContent = paginacao.proximasSaidas.totalItens;
}

function esconderControlesProximas() {
  const controles = document.getElementById('proximasControles');
  if (controles) controles.style.display = 'none';
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
  if (elementoTotalMes) elementoTotalMes.textContent = formatarMoedaBR(totalMes);

  const totalRecorrente = saidasMes.filter(s => s.recorrente === 'Sim').reduce((sum, s) => sum + s.valor, 0);
  const elementoTotalRecorrente = document.getElementById("totalRecorrente");
  if (elementoTotalRecorrente) elementoTotalRecorrente.textContent = formatarMoedaBR(totalRecorrente);

  const maiorGasto = saidasMes.length > 0 ? Math.max(...saidasMes.map(s => s.valor)) : 0;
  const elementoMaiorGasto = document.getElementById("maiorGasto");
  if (elementoMaiorGasto) elementoMaiorGasto.textContent = formatarMoedaBR(maiorGasto);

  const categoriaCount = {};
  saidasMes.forEach(s => {
    categoriaCount[s.categoria] = (categoriaCount[s.categoria] || 0) + s.valor;
  });
  
  const categoriaTopo = Object.keys(categoriaCount).length > 0 
    ? Object.keys(categoriaCount).reduce((a, b) => categoriaCount[a] > categoriaCount[b] ? a : b)
    : '-';
  const elementoCategoriaTopo = document.getElementById("categoriaTopo");
  if (elementoCategoriaTopo) elementoCategoriaTopo.textContent = categoriaTopo;

  const elementoTotalSaidas = document.getElementById("totalSaidas");
  if (elementoTotalSaidas) elementoTotalSaidas.textContent = saidasMes.length;
}

function aplicarFiltroLoja() {
  const filtro = document.getElementById("filtroLojaGlobal");
  lojaFiltroAtual = filtro ? filtro.value : "";
  paginacao.saidasMes.paginaAtual = 1;
  atualizarTabela();
  atualizarDashboard();
}

function filtrarRecorrentesPorFiltros() {
  atualizarTabela();
}

function limparFiltrosRecorrentes() {
  const filtros = ['filtroLojaRecorrentes', 'filtroAnoRecorrentes', 'filtroMesRecorrentes', 'filtroCategoriaRecorrentes'];
  filtros.forEach(filtroId => {
    const elemento = document.getElementById(filtroId);
    if (elemento) elemento.value = '';
  });
  filtrarRecorrentesPorFiltros();
  mostrarNotificacaoInteligente('✅ Filtros limpos!');
}

// CORREÇÃO: Análise inteligente funcional
function abrirAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  const loading = document.getElementById('analiseLoading');
  const resultado = document.getElementById('analiseResultado');
  
  if (!modal) {
    mostrarNotificacaoInteligente('Modal de análise não encontrado', 'error');
    return;
  }
  
  modal.style.display = 'block';
  if (loading) loading.style.display = 'block';
  if (resultado) resultado.style.display = 'none';
  
  setTimeout(() => {
    if (loading) loading.style.display = 'none';
    if (resultado) {
      resultado.style.display = 'block';
      resultado.innerHTML = gerarAnaliseSimples();
    }
  }, 2000);
}

function gerarAnaliseSimples() {
  const totalSaidas = saidas.length + saidasPendentes.length;
  const valorTotal = [...saidas, ...saidasPendentes].reduce((sum, s) => sum + s.valor, 0);
  const saidasPendentesCount = saidasPendentes.length;
  const valorPendente = saidasPendentes.reduce((sum, s) => sum + s.valor, 0);
  
  const categoriaCount = {};
  [...saidas, ...saidasPendentes].forEach(s => {
    categoriaCount[s.categoria] = (categoriaCount[s.categoria] || 0) + s.valor;
  });
  
  const categoriaTopo = Object.keys(categoriaCount).length > 0 
    ? Object.keys(categoriaCount).reduce((a, b) => categoriaCount[a] > categoriaCount[b] ? a : b)
    : 'N/A';
  
  return `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
      <h4 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 15px;">📊 Resumo Executivo Inteligente</h4>
      <p>Análise completa baseada em ${totalSaidas} saídas processadas</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px;">
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 15px;">
          <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 5px;">${formatarMoedaBR(valorTotal)}</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">Valor Total</div>
        </div>
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 15px;">
          <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 5px;">${totalSaidas}</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">Total Saídas</div>
        </div>
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 15px;">
          <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 5px;">${categoriaTopo}</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">Categoria Top</div>
        </div>
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 15px;">
          <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 5px;">${saidasPendentesCount}</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">Pendentes</div>
        </div>
      </div>
    </div>
    
    ${saidasPendentesCount > 0 ? `
    <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
        <div style="width: 40px; height: 40px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div>
          <h6 style="font-size: 1.1rem; font-weight: 700; color: #1f2937; margin: 0;">Alto Volume de Pendências</h6>
          <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">${formatarMoedaBR(valorPendente)}</p>
        </div>
      </div>
      <div style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
        Você tem ${saidasPendentesCount} saídas pendentes totalizando ${formatarMoedaBR(valorPendente)}. Isso pode impactar seu fluxo de caixa.
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <span style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 8px 16px; color: #374151; font-size: 0.85rem; font-weight: 600;">Priorizar pagamentos críticos</span>
        <span style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 8px 16px; color: #374151; font-size: 0.85rem; font-weight: 600;">Renegociar prazos</span>
      </div>
    </div>
    ` : ''}
    
    <div style="background: #f8fafc; border: 2px solid #8b5cf6; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
        <div style="width: 40px; height: 40px; background: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
          <i class="fas fa-brain"></i>
        </div>
        <div>
          <h6 style="font-size: 1.1rem; font-weight: 700; color: #1f2937; margin: 0;">Categoria Dominante</h6>
          <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">${categoriaTopo}</p>
        </div>
      </div>
      <div style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
        A categoria "${categoriaTopo}" é sua principal categoria de gastos. Monitore regularmente para identificar oportunidades de otimização.
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <span style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 8px 16px; color: #374151; font-size: 0.85rem; font-weight: 600;">Analisar fornecedores</span>
        <span style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 8px 16px; color: #374151; font-size: 0.85rem; font-weight: 600;">Monitorar tendências</span>
      </div>
    </div>
  `;
}

function fecharAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  if (modal) modal.style.display = 'none';
}

// Treinamento IA básico
function mostrarTreinamentoIA() {
  mostrarNotificacaoInteligente('Treinamento IA em desenvolvimento', 'warning');
}

function fecharTreinamentoIA() {
  const modal = document.getElementById('modalTreinamentoIA');
  if (modal) modal.style.display = 'none';
}

// Utilitários
function formatarMoeda(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor === '') {
    input.value = '';
    return;
  }
  valor = parseInt(valor);
  input.value = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function extrairValorNumerico(valorFormatado) {
  if (!valorFormatado) return 0;
  let valor = valorFormatado.toString().replace(/[R$\s]/g, '');
  if (/^\d+$/.test(valor)) return parseFloat(valor);
  if (valor.includes('.') && valor.includes(',')) {
    valor = valor.replace(/\./g, '').replace(',', '.');
  } else if (valor.includes(',') && !valor.includes('.')) {
    valor = valor.replace(',', '.');
  }
  return parseFloat(valor) || 0;
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
  if (dataElement) dataElement.value = new Date().toISOString().split('T')[0];
  
  const recorrenteElement = document.getElementById('recorrente');
  if (recorrenteElement) recorrenteElement.value = 'Não';
  
  const colunaRecorrencia = document.getElementById('colunaTipoRecorrencia');
  if (colunaRecorrencia) colunaRecorrencia.style.display = 'none';
}

function salvarDadosLocal() {
  try {
    const dadosBackup = {
      categorias, lojas, saidas, saidasPendentes, treinamentosIA, treinamentosNaturais,
      versao: '2.0.0', ultimoBackup: new Date().toISOString(),
      totalSaidas: saidas.length + saidasPendentes.length
    };
    localStorage.setItem('iclubSaidas', JSON.stringify(dadosBackup));
  } catch (error) {
    console.error('❌ Erro salvar backup:', error);
  }
}

function carregarDadosLocal() {
  try {
    const dadosSalvos = localStorage.getItem('iclubSaidas');
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      if (dados.categorias) categorias = dados.categorias;
      if (dados.lojas) lojas = dados.lojas;
      if (dados.saidas) saidas = dados.saidas;
      if (dados.saidasPendentes) saidasPendentes = dados.saidasPendentes;
      return true;
    }
  } catch (error) {
    console.error('❌ Erro carregar backup:', error);
  }
  return false;
}

// Inicialização
window.addEventListener('load', () => {
  const dataElement = document.getElementById('data');
  if (dataElement && !dataElement.value) {
    dataElement.value = new Date().toISOString().split('T')[0];
  }
  
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        enviarMensagemChat();
      }
    });
  }
  
  carregarDadosLocal();
  atualizarInterfaceCompleta();
  
  const totalSaidas = saidas.length + saidasPendentes.length;
  if (totalSaidas > 0) {
    mostrarNotificacaoInteligente(`✅ Sistema carregado! ${totalSaidas} saídas encontradas.`);
  } else {
    mostrarNotificacaoInteligente('✅ Sistema carregado com sucesso!');
  }
});

// Exposição global das funções
window.toggleChat = toggleChat;
window.adicionarSaida = adicionarSaida;
window.excluirSaida = excluirSaida;
window.editarSaida = editarSaida;
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
window.toggleTipoRecorrencia = toggleTipoRecorrencia;
window.toggleRecorrenciaPersonalizada = toggleRecorrenciaPersonalizada;
window.toggleRecorrenciaMultipla = toggleRecorrenciaMultipla;
window.aplicarFiltroLoja = aplicarFiltroLoja;
window.filtrarRecorrentesPorFiltros = filtrarRecorrentesPorFiltros;
window.limparFiltrosRecorrentes = limparFiltrosRecorrentes;
window.preencherMesesDoAno = preencherMesesDoAno;
window.paginacaoAnteriorProximas = paginacaoAnteriorProximas;
window.paginacaoProximaProximas = paginacaoProximaProximas;
window.paginacaoAnterior = paginacaoAnterior;
window.paginacaoProxima = paginacaoProxima;
window.abrirAnaliseInteligente = abrirAnaliseInteligente;
window.fecharAnaliseInteligente = fecharAnaliseInteligente;
window.mostrarTreinamentoIA = mostrarTreinamentoIA;
window.fecharTreinamentoIA = fecharTreinamentoIA;
window.enviarMensagemChat = enviarMensagemChat;
window.limparChat = limparChat;
window.formatarMoeda = formatarMoeda;

console.log('✅ Sistema iClub carregado - Versão otimizada!');