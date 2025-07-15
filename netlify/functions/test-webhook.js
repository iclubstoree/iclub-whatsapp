// netlify/functions/test-webhook.js  
// FUNÇÃO PARA TESTAR O WEBHOOK SEM WHATSAPP - CORRIGIDA

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'text/html'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

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
        .message-test { 
            background: #e3f2fd; 
            padding: 15px; 
            border-radius: 10px; 
            margin: 10px 0; 
            cursor: pointer; 
            transition: all 0.2s;
        }
        .message-test:hover { 
            background: #bbdefb; 
            transform: translateY(-2px);
        }
        .result-area { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            border: 1px solid #ddd; 
            min-height: 200px; 
        }
        .btn-test { 
            background: linear-gradient(135deg, #10b981, #059669);
            border: none;
            color: white;
            font-weight: 600;
        }
        .btn-test:hover {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="text-center mb-4">🧪 Teste Webhook WhatsApp</h1>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card test-card">
                    <div class="card-header bg-primary text-white">
                        <h5>📱 Teste Manual</h5>
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
                        <button class="btn btn-test w-100" onclick="testarMensagemCustom()">
                            🚀 Testar Mensagem
                        </button>
                    </div>
                </div>

                <div class="card test-card">
                    <div class="card-header bg-success text-white">
                        <h5>📋 Testes Predefinidos</h5>
                    </div>
                    <div class="card-body">
                        <div class="message-test" onclick="testarMensagem('Paguei R$ 1.500 de aluguel hoje', '5511999999999')">
                            <strong>Teste 1:</strong> "Paguei R$ 1.500 de aluguel hoje"
                        </div>
                        <div class="message-test" onclick="testarMensagem('Gastei R$ 50,00 de gasolina ontem', '5511888888888')">
                            <strong>Teste 2:</strong> "Gastei R$ 50,00 de gasolina ontem"
                        </div>
                        <div class="message-test" onclick="testarMensagem('Preciso pagar R$ 200 de internet todo mês', '5511777777777')">
                            <strong>Teste 3:</strong> "Preciso pagar R$ 200 de internet todo mês"
                        </div>
                        <div class="message-test" onclick="testarMensagem('Comprei material de escritório por R$ 80', '5511666666666')">
                            <strong>Teste 4:</strong> "Comprei material de escritório por R$ 80"
                        </div>
                        <div class="message-test" onclick="testarMensagem('Devo R$ 300 de energia elétrica', '5511555555555')">
                            <strong>Teste 5:</strong> "Devo R$ 300 de energia elétrica"
                        </div>
                        
                        <button class="btn btn-success mt-3 w-100" onclick="executarTodosTestes()">
                            🧪 Executar Todos os Testes
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5>📊 Resultado do Teste</h5>
                    </div>
                    <div class="card-body">
                        <div id="resultadoTeste" class="result-area">
                            <p class="text-muted text-center">Clique em um teste para ver o resultado...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const WEBHOOK_URL = '/.netlify/functions/webhook-whatsapp';
        
        async function testarMensagem(message, phone) {
            const resultDiv = document.getElementById('resultadoTeste');
            resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><br><br>Processando mensagem...</div>';
            
            try {
                console.log('Enviando para webhook:', { message, phone });
                
                const response = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ message, phone, name: 'Teste' })
                });
                
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                console.log('Resultado:', result);
                
                let html = '';
                if (result.success) {
                    html = \`
                        <div class="alert alert-success">
                            <h6><i class="fas fa-check-circle"></i> ✅ Teste Bem-sucedido!</h6>
                        </div>
                        <h6>📝 Mensagem Testada:</h6>
                        <div class="border p-2 bg-light mb-3">"\${message}"</div>
                        
                        <h6>📊 Dados Extraídos pela IA:</h6>
                        <ul class="list-group mb-3">
                            <li class="list-group-item"><strong>💰 Valor:</strong> R$ \${result.data?.valor?.toFixed(2) || 'N/A'}</li>
                            <li class="list-group-item"><strong>🏷️ Categoria:</strong> \${result.data?.categoria || 'N/A'}</li>
                            <li class="list-group-item"><strong>📅 Data:</strong> \${result.data?.data || 'N/A'}</li>
                            <li class="list-group-item"><strong>💳 Status:</strong> \${result.data?.pago || 'N/A'}</li>
                            <li class="list-group-item"><strong>🔄 Recorrente:</strong> \${result.data?.recorrente || 'Não'}</li>
                        </ul>
                        
                        <h6>💬 Resposta WhatsApp:</h6>
                        <div class="border p-3 bg-success text-white rounded">
                            <pre style="white-space: pre-wrap; margin: 0; color: white; font-family: inherit;">\${result.response}</pre>
                        </div>
                        
                        <div class="alert alert-info mt-3">
                            <small><strong>✅ Dados salvos no Firebase!</strong> Verifique a coleção 'saidasProfissional' no seu Firestore.</small>
                        </div>
                    \`;
                } else {
                    html = \`
                        <div class="alert alert-danger">
                            <h6><i class="fas fa-exclamation-triangle"></i> ❌ Erro no Teste</h6>
                            <p><strong>Erro:</strong> \${result.error || 'Erro desconhecido'}</p>
                        </div>
                        <h6>📝 Mensagem Testada:</h6>
                        <div class="border p-2 bg-light mb-3">"\${message}"</div>
                        <h6>💬 Resposta de Erro:</h6>
                        <div class="border p-3 bg-danger text-white rounded">
                            <pre style="white-space: pre-wrap; margin: 0; color: white;">\${result.response || result.error || 'Sem resposta'}</pre>
                        </div>
                    \`;
                }
                
                resultDiv.innerHTML = html;
                
            } catch (error) {
                console.error('Erro no teste:', error);
                resultDiv.innerHTML = \`
                    <div class="alert alert-danger">
                        <h6><i class="fas fa-exclamation-triangle"></i> ❌ Erro de Conexão</h6>
                        <p><strong>Erro:</strong> \${error.message}</p>
                        <hr>
                        <small>Verifique se o webhook está funcionando: <a href="/.netlify/functions/status" target="_blank">Status do Sistema</a></small>
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
            const testes = [
                { message: 'Paguei R$ 1.500 de aluguel hoje', phone: '5511999999999' },
                { message: 'Gastei R$ 50,00 de gasolina ontem', phone: '5511888888888' },
                { message: 'Preciso pagar R$ 200 de internet todo mês', phone: '5511777777777' },
                { message: 'Comprei material de escritório por R$ 80', phone: '5511666666666' },
                { message: 'Devo R$ 300 de energia elétrica', phone: '5511555555555' }
            ];
            
            const resultDiv = document.getElementById('resultadoTeste');
            resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-success" role="status"></div><br><br>Executando todos os testes...</div>';
            
            let resultados = '<h6>🧪 Resultados de Todos os Testes:</h6>';
            let sucessos = 0;
            
            for (let i = 0; i < testes.length; i++) {
                const teste = testes[i];
                try {
                    const response = await fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(teste)
                    });
                    
                    const result = await response.json();
                    
                    const status = result.success ? '✅' : '❌';
                    const categoria = result.data?.categoria || 'N/A';
                    const valor = result.data?.valor || 0;
                    
                    if (result.success) sucessos++;
                    
                    resultados += \`
                        <div class="border p-2 mb-2 \${result.success ? 'bg-light border-success' : 'bg-light border-danger'}">
                            <strong>Teste \${i + 1} \${status}</strong><br>
                            <small>"\${teste.message}"</small><br>
                            <small><strong>Resultado:</strong> \${categoria} - R$ \${valor.toFixed ? valor.toFixed(2) : valor} </small>
                        </div>
                    \`;
                    
                } catch (error) {
                    resultados += \`
                        <div class="border p-2 mb-2 bg-light border-danger">
                            <strong>Teste \${i + 1} ❌</strong><br>
                            <small>Erro: \${error.message}</small>
                        </div>
                    \`;
                }
            }
            
            resultados += \`
                <div class="alert alert-\${sucessos === testes.length ? 'success' : 'warning'} mt-3">
                    <strong>Resumo:</strong> \${sucessos} de \${testes.length} testes foram bem-sucedidos!
                </div>
            \`;
            
            resultDiv.innerHTML = resultados;
        }
    </script>
</body>
</html>
    `;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'text/html' },
      body: html
    };
  }

  // Se for POST, processar como antes
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      success: false,
      error: 'Método não suportado para POST nesta função'
    })
  };
};
