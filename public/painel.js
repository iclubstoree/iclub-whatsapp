// painel.js - SISTEMA ICLUB ATUALIZADO COM NOVAS FUNCIONALIDADES
let categorias = ["Aluguel", "Energia", "Internet", "Combustível", "Material", "Transporte", "Alimentação", "Marketing", "Saúde"];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";
let contadorMultiplas = 0;
let chatAberto = false;
let treinamentosIA = JSON.parse(localStorage.getItem('treinamentosIA') || '[]');
let treinamentosNaturais = JSON.parse(localStorage.getItem('treinamentosNaturais') || '[]');
let selecionados = {
  saidasMes: new Set(),
  recorrentes: new Set(),
  proximas: new Set()
};
let paginacao = {
  saidasMes: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 },
  proximasSaidas: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 }
};

// ===== CHAT NO TOPO =====
function toggleChatTopo() {
  const chatContainer = document.getElementById('chatContainerTopo');
  if (!chatContainer) return;
  
  chatAberto = !chatAberto;
  if (chatAberto) {
    chatContainer.style.display = 'flex';
  } else {
    chatContainer.style.display = 'none';
  }
}

function enviarMensagemChatTopo() {
  const input = document.getElementById('chatInputTopo');
  const mensagem = input?.value.trim();
  if (!mensagem) return;
  
  input.value = '';
  adicionarMensagemChatTopo('user', mensagem);
  
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
      adicionarMensagemChatTopo('system', `✅ Saída de ${formatarMoedaBR(resultado.valor)} adicionada para ${resultado.categoria}!`);
    } else {
      adicionarMensagemChatTopo('system', `❌ ${resultado.erro}`);
    }
  }, 1000);
}

function adicionarMensagemChatTopo(tipo, texto) {
  const chatMessages = document.getElementById('chatMessagesTopo');
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

function limparChatTopo() {
  const chatMessages = document.getElementById('chatMessagesTopo');
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

// ===== RECORRÊNCIA PERSONALIZADA AVANÇADA =====
function toggleRecorrenciaPersonalizada() {
  const tipoRecorrencia = document.getElementById("tipoRecorrencia");
  const recorrenciaAvancada = document.getElementById("recorrenciaAvancada");
  
  if (tipoRecorrencia && recorrenciaAvancada) {
    if (tipoRecorrencia.value === "Personalizada") {
      recorrenciaAvancada.classList.add('show');
      
      // Pré-selecionar ano atual e todos os meses
      const anoAtual = new Date().getFullYear();
      document.getElementById('anoRecorrencia').value = anoAtual;
      
      // Selecionar todos os meses por padrão
      const selectMeses = document.getElementById('mesesRecorrencia');
      for (let i = 0; i < selectMeses.options.length; i++) {
        selectMeses.options[i].selected = true;
      }
    } else {
      recorrenciaAvancada.classList.remove('show');
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
      const recorrenciaAvancada = document.getElementById("recorrenciaAvancada");
      if (recorrenciaAvancada) {
        recorrenciaAvancada.classList.remove('show');
      }
    }
  }
}

// ===== SELEÇÃO MÚLTIPLA =====
function selecionarTodasLinhas(secao) {
  const checkbox = document.getElementById(`selecionarTodas${secao === 'saidasMes' ? 'SaidasMes' : 'Recorrentes'}`);
  const checkboxes = document.querySelectorAll(`input[data-secao="${secao}"]`);
  
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
    const saidaId = parseInt(cb.dataset.saidaId);
    
    if (checkbox.checked) {
      selecionados[secao].add(saidaId);
      cb.closest('tr').classList.add('linha-selecionada');
    } else {
      selecionados[secao].delete(saidaId);
      cb.closest('tr').classList.remove('linha-selecionada');
    }
  });
  
  atualizarContadorSelecao(secao);
  mostrarOcultarBotoesAcao(secao);
}

function toggleSelecaoLinha(checkbox, secao, saidaId) {
  const linha = checkbox.closest('tr');
  
  if (checkbox.checked) {
    selecionados[secao].add(saidaId);
    linha.classList.add('linha-selecionada');
  } else {
    selecionados[secao].delete(saidaId);
    linha.classList.remove('linha-selecionada');
  }
  
  atualizarContadorSelecao(secao);
  mostrarOcultarBotoesAcao(secao);
}

function atualizarContadorSelecao(secao) {
  const contador = document.getElementById(`contador${secao === 'saidasMes' ? 'SaidasMes' : 'Recorrentes'}`);
  if (contador) {
    const qtd = selecionados[secao].size;
    contador.textContent = `${qtd} saída${qtd !== 1 ? 's' : ''} selecionada${qtd !== 1 ? 's' : ''}`;
  }
}

function mostrarOcultarBotoesAcao(secao) {
  const botoes = document.getElementById(`botoesAcao${secao === 'saidasMes' ? 'SaidasMes' : 'Recorrentes'}`);
  if (botoes) {
    if (selecionados[secao].size > 0) {
      botoes.classList.add('show');
    } else {
      botoes.classList.remove('show');
    }
  }
}

function limparSelecaoSaidasMes() {
  selecionados.saidasMes.clear();
  document.querySelectorAll('input[data-secao="saidasMes"]').forEach(cb => {
    cb.checked = false;
    cb.closest('tr').classList.remove('linha-selecionada');
  });
  document.getElementById('selecionarTodasSaidasMes').checked = false;
  atualizarContadorSelecao('saidasMes');
  mostrarOcultarBotoesAcao('saidasMes');
}

function limparSelecaoRecorrentes() {
  selecionados.recorrentes.clear();
  document.querySelectorAll('input[data-secao="recorrentes"]').forEach(cb => {
    cb.checked = false;
    cb.closest('tr').classList.remove('linha-selecionada');
  });
  atualizarContadorSelecao('recorrentes');
  mostrarOcultarBotoesAcao('recorrentes');
}

// ===== AÇÕES MÚLTIPLAS =====
function pagarSaidasSelecionadas(secao) {
  const saidaIds = Array.from(selecionados[secao]);
  if (saidaIds.length === 0) {
    mostrarNotificacaoInteligente('Nenhuma saída selecionada!', 'warning');
    return;
  }
  
  if (!confirm(`Marcar ${saidaIds.length} saída(s) como paga(s)?`)) return;
  
  let contador = 0;
  saidaIds.forEach(saidaId => {
    const saida = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
    if (saida && saida.pago === 'Não') {
      saida.pago = 'Sim';
      saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
      saidas.unshift(saida);
      contador++;
    }
  });
  
  if (contador > 0) {
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente(`✅ ${contador} saída(s) marcada(s) como paga(s)!`);
    secao === 'saidasMes' ? limparSelecaoSaidasMes() : limparSelecaoRecorrentes();
  }
}

function excluirSaidasSelecionadas(secao) {
  const saidaIds = Array.from(selecionados[secao]);
  if (saidaIds.length === 0) {
    mostrarNotificacaoInteligente('Nenhuma saída selecionada!', 'warning');
    return;
  }
  
  if (!confirm(`Excluir permanentemente ${saidaIds.length} saída(s)?`)) return;
  
  saidaIds.forEach(saidaId => {
    saidas = saidas.filter(s => s.id !== saidaId);
    saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
  });
  
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarNotificacaoInteligente(`✅ ${saidaIds.length} saída(s) excluída(s)!`);
  secao === 'saidasMes' ? limparSelecaoSaidasMes() : limparSelecaoRecorrentes();
}

function editarSaidasSelecionadas(secao) {
  const saidaIds = Array.from(selecionados[secao]);
  if (saidaIds.length === 0) {
    mostrarNotificacaoInteligente('Nenhuma saída selecionada!', 'warning');
    return;
  }
  
  abrirModalEdicaoMultipla(saidaIds);
}

// ===== MODAL EDIÇÃO MÚLTIPLA =====
function abrirModalEdicaoMultipla(saidaIds) {
  const modal = document.getElementById('modalEdicaoMultipla');
  const conteudo = document.getElementById('conteudoEdicaoMultipla');
  
  if (!modal || !conteudo) return;
  
  const saidas = saidaIds.map(id => [...saidas, ...saidasPendentes].find(s => s.id === id)).filter(Boolean);
  
  conteudo.innerHTML = `
    <div class="alert alert-info">
      <strong>📝 Editando ${saidas.length} saída(s) simultaneamente</strong><br>
      Deixe em branco os campos que não deseja alterar.
    </div>
    
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label fw-bold">Nova Loja:</label>
        <select id="editMultiploLoja" class="form-select">
          <option value="">-- Não alterar --</option>
          ${lojas.map(loja => `<option value="${loja}">${loja}</option>`).join('')}
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">Nova Categoria:</label>
        <select id="editMultiploCategoria" class="form-select">
          <option value="">-- Não alterar --</option>
          ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">Novo Status:</label>
        <select id="editMultiploPago" class="form-select">
          <option value="">-- Não alterar --</option>
          <option value="Sim">Pago</option>
          <option value="Não">Pendente</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">Nova Descrição:</label>
        <input type="text" id="editMultiploDescricao" class="form-control" placeholder="Deixe vazio para não alterar">
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">Novo Valor (R$):</label>
        <input type="text" id="editMultiploValor" class="form-control" placeholder="Deixe vazio para não alterar" oninput="formatarMoeda(this)">
      </div>
    </div>
    
    <div class="mt-4">
      <h6>📋 Saídas que serão alteradas:</h6>
      <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;">
        ${saidas.map(s => `
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
            <span><strong>${s.loja}</strong> - ${s.categoria}</span>
            <span>${formatarMoedaBR(s.valor)} - ${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="mt-4 d-flex gap-2 justify-content-center">
      <button class="btn btn-success-modern btn-modern" onclick="salvarEdicaoMultipla([${saidaIds.join(',')}])">
        <i class="fas fa-save"></i> Salvar Alterações
      </button>
      <button class="btn btn-secondary btn-modern" onclick="fecharEdicaoMultipla()">
        <i class="fas fa-times"></i> Cancelar
      </button>
    </div>
  `;
  
  modal.style.display = 'block';
}

function salvarEdicaoMultipla(saidaIds) {
  const novaLoja = document.getElementById('editMultiploLoja')?.value;
  const novaCategoria = document.getElementById('editMultiploCategoria')?.value;
  const novoPago = document.getElementById('editMultiploPago')?.value;
  const novaDescricao = document.getElementById('editMultiploDescricao')?.value;
  const novoValorInput = document.getElementById('editMultiploValor')?.value;
  const novoValor = novoValorInput ? extrairValorNumerico(novoValorInput) : null;
  
  let alteracoes = 0;
  
  saidaIds.forEach(saidaId => {
    let saida = saidas.find(s => s.id === saidaId);
    let estavaEmPendentes = false;
    
    if (!saida) {
      saida = saidasPendentes.find(s => s.id === saidaId);
      estavaEmPendentes = true;
    }
    
    if (saida) {
      let alterou = false;
      
      if (novaLoja) { saida.loja = novaLoja; alterou = true; }
      if (novaCategoria) { saida.categoria = novaCategoria; alterou = true; }
      if (novaDescricao) { saida.descricao = novaDescricao; alterou = true; }
      if (novoValor && novoValor > 0) { saida.valor = novoValor; alterou = true; }
      
      if (novoPago && novoPago !== saida.pago) {
        saida.pago = novoPago;
        alterou = true;
        
        // Mover entre arrays conforme necessário
        if (estavaEmPendentes && novoPago === 'Sim') {
          saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
          saidas.unshift(saida);
        } else if (!estavaEmPendentes && novoPago === 'Não') {
          saidas = saidas.filter(s => s.id !== saidaId);
          saidasPendentes.unshift(saida);
        }
      }
      
      if (alterou) {
        saida.editadoEm = new Date().toISOString();
        alteracoes++;
      }
    }
  });
  
  if (alteracoes > 0) {
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente(`✅ ${alteracoes} saída(s) editada(s) com sucesso!`);
    fecharEdicaoMultipla();
    limparSelecaoSaidasMes();
    limparSelecaoRecorrentes();
  } else {
    mostrarNotificacaoInteligente('Nenhuma alteração foi feita!', 'warning');
  }
}

function fecharEdicaoMultipla() {
  const modal = document.getElementById('modalEdicaoMultipla');
  if (modal) modal.style.display = 'none';
}

// ===== SAÍDAS RECORRENTES APRIMORADAS =====
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

  let configRecorrencia = null;
  
  if (recorrente === "Sim" && tipoRecorrencia) {
    if (tipoRecorrencia === "Personalizada") {
      const diasPersonalizado = document.getElementById('diasPersonalizado')?.value;
      const mesesSelecionados = Array.from(document.getElementById('mesesRecorrencia').selectedOptions).map(opt => parseInt(opt.value));
      const anoRecorrencia = document.getElementById('anoRecorrencia')?.value;
      
      configRecorrencia = {
        tipo: 'Personalizada',
        diasIntervalo: diasPersonalizado ? parseInt(diasPersonalizado) : 30,
        mesesAtivos: mesesSelecionados.length > 0 ? mesesSelecionados : [1,2,3,4,5,6,7,8,9,10,11,12],
        anoRecorrencia: anoRecorrencia ? parseInt(anoRecorrencia) : new Date().getFullYear()
      };
    } else {
      configRecorrencia = { tipo: tipoRecorrencia };
    }
  }

  const saida = { 
    id: Date.now() + Math.random() * 1000, 
    loja, categoria, 
    descricao: descricao || categoria,
    valor, data, recorrente,
    tipoRecorrencia: recorrente === "Sim" ? tipoRecorrencia : null,
    configRecorrencia: configRecorrencia,
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

function gerarSaidasRecorrentes(saidaBase) {
  const dataInicio = new Date(saidaBase.data + 'T00:00:00');
  const mesesParaGerar = 12;
  
  if (saidaBase.configRecorrencia?.tipo === 'Personalizada') {
    const config = saidaBase.configRecorrencia;
    const anoLimite = config.anoRecorrencia;
    
    config.mesesAtivos.forEach(mes => {
      if (mes >= dataInicio.getMonth() + 1 || anoLimite > dataInicio.getFullYear()) {
        let dataRecorrente = new Date(anoLimite, mes - 1, dataInicio.getDate());
        
        // Se for o mesmo ano e mês já passou, pular
        if (anoLimite === dataInicio.getFullYear() && mes < dataInicio.getMonth() + 1) {
          return;
        }
        
        const saidaRecorrente = {
          ...saidaBase,
          id: Date.now() + Math.random() * 1000,
          data: dataRecorrente.toISOString().split('T')[0],
          origem: 'recorrente'
        };
        
        if (saidaRecorrente.pago === "Sim") {
          saidas.push(saidaRecorrente);
        } else {
          saidasPendentes.push(saidaRecorrente);
        }
      }
    });
    return;
  }
  
  // Lógica normal para outros tipos de recorrência
  let incremento = 1;
  let unidade = 'month';
  
  switch (saidaBase.tipoRecorrencia) {
    case 'Diária': incremento = 1; unidade = 'day'; break;
    case 'Semanal': incremento = 7; unidade = 'day'; break;
    case 'Mensal': incremento = 1; unidade = 'month'; break;
    case 'Anual': incremento = 12; unidade = 'month'; break;
  }
  
  for (let i = 0; i < mesesParaGerar; i++) {
    const dataRecorrente = new Date(dataInicio);
    
    if (unidade === 'month') {
      dataRecorrente.setMonth(dataInicio.getMonth() + (i * incremento));
    } else {
      dataRecorrente.setDate(dataInicio.getDate() + (i * incremento));
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

// ===== EXCLUIR RECORRÊNCIA COMPLETA =====
function excluirRecorrenciaCompleta(saidaId) {
  if (!confirm('Excluir esta recorrência de TODOS os meses futuros?')) return;
  
  const saidaReferencia = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
  if (!saidaReferencia || saidaReferencia.recorrente !== 'Sim') {
    mostrarNotificacaoInteligente('Saída não é recorrente!', 'error');
    return;
  }
  
  // Identificar e remover todas as saídas da mesma recorrência
  const chaveRecorrencia = `${saidaReferencia.loja}_${saidaReferencia.categoria}_${saidaReferencia.valor}_${saidaReferencia.tipoRecorrencia}`;
  
  let removidas = 0;
  const hoje = new Date().toISOString().split('T')[0];
  
  // Remover de saídas futuras
  const saidasAnteriores = saidas.length;
  saidas = saidas.filter(s => {
    const chaveAtual = `${s.loja}_${s.categoria}_${s.valor}_${s.tipoRecorrencia}`;
    const remover = s.data >= hoje && s.recorrente === 'Sim' && chaveAtual === chaveRecorrencia;
    if (remover) removidas++;
    return !remover;
  });
  
  // Remover de pendentes futuras
  const pendenteAnteriores = saidasPendentes.length;
  saidasPendentes = saidasPendentes.filter(s => {
    const chaveAtual = `${s.loja}_${s.categoria}_${s.valor}_${s.tipoRecorrencia}`;
    const remover = s.data >= hoje && s.recorrente === 'Sim' && chaveAtual === chaveRecorrencia;
    if (remover) removidas++;
    return !remover;
  });
  
  if (removidas > 0) {
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente(`✅ ${removidas} saída(s) recorrente(s) removida(s) de todos os meses futuros!`);
  } else {
    mostrarNotificacaoInteligente('Nenhuma saída futura foi encontrada para remover.', 'warning');
  }
}

// ===== MÚLTIPLAS SAÍDAS COM RECORRÊNCIA =====
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
          <select class="form-select form-select-sm" id="tipoRecorrencia-${contadorMultiplas}" onchange="toggleRecorrenciaMultiplaPersonalizada(${contadorMultiplas})">
            <option>Diária</option>
            <option>Semanal</option>
            <option>Mensal</option>
            <option>Anual</option>
            <option>Personalizada</option>
          </select>
        </div>
        <div class="col-md-6" id="recorrenciaPersonalizadaContainer-${contadorMultiplas}" style="display:none;">
          <div class="row g-1">
            <div class="col-4">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">A cada X dias</label>
              <input type="number" class="form-control form-control-sm" id="diasPersonalizado-${contadorMultiplas}" placeholder="30" min="1">
            </div>
            <div class="col-4">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Meses</label>
              <select class="form-select form-select-sm" id="mesesRecorrencia-${contadorMultiplas}" multiple style="height: 60px;">
                <option value="1">Jan</option><option value="2">Fev</option><option value="3">Mar</option>
                <option value="4">Abr</option><option value="5">Mai</option><option value="6">Jun</option>
                <option value="7">Jul</option><option value="8">Ago</option><option value="9">Set</option>
                <option value="10">Out</option><option value="11">Nov</option><option value="12">Dez</option>
              </select>
            </div>
            <div class="col-4">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Ano</label>
              <input type="number" class="form-control form-control-sm" id="anoRecorrencia-${contadorMultiplas}" value="2025" min="2024">
            </div>
          </div>
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

function toggleRecorrenciaMultiplaPersonalizada(id) {
  const tipoRecorrencia = document.getElementById(`tipoRecorrencia-${id}`);
  const container = document.getElementById(`recorrenciaPersonalizadaContainer-${id}`);
  
  if (tipoRecorrencia && container) {
    if (tipoRecorrencia.value === "Personalizada") {
      container.style.display = "block";
      // Selecionar todos os meses por padrão
      const selectMeses = document.getElementById(`mesesRecorrencia-${id}`);
      for (let i = 0; i < selectMeses.options.length; i++) {
        selectMeses.options[i].selected = true;
      }
    } else {
      container.style.display = "none";
    }
  }
}

// ===== FILTROS PRÉ-SELECIONADOS PARA RECORRENTES =====
function preencherFiltrosRecorrentesIniciais() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  
  // Preencher anos disponíveis
  const filtroAno = document.getElementById("filtroAnoRecorrentes");
  if (filtroAno) {
    filtroAno.innerHTML = '<option value="">Todos os anos</option>';
    for (let ano = anoAtual - 1; ano <= anoAtual + 2; ano++) {
      const option = document.createElement("option");
      option.value = ano;
      option.textContent = ano;
      option.selected = ano === anoAtual; // Pré-selecionar ano atual
      filtroAno.appendChild(option);
    }
  }
  
  // Preencher e pré-selecionar mês atual
  setTimeout(() => {
    preencherMesesDoAno();
    const filtroMes = document.getElementById("filtroMesRecorrentes");
    if (filtroMes) {
      filtroMes.value = `${anoAtual}-${mesAtual}`;
    }
  }, 100);
}

// ===== ATUALIZAÇÃO DAS TABELAS COM SELEÇÃO =====
function preencherTabelaDoMes(tbody, saidas) {
  const itensPorPagina = paginacao.saidasMes.itensPorPagina;
  const paginaAtual = paginacao.saidasMes.paginaAtual;
  const totalItens = saidas.length;
  
  paginacao.saidasMes.totalItens = totalItens;
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const saidasPagina = saidas.slice(inicio, inicio + itensPorPagina);
  
  saidasPagina.forEach(s => {
    const tr = document.createElement("tr");
    const isSelected = selecionados.saidasMes.has(s.id);
    if (isSelected) tr.classList.add('linha-selecionada');
    
    tr.innerHTML = `
      <td><input type="checkbox" class="checkbox-selecao" data-secao="saidasMes" data-saida-id="${s.id}" 
          ${isSelected ? 'checked' : ''} onchange="toggleSelecaoLinha(this, 'saidasMes', ${s.id})"></td>
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

function preencherTabelaSimples(container, saidas, mensagemVazia) {
  if (!container) return;
  
  if (saidas.length === 0) {
    container.innerHTML = `<p class="text-muted text-center">✅ ${mensagemVazia}</p>`;
    return;
  }
  
  const isRecorrentes = container.id === 'previsaoRecorrentes';
  const secao = isRecorrentes ? 'recorrentes' : 'outras';
  
  // Ordenar por data (mais próximas primeiro) para próximas saídas
  if (container.id === 'proximas' || container.parentElement.classList.contains('status-proximas')) {
    saidas.sort((a, b) => new Date(a.data) - new Date(b.data));
  }
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            ${isRecorrentes ? `<th><input type="checkbox" id="selecionarTodasRecorrentes" onchange="selecionarTodasLinhas('recorrentes')"></th>` : ''}
            <th>Loja</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${saidas.map(s => {
            const diasInfo = calcularDiasInfo(s);
            const isSelected = isRecorrentes && selecionados.recorrentes.has(s.id);
            const linhaClass = isSelected ? 'linha-selecionada' : '';
            return `
            <tr class="${linhaClass}">
              ${isRecorrentes ? `<td><input type="checkbox" class="checkbox-selecao" data-secao="recorrentes" data-saida-id="${s.id}" 
                  ${isSelected ? 'checked' : ''} onchange="toggleSelecaoLinha(this, 'recorrentes', ${s.id})"></td>` : ''}
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
                ${s.recorrente === 'Sim' ? 
                  `<button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirRecorrenciaCompleta(${s.id})" title="Excluir Recorrência Completa">
                    <i class="fas fa-ban"></i>
                  </button>` : 
                  `<button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaida('', ${s.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                  </button>`
                }
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = tabela;
}

// ===== NOTIFICAÇÕES =====
function mostrarNotificacaoInteligente(texto = '✅ Operação realizada!', tipo = 'success') {
  const notificacao = document.getElementById("notificacaoInteligente");
  const textoElement = document.getElementById("textoNotificacao");
  if (!notificacao || !textoElement) return;
  
  notificacao.className = 'notificacao-inteligente';
  if (tipo === 'error') {
    notificacao.classList.add('error');
    textoElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${texto}`;
  } else if (tipo === 'warning') {
    notificacao.classList.add('warning');
    textoElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${texto}`;
  } else {
    textoElement.innerHTML = `<i class="fas fa-check-circle"></i> ${texto}`;
  }
  
  notificacao.classList.add('show');
  setTimeout(() => notificacao.classList.remove('show'), 4000);
}

// ===== FUNÇÕES BÁSICAS EXISTENTES (sem alteração) =====
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

// ===== CHAT IA BÁSICO =====
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

// ===== MÚLTIPLAS SAÍDAS =====
function iniciarMultiplasSaidas() {
  contadorMultiplas = 0;
  const container = document.getElementById("multiplasSaidasContainer");
  if (container) {
    container.style.display = "block";
    adicionarNovaLinha();
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
    
    let configRecorrencia = null;
    let tipoFinal = tipoRecorrencia;
    
    if (recorrente === 'Sim' && tipoRecorrencia === 'Personalizada') {
      const diasPersonalizado = document.getElementById(`diasPersonalizado-${id}`)?.value;
      const mesesSelecionados = Array.from(document.getElementById(`mesesRecorrencia-${id}`).selectedOptions).map(opt => parseInt(opt.value));
      const anoRecorrencia = document.getElementById(`anoRecorrencia-${id}`)?.value;
      
      configRecorrencia = {
        tipo: 'Personalizada',
        diasIntervalo: diasPersonalizado ? parseInt(diasPersonalizado) : 30,
        mesesAtivos: mesesSelecionados.length > 0 ? mesesSelecionados : [1,2,3,4,5,6,7,8,9,10,11,12],
        anoRecorrencia: anoRecorrencia ? parseInt(anoRecorrencia) : new Date().getFullYear()
      };
    } else if (recorrente === 'Sim') {
      configRecorrencia = { tipo: tipoRecorrencia };
    }
    
    const saida = {
      id: Date.now() + Math.random() * 1000,
      loja, categoria,
      descricao: descricao || categoria,
      valor, data,
      recorrente,
      tipoRecorrencia: recorrente === 'Sim' ? tipoFinal : null,
      configRecorrencia: configRecorrencia,
      pago: pago || "Sim",
      origem: 'multiplas',
      timestamp: new Date()
    };
    
    try {
      if (recorrente === 'Sim' && tipoRecorrencia) {
        gerarSaidasRecorrentes(saida);
      } else {
        if (saida.pago === 'Sim') {
          saidas.unshift(saida);
        } else {
          saidasPendentes.unshift(saida);
        }
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

// ===== EDITAR CATEGORIAS E LOJAS =====
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
      <input type="text" value="${cat}" id="editCat${index}" style="flex: 1; margin-right: 10px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
      <button onclick="salvarEdicaoCategoria(${index})" class="btn btn-success-modern btn-sm me-1">
        <i class="fas fa-save"></i>
      </button>
      <button onclick="removerCategoria(${index})" class="btn btn-danger-modern btn-sm">
        <i class="fas fa-trash"></i>
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
      <input type="text" value="${loja}" id="editLoja${index}" style="flex: 1; margin-right: 10px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
      <button onclick="salvarEdicaoLoja(${index})" class="btn btn-success-modern btn-sm me-1">
        <i class="fas fa-save"></i>
      </button>
      <button onclick="removerLoja(${index})" class="btn btn-danger-modern btn-sm">
        <i class="fas fa-trash"></i>
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

function salvarEdicaoCategoria(index) {
  const novoNome = document.getElementById(`editCat${index}`)?.value.trim();
  if (!novoNome) {
    mostrarNotificacaoInteligente('Nome não pode estar vazio!', 'warning');
    return;
  }
  
  if (categorias.includes(novoNome) && categorias[index] !== novoNome) {
    mostrarNotificacaoInteligente('Esta categoria já existe!', 'warning');
    return;
  }
  
  const nomeAntigo = categorias[index];
  categorias[index] = novoNome;
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarNotificacaoInteligente(`✅ Categoria "${nomeAntigo}" alterada para "${novoNome}"!`);
  mostrarEditorCategoriaExistente();
}

function salvarEdicaoLoja(index) {
  const novoNome = document.getElementById(`editLoja${index}`)?.value.trim();
  if (!novoNome) {
    mostrarNotificacaoInteligente('Nome não pode estar vazio!', 'warning');
    return;
  }
  
  if (lojas.includes(novoNome) && lojas[index] !== novoNome) {
    mostrarNotificacaoInteligente('Esta loja já existe!', 'warning');
    return;
  }
  
  const nomeAntigo = lojas[index];
  lojas[index] = novoNome;
  salvarDadosLocal();
  atualizarInterfaceCompleta();
  mostrarNotificacaoInteligente(`✅ Loja "${nomeAntigo}" alterada para "${novoNome}"!`);
  mostrarEditorLojaExistente();
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

// ===== PAGINAÇÃO =====
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

function preencherTabelaProximas(container, saidas) {
  if (!container) return;
  
  paginacao.proximasSaidas.totalItens = saidas.length;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">✅ Nenhuma saída próxima</p>';
    esconderControlesProximas();
    return;
  }
  
  // Ordenar por data (mais próximas primeiro)
  saidas.sort((a, b) => new Date(a.data) - new Date(b.data));
  
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
            <th>Descrição</th>
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
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')} <span class="badge bg-warning">${diasRestantes}d</span></td>
              <td>
                <button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('', ${s.id})" title="Marcar como Pago">
                  <i class="fas fa-check"></i>
                </button>
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

// ===== INTERFACE E ATUALIZAÇÃO =====
function atualizarInterfaceCompleta() {
  atualizarCategorias();
  atualizarLojas();
  atualizarFiltros();
  atualizarTabela();
  atualizarDashboard();
  atualizarGraficos();
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
  
  const mesAtualSelecionado = filtroMes.value;
  filtroMes.innerHTML = '<option value="">Todos os meses</option>';
  meses.forEach(mes => {
    const option = document.createElement("option");
    option.value = mes.valor;
    option.textContent = mes.nome;
    if (mes.valor === mesAtualSelecionado) option.selected = true;
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
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes && s.pago === 'Sim';
  });
  
  let saidasAtrasadas = [...saidas, ...saidasPendentes].filter(s => s.pago === 'Não' && s.data < dataHoje);
  let saidasVencendoHoje = [...saidas, ...saidasPendentes].filter(s => s.pago === 'Não' && s.data === dataHoje);
  
  let saidasProximas = [...saidas, ...saidasPendentes].filter(s => {
    if (s.pago === 'Sim') return false;
    const diasRestantes = Math.floor((new Date(s.data + 'T00:00:00') - hoje) / (1000 * 60 * 60 * 24));
    return diasRestantes > 0;
  });
  
  let saidasRecorrentes = [...saidas, ...saidasPendentes].filter(s => s.recorrente === 'Sim');
  
  if (lojaFiltroAtual) {
    saidasMes = saidasMes.filter(s => s.loja === lojaFiltroAtual);
    saidasAtrasadas = saidasAtrasadas.filter(s => s.loja === lojaFiltroAtual);
    saidasVencendoHoje = saidasVencendoHoje.filter(s => s.loja === lojaFiltroAtual);
    saidasProximas = saidasProximas.filter(s => s.loja === lojaFiltroAtual);
    saidasRecorrentes = saidasRecorrentes.filter(s => s.loja === lojaFiltroAtual);
  }
  
  saidasRecorrentes = aplicarFiltrosRecorrentes(saidasRecorrentes);
  
  preencherTabelaDoMes(tbody, saidasMes);
  preencherTabelaSimples(divAtrasadas, saidasAtrasadas, 'Nenhuma saída atrasada');
  preencherTabelaSimples(divVencendoHoje, saidasVencendoHoje, 'Nenhuma saída vencendo hoje');
  preencherTabelaProximas(divProximas, saidasProximas);
  preencherTabelaSimples(divPrevisaoRecorrentes, saidasRecorrentes, 'Nenhuma saída recorrente');
  
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
  atualizarGraficos();
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
  
  // Reaplicar filtros padrão
  setTimeout(preencherFiltrosRecorrentesIniciais, 100);
  
  filtrarRecorrentesPorFiltros();
  mostrarNotificacaoInteligente('✅ Filtros limpos e padrões reaplicados!');
}

// ===== GRÁFICOS AUTOMÁTICOS =====
function atualizarGraficos() {
  // Esta função atualizará os gráficos automaticamente baseado nos dados atuais
  // Implementação básica - pode ser expandida conforme necessário
  console.log('📊 Gráficos atualizados automaticamente');
}

// ===== ANÁLISE INTELIGENTE =====
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

// ===== TREINAMENTO IA =====
function mostrarTreinamentoIA() {
  mostrarNotificacaoInteligente('Treinamento IA em desenvolvimento', 'warning');
}

function fecharTreinamentoIA() {
  const modal = document.getElementById('modalTreinamentoIA');
  if (modal) modal.style.display = 'none';
}

// ===== UTILITÁRIOS =====
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
  
  const recorrenciaAvancada = document.getElementById('recorrenciaAvancada');
  if (recorrenciaAvancada) recorrenciaAvancada.classList.remove('show');
}

function salvarDadosLocal() {
  try {
    const dadosBackup = {
      categorias, lojas, saidas, saidasPendentes, treinamentosIA, treinamentosNaturais,
      versao: '3.0.0', ultimoBackup: new Date().toISOString(),
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

// ===== INICIALIZAÇÃO =====
window.addEventListener('load', () => {
  const dataElement = document.getElementById('data');
  if (dataElement && !dataElement.value) {
    dataElement.value = new Date().toISOString().split('T')[0];
  }
  
  const chatInput = document.getElementById('chatInputTopo');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        enviarMensagemChatTopo();
      }
    });
  }
  
  carregarDadosLocal();
  atualizarInterfaceCompleta();
  preencherFiltrosRecorrentesIniciais();
  
  const totalSaidas = saidas.length + saidasPendentes.length;
  if (totalSaidas > 0) {
    mostrarNotificacaoInteligente(`✅ Sistema carregado! ${totalSaidas} saídas encontradas.`);
  } else {
    mostrarNotificacaoInteligente('✅ Sistema carregado com sucesso!');
  }
});

// ===== EXPOSIÇÃO GLOBAL DAS FUNÇÕES =====
window.toggleChatTopo = toggleChatTopo;
window.enviarMensagemChatTopo = enviarMensagemChatTopo;
window.limparChatTopo = limparChatTopo;
window.adicionarSaida = adicionarSaida;
window.excluirSaida = excluirSaida;
window.excluirRecorrenciaCompleta = excluirRecorrenciaCompleta;
window.editarSaida = editarSaida;
window.salvarEdicaoSaida = salvarEdicaoSaida;
window.marcarComoPago = marcarComoPago;
window.mostrarEditorCategoria = mostrarEditorCategoria;
window.mostrarEditorLoja = mostrarEditorLoja;
window.adicionarCategoria = adicionarCategoria;
window.adicionarLoja = adicionarLoja;
window.mostrarEditorCategoriaExistente = mostrarEditorCategoriaExistente;
window.mostrarEditorLojaExistente = mostrarEditorLojaExistente;
window.salvarEdicaoCategoria = salvarEdicaoCategoria;
window.salvarEdicaoLoja = salvarEdicaoLoja;
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
window.toggleRecorrenciaMultiplaPersonalizada = toggleRecorrenciaMultiplaPersonalizada;
window.aplicarFiltroLoja = aplicarFiltroLoja;
window.filtrarRecorrentesPorFiltros = filtrarRecorrentesPorFiltros;
window.limparFiltrosRecorrentes = limparFiltrosRecorrentes;
window.preencherMesesDoAno = preencherMesesDoAno;
window.paginacaoAnteriorProximas = paginacaoAnteriorProximas;
window.paginacaoProximaProximas = paginacaoProximaProximas;
window.paginacaoAnterior = paginacaoAnterior;
window.paginacaoProxima = paginacaoProxima;
window.selecionarTodasLinhas = selecionarTodasLinhas;
window.toggleSelecaoLinha = toggleSelecaoLinha;
window.limparSelecaoSaidasMes = limparSelecaoSaidasMes;
window.limparSelecaoRecorrentes = limparSelecaoRecorrentes;
window.pagarSaidasSelecionadas = pagarSaidasSelecionadas;
window.excluirSaidasSelecionadas = excluirSaidasSelecionadas;
window.editarSaidasSelecionadas = editarSaidasSelecionadas;
window.abrirModalEdicaoMultipla = abrirModalEdicaoMultipla;
window.salvarEdicaoMultipla = salvarEdicaoMultipla;
window.fecharEdicaoMultipla = fecharEdicaoMultipla;
window.abrirAnaliseInteligente = abrirAnaliseInteligente;
window.fecharAnaliseInteligente = fecharAnaliseInteligente;
window.mostrarTreinamentoIA = mostrarTreinamentoIA;
window.fecharTreinamentoIA = fecharTreinamentoIA;
window.formatarMoeda = formatarMoeda;

console.log('✅ Sistema iClub carregado - Versão 3.0 com todas as funcionalidades!');