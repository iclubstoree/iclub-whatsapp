// painel.js
let categorias = ["Aluguel", "Energia", "Internet"];
let lojas = ["Loja Centro", "Loja Shopping", "Loja Bairro"];
let saidas = [];
let saidasPendentes = [];
let lojaFiltroAtual = "";
let listaSaidasMultiplas = []; // Nova variável para múltiplas saídas

// Funções de persistência
function salvarDados() {
  const dados = {
    categorias,
    lojas,
    saidas,
    saidasPendentes
  };
  localStorage.setItem('iclubSaidas', JSON.stringify(dados));
}

function carregarDados() {
  const dadosSalvos = localStorage.getItem('iclubSaidas');
  if (dadosSalvos) {
    const dados = JSON.parse(dadosSalvos);
    categorias = dados.categorias || ["Aluguel", "Energia", "Internet"];
    lojas = dados.lojas || ["Loja Centro", "Loja Shopping", "Loja Bairro"];
    saidas = dados.saidas || [];
    saidasPendentes = dados.saidasPendentes || [];
  }
}

// Funções do Modal
function mostrarModal(titulo, texto, botoes) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalTexto').innerHTML = texto;
  document.getElementById('modalBotoes').innerHTML = botoes;
  document.getElementById('modalCustom').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalCustom').style.display = 'none';
}

// Novas funções para múltiplas saídas
function iniciarMultiplasSaidas() {
  // Validar se os campos obrigatórios estão preenchidos
  const loja = document.getElementById("loja").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value;
  const valorInput = document.getElementById("valor").value;
  const data = document.getElementById("data").value;

  if (!loja || !categoria || !descricao || !valorInput || !data) {
    alert("Por favor, preencha todos os campos obrigatórios antes de criar múltiplas saídas!");
    return;
  }

  // Coletar dados do formulário
  const dadosBase = coletarDadosFormulario();
  if (!dadosBase) return;

  // Inicializar lista com a primeira saída
  listaSaidasMultiplas = [dadosBase];
  
  // Mostrar container e renderizar lista
  document.getElementById("multiplasSaidasContainer").style.display = "block";
  renderizarListaSaidas();
}

function coletarDadosFormulario() {
  const loja = document.getElementById("loja").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value;
  const valorInput = document.getElementById("valor").value;
  const valor = extrairValorNumerico(valorInput);
  const data = document.getElementById("data").value;
  const recorrente = document.getElementById("recorrente").value;
  const tipoRecorrencia = document.getElementById("tipoRecorrencia").value;
  const pago = document.getElementById("pago").value;

  if (valor <= 0) {
    alert("Por favor, insira um valor válido!");
    return null;
  }

  if (recorrente === "Sim" && (!tipoRecorrencia || tipoRecorrencia === "Selecione")) {
    alert("Por favor, selecione o tipo de recorrência!");
    return null;
  }

  return {
    loja,
    categoria,
    descricao,
    valor,
    valorFormatado: valorInput,
    data,
    recorrente,
    tipoRecorrencia: recorrente === "Sim" ? tipoRecorrencia : null,
    pago
  };
}

function adicionarNovaLinha() {
  // Usar os mesmos dados da primeira saída como base
  const dadosBase = { ...listaSaidasMultiplas[0] };
  listaSaidasMultiplas.push(dadosBase);
  renderizarListaSaidas();
}

function renderizarListaSaidas() {
  const container = document.getElementById("listaSaidas");
  let html = "";

  listaSaidasMultiplas.forEach((saida, index) => {
    html += `
      <div class="saida-item">
        <div class="saida-info">
          <div class="row g-2">
            <div class="col-md-2">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Descrição</label>
              <input type="text" class="form-control form-control-sm" 
                     value="${saida.descricao}" 
                     onchange="atualizarSaidaLista(${index}, 'descricao', this.value)">
            </div>
            <div class="col-md-2">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Valor</label>
              <input type="text" class="form-control form-control-sm" 
                     value="${saida.valorFormatado}" 
                     oninput="formatarMoeda(this)" 
                     onchange="atualizarSaidaListaValor(${index}, this.value)">
            </div>
            <div class="col-md-2">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Data</label>
              <input type="date" class="form-control form-control-sm" 
                     value="${saida.data}" 
                     onchange="atualizarSaidaLista(${index}, 'data', this.value)">
            </div>
            <div class="col-md-2">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Loja</label>
              <select class="form-select form-select-sm" 
                      onchange="atualizarSaidaLista(${index}, 'loja', this.value)">
                ${lojas.map(l => `<option value="${l}" ${l === saida.loja ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Centro de custo</label>
              <select class="form-select form-select-sm" 
                      onchange="atualizarSaidaLista(${index}, 'categoria', this.value)">
                ${categorias.map(c => `<option value="${c}" ${c === saida.categoria ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label fw-bold" style="font-size: 0.8rem;">Pago?</label>
              <select class="form-select form-select-sm" 
                      onchange="atualizarSaidaLista(${index}, 'pago', this.value)">
                <option value="Sim" ${saida.pago === 'Sim' ? 'selected' : ''}>Sim</option>
                <option value="Não" ${saida.pago === 'Não' ? 'selected' : ''}>Não</option>
              </select>
            </div>
          </div>
        </div>
        <div class="saida-actions">
          <button class="btn btn-danger btn-sm" onclick="removerSaidaLista(${index})" 
                  ${listaSaidasMultiplas.length === 1 ? 'disabled' : ''}>
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function atualizarSaidaLista(index, campo, valor) {
  listaSaidasMultiplas[index][campo] = valor;
}

function atualizarSaidaListaValor(index, valorFormatado) {
  listaSaidasMultiplas[index].valorFormatado = valorFormatado;
  listaSaidasMultiplas[index].valor = extrairValorNumerico(valorFormatado);
}

function removerSaidaLista(index) {
  if (listaSaidasMultiplas.length > 1) {
    listaSaidasMultiplas.splice(index, 1);
    renderizarListaSaidas();
  }
}

function adicionarTodasSaidas() {
  let saidasAdicionadas = 0;
  let erros = [];

  listaSaidasMultiplas.forEach((dadosSaida, index) => {
    try {
      // Validações
      if (!dadosSaida.descricao || dadosSaida.valor <= 0) {
        erros.push(`Saída ${index + 1}: Descrição ou valor inválido`);
        return;
      }

      const saida = {
        id: Date.now() + Math.random() * 1000 + index,
        loja: dadosSaida.loja,
        categoria: dadosSaida.categoria,
        descricao: dadosSaida.descricao,
        valor: dadosSaida.valor,
        data: dadosSaida.data,
        recorrente: dadosSaida.recorrente,
        tipoRecorrencia: dadosSaida.tipoRecorrencia,
        pago: dadosSaida.pago
      };

      // Mesma lógica do adicionarSaida original
      if (saida.pago === "Sim" && saida.recorrente === "Não") {
        saidas.push(saida);
      } else if (saida.pago === "Sim" && saida.recorrente === "Sim") {
        saidas.push(saida);
        gerarRecorrenciasFuturas(saida);
      } else if (saida.pago === "Não") {
        saidasPendentes.push(saida);
        if (saida.recorrente === "Sim") {
          gerarRecorrenciasFuturas(saida);
        }
      }

      saidasAdicionadas++;
    } catch (error) {
      erros.push(`Saída ${index + 1}: Erro ao processar`);
    }
  });

  if (erros.length > 0) {
    alert(`Algumas saídas não foram adicionadas:\n${erros.join('\n')}`);
  }

  if (saidasAdicionadas > 0) {
    // Atualizar todas as tabelas e gráficos
    atualizarTodasTabelas();
    atualizarDashboard();
    atualizarGraficos();
    atualizarComparativoLojas();
    salvarDados();

    // Mostrar mensagem de sucesso
    const titulo = "✅ Múltiplas Saídas Adicionadas!";
    const texto = `<strong>${saidasAdicionadas} saídas</strong> foram adicionadas com sucesso!`;
    const botoes = `
      <button class="btn btn-success-modern btn-modern" onclick="finalizarMultiplasSaidas()">
        <i class="fas fa-check"></i> Finalizar
      </button>
    `;
    
    mostrarModal(titulo, texto, botoes);
  }
}

function cancelarMultiplasSaidas() {
  document.getElementById("multiplasSaidasContainer").style.display = "none";
  listaSaidasMultiplas = [];
}

function finalizarMultiplasSaidas() {
  cancelarMultiplasSaidas();
  limparFormulario();
  fecharModal();
}

function limparFiltrosRecorrentes() {
  document.getElementById("filtroLojaRecorrentes").value = "";
  document.getElementById("filtroAnoRecorrentes").value = "";
  document.getElementById("filtroMesRecorrentes").innerHTML = '<option value="">Todos os meses</option>';
  document.getElementById("filtroCategoriaRecorrentes").value = "";
  filtrarRecorrentesPorFiltros();
}

function formatarMoedaBR(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarMoeda(input) {
  let valor = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
  
  if (valor === '') {
    input.value = '';
    return;
  }
  
  // Converte para centavos
  valor = parseInt(valor);
  
  // Formata como moeda
  const valorFormatado = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  input.value = valorFormatado;
}

function extrairValorNumerico(valorFormatado) {
  if (!valorFormatado) return 0;
  
  // Remove símbolos de moeda e converte para número
  return parseFloat(valorFormatado.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

function mostrarMensagemSucesso() {
  const mensagem = document.getElementById("mensagemSucesso");
  mensagem.style.display = "block";
  
  // Esconde a mensagem após 3 segundos
  setTimeout(() => {
    mensagem.style.display = "none";
  }, 3000);
}

function atualizarCategorias() {
  const select = document.getElementById("categoria");
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
  select.innerHTML = "";
  lojas.forEach(loja => {
    const option = document.createElement("option");
    option.value = loja;
    option.textContent = loja;
    select.appendChild(option);
  });
}

function atualizarFiltroLojas() {
  const select = document.getElementById("filtroLojaGlobal");
  const opcaoTodas = select.querySelector('option[value=""]');
  select.innerHTML = "";
  select.appendChild(opcaoTodas);
  
  lojas.forEach(loja => {
    const option = document.createElement("option");
    option.value = loja;
    option.textContent = `🏢 ${loja}`;
    select.appendChild(option);
  });
}

function preencherFiltroLojasRecorrentes() {
  const select = document.getElementById("filtroLojaRecorrentes");
  select.innerHTML = '<option value="">Todas as lojas</option>';
  
  lojas.forEach(loja => {
    const option = document.createElement("option");
    option.value = loja;
    option.textContent = `🏢 ${loja}`;
    select.appendChild(option);
  });
}

function mostrarEditorLoja() {
  const editor = document.getElementById("editor-loja");
  if (editor.style.display === "none" || editor.style.display === "") {
    editor.style.display = "block";
  } else {
    editor.style.display = "none";
  }
}

function adicionarLoja() {
  const nova = document.getElementById("novaLoja").value;
  if (nova && !lojas.includes(nova)) {
    lojas.push(nova);
    atualizarLojas();
    atualizarFiltroLojas();
    preencherFiltroLojasRecorrentes();
    salvarDados();
  }
  document.getElementById("novaLoja").value = "";
}

function aplicarFiltroLoja() {
  lojaFiltroAtual = document.getElementById("filtroLojaGlobal").value;
  atualizarTodasTabelas();
  atualizarDashboard();
  atualizarGraficos();
  atualizarComparativoLojas();
}

function mostrarEditorCategoria() {
  const editor = document.getElementById("editor-categoria");
  if (editor.style.display === "none" || editor.style.display === "") {
    editor.style.display = "block";
  } else {
    editor.style.display = "none";
  }
}

function toggleTipoRecorrencia() {
  const recorrente = document.getElementById("recorrente").value;
  const colunaTipo = document.getElementById("colunaTipoRecorrencia");
  
  if (recorrente === "Sim") {
    colunaTipo.style.display = "block";
  } else {
    colunaTipo.style.display = "none";
  }
}

function preencherFiltroAnos() {
  const select = document.getElementById("filtroAnoRecorrentes");
  const anoAtual = new Date().getFullYear();
  
  select.innerHTML = '<option value="">Todos os anos</option>';
  
  for (let i = 0; i < 5; i++) {
    const ano = anoAtual + i;
    const option = document.createElement("option");
    option.value = ano;
    option.textContent = ano;
    select.appendChild(option);
  }
  
  // Definir ano atual como padrão
  select.value = anoAtual;
}

function preencherMesesDoAno() {
  const anoSelecionado = document.getElementById("filtroAnoRecorrentes").value;
  const select = document.getElementById("filtroMesRecorrentes");
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                 "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  select.innerHTML = '<option value="">Todos os meses</option>';
  
  if (anoSelecionado) {
    const mesAtual = new Date().getMonth() + 1; // Mês atual (1-12)
    
    for (let i = 0; i < 12; i++) {
      const mesAno = `${anoSelecionado}-${String(i + 1).padStart(2, '0')}`;
      const option = document.createElement("option");
      option.value = mesAno;
      option.textContent = meses[i];
      select.appendChild(option);
    }
    
    // Definir mês atual como padrão se for o ano atual
    if (anoSelecionado == new Date().getFullYear()) {
      const mesAtualFormatado = `${anoSelecionado}-${String(mesAtual).padStart(2, '0')}`;
      select.value = mesAtualFormatado;
    }
  }
  
  filtrarRecorrentesPorFiltros();
}

function preencherFiltroCategorias() {
  const select = document.getElementById("filtroCategoriaRecorrentes");
  select.innerHTML = '<option value="">Todos os centros de custo</option>';
  
  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function filtrarPorLoja(lista) {
  if (!lojaFiltroAtual) return lista;
  return lista.filter(s => s.loja === lojaFiltroAtual);
}

function atualizarComparativoLojas() {
  const container = document.getElementById("tabelaComparativo");
  
  if (lojaFiltroAtual) {
    document.getElementById("comparativoLojas").style.display = "none";
    return;
  }
  
  document.getElementById("comparativoLojas").style.display = "block";
  
  const dadosPorLoja = {};
  
  lojas.forEach(loja => {
    const saidasLoja = saidas.filter(s => s.loja === loja && s.pago === "Sim");
    const total = saidasLoja.reduce((sum, s) => sum + s.valor, 0);
    const quantidade = saidasLoja.length;
    
    dadosPorLoja[loja] = { total, quantidade };
  });
  
  let html = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>🏢 Loja</th>
            <th>💰 Total Gasto</th>
            <th>📊 Quantidade Saídas</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  Object.entries(dadosPorLoja).forEach(([loja, dados]) => {
    html += `
      <tr>
        <td><strong>${loja}</strong></td>
        <td><span class="valor-dourado">${formatarMoedaBR(dados.total)}</span></td>
        <td>${dados.quantidade}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Atualizar gráfico comparativo de lojas
  atualizarGraficoLojas(dadosPorLoja);
  
  // Atualizar gráfico de centros de custo por loja
  atualizarGraficoCentrosCusto();
}

function filtrarRecorrentesPorFiltros() {
  const lojaSelecionada = document.getElementById("filtroLojaRecorrentes").value;
  const anoSelecionado = document.getElementById("filtroAnoRecorrentes").value;
  const mesSelecionado = document.getElementById("filtroMesRecorrentes").value;
  const categoriaSelecionada = document.getElementById("filtroCategoriaRecorrentes").value;
  const hoje = new Date().toISOString().split('T')[0];
  
  let recorrentes = saidasPendentes.filter((s, index, self) => 
    s.recorrente === "Sim" && s.data > hoje && index === self.findIndex(t => t.id === s.id)
  );
  
  // Aplicar filtro por loja específico das saídas recorrentes
  if (lojaSelecionada) {
    recorrentes = recorrentes.filter(s => s.loja === lojaSelecionada);
  } else if (lojaFiltroAtual) {
    // Aplicar filtro global se não houver filtro específico
    recorrentes = recorrentes.filter(s => s.loja === lojaFiltroAtual);
  }
  
  if (anoSelecionado && !mesSelecionado) {
    recorrentes = recorrentes.filter(s => s.data.startsWith(anoSelecionado));
  } else if (mesSelecionado) {
    recorrentes = recorrentes.filter(s => s.data.startsWith(mesSelecionado));
  }
  
  if (categoriaSelecionada) {
    recorrentes = recorrentes.filter(s => s.categoria === categoriaSelecionada);
  }
  
  // Calcular total filtrado
  const totalFiltrado = recorrentes.reduce((sum, s) => sum + s.valor, 0);
  document.getElementById("totalSaidasRecorrentes").textContent = formatarMoedaBR(totalFiltrado);
  
  criarTabelaSubcategoria("previsaoRecorrentes", recorrentes);
}

function adicionarCategoria() {
  const nova = document.getElementById("novaCategoria").value;
  if (nova && !categorias.includes(nova)) {
    categorias.push(nova);
    atualizarCategorias();
    preencherFiltroCategorias();
    salvarDados();
  }
  document.getElementById("novaCategoria").value = "";
}

// Novas funções para editar lojas e categorias existentes
function mostrarEditorLojaExistente() {
  if (lojas.length === 0) {
    alert("Nenhuma loja cadastrada para editar!");
    return;
  }
  
  let opcoesLojas = "";
  lojas.forEach((loja, index) => {
    opcoesLojas += `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: #f8fafc; border-radius: 8px;">
        <span style="flex: 1; font-weight: bold;">${loja}</span>
        <button class="btn btn-warning btn-sm" onclick="editarLoja(${index})">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn btn-danger btn-sm" onclick="excluirLoja(${index})">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </div>
    `;
  });
  
  const titulo = "✏️ Editar Lojas Existentes";
  const texto = `<div style="max-height: 300px; overflow-y: auto;">${opcoesLojas}</div>`;
  const botoes = `
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      <i class="fas fa-times"></i> Fechar
    </button>
  `;
  
  mostrarModal(titulo, texto, botoes);
}

function mostrarEditorCategoriaExistente() {
  if (categorias.length === 0) {
    alert("Nenhum centro de custo cadastrado para editar!");
    return;
  }
  
  let opcoesCategorias = "";
  categorias.forEach((categoria, index) => {
    opcoesCategorias += `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: #f8fafc; border-radius: 8px;">
        <span style="flex: 1; font-weight: bold;">${categoria}</span>
        <button class="btn btn-warning btn-sm" onclick="editarCategoria(${index})">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn btn-danger btn-sm" onclick="excluirCategoria(${index})">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </div>
    `;
  });
  
  const titulo = "✏️ Editar Centros de Custo Existentes";
  const texto = `<div style="max-height: 300px; overflow-y: auto;">${opcoesCategorias}</div>`;
  const botoes = `
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      <i class="fas fa-times"></i> Fechar
    </button>
  `;
  
  mostrarModal(titulo, texto, botoes);
}

function editarLoja(index) {
  const lojaAtual = lojas[index];
  const novoNome = prompt(`Digite o novo nome para a loja:\n\nNome atual: ${lojaAtual}`, lojaAtual);
  
  if (novoNome && novoNome.trim() !== "" && novoNome !== lojaAtual) {
    // Verificar se já existe
    if (lojas.includes(novoNome)) {
      alert("Já existe uma loja com este nome!");
      return;
    }
    
    // Atualizar todas as saídas que usam esta loja
    saidas.forEach(saida => {
      if (saida.loja === lojaAtual) {
        saida.loja = novoNome;
      }
    });
    
    saidasPendentes.forEach(saida => {
      if (saida.loja === lojaAtual) {
        saida.loja = novoNome;
      }
    });
    
    // Atualizar array de lojas
    lojas[index] = novoNome;
    
    // Atualizar interface
    atualizarLojas();
    atualizarFiltroLojas();
    preencherFiltroLojasRecorrentes();
    atualizarTodasTabelas();
    atualizarDashboard();
    atualizarGraficos();
    atualizarComparativoLojas();
    salvarDados();
    
    fecharModal();
    alert(`Loja renomeada de "${lojaAtual}" para "${novoNome}" com sucesso!\nTodas as saídas foram atualizadas.`);
  }
}

function editarCategoria(index) {
  const categoriaAtual = categorias[index];
  const novoNome = prompt(`Digite o novo nome para o centro de custo:\n\nNome atual: ${categoriaAtual}`, categoriaAtual);
  
  if (novoNome && novoNome.trim() !== "" && novoNome !== categoriaAtual) {
    // Verificar se já existe
    if (categorias.includes(novoNome)) {
      alert("Já existe um centro de custo com este nome!");
      return;
    }
    
    // Atualizar todas as saídas que usam esta categoria
    saidas.forEach(saida => {
      if (saida.categoria === categoriaAtual) {
        saida.categoria = novoNome;
      }
    });
    
    saidasPendentes.forEach(saida => {
      if (saida.categoria === categoriaAtual) {
        saida.categoria = novoNome;
      }
    });
    
    // Atualizar array de categorias
    categorias[index] = novoNome;
    
    // Atualizar interface
    atualizarCategorias();
    preencherFiltroCategorias();
    atualizarTodasTabelas();
    atualizarDashboard();
    atualizarGraficos();
    atualizarComparativoLojas();
    salvarDados();
    
    fecharModal();
    alert(`Centro de custo renomeado de "${categoriaAtual}" para "${novoNome}" com sucesso!\nTodas as saídas foram atualizadas.`);
  }
}

function excluirLoja(index) {
  const loja = lojas[index];
  
  // Verificar se existem saídas usando esta loja
  const saidasComLoja = saidas.filter(s => s.loja === loja).length;
  const saidasPendentesComLoja = saidasPendentes.filter(s => s.loja === loja).length;
  const totalSaidas = saidasComLoja + saidasPendentesComLoja;
  
  if (totalSaidas > 0) {
    alert(`Não é possível excluir a loja "${loja}"!\n\nExistem ${totalSaidas} saída(s) cadastrada(s) usando esta loja.\n\nPara excluir, primeiro remova ou edite todas as saídas que usam esta loja.`);
    return;
  }
  
  if (confirm(`Tem certeza que deseja EXCLUIR a loja "${loja}"?\n\nEsta ação não pode ser desfeita.`)) {
    lojas.splice(index, 1);
    
    // Atualizar interface
    atualizarLojas();
    atualizarFiltroLojas();
    preencherFiltroLojasRecorrentes();
    atualizarComparativoLojas();
    salvarDados();
    
    fecharModal();
    alert(`Loja "${loja}" excluída com sucesso!`);
  }
}

function excluirCategoria(index) {
  const categoria = categorias[index];
  
  // Verificar se existem saídas usando esta categoria
  const saidasComCategoria = saidas.filter(s => s.categoria === categoria).length;
  const saidasPendentesComCategoria = saidasPendentes.filter(s => s.categoria === categoria).length;
  const totalSaidas = saidasComCategoria + saidasPendentesComCategoria;
  
  if (totalSaidas > 0) {
    alert(`Não é possível excluir o centro de custo "${categoria}"!\n\nExistem ${totalSaidas} saída(s) cadastrada(s) usando este centro de custo.\n\nPara excluir, primeiro remova ou edite todas as saídas que usam este centro de custo.`);
    return;
  }
  
  if (confirm(`Tem certeza que deseja EXCLUIR o centro de custo "${categoria}"?\n\nEsta ação não pode ser desfeita.`)) {
    categorias.splice(index, 1);
    
    // Atualizar interface
    atualizarCategorias();
    preencherFiltroCategorias();
    atualizarTodasTabelas();
    atualizarDashboard();
    atualizarGraficos();
    atualizarComparativoLojas();
    salvarDados();
    
    fecharModal();
    alert(`Centro de custo "${categoria}" excluído com sucesso!`);
  }
}

function adicionarSaida() {
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

  const saida = { 
    id: Date.now() + Math.random() * 1000, 
    loja,
    categoria, 
    descricao, 
    valor, 
    data, 
    recorrente, 
    tipoRecorrencia: recorrente === "Sim" ? tipoRecorrencia : null, 
    pago 
  };

  // Situação 1: Pago=Sim + Recorrente=Não → Saídas do Mês
  if (pago === "Sim" && recorrente === "Não") {
    saidas.push(saida);
  }
  
  // Situação 2: Pago=Sim + Recorrente=Sim → Saídas do Mês + Recorrências futuras
  else if (pago === "Sim" && recorrente === "Sim") {
    saidas.push(saida);
    gerarRecorrenciasFuturas(saida);
  }
  
  // Situação 3: Pago=Não → Vai para pendentes
  else if (pago === "Não") {
    saidasPendentes.push(saida);
    if (recorrente === "Sim") {
      gerarRecorrenciasFuturas(saida);
    }
  }

  atualizarTodasTabelas();
  atualizarDashboard();
  atualizarGraficos();
  atualizarComparativoLojas();
  mostrarMensagemSucesso();
  salvarDados();
  
  // Limpar formulário após adicionar
  limparFormulario();
}

function gerarRecorrenciasFuturas(saidaBase) {
  const dataBase = new Date(saidaBase.data);
  const hoje = new Date();
  const tresMesesFuture = new Date();
  tresMesesFuture.setMonth(hoje.getMonth() + 3);

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

    if (proximaData <= tresMesesFuture && saidaBase.pago === "Não") {
      const recorrencia = {
        ...saidaBase,
        id: Date.now() + i + Math.random() * 1000,
        data: proximaData.toISOString().split('T')[0],
        pago: "Não"
      };
      saidasPendentes.push(recorrencia);
    }
  }
}

function pagarSaida(id) {
  const index = saidasPendentes.findIndex(s => s.id === id);
  if (index !== -1) {
    const saida = saidasPendentes[index];
    
    // Mostrar modal de confirmação
    const titulo = "✅ Confirmar Pagamento";
    const texto = `<strong>Descrição:</strong> ${saida.descricao}<br>
                   <strong>Valor:</strong> ${formatarMoedaBR(saida.valor)}<br>
                   <strong>Loja:</strong> ${saida.loja}<br><br>
                   <span style="color: #10b981; font-weight: bold;">🎉 Saída foi realizada com sucesso!</span>`;
    const botoes = `
      <button class="btn btn-success-modern btn-modern" onclick="confirmarPagamento(${id})">
        <i class="fas fa-check"></i> Confirmar
      </button>
      <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
        <i class="fas fa-times"></i> Fechar
      </button>
    `;
    
    mostrarModal(titulo, texto, botoes);
  }
}

function confirmarPagamento(id) {
  const index = saidasPendentes.findIndex(s => s.id === id);
  if (index !== -1) {
    const saida = saidasPendentes[index];
    saida.pago = "Sim";
    saidas.push(saida);
    saidasPendentes.splice(index, 1);
    
    atualizarTodasTabelas();
    atualizarDashboard();
    atualizarGraficos();
    atualizarComparativoLojas();
    salvarDados();
    fecharModal();
  }
}

function editarSaida(id, origem) {
  let saida, lista, index;
  
  if (origem === 'paga') {
    index = saidas.findIndex(s => s.id === id);
    if (index !== -1) {
      saida = saidas[index];
      lista = saidas;
    }
  } else {
    index = saidasPendentes.findIndex(s => s.id === id);
    if (index !== -1) {
      saida = saidasPendentes[index];
      lista = saidasPendentes;
    }
  }
  
  if (!saida) return;
  
  // Mostrar modal com opções
  const titulo = "⚙️ Opções de Edição";
  const texto = `<strong>Descrição:</strong> ${saida.descricao}<br>
                 <strong>Valor:</strong> ${formatarMoedaBR(saida.valor)}<br>
                 <strong>Loja:</strong> ${saida.loja}<br><br>
                 Escolha uma opção:`;
  const botoes = `
    <button class="btn btn-warning btn-modern" onclick="executarEdicao(${id}, '${origem}', 'editar')">
      <i class="fas fa-edit"></i> Editar
    </button>
    <button class="btn btn-danger btn-modern" onclick="executarEdicao(${id}, '${origem}', 'excluir')">
      <i class="fas fa-trash"></i> Excluir
    </button>
    <button class="btn btn-secondary btn-modern" onclick="fecharModal()">
      <i class="fas fa-times"></i> Fechar
    </button>
  `;
  
  mostrarModal(titulo, texto, botoes);
}

function executarEdicao(id, origem, acao) {
  let saida, lista, index;
  
  if (origem === 'paga') {
    index = saidas.findIndex(s => s.id === id);
    if (index !== -1) {
      saida = saidas[index];
      lista = saidas;
    }
  } else {
    index = saidasPendentes.findIndex(s => s.id === id);
    if (index !== -1) {
      saida = saidasPendentes[index];
      lista = saidasPendentes;
    }
  }
  
  if (!saida) return;
  
  if (acao === 'editar') {
    // Editar - preencher formulário
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
    
    // Remover a saída original
    lista.splice(index, 1);
    
    fecharModal();
    alert("Dados carregados no formulário. Faça as alterações e clique em 'Adicionar Saída'");
    
  } else if (acao === 'excluir') {
    // Confirmar exclusão
    if (confirm(`Tem certeza que deseja EXCLUIR a saída: ${saida.descricao}?`)) {
      lista.splice(index, 1);
      fecharModal();
      alert("Saída excluída com sucesso!");
    }
  }
  
  atualizarTodasTabelas();
  atualizarDashboard();
  atualizarGraficos();
  atualizarComparativoLojas();
  salvarDados();
}

function atualizarTodasTabelas() {
  atualizarTabela();
  atualizarTabelasSubcategorias();
}

function atualizarTabelasSubcategorias() {
  const hoje = new Date().toISOString().split('T')[0];

  // Separar saídas por categoria - removendo duplicatas e aplicando filtro por loja
  const saidasFiltradas = filtrarPorLoja(saidasPendentes);
  
  const atrasadas = saidasFiltradas.filter((s, index, self) => 
    s.data < hoje && index === self.findIndex(t => t.id === s.id)
  );
  
  const vencendoHoje = saidasFiltradas.filter((s, index, self) => 
    s.data === hoje && index === self.findIndex(t => t.id === s.id)
  );
  
  const proximas = saidasFiltradas.filter((s, index, self) => 
    s.data > hoje && s.recorrente === "Não" && index === self.findIndex(t => t.id === s.id)
  );

  criarTabelaSubcategoria("atrasadas", atrasadas);
  criarTabelaSubcategoria("vencendoHoje", vencendoHoje);
  criarTabelaSubcategoria("proximas", proximas);
  
  // Atualizar saídas recorrentes com filtros
  filtrarRecorrentesPorFiltros();
}

function criarTabelaSubcategoria(containerId, saidasArray) {
  const container = document.getElementById(containerId);
  
  if (saidasArray.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <p class="mb-0">Nenhuma saída encontrada</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="table table-modern">
        <thead>
          <tr>
            <th>Loja</th>
            <th>Centro de custo</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Recorrente</th>
            <th>Tipo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
  `;

  saidasArray.forEach(s => {
    const recorrenteBadge = s.recorrente === 'Sim' 
      ? '<span class="badge bg-success">Sim</span>' 
      : '<span class="badge bg-secondary">Não</span>';
      
    html += `
      <tr>
        <td><strong>🏢 ${s.loja}</strong></td>
        <td><strong>${s.categoria}</strong></td>
        <td>${s.descricao}</td>
        <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
        <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
        <td>${recorrenteBadge}</td>
        <td>${s.tipoRecorrencia || '-'}</td>
        <td>
          <button class="btn btn-success btn-sm-modern me-1" onclick="pagarSaida(${s.id})">
            Pagar
          </button>
          <button class="btn btn-warning btn-sm-modern" onclick="editarSaida(${s.id}, 'pendente')">
            Editar
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function atualizarTabela() {
  const tbody = document.getElementById("tabelaSaidas");
  tbody.innerHTML = "";
  
  const saidasFiltradas = filtrarPorLoja(saidas);
  
  saidasFiltradas.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>🏢 ${s.loja}</strong></td>
      <td>${s.categoria}</td>
      <td>${s.descricao}</td>
      <td><span class="valor-dourado">${formatarMoedaBR(s.valor)}</span></td>
      <td>${new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td>${s.recorrente}</td>
      <td>${s.tipoRecorrencia || '-'}</td>
      <td>
        <button class="btn btn-warning btn-sm-modern" onclick="editarSaida(${s.id}, 'paga')">
          Editar
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function atualizarDashboard() {
  const saidasFiltradas = filtrarPorLoja(saidas);
  
  let total = 0, totalRec = 0, categoriaTotal = {};
  saidasFiltradas.forEach(s => {
    if (s.pago === "Sim") {
      total += s.valor;
      if (s.recorrente === "Sim") totalRec += s.valor;
      categoriaTotal[s.categoria] = (categoriaTotal[s.categoria] || 0) + s.valor;
    }
  });
  
  document.getElementById("totalMes").textContent = formatarMoedaBR(total);
  document.getElementById("totalRecorrente").textContent = formatarMoedaBR(totalRec);
  const maiorCategoria = Object.entries(categoriaTotal).sort((a,b) => b[1]-a[1])[0] || ["-", 0];
  document.getElementById("categoriaTopo").textContent = maiorCategoria[0];
  document.getElementById("maiorGasto").textContent = formatarMoedaBR(maiorCategoria[1]);
  document.getElementById("totalSaidas").textContent = saidasFiltradas.length;
}

function atualizarGraficos() {
  const saidasFiltradas = filtrarPorLoja(saidas);
  
  // Preparar dados para os gráficos
  const categoriaTotal = {};
  const tipoTotal = { "Recorrente": 0, "Único": 0 };
  const mesTotal = {};

  saidasFiltradas.forEach(s => {
    if (s.pago === "Sim") {
      // Por categoria
      categoriaTotal[s.categoria] = (categoriaTotal[s.categoria] || 0) + s.valor;
      
      // Por tipo
      if (s.recorrente === "Sim") {
        tipoTotal["Recorrente"] += s.valor;
      } else {
        tipoTotal["Único"] += s.valor;
      }
      
      // Por mês
      const mes = s.data.substring(0, 7); // YYYY-MM
      mesTotal[mes] = (mesTotal[mes] || 0) + s.valor;
    }
  });

  // Atualizar gráfico por categoria
  atualizarGraficoCategoria(categoriaTotal);
  
  // Atualizar gráfico por tipo
  atualizarGraficoTipo(tipoTotal);
  
  // Atualizar gráfico por mês
  atualizarGraficoMes(mesTotal);
}

function atualizarGraficoLojas(dadosPorLoja) {
  const ctx = document.getElementById('graficoLojas').getContext('2d');
  
  if (window.chartLojas) {
    window.chartLojas.destroy();
  }
  
  // Ordenar lojas por total (maior para menor)
  const lojasOrdenadas = Object.entries(dadosPorLoja).sort((a, b) => b[1].total - a[1].total);
  
  window.chartLojas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: lojasOrdenadas.map(([loja]) => loja),
      datasets: [{
        label: 'Total Gasto (R$)',
        data: lojasOrdenadas.map(([, dados]) => dados.total),
        backgroundColor: [
          '#10b981', // Verde
          '#0891b2', // Azul
          '#8b5cf6', // Roxo
          '#f59e0b', // Amarelo
          '#ef4444', // Vermelho
          '#6b7280'  // Cinza
        ],
        borderColor: [
          '#059669',
          '#0e7490', 
          '#7c3aed',
          '#d97706',
          '#dc2626',
          '#4b5563'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Total: ${formatarMoedaBR(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatarMoedaBR(value);
            }
          }
        },
        x: {
          ticks: {
            font: {
              weight: 'bold'
            }
          }
        }
      },
      elements: {
        bar: {
          borderWidth: 2,
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutBounce'
      }
    }
  });
}

function atualizarGraficoCentrosCusto() {
  const ctx = document.getElementById('graficoCentrosCusto').getContext('2d');
  
  if (window.chartCentrosCusto) {
    window.chartCentrosCusto.destroy();
  }
  
  // Preparar dados por loja e centro de custo
  const dadosPorLoja = {};
  const coresCentrosCusto = {
    'Aluguel': '#ef4444',
    'Energia': '#f59e0b', 
    'Internet': '#10b981',
    'Água': '#0891b2',
    'Telefone': '#8b5cf6',
    'Material': '#ec4899',
    'Outros': '#6b7280'
  };
  
  lojas.forEach(loja => {
    dadosPorLoja[loja] = {};
    categorias.forEach(categoria => {
      const saidasCategoria = saidas.filter(s => 
        s.loja === loja && 
        s.categoria === categoria && 
        s.pago === "Sim"
      );
      const total = saidasCategoria.reduce((sum, s) => sum + s.valor, 0);
      dadosPorLoja[loja][categoria] = total;
    });
  });
  
  // Criar datasets para cada centro de custo
  const datasets = [];
  categorias.forEach((categoria, index) => {
    const data = lojas.map(loja => dadosPorLoja[loja][categoria] || 0);
    datasets.push({
      label: categoria,
      data: data,
      backgroundColor: coresCentrosCusto[categoria] || `hsl(${index * 60}, 70%, 50%)`,
      borderColor: coresCentrosCusto[categoria] || `hsl(${index * 60}, 70%, 40%)`,
      borderWidth: 1
    });
  });
  
  window.chartCentrosCusto = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: lojas,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          stacked: true,
          ticks: {
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatarMoedaBR(value);
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatarMoedaBR(context.parsed.y)}`;
            }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

function atualizarGraficoCategoria(dados) {
  const ctx = document.getElementById('graficoCategoria').getContext('2d');
  
  if (window.chartCategoria) {
    window.chartCategoria.destroy();
  }
  
  window.chartCategoria = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(dados),
      datasets: [{
        data: Object.values(dados),
        backgroundColor: [
          '#ef4444', // Vermelho vibrante
          '#f59e0b', // Amarelo vibrante
          '#10b981', // Verde vibrante
          '#0891b2', // Azul vibrante
          '#8b5cf6', // Roxo vibrante
          '#ec4899'  // Rosa vibrante
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function atualizarGraficoTipo(dados) {
  const ctx = document.getElementById('graficoTipo').getContext('2d');
  
  if (window.chartTipo) {
    window.chartTipo.destroy();
  }
  
  window.chartTipo = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(dados),
      datasets: [{
        data: Object.values(dados),
        backgroundColor: [
          '#10b981', // Verde vibrante
          '#f59e0b'  // Amarelo vibrante
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function atualizarGraficoMes(dados) {
  const ctx = document.getElementById('graficoMes').getContext('2d');
  
  if (window.chartMes) {
    window.chartMes.destroy();
  }
  
  window.chartMes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dados),
      datasets: [{
        label: 'Gastos por Mês (R$)',
        data: Object.values(dados),
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 2,
        borderRadius: 8
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
              return formatarMoedaBR(value);
            }
          }
        }
      }
    }
  });
}

function limparFormulario() {
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("data").value = "";
  document.getElementById("recorrente").value = "Não";
  document.getElementById("tipoRecorrencia").selectedIndex = 0;
  document.getElementById("pago").value = "Sim";
  
  // Esconde o campo de tipo de recorrência
  document.getElementById("colunaTipoRecorrencia").style.display = "none";
}

function limparFormularioRapido() {
  // Limpa apenas os campos principais, mantém data e configurações
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
}

window.onload = () => {
  carregarDados();
  atualizarCategorias();
  atualizarLojas();
  atualizarFiltroLojas();
  preencherFiltroLojasRecorrentes();
  preencherFiltroAnos();
  preencherFiltroCategorias();
  preencherMesesDoAno(); // Carregar com filtros padrão
  atualizarTodasTabelas();
  atualizarDashboard();
  atualizarGraficos();
  atualizarComparativoLojas();
};