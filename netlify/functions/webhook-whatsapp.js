// ============================================================================
// netlify/functions/webhook-whatsapp.js
// WEBHOOK PRINCIPAL - IA + WHATSAPP + FIREBASE - MULTI-USUÁRIO
// ============================================================================

const admin = require('firebase-admin');

// ============================================================================
// INICIALIZAÇÃO FIREBASE
// ============================================================================
let db = null;

function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Variáveis de ambiente Firebase não configuradas');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });

      db = admin.firestore();
      console.log('✅ Firebase inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase:', error.message);
      return false;
    }
  } else {
    db = admin.firestore();
    return true;
  }
}

// ============================================================================
// SISTEMA DE USUÁRIOS MULTI-WHATSAPP
// ============================================================================
const USUARIOS_AUTORIZADOS = {
  // Adicione aqui os números autorizados
  '5511999999999': {
    nome: 'Usuário Principal',
    email: 'usuario@iclub.com',
    perfil: 'admin',
    ativo: true
  },
  '5511888888888': {
    nome: 'Sócia',
    email: 'socia@iclub.com', 
    perfil: 'admin',
    ativo: true
  },
  // Adicione mais usuários conforme necessário
};

function identificarUsuario(numeroTelefone) {
  // Limpar número (remover caracteres especiais)
  const numeroLimpo = numeroTelefone.replace(/[^\d]/g, '');
  
  // Tentar encontrar usuário por número exato
  if (USUARIOS_AUTORIZADOS[numeroLimpo]) {
    return {
      autorizado: true,
      usuario: USUARIOS_AUTORIZADOS[numeroLimpo],
      numeroLimpo: numeroLimpo
    };
  }
  
  // Tentar encontrar por final do número (últimos 9 dígitos)
  const finalNumero = numeroLimpo.slice(-9);
  for (const [numeroAutorizado, dadosUsuario] of Object.entries(USUARIOS_AUTORIZADOS)) {
    if (numeroAutorizado.slice(-9) === finalNumero) {
      return {
        autorizado: true,
        usuario: dadosUsuario,
        numeroLimpo: numeroAutorizado
      };
    }
  }
  
  return {
    autorizado: false,
    numeroLimpo: numeroLimpo
  };
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Responder OPTIONS para CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Apenas aceitar POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Método não permitido. Use POST.' 
      })
    };
  }

  try {
    // Inicializar Firebase
    const firebaseOK = initializeFirebase();
    if (!firebaseOK) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Erro na configuração do Firebase',
          response: '❌ Erro interno do servidor'
        })
      };
    }

    // Parse do body
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'JSON inválido',
          response: '❌ Formato de dados inválido'
        })
      };
    }

    const { message, phone, name, from, source } = requestData;
    
    // Logs para debug
    console.log('📱 Webhook recebido:', {
      message: message?.substring(0, 100),
      phone: phone || from,
      name,
      source: source || 'manual',
      timestamp: new Date().toISOString()
    });

    // Validações básicas
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Mensagem é obrigatória',
          response: '❌ Mensagem não encontrada'
        })
      };
    }

    const numeroTelefone = phone || from || 'unknown';

    // Identificar usuário
    const identificacao = identificarUsuario(numeroTelefone);
    
    // Log da identificação
    console.log('👤 Identificação do usuário:', {
      numero: identificacao.numeroLimpo.substring(0, 8) + '***',
      autorizado: identificacao.autorizado,
      nome: identificacao.usuario?.nome || 'Desconhecido'
    });

    // Verificar se usuário está autorizado (apenas para controle)
    if (!identificacao.autorizado) {
      console.log('⚠️ Usuário não autorizado, mas processando mesmo assim');
    }

    // Processar mensagem com IA
    const resultado = await processarMensagemWhatsapp(
      message, 
      identificacao.numeroLimpo,
      identificacao.usuario || null,
      source || 'whatsapp'
    );

    // Log do resultado
    console.log('📊 Resultado processamento:', {
      sucesso: resultado.sucesso,
      categoria: resultado.dados?.categoria,
      valor: resultado.dados?.valor,
      usuario: resultado.dados?.usuarioNome
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: resultado.sucesso,
        response: resultado.resposta,
        data: resultado.dados || null,
        user: identificacao.usuario || null,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        response: '❌ Erro interno. Tente novamente em alguns minutos.'
      })
    };
  }
};

// ============================================================================
// PROCESSAMENTO PRINCIPAL MULTI-USUÁRIO
// ============================================================================
async function processarMensagemWhatsapp(mensagem, numeroRemetente, dadosUsuario, origem) {
  try {
    console.log('🔄 Iniciando processamento multi-usuário:', {
      mensagem: mensagem.substring(0, 50),
      numero: numeroRemetente.substring(0, 8) + '***',
      usuario: dadosUsuario?.nome || 'Anônimo',
      origem
    });

    // STEP 1: Interpretar mensagem com IA
    const dadosExtraidos = interpretarMensagemIA(mensagem);
    
    if (!dadosExtraidos.sucesso) {
      console.log('❌ Falha na interpretação:', dadosExtraidos.erro);
      return {
        sucesso: false,
        erro: dadosExtraidos.erro,
        resposta: gerarRespostaErro(dadosExtraidos.erro, dadosUsuario)
      };
    }

    // STEP 2: Preparar dados para o Firestore com informações do usuário
    const timestamp = new Date();
    const saidaProfissional = {
      // IDs únicos
      id: `${origem}-${timestamp.getTime()}-${Math.floor(Math.random() * 1000)}`,
      
      // Dados extraídos pela IA
      categoria: dadosExtraidos.categoria,
      subcategoria: dadosExtraidos.subcategoria || null,
      loja: dadosExtraidos.loja || "WhatsApp",
      descricao: dadosExtraidos.descricao,
      valor: dadosExtraidos.valor,
      data: dadosExtraidos.data,
      recorrente: dadosExtraidos.recorrente,
      tipoRecorrencia: dadosExtraidos.tipoRecorrencia,
      pago: dadosExtraidos.pago,
      
      // Dados do usuário multi-WhatsApp
      usuarioNumero: numeroRemetente,
      usuarioNome: dadosUsuario?.nome || 'Usuário Anônimo',
      usuarioEmail: dadosUsuario?.email || null,
      usuarioPerfil: dadosUsuario?.perfil || 'usuario',
      
      // Metadados WhatsApp
      origem: origem,
      numeroRemetente: numeroRemetente,
      mensagemOriginal: mensagem,
      confianca: dadosExtraidos.confianca || 0.8,
      
      // Timestamps
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      dataProcessamento: timestamp.toISOString(),
      processadoEm: timestamp.toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo' 
      }),
      
      // Campos para filtros multi-usuário
      multiUsuario: true,
      usuarioId: numeroRemetente // Para facilitar queries
    };

    // STEP 3: Salvar no Firestore
    console.log('💾 Salvando no Firestore com dados multi-usuário...');
    const docRef = await db.collection('saidasProfissional').add(saidaProfissional);
    
    // Atualizar com ID do documento
    await docRef.update({ firestoreId: docRef.id });
    
    console.log('✅ Salvo no Firestore:', docRef.id);

    // STEP 4: Registrar estatísticas de usuário
    await registrarEstatisticasUsuario(numeroRemetente, dadosUsuario, saidaProfissional);

    // STEP 5: Gerar resposta de confirmação personalizada
    const resposta = gerarRespostaConfirmacaoMultiUsuario(saidaProfissional, dadosUsuario);

    return {
      sucesso: true,
      dados: { ...saidaProfissional, firestoreId: docRef.id },
      resposta: resposta
    };

  } catch (error) {
    console.error('❌ Erro no processamento multi-usuário:', error);
    
    // Erros específicos
    if (error.code === 'permission-denied') {
      return {
        sucesso: false,
        erro: 'Erro de permissão no Firebase',
        resposta: '❌ Erro de configuração. Contacte o administrador.'
      };
    }
    
    return {
      sucesso: false,
      erro: error.message,
      resposta: '❌ Erro ao processar mensagem. Tente novamente.'
    };
  }
}

// ============================================================================
// SISTEMA DE ESTATÍSTICAS POR USUÁRIO
// ============================================================================
async function registrarEstatisticasUsuario(numeroUsuario, dadosUsuario, saida) {
  try {
    const mes = saida.data.substring(0, 7); // YYYY-MM
    const estatisticaId = `${numeroUsuario}-${mes}`;
    
    const estatisticaRef = db.collection('estatisticasUsuario').doc(estatisticaId);
    
    // Usar transação para atualizar estatísticas
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(estatisticaRef);
      
      if (doc.exists) {
        // Atualizar estatística existente
        const dados = doc.data();
        transaction.update(estatisticaRef, {
          totalSaidas: (dados.totalSaidas || 0) + 1,
          totalValor: (dados.totalValor || 0) + saida.valor,
          ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp(),
          categorias: {
            ...dados.categorias,
            [saida.categoria]: (dados.categorias?.[saida.categoria] || 0) + saida.valor
          }
        });
      } else {
        // Criar nova estatística
        transaction.set(estatisticaRef, {
          usuarioNumero: numeroUsuario,
          usuarioNome: dadosUsuario?.nome || 'Usuário Anônimo',
          mes: mes,
          totalSaidas: 1,
          totalValor: saida.valor,
          criadoEm: admin.firestore.FieldValue.serverTimestamp(),
          ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp(),
          categorias: {
            [saida.categoria]: saida.valor
          }
        });
      }
    });
    
    console.log('📈 Estatísticas de usuário atualizadas');
    
  } catch (error) {
    console.error('⚠️ Erro ao registrar estatísticas (não crítico):', error);
  }
}

// ============================================================================
// IA DE INTERPRETAÇÃO DE MENSAGENS (MANTIDA IGUAL)
// ============================================================================
function interpretarMensagemIA(mensagem) {
  try {
    const msgOriginal = mensagem.trim();
    const msgLower = mensagem.toLowerCase().trim();
    
    console.log('🧠 IA analisando:', msgLower.substring(0, 50));

    // ========================================================================
    // PADRÕES DE RECONHECIMENTO AVANÇADOS
    // ========================================================================
    const padroes = {
      // Valores monetários (múltiplos formatos)
      valor: /(?:r\$?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais?|real|pila|conto|pau|dinheiro)?/i,
      
      // Datas variadas
      dataHoje: /\b(?:hoje|hj|agora)\b/i,
      dataOntem: /\b(?:ontem|onte)\b/i,
      dataAmanha: /\b(?:amanhã|amanha|tomorrow)\b/i,
      dataFormatada: /(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/,
      dataPorExtenso: /(\d{1,2})\s+de\s+(\w+)/i,
      
      // Ações de pagamento
      acoesPago: /\b(?:pague[i]?|gaste[i]?|compre[i]?|pago|pagou|gastou|comprou|saída|despesa|débito|desembolsei?)\b/i,
      acoesNaoPago: /\b(?:devo|deve|preciso\s+pagar|vou\s+pagar|pendente|conta\s+para\s+pagar|a\s+pagar|fatura|boleto)\b/i,
      
      // Recorrência
      recorrente: /\b(?:mensal|todo\s+mês|mensalmente|recorrente|fixo|sempre|mensalidade)\b/i,
      semanal: /\b(?:semanal|toda\s+semana|semanalmente|por\s+semana)\b/i,
      diario: /\b(?:diário|diario|todo\s+dia|diariamente|por\s+dia)\b/i,
      anual: /\b(?:anual|todo\s+ano|anualmente|por\s+ano|anuidade)\b/i
    };

    // ========================================================================
    // CATEGORIAS INTELIGENTES (EXPANDIDAS)
    // ========================================================================
    const categorias = {
      'Aluguel': {
        regex: /\b(?:aluguel|aluguer|rent|locação|arrendamento)\b/i,
        confianca: 0.95
      },
      'Energia': {
        regex: /\b(?:energia|luz|elétrica|eletricidade|conta\s+de\s+luz|enel|cpfl|cemig|eletropaulo|elektro)\b/i,
        confianca: 0.9
      },
      'Internet': {
        regex: /\b(?:internet|wifi|banda\s+larga|provedor|vivo\s+fibra|claro\s+net|tim\s+live|oi\s+fibra|net\s+virtua)\b/i,
        confianca: 0.9
      },
      'Água': {
        regex: /\b(?:água|agua|saneamento|conta\s+de\s+água|sabesp|cedae|sanepar|embasa)\b/i,
        confianca: 0.9
      },
      'Telefone': {
        regex: /\b(?:telefone|celular|móvel|plano|operadora|tim|vivo|claro|oi|nextel|recarga)\b/i,
        confianca: 0.85
      },
      'Combustível': {
        regex: /\b(?:combustível|gasolina|etanol|diesel|posto|abasteci|álcool|combustivel|gas|gnv)\b/i,
        confianca: 0.9
      },
      'Alimentação': {
        regex: /\b(?:alimentação|comida|mercado|supermercado|restaurante|lanche|café|jantar|almoço|padaria|açougue|feira|delivery|ifood|uber\s+eats)\b/i,
        confianca: 0.8
      },
      'Transporte': {
        regex: /\b(?:transporte|uber|taxi|ônibus|onibus|metrô|metro|passagem|viagem|corrida|carro|moto|estacionamento|pedágio|99)\b/i,
        confianca: 0.85
      },
      'Material': {
        regex: /\b(?:material|escritório|papelaria|equipamento|ferramenta|suprimento|impressora|papel|caneta)\b/i,
        confianca: 0.7
      },
      'Marketing': {
        regex: /\b(?:marketing|publicidade|anúncio|anuncio|propaganda|google\s+ads|facebook\s+ads|instagram|social|mídia|impulsionar)\b/i,
        confianca: 0.8
      },
      'Saúde': {
        regex: /\b(?:saúde|saude|médico|medico|hospital|farmácia|farmacia|remédio|remedio|consulta|exame|dentista|clínica|clinica|plano\s+de\s+saúde)\b/i,
        confianca: 0.85
      },
      'Educação': {
        regex: /\b(?:educação|educacao|curso|livro|capacitação|capacitacao|treinamento|escola|faculdade|universidade|mensalidade)\b/i,
        confianca: 0.8
      },
      'Limpeza': {
        regex: /\b(?:limpeza|produto\s+de\s+limpeza|detergente|sabão|sabao|desinfetante|faxina|diarista)\b/i,
        confianca: 0.75
      },
      'Segurança': {
        regex: /\b(?:segurança|seguranca|alarme|câmera|camera|vigilância|vigilancia|portaria|monitoramento)\b/i,
        confianca: 0.8
      },
      'Manutenção': {
        regex: /\b(?:manutenção|manutencao|reparo|conserto|reforma|pintura|eletricista|encanador|pedreiro)\b/i,
        confianca: 0.8
      },
      'Impostos': {
        regex: /\b(?:imposto|taxa|iptu|ipva|irpf|darf|tributo|contribuição|contribuicao)\b/i,
        confianca: 0.9
      },
      'Financeiro': {
        regex: /\b(?:financiamento|empréstimo|emprestimo|juros|financeira|banco|cartão|cartao|fatura)\b/i,
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
    
    // Processar valor (aceitar vírgula ou ponto como decimal)
    let valorTexto = matchValor[1];
    
    // Se tem ponto E vírgula, ponto é milhares e vírgula é decimal
    if (valorTexto.includes('.') && valorTexto.includes(',')) {
      valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
    }
    // Se tem apenas vírgula e 2 dígitos após, é decimal
    else if (valorTexto.includes(',') && valorTexto.split(',')[1]?.length === 2) {
      valorTexto = valorTexto.replace(/\./g, '').replace(',', '.');
    }
    // Se tem apenas ponto e 2 dígitos após, é decimal
    else if (valorTexto.includes('.') && valorTexto.split('.')[1]?.length === 2) {
      // Já está correto
    }
    // Se tem apenas vírgula, trocar por ponto
    else if (valorTexto.includes(',')) {
      valorTexto = valorTexto.replace(',', '.');
    }
    // Se tem apenas ponto e mais de 2 dígitos após, é milhares
    else if (valorTexto.includes('.') && valorTexto.split('.')[1]?.length > 2) {
      valorTexto = valorTexto.replace(/\./g, '');
    }
    
    const valor = parseFloat(valorTexto);
    
    if (isNaN(valor) || valor <= 0) {
      return { 
        sucesso: false, 
        erro: `Valor inválido identificado: ${matchValor[1]}` 
      };
    }

    console.log('💰 Valor extraído:', valor);

    // ========================================================================
    // STEP 2: EXTRAIR DATA
    // ========================================================================
    let data = new Date().toISOString().split('T')[0]; // Default: hoje
    let confiancaData = 0.9;
    
    if (padroes.dataOntem.test(msgLower)) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      data = ontem.toISOString().split('T')[0];
      confiancaData = 0.95;
    } else if (padroes.dataAmanha.test(msgLower)) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      data = amanha.toISOString().split('T')[0];
      confiancaData = 0.95;
    } else if (padroes.dataFormatada.test(msgLower)) {
      const matchData = msgLower.match(padroes.dataFormatada);
      const dia = matchData[1].padStart(2, '0');
      const mes = matchData[2].padStart(2, '0');
      const ano = matchData[3] ? 
        (matchData[3].length === 2 ? '20' + matchData[3] : matchData[3]) : 
        new Date().getFullYear();
      data = `${ano}-${mes}-${dia}`;
      confiancaData = 0.85;
    }

    console.log('📅 Data extraída:', data);

    // ========================================================================
    // STEP 3: IDENTIFICAR CATEGORIA COM IA
    // ========================================================================
    let melhorCategoria = "Outros";
    let maiorConfianca = 0;
    let confiancaCategoria = 0.3; // Baixa confiança para "Outros"
    
    for (const [categoria, config] of Object.entries(categorias)) {
      if (config.regex.test(msgLower)) {
        if (config.confianca > maiorConfianca) {
          melhorCategoria = categoria;
          maiorConfianca = config.confianca;
          confiancaCategoria = config.confianca;
        }
      }
    }

    console.log('🏷️ Categoria identificada:', melhorCategoria, `(${confiancaCategoria})`);

    // ========================================================================
    // STEP 4: DETERMINAR STATUS DE PAGAMENTO
    // ========================================================================
    let pago = "Sim"; // Default
    let confiancaPagamento = 0.7;
    
    if (padroes.acoesNaoPago.test(msgLower)) {
      pago = "Não";
      confiancaPagamento = 0.9;
    } else if (padroes.acoesPago.test(msgLower)) {
      pago = "Sim";
      confiancaPagamento = 0.9;
    }

    console.log('💳 Status pagamento:', pago, `(${confiancaPagamento})`);

    // ========================================================================
    // STEP 5: IDENTIFICAR RECORRÊNCIA
    // ========================================================================
    let recorrente = "Não";
    let tipoRecorrencia = null;
    let confiancaRecorrencia = 0.8;
    
    if (padroes.recorrente.test(msgLower)) {
      recorrente = "Sim";
      tipoRecorrencia = "Mensal";
      confiancaRecorrencia = 0.9;
    } else if (padroes.semanal.test(msgLower)) {
      recorrente = "Sim";
      tipoRecorrencia = "Semanal";
      confiancaRecorrencia = 0.9;
    } else if (padroes.diario.test(msgLower)) {
      recorrente = "Sim";
      tipoRecorrencia = "Diária";
      confiancaRecorrencia = 0.9;
    } else if (padroes.anual.test(msgLower)) {
      recorrente = "Sim";
      tipoRecorrencia = "Anual";
      confiancaRecorrencia = 0.9;
    }

    console.log('🔄 Recorrência:', recorrente, tipoRecorrencia);

    // ========================================================================
    // STEP 6: GERAR DESCRIÇÃO INTELIGENTE
    // ========================================================================
    let descricao = msgOriginal;
    
    // Limpar descrição removendo elementos já extraídos
    descricao = descricao.replace(padroes.valor, ' ');
    descricao = descricao.replace(padroes.dataHoje, ' ');
    descricao = descricao.replace(padroes.dataOntem, ' ');
    descricao = descricao.replace(padroes.dataAmanha, ' ');
    descricao = descricao.replace(padroes.dataFormatada, ' ');
    descricao = descricao.replace(padroes.acoesPago, ' ');
    descricao = descricao.replace(padroes.acoesNaoPago, ' ');
    descricao = descricao.replace(padroes.recorrente, ' ');
    descricao = descricao.replace(padroes.semanal, ' ');
    descricao = descricao.replace(padroes.anual, ' ');
    
    // Limpar espaços extras
    descricao = descricao.replace(/\s+/g, ' ').trim();
    
    // Se descrição ficou muito curta, criar uma baseada na categoria
    if (descricao.length < 5) {
      const valorFormatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      descricao = `${melhorCategoria} - ${valorFormatado}`;
    }

    // ========================================================================
    // STEP 7: CALCULAR CONFIANÇA GERAL
    // ========================================================================
    const confiancaGeral = (
      confiancaCategoria * 0.3 + 
      confiancaPagamento * 0.2 + 
      confiancaData * 0.2 + 
      confiancaRecorrencia * 0.1 + 
      0.2 // Base para valor extraído
    );

    const resultado = {
      sucesso: true,
      categoria: melhorCategoria,
      valor: valor,
      data: data,
      descricao: descricao,
      pago: pago,
      recorrente: recorrente,
      tipoRecorrencia: tipoRecorrencia,
      loja: "WhatsApp",
      confianca: Math.round(confiancaGeral * 100) / 100,
      detalhes: {
        valorOriginal: matchValor[1],
        confiancaCategoria,
        confiancaPagamento,
        confiancaData,
        confiancaRecorrencia
      }
    };

    console.log('🎯 IA resultado:', resultado);
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro na IA:', error);
    return { 
      sucesso: false, 
      erro: `Erro no processamento: ${error.message}` 
    };
  }
}

// ============================================================================
// GERADOR DE RESPOSTA MULTI-USUÁRIO
// ============================================================================
function gerarRespostaConfirmacaoMultiUsuario(saida, dadosUsuario) {
  try {
    const dataFormatada = new Date(saida.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const valorFormatado = saida.valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    
    // Emoji baseado na categoria
    const emojiCategoria = {
      'Aluguel': '🏠',
      'Energia': '⚡',
      'Internet': '🌐',
      'Água': '💧',
      'Telefone': '📱',
      'Combustível': '⛽',
      'Alimentação': '🍽️',
      'Transporte': '🚗',
      'Material': '📦',
      'Marketing': '📢',
      'Saúde': '🏥',
      'Educação': '📚',
      'Limpeza': '🧽',
      'Segurança': '🛡️',
      'Manutenção': '🔧',
      'Impostos': '🏛️',
      'Financeiro': '🏦'
    };
    
    const emoji = emojiCategoria[saida.categoria] || '📊';
    
    let resposta = `✅ *Saída registrada com sucesso!*\n\n`;
    
    // Saudação personalizada
    if (dadosUsuario) {
      resposta += `👋 Olá, *${dadosUsuario.nome}*!\n\n`;
    }
    
    resposta += `💰 *Valor:* ${valorFormatado}\n`;
    resposta += `${emoji} *Categoria:* ${saida.categoria}\n`;
    resposta += `📝 *Descrição:* ${saida.descricao}\n`;
    resposta += `📅 *Data:* ${dataFormatada}\n`;
    resposta += `💳 *Status:* ${saida.pago === "Sim" ? "Pago ✅" : "Pendente ⏳"}\n`;
    
    if (saida.recorrente === "Sim") {
      resposta += `🔄 *Recorrência:* ${saida.tipoRecorrencia}\n`;
    }
    
    // Informações do usuário
    resposta += `\n👤 *Registrado por:* ${saida.usuarioNome}\n`;
    resposta += `📱 *Via WhatsApp:* ***${saida.usuarioNumero.slice(-4)}\n`;
    
    // Adicionar confiança se disponível
    if (saida.confianca) {
      const porcentagem = Math.round(saida.confianca * 100);
      resposta += `🎯 *Confiança IA:* ${porcentagem}%\n`;
    }
    
    resposta += `⏰ ${saida.processadoEm}`;
    resposta += `\n\n💡 *Dica:* Dados consolidados no painel compartilhado!`;
    resposta += `\n🤝 *Sistema multi-usuário* ativo para toda equipe`;
    
    return resposta;
    
  } catch (error) {
    console.error('❌ Erro ao gerar resposta multi-usuário:', error);
    return `✅ Saída registrada com sucesso!\n\n💰 Valor: ${saida.valor}\n🏷️ Categoria: ${saida.categoria}\n👤 Por: ${saida.usuarioNome}\n📱 Via WhatsApp Multi-Usuário`;
  }
}

function gerarRespostaErro(erro, dadosUsuario) {
  const saudacao = dadosUsuario ? `Olá, *${dadosUsuario.nome}*!\n\n` : '';
  
  return `${saudacao}❌ ${erro}\n\n💡 *Exemplos válidos:*\n• "Paguei R$ 500 de aluguel hoje"\n• "Gastei R$ 80 de gasolina ontem"\n• "Devo R$ 200 de internet"\n\n🤝 *Sistema multi-usuário* iClub`;
}