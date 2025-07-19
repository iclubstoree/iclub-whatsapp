// painel.js - SISTEMA ICLUB COMPLETO V4.0 CORRIGIDO
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

// ===== SISTEMA DE LOGIN CORRIGIDO =====
function fazerLogin(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const errorDiv = document.getElementById('loginError');
  
  if (!usuario || !senha) {
    if (errorDiv) {
      errorDiv.textContent = 'Por favor, preencha todos os campos!';
      errorDiv.style.display = 'block';
      setTimeout(() => errorDiv.style.display = 'none', 3000);
    }
    return false;
  }
  
  const usuarios = {
    'admin': 'admin123',
    'user1': 'user123',
    'user2': 'user456'
  };
  
  if (usuarios[usuario] && usuarios[usuario] === senha) {
    usuarioAtual = usuario;
    localStorage.setItem('usuarioLogado', usuario);
    
    const loginContainer = document.getElementById('loginContainer');
    const mainContainer = document.getElementById('mainContainer');
    
    if (loginContainer) {
      loginContainer.style.transition = 'opacity 0.5s ease';
      loginContainer.style.opacity = '0';
      setTimeout(() => {
        loginContainer.style.display = 'none';
      }, 500);
    }
    
    if (mainContainer) {
      mainContainer.style.display = 'block';
      setTimeout(() => {
        mainContainer.classList.add('show');
      }, 100);
    }
    
    atualizarUsuarioLogado();
    mostrarNotificacaoInteligente(`✅ Bem-vindo, ${usuario}!`);
    carregarDadosLocal();
    atualizarInterfaceCompleta();
    
    return false;
  } else {
    if (errorDiv) {
      errorDiv.textContent = 'Usuário ou senha incorretos!';
      errorDiv.style.display = 'block';
      setTimeout(() => errorDiv.style.display = 'none', 3000);
    }
    return false;
  }
}

function fazerLogout() {
  localStorage.removeItem('usuarioLogado');
  usuarioAtual = null;
  
  const loginContainer = document.getElementById('loginContainer');
  const mainContainer = document.getElementById('mainContainer');
  
  if (loginContainer) loginContainer.style.display = 'flex';
  if (mainContainer) {
    mainContainer.classList.remove('show');
    setTimeout(() => mainContainer.style.display = 'none', 300);
  }
  
  mostrarNotificacaoInteligente('👋 Logout realizado com sucesso!');
  toggleConfigMenu();
}

function verificarSessao() {
  const usuarioSalvo = localStorage.getItem('usuarioLogado');
  if (usuarioSalvo) {
    usuarioAtual = usuarioSalvo;
    const loginContainer = document.getElementById('loginContainer');
    const mainContainer = document.getElementById('mainContainer');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (mainContainer) {
      mainContainer.style.display = 'block';
      mainContainer.classList.add('show');
    }
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
          <label class="form-check-label" for="colDescricao">Descri