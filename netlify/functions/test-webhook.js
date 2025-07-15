// ============================================================================
// netlify/functions/test-webhook.js  
// FUNÇÃO PARA TESTAR O WEBHOOK SEM WHATSAPP
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
        .message-test { background: #e3f2fd; padding: 15px; border-radius: 10px; margin: 10px 0; cursor: pointer; }
        .message-test:hover { background: #bbdefb; }
        .result-area { background: white; padding: 20px; border-radius: 10px; border: 1px solid #ddd; min-height: 200px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="text-center mb-4">🧪 Teste Webhook WhatsApp</h1>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card test-card">
                    <div class="card-header">
                        <h5>📱 Teste Manual</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Mensagem:</label>
                            <input type="text" id="mensagemCustom" class="form-control" 
                                   placeholder="Ex: Paguei R$ 500 de aluguel hoje"
                                   value="Paguei R$ 500 de aluguel hoje">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Telefone:</label>
                            <input type="text" id="telefoneCustom" class="form-control" 
                                   placeholder="5511999999999" value="5511999999999">
                        </div>
                        <button class="btn btn-primary" onclick="testarMensagemCustom()">
                            🚀 Testar Mensagem
                        </button>
                    </div>
                </div>

                <div class="card test-card">
                    <div class="card-header">
                        <h5>📋 Testes Predefinidos</h5>
                    </div>
                    <div class="card-body">
                        ${mensagensTeste.map(teste => `
                            <div class="message-test" onclick="testarMensagem('${teste.message}', '${teste.phone}')">
                                <strong>Teste ${teste.id}:</strong> "${teste.message}"
                            </div>
                        `).join('')}
                        
                        <button class="btn btn-success mt-3" onclick="executarTodosTestes()">
                            🧪 Executar Todos os Testes
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>📊 Resultado do Teste</h5>
                    </div>
                    <div class="card-body">
                        <div id="resultadoTeste" class="result-area">
                            <p class="text-muted">Clique em um teste para ver o resultado...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function testarMensagem(message, phone) {
            const resultDiv = document.getElementById('resultadoTeste');
            resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><br>Processando...</div>';
            
            try {
                const response = await fetch('/.netlify/functions/webhook-whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, phone, name: 'Teste' })
                });
                
                const result = await response.json();
                
                let html = '';
                if (result.success) {
                    html = \`
                        <div class="alert alert-success">
                            <h6>✅ Teste Bem-sucedido!</h6>
                        </div>
                        <h6>📝 Mensagem Testada:</h6>
                        <p class="border p-2 bg-light">"\${message}"</p>
                        <h6>📊 Dados Extraídos:</h6>
                        <ul>
                            <li><strong>Categoria:</strong> \${result.data?.categoria || 'N/A'}</li>
                            <li><strong>Valor:</strong> R$ \${result.data?.valor?.toFixed(2) || 'N/A'}</li>
                            <li><strong>Data:</strong> \${result.data?.data || 'N/A'}</li>
                            <li><strong>Status:</strong> \${result.data?.pago || 'N/A'}</li>
                            <li><strong>Recorrente:</strong> \${result.data?.recorrente || 'Não'}</li>
                            <li><strong>Confiança IA:</strong> \${Math.round((result.data?.confianca || 0) * 100)}%</li>
                        </ul>
                        <h6>💬 Resposta WhatsApp:</h6>
                        <div class="border p-3 bg-success text-white rounded">
                            <pre style="white-space: pre-wrap; margin: 0; color: white;">\${result.response}</pre>
                        </div>
                    \`;
                } else {
                    html = \`
                        <div class="alert alert-danger">
                            <h6>❌ Erro no Teste</h6>
                            <p><strong>Erro:</strong> \${result.error || 'Erro desconhecido'}</p>
                        </div>
                        <h6>📝 Mensagem Testada:</h6>
                        <p class="border p-2 bg-light">"\${message}"</p>
                        <h6>💬 Resposta de Erro:</h6>
                        <div class="border p-3 bg-danger text-white rounded">
                            <pre style="white-space: pre-wrap; margin: 0; color: white;">\${result.response || 'Sem resposta'}</pre>
                        </div>
                    \`;
                }
                
                resultDiv.innerHTML = html;
                
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="alert alert-danger">
                        <h6>❌ Erro de Conexão</h6>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }
        
        function testarMensagemCustom() {
            const message = document.getElementById('mensagemCustom').value;
            const phone = document.getElementById('telefoneCustom').value;
            if (message && phone) {
                testarMensagem(message, phone);
            } else {
                alert('Preencha mensagem e telefone!');
            }
        }
        
        async function executarTodosTestes() {
            const testes = ${JSON.stringify(mensagensTeste)};
            const resultDiv = document.getElementById('resultadoTeste');
            resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><br>Executando todos os testes...</div>';
            
            let resultados = '<h6>🧪 Resultados de Todos os Testes:</h6>';
            
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
                    
                    const status = result.success ? '✅' : '❌';
                    const categoria = result.data?.categoria || 'N/A';
                    const valor = result.data?.valor || 0;
                    const confianca = Math.round((result.data?.confianca || 0) * 100);
                    
                    resultados += \`
                        <div class="border p-2 mb-2 \${result.success ? 'bg-light-success' : 'bg-light-danger'}">
                            <strong>Teste \${teste.id} \${status}</strong><br>
                            <small>"\${teste.message}"</small><br>
                            <small><strong>Resultado:</strong> \${categoria} - R$ \${valor.toFixed(2)} (\${confianca}% confiança)</small>
                        </div>
                    \`;
                    
                } catch (error) {
                    resultados += \`
                        <div class="border p-2 mb-2 bg-light-danger">
                            <strong>Teste \${teste.id} ❌</strong><br>
                            <small>Erro: \${error.message}</small>
                        </div>
                    \`;
                }
            }
            
            resultDiv.innerHTML = resultados;
        }
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

    // Se for POST, executar teste
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

      // Chamar o webhook principal
      try {
        const webhookUrl = `${event.headers.origin || 'https://localhost:3000'}/.netlify/functions/webhook-whatsapp`;
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: testeData.message,
            phone: testeData.phone,
            name: testeData.name
          })
        });

        const result = await response.json();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            testData: testeData,
            webhookResult: result,
            timestamp: new Date().toISOString()
          })
        };

      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: `Erro ao chamar webhook: ${error.message}`,
            testData: testeData
          })
        };
      }
    }

    // Método não suportado
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Método não suportado. Use GET ou POST.'
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