// painel.js - SISTEMA ICLUB COMPLETO V4.0 ATUALIZADO
let categorias = ["Aluguel", "Energia", "Internet", "Combustível", "Material", "Transporte", "Alimentação", "Marketing", "Saúde"];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";
let contadorMultiplas = 0;
let chatAberto = false;
let usuarioAtual = null;
let selecionados = {
  saidasMes: new Set(),
  recorrentes: new Set(),
  proximas: new Set()
};
let paginacao = {
  saidasMes: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 },
  proximasSaidas: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 },
  recorrentes: { paginaAtual: 1, itensPorPagina: 10, totalItens: 0 }
};
let graficos = {
  categoria: null,
  tipo: null,
  mes: null,
  lojas: null,
  centrosCusto: null
};

// ===== SISTEMA DE LOGIN =====
function fazerLogin(event) {
  event.preventDefault();
  
  const usuario = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;
  const errorDiv = document.getElementById('loginError');
  
  // Credenciais demo (em produção usar autenticação real)
  const usuarios = {
    'admin': 'admin123',
    'user1': 'user123',
    'user2': 'user456'
  };
  
  if (usuarios[usuario] && usuarios[usuario] === senha) {
    usuarioAtual = usuario;
    localStorage.setItem('usuarioLogado', usuario);
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').classList.add('show');
    atualizarUsuarioLogado();
    mostrarNotificacaoInteligente(`✅ Bem-vindo, ${usuario}!`);
    carregarDadosLocal();
    atualizarInterfaceCompleta();
  } else {
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 3000);
  }
}

function fazerLogout() {
  localStorage.removeItem('usuarioLogado');
  usuarioAtual = null;
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('mainContainer').classList.remove('show');
  mostrarNotificacaoInteligente('👋 Logout realizado com sucesso!');
  toggleConfigMenu(); // Fechar menu se estiver aberto
}

function verificarSessao() {
  const usuarioSalvo = localStorage.getItem('usuarioLogado');
  if (usuarioSalvo) {
    usuarioAtual = usuarioSalvo;
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').classList.add('show');
    atualizarUsuarioLogado();
  }
}

function atualizarUsuarioLogado() {
  const elemento = document.getElementById('usuarioAtual');
  const elementoMenu = document.getElementById('nomeUsuarioMenu');
  if (elemento && usuarioAtual) {
    elemento.textContent = usuarioAtual;
  }
  if (elementoMenu && usuarioAtual) {
    elementoMenu.textContent = usuarioAtual;
  }
}

// ===== MENU CONFIGURAÇÕES =====
function toggleConfigMenu() {
  const menu = document.getElementById('configMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

function abrirGerenciarConta() {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  document.getElementById('modalTitulo').textContent = '👤 Gerenciar Conta';
  document.getElementById('modalTexto').innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label fw-bold">Usuário atual:</label>
        <input type="text" value="${usuarioAtual}" class="form-control" disabled>
      </div>
      <div class="col-12">
        <label class="form-label fw-bold">Nova senha:</label>
        <input type="password" id="novaSenha" class="form-control" placeholder="Digite a nova senha">
      </div>
      <div class="col-12">
        <label class="form-label fw-bold">Confirmar senha:</label>
        <input type="password" id="confirmarSenha" class="form-control" placeholder="Confirme a nova senha">
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-success-modern btn-modern" onclick="alterarSenha()">
      <i class="fas fa-save"></i> Alterar Senha
    </button>
    <button class="btn btn-danger-modern btn-modern" onclick="fazerLogout()">
      <i class="fas fa-sign-out-alt"></i> Sair da Conta
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      Cancelar
    </button>
  `;
  
  modal.style.display = 'flex';
  toggleConfigMenu();
}

function alterarSenha() {
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  
  if (!novaSenha || novaSenha.length < 6) {
    mostrarNotificacaoInteligente('Senha deve ter pelo menos 6 caracteres!', 'warning');
    return;
  }
  
  if (novaSenha !== confirmarSenha) {
    mostrarNotificacaoInteligente('Senhas não coincidem!', 'error');
    return;
  }
  
  // Em produção, enviar para backend
  mostrarNotificacaoInteligente('✅ Senha alterada com sucesso!');
  fecharModal();
}

function abrirPermissoes() {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  document.getElementById('modalTitulo').textContent = '🛡️ Permissões de Acesso';
  document.getElementById('modalTexto').innerHTML = `
    <div class="alert alert-info">
      <h6>Permissões do usuário: <strong>${usuarioAtual}</strong></h6>
    </div>
    <div class="row g-3">
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="permissaoAdicionar" checked>
          <label class="form-check-label" for="permissaoAdicionar">
            <strong>Adicionar Saídas</strong> - Pode criar novas saídas
          </label>
        </div>
      </div>
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="permissaoEditar" checked>
          <label class="form-check-label" for="permissaoEditar">
            <strong>Editar Saídas</strong> - Pode modificar saídas existentes
          </label>
        </div>
      </div>
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="permissaoExcluir" ${usuarioAtual === 'admin' ? 'checked' : ''}>
          <label class="form-check-label" for="permissaoExcluir">
            <strong>Excluir Saídas</strong> - Pode remover saídas
          </label>
        </div>
      </div>
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="permissaoConfig" ${usuarioAtual === 'admin' ? 'checked' : ''}>
          <label class="form-check-label" for="permissaoConfig">
            <strong>Configurações</strong> - Pode alterar categorias e lojas
          </label>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-success-modern btn-modern" onclick="salvarPermissoes()">
      <i class="fas fa-save"></i> Salvar Permissões
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      Cancelar
    </button>
  `;
  
  modal.style.display = 'flex';
  toggleConfigMenu();
}

function salvarPermissoes() {
  mostrarNotificacaoInteligente('✅ Permissões salvas com sucesso!');
  fecharModal();
}

function abrirColunas() {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  document.getElementById('modalTitulo').textContent = '📋 Exibir/Ocultar Colunas';
  document.getElementById('modalTexto').innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <h6>Colunas da tabela de saídas:</h6>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colUsuario" checked>
          <label class="form-check-label" for="colUsuario">Usuário</label>
        </div>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colLoja" checked>
          <label class="form-check-label" for="colLoja">Loja</label>
        </div>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colCategoria" checked>
          <label class="form-check-label" for="colCategoria">Centro de Custo</label>
        </div>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colDescricao" checked>
          <label class="form-check-label" for="colDescricao">Descrição</label>
        </div>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colValor" checked>
          <label class="form-check-label" for="colValor">Valor</label>
        </div>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colData" checked>
          <label class="form-check-label" for="colData">Data</label>
        </div>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colRecorrente" checked>
          <label class="form-check-label" for="colRecorrente">Recorrente</label>
        </div>
      </div>
      <div class="col-6">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="colAcoes" checked>
          <label class="form-check-label" for="colAcoes">Ações</label>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-success-modern btn-modern" onclick="salvarColunas()">
      <i class="fas fa-save"></i> Aplicar Configurações
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      Cancelar
    </button>
  `;
  
  modal.style.display = 'flex';
  toggleConfigMenu();
}

function salvarColunas() {
  mostrarNotificacaoInteligente('✅ Configurações de colunas salvas!');
  atualizarTabela();
  fecharModal();
}

function abrirAlertas() {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  document.getElementById('modalTitulo').textContent = '🔔 Alertas e Notificações';
  document.getElementById('modalTexto').innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="alertaSaidas" checked>
          <label class="form-check-label" for="alertaSaidas">
            <strong>Alertas de Saídas Vencendo</strong><br>
            <small class="text-muted">Notificar quando saídas estão próximas do vencimento</small>
          </label>
        </div>
      </div>
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="alertaRecorrentes" checked>
          <label class="form-check-label" for="alertaRecorrentes">
            <strong>Alertas de Recorrências</strong><br>
            <small class="text-muted">Notificar sobre saídas recorrentes pendentes</small>
          </label>
        </div>
      </div>
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="alertaChat" checked>
          <label class="form-check-label" for="alertaChat">
            <strong>Notificações do Chat IA</strong><br>
            <small class="text-muted">Receber confirmações das ações do chat</small>
          </label>
        </div>
      </div>
      <div class="col-12">
        <label class="form-label fw-bold">Dias de antecedência para alertas:</label>
        <select class="form-select" id="diasAntecedencia">
          <option value="1">1 dia</option>
          <option value="3" selected>3 dias</option>
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
        </select>
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-success-modern btn-modern" onclick="salvarAlertas()">
      <i class="fas fa-save"></i> Salvar Configurações
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      Cancelar
    </button>
  `;
  
  modal.style.display = 'flex';
  toggleConfigMenu();
}

function salvarAlertas() {
  mostrarNotificacaoInteligente('✅ Configurações de alertas salvas!');
  fecharModal();
}

function abrirBackup() {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  document.getElementById('modalTitulo').textContent = '💾 Backup e Exportação';
  document.getElementById('modalTexto').innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <h6>Exportar Dados:</h6>
        <div class="d-grid gap-2">
          <button class="btn btn-outline-success" onclick="exportarCSV()">
            <i class="fas fa-file-csv"></i> Exportar como CSV
          </button>
          <button class="btn btn-outline-primary" onclick="exportarExcel()">
            <i class="fas fa-file-excel"></i> Exportar como Excel
          </button>
          <button class="btn btn-outline-info" onclick="exportarJSON()">
            <i class="fas fa-file-code"></i> Exportar como JSON
          </button>
        </div>
      </div>
      <div class="col-12">
        <hr>
        <h6>Backup Automático:</h6>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="backupAuto" checked>
          <label class="form-check-label" for="backupAuto">
            Backup automático no navegador
          </label>
        </div>
        <small class="text-muted">Último backup: ${new Date().toLocaleString('pt-BR')}</small>
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-success-modern btn-modern" onclick="criarBackup()">
      <i class="fas fa-save"></i> Criar Backup Agora
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      Fechar
    </button>
  `;
  
  modal.style.display = 'flex';
  toggleConfigMenu();
}

function exportarCSV() {
  const dados = [...saidas, ...saidasPendentes];
  let csv = 'Usuario,Loja,Categoria,Descricao,Valor,Data,Recorrente,Tipo,Pago\n';
  
  dados.forEach(s => {
    csv += `${s.usuario || usuarioAtual},${s.loja},${s.categoria},"${s.descricao}",${s.valor},${s.data},${s.recorrente},${s.tipoRecorrencia || ''},${s.pago}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `iclub-saidas-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  mostrarNotificacaoInteligente('✅ CSV exportado com sucesso!');
}

function exportarJSON() {
  const dados = {
    usuario: usuarioAtual,
    dataExportacao: new Date().toISOString(),
    saidas: saidas,
    saidasPendentes: saidasPendentes,
    categorias: categorias,
    lojas: lojas
  };
  
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `iclub-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  mostrarNotificacaoInteligente('✅ JSON exportado com sucesso!');
}

function exportarExcel() {
  mostrarNotificacaoInteligente('📊 Funcionalidade Excel em desenvolvimento!', 'warning');
}

function criarBackup() {
  salvarDadosLocal();
  mostrarNotificacaoInteligente('✅ Backup criado com sucesso!');
  fecharModal();
}

function abrirIntegracoes() {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  document.getElementById('modalTitulo').textContent = '🔗 Integrações';
  document.getElementById('modalTexto').innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <div class="card" style="border: 2px solid #25d366;">
          <div class="card-body">
            <h6><i class="fab fa-whatsapp" style="color: #25d366;"></i> WhatsApp Business</h6>
            <p class="small text-muted">Receba notificações e adicione saídas via WhatsApp</p>
            <button class="btn btn-success btn-sm">
              <i class="fas fa-plug"></i> Conectar
            </button>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="card" style="border: 2px solid #0066cc;">
          <div class="card-body">
            <h6><i class="fas fa-chart-line" style="color: #0066cc;"></i> Sistema ERP</h6>
            <p class="small text-muted">Sincronizar com sistema de gestão empresarial</p>
            <button class="btn btn-primary btn-sm">
              <i class="fas fa-plug"></i> Configurar
            </button>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="card" style="border: 2px solid #1da1f2;">
          <div class="card-body">
            <h6><i class="fas fa-envelope" style="color: #1da1f2;"></i> E-mail</h6>
            <p class="small text-muted">Relatórios automáticos por e-mail</p>
            <button class="btn btn-info btn-sm">
              <i class="fas fa-plug"></i> Configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      Fechar
    </button>
  `;
  
  modal.style.display = 'flex';
  toggleConfigMenu();
}

// ===== CHAT NO TOPO =====
function toggleChatTopo() {
  const chatContainer = document.getElementById('chatContainerTopo');
  if (!chatContainer) return;
  
  chatAberto = !chatAberto;
  chatContainer.style.display = chatAberto ? 'flex' : 'none';
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
        usuario: `IA - ${usuarioAtual}`,
        loja: resultado.loja || "Loja Centro",
        categoria: resultado.categoria,
        descricao: resultado.descricao || resultado.categoria,
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
    'Transporte': /uber|taxi|transporte/i,
    'Alimentação': /comida|restaurante|lanche|refeição/i,
    'Marketing': /marketing|propaganda|anúncio/i,
    'Material': /material|equipamento|ferramenta/i,
    'Saúde': /médico|hospital|farmácia|saúde/i
  };
  
  for (const [cat, regex] of Object.entries(categoriasIA)) {
    if (regex.test(msgLower)) {
      categoria = cat;
      break;
    }
  }
  
  let loja = "Loja Centro";
  const lojasIA = {
    'Loja Centro': /centro|downtown/i,
    'Loja Shopping': /shopping|mall/i,
    'Loja Bairro': /bairro|neighborhood/i
  };
  
  for (const [lojaName, regex] of Object.entries(lojasIA)) {
    if (regex.test(msgLower)) {
      loja = lojaName;
      break;
    }
  }
  
  let data = new Date().toISOString().split('T')[0];
  if (/ontem/i.test(msgLower)) {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    data = ontem.toISOString().split('T')[0];
  }
  
  const pago = /devo|deve|pendente|não pago/i.test(msgLower) ? "Não" : "Sim";
  
  return { 
    sucesso: true, 
    categoria, 
    valor, 
    data, 
    pago, 
    loja,
    descricao: categoria 
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

// ===== MODAL TREINAMENTO IA =====
function mostrarTreinamentoIA() {
  const modal = document.getElementById('modalTreinamentoIA');
  if (modal) {
    modal.style.display = 'flex';
    preencherOpcoesFormulario();
  }
}

function fecharTreinamentoIA() {
  const modal = document.getElementById('modalTreinamentoIA');
  if (modal) {
    modal.style.display = 'none';
  }
}

function preencherOpcoesFormulario() {
  const selectCategoria = document.getElementById('treinamentoCategoria');
  const selectLoja = document.getElementById('treinamentoLoja');
  
  if (selectCategoria) {
    selectCategoria.innerHTML = '<option value="">Selecione categoria...</option>';
    categorias.forEach(cat => {
      selectCategoria.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }
  
  if (selectLoja) {
    selectLoja.innerHTML = '<option value="">Selecione loja...</option>';
    lojas.forEach(loja => {
      selectLoja.innerHTML += `<option value="${loja}">${loja}</option>`;
    });
  }
}

function salvarTreinamentoNatural() {
  const texto = document.getElementById('treinamentoNatural')?.value.trim();
  if (!texto) {
    mostrarNotificacaoInteligente('Digite um treinamento para a IA!', 'warning');
    return;
  }
  
  // Aqui seria onde salvamos o treinamento - em produção enviaria para backend
  mostrarNotificacaoInteligente('✅ Treinamento salvo! A IA aprendeu os novos padrões.');
  document.getElementById('treinamentoNatural').value = '';
}

function salvarTreinamentoManual() {
  const frase = document.getElementById('treinamentoFrase')?.value.trim();
  const categoria = document.getElementById('treinamentoCategoria')?.value;
  const valor = document.getElementById('treinamentoValor')?.value.trim();
  const loja = document.getElementById('treinamentoLoja')?.value;
  
  if (!frase || !categoria || !valor || !loja) {
    mostrarNotificacaoInteligente('Preencha todos os campos do treinamento!', 'warning');
    return;
  }
  
  // Aqui seria onde salvamos o treinamento manual
  mostrarNotificacaoInteligente('✅ Treinamento manual salvo com sucesso!');
  
  // Limpar campos
  ['treinamentoFrase', 'treinamentoValor'].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) campo.value = '';
  });
  
  ['treinamentoCategoria', 'treinamentoLoja'].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) campo.value = '';
  });
}

// ===== RECORRÊNCIA PERSONALIZADA =====
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

function toggleRecorrenciaPersonalizada() {
  const tipoRecorrencia = document.getElementById("tipoRecorrencia");
  const recorrenciaAvancada = document.getElementById("recorrenciaAvancada");
  
  if (tipoRecorrencia && recorrenciaAvancada) {
    if (tipoRecorrencia.value === "Personalizada") {
      recorrenciaAvancada.classList.add('show');
      
      // Pré-selecionar ano atual e todos os meses
      const anoAtual = new Date().getFullYear();
      const anoInput = document.getElementById('anoRecorrencia');
      if (anoInput) anoInput.value = anoAtual;
      
      // Selecionar todos os meses por padrão
      const selectMeses = document.getElementById('mesesRecorrencia');
      if (selectMeses) {
        for (let i = 0; i < selectMeses.options.length; i++) {
          selectMeses.options[i].selected = true;
        }
      }
    } else {
      recorrenciaAvancada.classList.remove('show');
    }
  }
}

// ===== ADICIONAR SAÍDA =====
function adicionarSaida() {
  const loja = document.getElementById("loja")?.value || "Loja Centro";
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
    usuario: usuarioAtual,
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

// ===== MÚLTIPLAS SAÍDAS =====
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
      const selectMeses = document.getElementById(`mesesRecorrencia-${id}`);
      if (selectMeses) {
        for (let i = 0; i < selectMeses.options.length; i++) {
          selectMeses.options[i].selected = true;
        }
      }
    } else {
      container.style.display = "none";
    }
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
      usuario: usuarioAtual,
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

// ===== FUNÇÕES BÁSICAS =====
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
    saida.pagoEm = new Date().toISOString();
    saida.pagoPor = usuarioAtual;
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
          <option value="">Selecione</option>
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
  saidaEncontrada.editadoPor = usuarioAtual;
  
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

function excluirSaidasRecorrentesFuturas(saidaId) {
  const saidaReferencia = [...saidas, ...saidasPendentes].find(s => s.id === saidaId);
  if (!saidaReferencia || saidaReferencia.recorrente !== 'Sim') {
    mostrarNotificacaoInteligente('Esta saída não é recorrente!', 'error');
    return;
  }
  
  if (!confirm('Excluir todas as saídas futuras desta recorrência?')) return;
  
  const chaveRecorrencia = `${saidaReferencia.loja}_${saidaReferencia.categoria}_${saidaReferencia.valor}_${saidaReferencia.tipoRecorrencia}`;
  
  let removidas = 0;
  const hoje = new Date().toISOString().split('T')[0];
  
  // Remove saídas futuras não pagas
  saidas = saidas.filter(s => {
    const chaveAtual = `${s.loja}_${s.categoria}_${s.valor}_${s.tipoRecorrencia}`;
    const remover = s.data >= hoje && s.recorrente === 'Sim' && chaveAtual === chaveRecorrencia && s.pago === 'Não';
    if (remover) removidas++;
    return !remover;
  });
  
  saidasPendentes = saidasPendentes.filter(s => {
    const chaveAtual = `${s.loja}_${s.categoria}_${s.valor}_${s.tipoRecorrencia}`;
    const remover = s.data >= hoje && s.recorrente === 'Sim' && chaveAtual === chaveRecorrencia;
    if (remover) removidas++;
    return !remover;
  });
  
  if (removidas > 0) {
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente(`✅ ${removidas} saída(s) recorrente(s) futura(s) removida(s)!`);
  } else {
    mostrarNotificacaoInteligente('Nenhuma saída futura não paga foi encontrada para remover.', 'warning');
  }
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
  toggleConfigMenu(); // Fechar menu se estiver aberto
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

function paginacaoAnteriorRecorrentes() {
  if (paginacao.recorrentes.paginaAtual > 1) {
    paginacao.recorrentes.paginaAtual--;
    atualizarTabela();
  }
}

function paginacaoProximaRecorrentes() {
  const totalPaginas = Math.ceil(paginacao.recorrentes.totalItens / paginacao.recorrentes.itensPorPagina);
  if (paginacao.recorrentes.paginaAtual < totalPaginas) {
    paginacao.recorrentes.paginaAtual++;
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

// ===== SELEÇÃO MÚLTIPLA =====
function selecionarTodasLinhas(secao) {
  const checkbox = document.getElementById(`selecionarTodas${secao === 'saidasMes' ? 'SaidasMes' : secao === 'recorrentes' ? 'Recorrentes' : 'Proximas'}`);
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
  const nomes = {
    saidasMes: 'SaidasMes',
    recorrentes: 'Recorrentes',
    proximas: 'Proximas'
  };
  
  const contador = document.getElementById(`contador${nomes[secao]}`);
  if (contador) {
    const qtd = selecionados[secao].size;
    contador.textContent = `${qtd} saída${qtd !== 1 ? 's' : ''} selecionada${qtd !== 1 ? 's' : ''}`;
  }
}

function mostrarOcultarBotoesAcao(secao) {
  const nomes = {
    saidasMes: 'SaidasMes',
    recorrentes: 'Recorrentes',
    proximas: 'Proximas'
  };
  
  const botoes = document.getElementById(`botoesAcao${nomes[secao]}`);
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
  const checkbox = document.getElementById('selecionarTodasSaidasMes');
  if (checkbox) checkbox.checked = false;
  atualizarContadorSelecao('saidasMes');
  mostrarOcultarBotoesAcao('saidasMes');
}

function limparSelecaoRecorrentes() {
  selecionados.recorrentes.clear();
  document.querySelectorAll('input[data-secao="recorrentes"]').forEach(cb => {
    cb.checked = false;
    cb.closest('tr').classList.remove('linha-selecionada');
  });
  const checkbox = document.getElementById('selecionarTodasRecorrentes');
  if (checkbox) checkbox.checked = false;
  atualizarContadorSelecao('recorrentes');
  mostrarOcultarBotoesAcao('recorrentes');
}

function limparSelecaoProximas() {
  selecionados.proximas.clear();
  document.querySelectorAll('input[data-secao="proximas"]').forEach(cb => {
    cb.checked = false;
    cb.closest('tr').classList.remove('linha-selecionada');
  });
  const checkbox = document.getElementById('selecionarTodasProximas');
  if (checkbox) checkbox.checked = false;
  atualizarContadorSelecao('proximas');
  mostrarOcultarBotoesAcao('proximas');
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
      saida.pagoEm = new Date().toISOString();
      saida.pagoPor = usuarioAtual;
      saidasPendentes = saidasPendentes.filter(s => s.id !== saidaId);
      saidas.unshift(saida);
      contador++;
    }
  });
  
  if (contador > 0) {
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente(`✅ ${contador} saída(s) marcada(s) como paga(s)!`);
    
    if (secao === 'saidasMes') limparSelecaoSaidasMes();
    else if (secao === 'recorrentes') limparSelecaoRecorrentes();
    else if (secao === 'proximas') limparSelecaoProximas();
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
  
  if (secao === 'saidasMes') limparSelecaoSaidasMes();
  else if (secao === 'recorrentes') limparSelecaoRecorrentes();
  else if (secao === 'proximas') limparSelecaoProximas();
}

function editarSaidasSelecionadas(secao) {
  const saidaIds = Array.from(selecionados[secao]);
  if (saidaIds.length === 0) {
    mostrarNotificacaoInteligente('Nenhuma saída selecionada!', 'warning');
    return;
  }
  
  abrirModalEdicaoMultipla(saidaIds);
}

function abrirModalEdicaoMultipla(saidaIds) {
  const modal = document.getElementById('modalCustom');
  if (!modal) return;
  
  const saidasParaEditar = saidaIds.map(id => [...saidas, ...saidasPendentes].find(s => s.id === id)).filter(Boolean);
  
  document.getElementById('modalTitulo').textContent = '✏️ Editar Múltiplas Saídas';
  document.getElementById('modalTexto').innerHTML = `
    <div class="alert alert-info">
      <strong>📝 Editando ${saidasParaEditar.length} saída(s) simultaneamente</strong><br>
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
        ${saidasParaEditar.map(s => `
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
            <span><strong>${s.loja}</strong> - ${s.categoria}</span>
            <span>${formatarMoedaBR(s.valor)} - ${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  document.getElementById('modalBotoes').innerHTML = `
    <button class="btn btn-success-modern btn-modern" onclick="salvarEdicaoMultipla([${saidaIds.join(',')}])">
      <i class="fas fa-save"></i> Salvar Alterações
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      <i class="fas fa-times"></i> Cancelar
    </button>
  `;
  
  modal.style.display = 'flex';
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
        saida.editadoPor = usuarioAtual;
        alteracoes++;
      }
    }
  });
  
  if (alteracoes > 0) {
    salvarDadosLocal();
    atualizarInterfaceCompleta();
    mostrarNotificacaoInteligente(`✅ ${alteracoes} saída(s) editada(s) com sucesso!`);
    fecharModal();
    limparSelecaoSaidasMes();
    limparSelecaoRecorrentes();
    limparSelecaoProximas();
  } else {
    mostrarNotificacaoInteligente('Nenhuma alteração foi feita!', 'warning');
  }
}

// ===== INTERFACE E ATUALIZAÇÃO =====
function atualizarInterfaceCompleta() {
  atualizarCategorias();
  atualizarLojas();
  atualizarFiltros();
  atualizarTabela();
  atualizarDashboard();
  atualizarGraficos();
  atualizarComparativoLojas();
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
  
  preencherFiltrosRecorrentesIniciais();
}

function preencherFiltrosRecorrentesIniciais() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  
  const filtroAno = document.getElementById("filtroAnoRecorrentes");
  if (filtroAno) {
    filtroAno.innerHTML = '<option value="">Todos os anos</option>';
    for (let ano = anoAtual - 1; ano <= anoAtual + 2; ano++) {
      const option = document.createElement("option");
      option.value = ano;
      option.textContent = ano;
      option.selected = ano === anoAtual;
      filtroAno.appendChild(option);
    }
  }
  
  setTimeout(() => {
    preencherMesesDoAno();
    const filtroMes = document.getElementById("filtroMesRecorrentes");
    if (filtroMes) {
      filtroMes.value = `${anoAtual}-${mesAtual}`;
    }
  }, 100);
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
    return saidaAnoMes === anoMes;
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
  preencherTabelaRecorrentes(divPrevisaoRecorrentes, saidasRecorrentes);
  
  const totalRecorrentes = saidasRecorrentes.reduce((sum, s) => sum + s.valor, 0);
  const elemento = document.getElementById("totalSaidasRecorrentes");
  if (elemento) elemento.textContent = formatarMoedaBR(totalRecorrentes);
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
    const isSelected = selecionados.saidasMes.has(s.id);
    if (isSelected) tr.classList.add('linha-selecionada');
    
    tr.innerHTML = `
      <td><input type="checkbox" class="checkbox-selecao" data-secao="saidasMes" data-saida-id="${s.id}" 
          ${isSelected ? 'checked' : ''} onchange="toggleSelecaoLinha(this, 'saidasMes', ${s.id})"></td>
      <td><strong>${s.usuario || usuarioAtual}</strong></td>
      <td><strong>${s.loja}</strong></td>
      <td>${s.categoria}</td>
      <td>${s.descricao}</td>
      <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
      <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td><span class="badge-recorrente ${s.recorrente === 'Sim' ? 'sim' : 'nao'}">${s.recorrente}</span></td>
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
  
  saidas.sort((a, b) => new Date(a.data) - new Date(b.data));
  
  const totalSaidas = saidas.reduce((sum, s) => sum + s.valor, 0);
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>Usuário</th>
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
            return `
            <tr>
              <td><strong>${s.usuario || usuarioAtual}</strong></td>
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
    <div class="total-saidas-destaque">
      <strong>Valor total das saídas: ${formatarMoedaBR(totalSaidas)}</strong>
    </div>
  `;
  
  container.innerHTML = tabela;
}

function preencherTabelaProximas(container, saidas) {
  if (!container) return;
  
  paginacao.proximasSaidas.totalItens = saidas.length;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">✅ Nenhuma saída próxima</p>';
    esconderControlesProximas();
    return;
  }
  
  saidas.sort((a, b) => new Date(a.data) - new Date(b.data));
  
  const itensPorPagina = paginacao.proximasSaidas.itensPorPagina;
  const paginaAtual = paginacao.proximasSaidas.paginaAtual;
  const totalPaginas = Math.ceil(saidas.length / itensPorPagina);
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const saidasPagina = saidas.slice(inicio, inicio + itensPorPagina);
  
  mostrarControlesProximas(totalPaginas);
  
  const totalSaidas = saidas.reduce((sum, s) => sum + s.valor, 0);
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th><input type="checkbox" id="selecionarTodasProximas" onchange="selecionarTodasLinhas('proximas')"></th>
            <th>Usuário</th>
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
            const isSelected = selecionados.proximas.has(s.id);
            const linhaClass = isSelected ? 'linha-selecionada' : '';
            return `
            <tr class="${linhaClass}">
              <td><input type="checkbox" class="checkbox-selecao" data-secao="proximas" data-saida-id="${s.id}" 
                  ${isSelected ? 'checked' : ''} onchange="toggleSelecaoLinha(this, 'proximas', ${s.id})"></td>
              <td><strong>${s.usuario || usuarioAtual}</strong></td>
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
    <div class="total-saidas-destaque">
      <strong>Valor total das saídas próximas: ${formatarMoedaBR(totalSaidas)}</strong>
    </div>
  `;
  
  container.innerHTML = tabela;
}

function preencherTabelaRecorrentes(container, saidas) {
  if (!container) return;
  
  paginacao.recorrentes.totalItens = saidas.length;
  
  if (saidas.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">✅ Nenhuma saída recorrente</p>';
    esconderControlesRecorrentes();
    return;
  }
  
  const itensPorPagina = paginacao.recorrentes.itensPorPagina;
  const paginaAtual = paginacao.recorrentes.paginaAtual;
  const totalPaginas = Math.ceil(saidas.length / itensPorPagina);
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const saidasPagina = saidas.slice(inicio, inicio + itensPorPagina);
  
  mostrarControlesRecorrentes(totalPaginas);
  
  const tabela = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th><input type="checkbox" id="selecionarTodasRecorrentes" onchange="selecionarTodasLinhas('recorrentes')"></th>
            <th>Usuário</th>
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
            const isSelected = selecionados.recorrentes.has(s.id);
            const linhaClass = isSelected ? 'linha-selecionada' : '';
            return `
            <tr class="${linhaClass}">
              <td><input type="checkbox" class="checkbox-selecao" data-secao="recorrentes" data-saida-id="${s.id}" 
                  ${isSelected ? 'checked' : ''} onchange="toggleSelecaoLinha(this, 'recorrentes', ${s.id})"></td>
              <td><strong>${s.usuario || usuarioAtual}</strong></td>
              <td><strong>${s.loja}</strong></td>
              <td>${s.categoria}</td>
              <td>${s.descricao}</td>
              <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
              <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td>
                ${s.pago === 'Não' ? `<button class="btn btn-success-modern btn-sm" onclick="marcarComoPago('', ${s.id})" title="Marcar como Pago"><i class="fas fa-check"></i></button>` : ''}
                <button class="btn btn-warning-modern btn-sm ms-1" onclick="editarSaida('', ${s.id})" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger-modern btn-sm ms-1" onclick="excluirSaidasRecorrentesFuturas(${s.id})" title="Excluir Todas as Futuras">
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

function mostrarControlesRecorrentes(totalPaginas) {
  const controles = document.getElementById('recorrentesControles');
  const paginaAtual = document.getElementById('paginaAtualRecorrentes');
  const totalPaginasElement = document.getElementById('totalPaginasRecorrentes');
  const totalItens = document.getElementById('totalItensRecorrentes');
  
  if (controles) controles.style.display = totalPaginas > 1 ? 'flex' : 'none';
  if (paginaAtual) paginaAtual.textContent = paginacao.recorrentes.paginaAtual;
  if (totalPaginasElement) totalPaginasElement.textContent = totalPaginas;
  if (totalItens) totalItens.textContent = paginacao.recorrentes.totalItens;
}

function esconderControlesRecorrentes() {
  const controles = document.getElementById('recorrentesControles');
  if (controles) controles.style.display = 'none';
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
  atualizarComparativoLojas();
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
  
  setTimeout(preencherFiltrosRecorrentesIniciais, 100);
  filtrarRecorrentesPorFiltros();
  mostrarNotificacaoInteligente('✅ Filtros limpos e padrões reaplicados!');
}

// ===== GRÁFICOS AUTOMÁTICOS =====
function atualizarGraficos() {
  atualizarGraficoCategoria();
  atualizarGraficoTipo();
  atualizarGraficoMes();
  atualizarGraficoLojas();
  atualizarGraficoCentrosCusto();
}

function atualizarGraficoCategoria() {
  const ctx = document.getElementById('graficoCategoria');
  if (!ctx) return;
  
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });

  if (lojaFiltroAtual) {
    saidasMes = saidasMes.filter(s => s.loja === lojaFiltroAtual);
  }
  
  const categoriaCount = {};
  saidasMes.forEach(s => {
    categoriaCount[s.categoria] = (categoriaCount[s.categoria] || 0) + s.valor;
  });
  
  if (graficos.categoria) {
    graficos.categoria.destroy();
  }
  
  graficos.categoria = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoriaCount),
      datasets: [{
        data: Object.values(categoriaCount),
        backgroundColor: [
          '#10b981', '#059669', '#f59e0b', '#ef4444', '#3b82f6',
          '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
        ]
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: window.innerWidth < 768 ? 10 : 12
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoTipo() {
  const ctx = document.getElementById('graficoTipo');
  if (!ctx) return;
  
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });

  if (lojaFiltroAtual) {
    saidasMes = saidasMes.filter(s => s.loja === lojaFiltroAtual);
  }
  
  const tipoCount = {
    'Recorrente': saidasMes.filter(s => s.recorrente === 'Sim').reduce((sum, s) => sum + s.valor, 0),
    'Único': saidasMes.filter(s => s.recorrente === 'Não').reduce((sum, s) => sum + s.valor, 0)
  };
  
  if (graficos.tipo) {
    graficos.tipo.destroy();
  }
  
  graficos.tipo = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(tipoCount),
      datasets: [{
        data: Object.values(tipoCount),
        backgroundColor: ['#10b981', '#6b7280']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: window.innerWidth < 768 ? 10 : 12
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoMes() {
  const ctx = document.getElementById('graficoMes');
  if (!ctx) return;
  
  const hoje = new Date();
  const mesesLabels = [];
  const dadosMeses = [];
  
  for (let i = 5; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const anoMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    
    let saidasDoMes = [...saidas, ...saidasPendentes].filter(s => {
      const saidaAnoMes = s.data.substring(0, 7);
      return saidaAnoMes === anoMes;
    });

    if (lojaFiltroAtual) {
      saidasDoMes = saidasDoMes.filter(s => s.loja === lojaFiltroAtual);
    }
    
    const total = saidasDoMes.reduce((sum, s) => sum + s.valor, 0);
    
    mesesLabels.push(data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
    dadosMeses.push(total);
  }
  
  if (graficos.mes) {
    graficos.mes.destroy();
  }
  
  graficos.mes = new Chart(ctx, {
    type: 'line',
    data: {
      labels: mesesLabels,
      datasets: [{
        label: 'Saídas (R$)',
        data: dadosMeses,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: window.innerWidth < 768 ? 10 : 12
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: window.innerWidth < 768 ? 9 : 11
            },
            callback: function(value) {
              return formatarMoedaBR(value);
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: window.innerWidth < 768 ? 9 : 11
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoLojas() {
  const ctx = document.getElementById('graficoLojas');
  if (!ctx) return;
  
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });
  
  const lojaCount = {};
  lojas.forEach(loja => {
    const totalLoja = saidasMes.filter(s => s.loja === loja).reduce((sum, s) => sum + s.valor, 0);
    lojaCount[loja] = totalLoja;
  });
  
  if (graficos.lojas) {
    graficos.lojas.destroy();
  }
  
  graficos.lojas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(lojaCount),
      datasets: [{
        label: 'Valor por Loja (R$)',
        data: Object.values(lojaCount),
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: window.innerWidth < 768 ? 10 : 12
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: window.innerWidth < 768 ? 9 : 11
            },
            callback: function(value) {
              return formatarMoedaBR(value);
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: window.innerWidth < 768 ? 9 : 11
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoCentrosCusto() {
  const ctx = document.getElementById('graficoCentrosCusto');
  if (!ctx) return;
  
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });
  
  const datasets = [];
  const cores = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  lojas.forEach((loja, index) => {
    const saidasLoja = saidasMes.filter(s => s.loja === loja);
    const categoriasLoja = {};
    
    categorias.forEach(cat => {
      categoriasLoja[cat] = saidasLoja.filter(s => s.categoria === cat).reduce((sum, s) => sum + s.valor, 0);
    });
    
    datasets.push({
      label: loja,
      data: Object.values(categoriasLoja),
      backgroundColor: cores[index % cores.length]
    });
  });
  
  if (graficos.centrosCusto) {
    graficos.centrosCusto.destroy();
  }
  
  graficos.centrosCusto = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categorias,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: window.innerWidth < 768 ? 10 : 12
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: window.innerWidth < 768 ? 9 : 11
            },
            callback: function(value) {
              return formatarMoedaBR(value);
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: window.innerWidth < 768 ? 8 : 10
            }
          }
        }
      }
    }
  });
}

// ===== COMPARATIVO ENTRE LOJAS =====
function atualizarComparativoLojas() {
  const container = document.getElementById('tabelaComparativo');
  if (!container) return;
  
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });
  
  const dadosLojas = {};
  
  lojas.forEach(loja => {
    const saidasLoja = saidasMes.filter(s => s.loja === loja);
    const totalLoja = saidasLoja.reduce((sum, s) => sum + s.valor, 0);
    const totalRecorrente = saidasLoja.filter(s => s.recorrente === 'Sim').reduce((sum, s) => sum + s.valor, 0);
    const totalUnico = saidasLoja.filter(s => s.recorrente === 'Não').reduce((sum, s) => sum + s.valor, 0);
    const qtdSaidas = saidasLoja.length;
    
    dadosLojas[loja] = {
      total: totalLoja,
      recorrente: totalRecorrente,
      unico: totalUnico,
      quantidade: qtdSaidas
    };
  });
  
  let html = '';
  Object.entries(dadosLojas).forEach(([loja, dados]) => {
    html += `
      <div class="comparativo-loja-card">
        <div class="comparativo-loja-header">${loja}</div>
        <div class="comparativo-loja-stats">
          <div class="comparativo-stat">
            <div class="comparativo-stat-valor">${formatarMoedaBR(dados.total)}</div>
            <div class="comparativo-stat-label">Total</div>
          </div>
          <div class="comparativo-stat">
            <div class="comparativo-stat-valor">${formatarMoedaBR(dados.recorrente)}</div>
            <div class="comparativo-stat-label">Recorrente</div>
          </div>
          <div class="comparativo-stat">
            <div class="comparativo-stat-valor">${formatarMoedaBR(dados.unico)}</div>
            <div class="comparativo-stat-label">Único</div>
          </div>
          <div class="comparativo-stat">
            <div class="comparativo-stat-valor">${dados.quantidade}</div>
            <div class="comparativo-stat-label">Saídas</div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ===== ANÁLISE INTELIGENTE =====
function abrirAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  if (!modal) return;
  
  modal.style.display = 'flex';
  
  // Simular análise
  const loading = document.getElementById('analiseLoading');
  const resultado = document.getElementById('analiseResultado');
  const barra = document.getElementById('progressoBarra');
  const etapa = document.getElementById('etapaAnalise');
  
  loading.style.display = 'block';
  resultado.style.display = 'none';
  
  let progresso = 0;
  const etapas = [
    'Carregando dados...',
    'Analisando padrões...',
    'Identificando tendências...',
    'Gerando insights...',
    'Finalizando análise...'
  ];
  
  const interval = setInterval(() => {
    progresso += 20;
    barra.style.width = progresso + '%';
    etapa.textContent = etapas[Math.floor(progresso / 20) - 1] || etapas[etapas.length - 1];
    
    if (progresso >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loading.style.display = 'none';
        resultado.style.display = 'block';
        gerarAnaliseInteligente();
      }, 500);
    }
  }, 800);
}

function fecharAnaliseInteligente() {
  const modal = document.getElementById('modalAnaliseInteligente');
  if (modal) modal.style.display = 'none';
}

function gerarAnaliseInteligente() {
  const hoje = new Date();
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  let saidasMes = [...saidas, ...saidasPendentes].filter(s => {
    const saidaAnoMes = s.data.substring(0, 7);
    return saidaAnoMes === anoMes;
  });
  
  const totalMes = saidasMes.reduce((sum, s) => sum + s.valor, 0);
  const totalRecorrente = saidasMes.filter(s => s.recorrente === 'Sim').reduce((sum, s) => sum + s.valor, 0);
  const maiorGasto = saidasMes.length > 0 ? Math.max(...saidasMes.map(s => s.valor)) : 0;
  const saidasPendentesAnalise = saidasMes.filter(s => s.pago === 'Não');
  const totalPendente = saidasPendentesAnalise.reduce((sum, s) => sum + s.valor, 0);
  
  // Análise por categoria
  const categoriaStats = {};
  categorias.forEach(cat => {
    const totalCat = saidasMes.filter(s => s.categoria === cat).reduce((sum, s) => sum + s.valor, 0);
    if (totalCat > 0) categoriaStats[cat] = totalCat;
  });
  
  // Análise por loja
  const lojaStats = {};
  lojas.forEach(loja => {
    const totalLoja = saidasMes.filter(s => s.loja === loja).reduce((sum, s) => sum + s.valor, 0);
    if (totalLoja > 0) lojaStats[loja] = totalLoja;
  });
  
  const categoriaTop = Object.keys(categoriaStats).length > 0 
    ? Object.keys(categoriaStats).reduce((a, b) => categoriaStats[a] > categoriaStats[b] ? a : b)
    : 'Nenhuma';
    
  const lojaTop = Object.keys(lojaStats).length > 0 
    ? Object.keys(lojaStats).reduce((a, b) => lojaStats[a] > lojaStats[b] ? a : b)
    : 'Nenhuma';
  
  const resultado = document.getElementById('analiseResultado');
  resultado.innerHTML = `
    <div class="resumo-executivo">
      <div class="resumo-titulo">📊 Resumo Executivo - ${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
      <p>Análise inteligente baseada em ${saidasMes.length} saídas registradas</p>
      <div class="resumo-stats">
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${formatarMoedaBR(totalMes)}</div>
          <div class="resumo-stat-label">Total do Mês</div>
        </div>
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${Math.round((totalRecorrente / totalMes) * 100)}%</div>
          <div class="resumo-stat-label">Recorrente</div>
        </div>
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${saidasMes.length}</div>
          <div class="resumo-stat-label">Total Saídas</div>
        </div>
        <div class="resumo-stat">
          <div class="resumo-stat-valor">${formatarMoedaBR(totalPendente)}</div>
          <div class="resumo-stat-label">Pendente</div>
        </div>
      </div>
    </div>
    
    <div class="insight-card tipo-tendencia">
      <div class="insight-header">
        <div class="insight-icon tendencia"><i class="fas fa-chart-line"></i></div>
        <div>
          <h6 class="insight-titulo">Análise de Tendências</h6>
          <p class="insight-valor">${totalRecorrente > totalMes * 0.6 ? 'Gastos recorrentes dominam' : 'Gastos únicos predominam'}</p>
        </div>
      </div>
      <p class="insight-descricao">
        ${totalRecorrente > totalMes * 0.6 
          ? 'Seus gastos recorrentes representam ' + Math.round((totalRecorrente / totalMes) * 100) + '% do orçamento. Considere revisar contratos e assinaturas para possíveis economias.'
          : 'Você tem flexibilidade nos gastos com ' + Math.round(((totalMes - totalRecorrente) / totalMes) * 100) + '% de despesas não-recorrentes. Mantenha controle sobre gastos variáveis.'}
      </p>
    </div>
    
    <div class="insight-card tipo-insight">
      <div class="insight-header">
        <div class="insight-icon insight"><i class="fas fa-store"></i></div>
        <div>
          <h6 class="insight-titulo">Performance por Loja</h6>
          <p class="insight-valor">Loja líder: ${lojaTop}</p>
        </div>
      </div>
      <p class="insight-descricao">
        A loja "${lojaTop}" representa ${formatarMoedaBR(lojaStats[lojaTop] || 0)} em gastos este mês (${Math.round(((lojaStats[lojaTop] || 0) / totalMes) * 100)}% do total).
      </p>
    </div>
    
    <div class="insight-card tipo-insight">
      <div class="insight-header">
        <div class="insight-icon insight"><i class="fas fa-tags"></i></div>
        <div>
          <h6 class="insight-titulo">Categoria Dominante</h6>
          <p class="insight-valor">${categoriaTop}</p>
        </div>
      </div>
      <p class="insight-descricao">
        A categoria "${categoriaTop}" consome ${formatarMoedaBR(categoriaStats[categoriaTop] || 0)} (${Math.round(((categoriaStats[categoriaTop] || 0) / totalMes) * 100)}% do orçamento mensal). 
        ${categoriaStats[categoriaTop] > totalMes * 0.4 ? 'Este alto percentual merece atenção especial.' : 'Distribuição equilibrada entre categorias.'}
      </p>
    </div>
    
    ${totalPendente > 0 ? `
    <div class="insight-card tipo-alerta">
      <div class="insight-header">
        <div class="insight-icon alerta"><i class="fas fa-exclamation-triangle"></i></div>
        <div>
          <h6 class="insight-titulo">Saídas Pendentes</h6>
          <p class="insight-valor">${formatarMoedaBR(totalPendente)}</p>
        </div>
      </div>
      <p class="insight-descricao">
        Você tem ${saidasPendentesAnalise.length} saída(s) pendente(s) totalizando ${formatarMoedaBR(totalPendente)}. 
        Isso representa ${Math.round((totalPendente / totalMes) * 100)}% do orçamento mensal.
      </p>
    </div>
    ` : ''}
    
    <div class="insight-card tipo-oportunidade">
      <div class="insight-header">
        <div class="insight-icon oportunidade"><i class="fas fa-lightbulb"></i></div>
        <div>
          <h6 class="insight-titulo">Oportunidades de Economia</h6>
          <p class="insight-valor">Potencial: ${formatarMoedaBR(totalRecorrente * 0.1)}</p>
        </div>
      </div>
      <p class="insight-descricao">
        Revise gastos recorrentes regularmente. Uma economia de 10% nos gastos fixos pode gerar ${formatarMoedaBR(totalRecorrente * 0.1 * 12)} anuais.
        ${Object.keys(categoriaStats).length > 1 ? ' Diversifique ainda mais as categorias para melhor controle.' : ''}
      </p>
    </div>
    
    ${maiorGasto > totalMes * 0.3 ? `
    <div class="insight-card tipo-alerta">
      <div class="insight-header">
        <div class="insight-icon alerta"><i class="fas fa-exclamation-triangle"></i></div>
        <div>
          <h6 class="insight-titulo">Gasto Concentrado</h6>
          <p class="insight-valor">${formatarMoedaBR(maiorGasto)}</p>
        </div>
      </div>
      <p class="insight-descricao">
        Um único gasto representa ${Math.round((maiorGasto / totalMes) * 100)}% do total mensal. 
        Verifique se este valor está dentro do planejado e considere parcelamento se necessário.
      </p>
    </div>
    ` : ''}
    
    <div class="insight-card tipo-insight">
      <div class="insight-header">
        <div class="insight-icon insight"><i class="fas fa-brain"></i></div>
        <div>
          <h6 class="insight-titulo">Comportamento Financeiro</h6>
          <p class="insight-valor">Análise Comportamental</p>
        </div>
      </div>
      <p class="insight-descricao">
        ${saidasMes.length > 30 
          ? 'Alto volume de transações indica excelente controle financeiro. Continue o monitoramento detalhado!'
          : saidasMes.length > 15 
            ? 'Bom nível de detalhamento financeiro. Considere registrar mais categorias para análises aprofundadas.'
            : 'Considere registrar mais detalhes das saídas para ter maior visibilidade e controle financeiro.'}
      </p>
    </div>
  `;
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
      categorias, lojas, saidas, saidasPendentes,
      usuarioAtual: usuarioAtual,
      versao: '4.0.0', 
      ultimoBackup: new Date().toISOString(),
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
  verificarSessao();
  
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
  
  // Fechar menu de configurações ao clicar fora
  document.addEventListener('click', function(e) {
    const configMenu = document.getElementById('configMenu');
    const configBtn = e.target.closest('.config-dropdown');
    
    if (configMenu && !configBtn && configMenu.classList.contains('show')) {
      configMenu.classList.remove('show');
    }
  });
  
  if (usuarioAtual) {
    carregarDadosLocal();
    atualizarInterfaceCompleta();
    
    const totalSaidas = saidas.length + saidasPendentes.length;
    if (totalSaidas > 0) {
      mostrarNotificacaoInteligente(`✅ Sistema carregado! ${totalSaidas} saídas encontradas.`);
    } else {
      mostrarNotificacaoInteligente('✅ Sistema carregado com sucesso!');
    }
  }
});

// ===== EXPOSIÇÃO GLOBAL DAS FUNÇÕES =====
window.fazerLogin = fazerLogin;
window.fazerLogout = fazerLogout;
window.toggleConfigMenu = toggleConfigMenu;
window.abrirGerenciarConta = abrirGerenciarConta;
window.alterarSenha = alterarSenha;
window.abrirPermissoes = abrirPermissoes;
window.salvarPermissoes = salvarPermissoes;
window.abrirColunas = abrirColunas;
window.salvarColunas = salvarColunas;
window.abrirAlertas = abrirAlertas;
window.salvarAlertas = salvarAlertas;
window.abrirBackup = abrirBackup;
window.exportarCSV = exportarCSV;
window.exportarJSON = exportarJSON;
window.exportarExcel = exportarExcel;
window.criarBackup = criarBackup;
window.abrirIntegracoes = abrirIntegracoes;
window.toggleChatTopo = toggleChatTopo;
window.enviarMensagemChatTopo = enviarMensagemChatTopo;
window.limparChatTopo = limparChatTopo;
window.mostrarTreinamentoIA = mostrarTreinamentoIA;
window.fecharTreinamentoIA = fecharTreinamentoIA;
window.salvarTreinamentoNatural = salvarTreinamentoNatural;
window.salvarTreinamentoManual = salvarTreinamentoManual;
window.adicionarSaida = adicionarSaida;
window.excluirSaida = excluirSaida;
window.excluirSaidasRecorrentesFuturas = excluirSaidasRecorrentesFuturas;
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
window.paginacaoAnteriorRecorrentes = paginacaoAnteriorRecorrentes;
window.paginacaoProximaRecorrentes = paginacaoProximaRecorrentes;
window.paginacaoAnterior = paginacaoAnterior;
window.paginacaoProxima = paginacaoProxima;
window.selecionarTodasLinhas = selecionarTodasLinhas;
window.toggleSelecaoLinha = toggleSelecaoLinha;
window.limparSelecaoSaidasMes = limparSelecaoSaidasMes;
window.limparSelecaoRecorrentes = limparSelecaoRecorrentes;
window.limparSelecaoProximas = limparSelecaoProximas;
window.pagarSaidasSelecionadas = pagarSaidasSelecionadas;
window.excluirSaidasSelecionadas = excluirSaidasSelecionadas;
window.editarSaidasSelecionadas = editarSaidasSelecionadas;
window.abrirModalEdicaoMultipla = abrirModalEdicaoMultipla;
window.salvarEdicaoMultipla = salvarEdicaoMultipla;
window.abrirAnaliseInteligente = abrirAnaliseInteligente;
window.fecharAnaliseInteligente = fecharAnaliseInteligente;
window.formatarMoeda = formatarMoeda;

console.log('✅ Sistema iClub V4.0 - Completo com todas as funcionalidades carregado!');

// ===== SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS =====
setInterval(() => {
  if (!usuarioAtual) return;
  
  const hoje = new Date().toISOString().split('T')[0];
  const saidasVencendoHoje = [...saidas, ...saidasPendentes].filter(s => 
    s.pago === 'Não' && s.data === hoje
  );
  
  if (saidasVencendoHoje.length > 0) {
    mostrarNotificacaoInteligente(
      `⏰ Você tem ${saidasVencendoHoje.length} saída(s) vencendo hoje!`, 
      'warning'
    );
  }
}, 300000); // Verifica a cada 5 minutos