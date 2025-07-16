// ============================================================================
// netlify/functions/test-webhook.js  
// FUNÇÃO PARA TESTAR O WEBHOOK SEM WHATSAPP - CORRIGIDA
// ============================================================================

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Mensagens de teste predefinidas
    const mensagensTeste = [
      {
        id: 1,
        message: "Paguei R$ 1.500 de aluguel hoje",
        phone: "5511999999999",
        name: "Teste 1",
        esperado: {
          categoria: "Aluguel",
          valor: 1500,
          pago: "Sim"
        }
      },
      {
        id: 2,
        message: "Gastei R$ 50,00 de gasolina ontem",
        phone: "5511888888888", 
        name: "Teste 2",
        esperado: {
          categoria: "Combustível",
          valor: 50,
          pago: "Sim"
        }
      },
      {
        id: 3,
        message: "Preciso pagar R$ 200 de internet todo mês",
        phone: "5511777777777",
        name: "Teste 3", 
        esperado: {
          categoria: "Internet",
          valor: 200,
          pago: "Não",
          recorrente: "Sim"
        }
      },
      {
        id: 4,
        message: "Comprei material de escritório por R$ 80",
        phone: "5511666666666",
        name: "Teste 4",
        esperado: {
          categoria: "Material",
          valor: 80,
          pago: "Sim"
        }
      },
      {
        id: 5,
        message: "Devo R$ 300 de energia elétrica",
        phone: "5511555555555",
        name: "Teste 5",
        esperado: {
          categoria: "Energia", 
          valor: 300,
          pago: "Não"
        }
      }
    ];

    // Se for GET, retornar página de teste
    if (event.httpMethod === 'GET') {
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧪 Teste Webhook WhatsApp</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f8f9fa; padding: 20px; }
        .test-card { margin-bottom: 20px; }
        .message-test { background: #e3f2fd; padding: 15px; border-radius: 10px; margin: 10px 0; cursor: pointer; transition: all 0.2s; }
        .message-test:hover { background: #bbdefb; transform: translateY(-2px); }
        .result-area { background: white; padding: 20px; border-radius: 10px; border: 1px solid #ddd; min-height: 200px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
        .status-success { background: #d1fae5; color: #065f46; }
        .status-error { background: #fee2e2; color: #991b1b; }
        .spinner-container { text-align: center; padding: 40px; }
        .test-summary { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row mb-4">
            <div class="col-12 text-center">
                <h1 class="text-primary">🧪 Teste Webhook WhatsApp</h1>
                <p class="text-muted">Interface para testar o sistema de IA sem precisar do WhatsApp real</p>
                <div class="test-summary">
                    <strong>🎯 Status do Sistema:</strong>
                    <span id="statusSistema" class="status-badge status-success">Sistema Operacional</span>
                    <button class="btn btn-outline-primary btn-sm ms-2" onclick="verificarStatus()">
                        <i class="fas fa-sync"></i> Verificar Status
                    </button>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card test-card">
                    <div class="card-header bg-primary text-white">
                        <h5><i class="fas fa-keyboard"></i> Teste Manual</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Mensagem:</label>
                            <input type="text" id="mensagemCustom" class="form-control" 
                                   placeholder="Ex: Paguei R$ 500 de aluguel hoje"
                                   value="Paguei R$ 500 de aluguel hoje">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Telefone:</label>
                            <input type="text" id="telefoneCustom" class="form-control" 
                                   placeholder="5511999999999" value="5511999999999">
                        </div>
                        <button class="btn btn-success w-100" onclick="testarMensagemCustom()">
                            <i class="fas fa-paper-plane"></i> Testar Mensagem
                        </button>
                    </div>
                </div>

                <div class="card test-card">
                    <div class="card-header bg-info text-white">
                        <h5><i class="fas fa-list"></i> Testes Predefinidos</h5>
                    </div>
                    <div class="card-body">
                        ${mensagensTeste.map(teste => `
                            <div class="message-test" onclick="testarMensagem('${teste.message}', '${teste.phone}', '${teste.name}')">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>Teste ${teste.id}:</strong><br>
                                        <small class="text-muted">"${teste.message}"</small>
                                    </div>
                                    <div class="text-end">
                                        <small class="text-primary">Categoria esperada: ${teste.esperado.categoria}</small><br>
                                        <small class="text-success">R$ ${teste.esperado.valor}</small>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        
                        <div class="d-grid gap-2 mt-3">
                            <button class="btn btn-warning" onclick="executarTodosTestes()">
                                <i class="fas fa-play"></i> Executar Todos os Testes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h5><i class="fas fa-chart-line"></i> Resultado do Teste</h5>
                    </div>
                    <div class="card-body">
                        <div id="resultadoTeste" class="result-area">
                            <div class="text-center text-muted">
                                <i class="fas fa-arrow-left fa-2x mb-3"></i>
                                <p>Clique em um teste ao lado para ver o resultado...</p>
                                <small>Os testes verificam se a IA está interpretando as mensagens corretamente</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
    <script>
        // Função para verificar status do sistema
        async function verificarStatus() {
            const statusElement = document.getElementById('statusSistema');
            statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            statusElement.className = 'status-badge';
            
            try {
                const response = await fetch('/.netlify/functions/status');
                const result = await response.json();
                
                if (result.status === 'online' && result.firebase?.status === 'connected') {
                    statusElement.innerHTML = '<i class="fas fa-check"></i> Sistema Operacional';
                    statusElement.className = 'status-badge status-success';
                } else {
                    statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sistema com Problemas';
                    statusElement.className = 'status-badge status-error';
                }
            } catch (error) {
                statusElement.innerHTML = '<i class="fas fa-times"></i> Erro de Conexão';
                statusElement.className = 'status-badge status-error';
            }
        }

        // Função principal para testar mensagens
        async function testarMensagem(message, phone, name = 'Teste') {
            const resultDiv = document.getElementById('resultadoTeste');
            resultDiv.innerHTML = '<div class="spinner-container"><div class="spinner-border text-primary" role="status"></div><br><strong>Processando mensagem...</strong><br><small>Testando IA + Firebase</small></div>';
            
            try {
                // CORREÇÃO: Chamar o webhook principal diretamente
                const response = await fetch('/.netlify/functions/webhook-whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: message, 
                        phone: phone, 
                        name: name 
                    })
                });
                
                const result = await response.json();
                
                let html = '';
                if (result.success) {
                    html = \`
                        <div class="alert alert-success border-0">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-check-circle fa-2x text-success me-3"></i>
                                <div>
                                    <h6 class="mb-0">✅ Teste Bem-sucedido!</h6>
                                    <small>IA interpretou e salvou no Firebase</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row g-3 mb-3">
                            <div class="col-12">
                                <h6 class="text-primary"><i class="fas fa-comment"></i> Mensagem Testada:</h6>
                                <div class="bg-light p-3 rounded">
                                    <i class="fas fa-quote-left text-muted"></i>
                                    <em>\${message}</em>
                                    <i class="fas fa-quote-right text-muted"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <h6 class="text-success"><i class="fas fa-brain"></i> Dados Extraídos pela IA:</h6>
                                <ul class="list-unstyled">
                                    <li><strong>Categoria:</strong> <span class="badge bg-primary">\${result.data?.categoria || 'N/A'}</span></li>
                                    <li><strong>Valor:</strong> <span class="badge bg-success">R$ \${result.data?.valor?.toFixed(2) || 'N/A'}</span></li>
                                    <li><strong>Data:</strong> <span class="badge bg-info">\${result.data?.data || 'N/A'}</span></li>
                                    <li><strong>Status:</strong> <span class="badge bg-\${result.data?.pago === 'Sim' ? 'success' : 'warning'}">\${result.data?.pago || 'N/A'}</span></li>
                                    <li><strong>Recorrente:</strong> <span class="badge bg-secondary">\${result.data?.recorrente || 'Não'}</span></li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-info"><i class="fas fa-cog"></i> Dados Técnicos:</h6>
                                <ul class="list-unstyled">
                                    <li><strong>Confiança IA:</strong> <span class="badge bg-info">\${Math.round((result.data?.confianca || 0) * 100)}%</span></li>
                                    <li><strong>Origem:</strong> <span class="badge bg-secondary">\${result.data?.origem || 'N/A'}</span></li>
                                    <li><strong>ID:</strong> <span class="badge bg-dark">\${result.data?.id || 'N/A'}</span></li>
                                    <li><strong>Timestamp:</strong> <span class="badge bg-muted">\${result.timestamp || 'N/A'}</span></li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="text-warning"><i class="fas fa-comment-dots"></i> Resposta WhatsApp Simulada:</h6>
                            <div class="bg-success text-white p-3 rounded">
                                <i class="fas fa-whatsapp me-2"></i>
                                <pre style="white-space: pre-wrap; margin: 0; color: white; font-family: inherit;">\${result.response}</pre>
                            </div>
                        </div>
                    \`;
                } else {
                    html = \`
                        <div class="alert alert-danger border-0">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-times-circle fa-2x text-danger me-3"></i>
                                <div>
                                    <h6 class="mb-0">❌ Erro no Teste</h6>
                                    <small>Problema na interpretação ou processamento</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="text-primary"><i class="fas fa-comment"></i> Mensagem Testada:</h6>
                            <div class="bg-light p-3 rounded">
                                <i class="fas fa-quote-left text-muted"></i>
                                <em>\${message}</em>
                                <i class="fas fa-quote-right text-muted"></i>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Erro Detectado:</h6>
                            <div class="bg-danger text-white p-3 rounded">
                                <strong>Erro:</strong> \${result.error || 'Erro desconhecido'}<br>
                                <strong>Status HTTP:</strong> \${response.status}
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="text-warning"><i class="fas fa-comment-dots"></i> Resposta de Erro:</h6>
                            <div class="bg-warning text-dark p-3 rounded">
                                <pre style="white-space: pre-wrap; margin: 0;">\${result.response || 'Sem resposta de erro'}</pre>
                            </div>
                        </div>
                    \`;
                }
                
                resultDiv.innerHTML = html;
                
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="alert alert-danger border-0">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-wifi fa-2x text-danger me-3"></i>
                            <div>
                                <h6 class="mb-0">🌐 Erro de Conexão</h6>
                                <small>Não foi possível conectar ao webhook</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="text-danger"><i class="fas fa-bug"></i> Detalhes do Erro:</h6>
                        <div class="bg-danger text-white p-3 rounded">
                            <strong>Erro:</strong> \${error.message}<br>
                            <strong>Tipo:</strong> Erro de rede/conexão
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="text-info"><i class="fas fa-lightbulb"></i> Possíveis Soluções:</h6>
                        <ul class="list-unstyled">
                            <li>✅ Verificar se o Netlify está rodando</li>
                            <li>✅ Verificar configuração do Firebase</li>
                            <li>✅ Verificar logs do sistema</li>
                        </ul>
                    </div>
                \`;
            }
        }
        
        function testarMensagemCustom() {
            const message = document.getElementById('mensagemCustom').value;
            const phone = document.getElementById('telefoneCustom').value;
            if (message && phone) {
                testarMensagem(message, phone, 'Teste Custom');
            } else {
                alert('Preencha mensagem e telefone!');
            }
        }
        
        async function executarTodosTestes() {
            const testes = ${JSON.stringify(mensagensTeste)};
            const resultDiv = document.getElementById('resultadoTeste');
            
            resultDiv.innerHTML = '<div class="spinner-container"><div class="spinner-border text-warning" role="status"></div><br><strong>Executando todos os testes...</strong><br><small>Isso pode demorar alguns segundos</small></div>';
            
            let resultados = '<h6 class="text-warning mb-3"><i class="fas fa-list-check"></i> Resultados de Todos os Testes:</h6>';
            let sucessos = 0;
            let erros = 0;
            
            for (const teste of testes) {
                try {
                    const response = await fetch('/.netlify/functions/webhook-whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            message: teste.message, 
                            phone: teste.phone, 
                            name: teste.name 
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        sucessos++;
                        const categoria = result.data?.categoria || 'N/A';
                        const valor = result.data?.valor || 0;
                        const confianca = Math.round((result.data?.confianca || 0) * 100);
                        const esperado = teste.esperado;
                        
                        // Verificar se atende expectativas
                        const categoriaOK = categoria.toLowerCase().includes(esperado.categoria.toLowerCase()) || esperado.categoria.toLowerCase().includes(categoria.toLowerCase());
                        const valorOK = Math.abs(valor - esperado.valor) < (esperado.valor * 0.1); // 10% de tolerância
                        
                        const statusIcon = (categoriaOK && valorOK) ? '✅' : '⚠️';
                        const statusColor = (categoriaOK && valorOK) ? 'success' : 'warning';
                        
                        resultados += \`
                            <div class="border border-\${statusColor} p-3 mb-2 rounded bg-light">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>Teste \${teste.id} \${statusIcon}</strong><br>
                                        <small class="text-muted">"\${teste.message}"</small>
                                    </div>
                                    <div class="text-end">
                                        <small><strong>Resultado:</strong> \${categoria} - R$ \${valor.toFixed(2)}</small><br>
                                        <small><strong>Esperado:</strong> \${esperado.categoria} - R$ \${esperado.valor.toFixed(2)}</small><br>
                                        <small><strong>Confiança:</strong> \${confianca}%</small>
                                    </div>
                                </div>
                            </div>
                        \`;
                    } else {
                        erros++;
                        resultados += \`
                            <div class="border border-danger p-3 mb-2 rounded bg-light">
                                <strong>Teste \${teste.id} ❌</strong><br>
                                <small class="text-muted">"\${teste.message}"</small><br>
                                <small class="text-danger">Erro: \${result.error || 'Erro desconhecido'}</small>
                            </div>
                        \`;
                    }
                    
                } catch (error) {
                    erros++;
                    resultados += \`
                        <div class="border border-danger p-3 mb-2 rounded bg-light">
                            <strong>Teste \${teste.id} 🌐</strong><br>
                            <small class="text-muted">"\${teste.message}"</small><br>
                            <small class="text-danger">Erro de conexão: \${error.message}</small>
                        </div>
                    \`;
                }
            }
            
            // Resumo final
            const resumo = \`
                <div class="alert alert-info border-0 mt-3">
                    <h6><i class="fas fa-chart-pie"></i> Resumo dos Testes:</h6>
                    <div class="row text-center">
                        <div class="col-4">
                            <div class="bg-success text-white p-2 rounded">
                                <strong>\${sucessos}</strong><br>
                                <small>Sucessos</small>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="bg-danger text-white p-2 rounded">
                                <strong>\${erros}</strong><br>
                                <small>Erros</small>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="bg-primary text-white p-2 rounded">
                                <strong>\${Math.round((sucessos / testes.length) * 100)}%</strong><br>
                                <small>Taxa Sucesso</small>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
            
            resultDiv.innerHTML = resultados + resumo;
        }
        
        // Verificar status ao carregar a página
        window.onload = () => {
            verificarStatus();
        };
    </script>
</body>
</html>
      `;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        },
        body: html
      };
    }

    // Se for POST, executar teste individual (se necessário)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { testId, message, phone } = body;

      let testeData;
      
      if (testId) {
        // Teste predefinido
        testeData = mensagensTeste.find(t => t.id === parseInt(testId));
        if (!testeData) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Teste não encontrado'
            })
          };
        }
      } else if (message && phone) {
        // Teste custom
        testeData = { message, phone, name: 'Teste Custom' };
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Forneça testId ou message+phone'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Use a interface web para testes completos',
          redirect: '/.netlify/functions/test-webhook'
        })
      };
    }

    // Método não suportado
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Método não suportado. Use GET para interface ou POST para testes.'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};