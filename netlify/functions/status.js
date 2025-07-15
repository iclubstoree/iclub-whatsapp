// ============================================================================
// netlify/functions/status.js
// VERIFICAÇÃO DE STATUS DO SISTEMA
// ============================================================================

const admin = require('firebase-admin');

// Inicializar Firebase se não estiver inicializado
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase no status:', error);
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const timestamp = new Date();
    const statusData = {
      status: 'online',
      timestamp: timestamp.toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    };

    // Testar Firebase
    try {
      const db = admin.firestore();
      
      // Tentar acessar a coleção (sem criar documento)
      const testQuery = await db.collection('saidasProfissional').limit(1).get();
      
      statusData.firebase = {
        status: 'connected',
        collections: ['saidasProfissional'],
        lastCheck: timestamp.toISOString()
      };
      
      // Estatísticas básicas (se houver dados)
      if (!testQuery.empty) {
        statusData.firebase.documentsCount = testQuery.size;
      }
      
    } catch (firebaseError) {
      console.error('❌ Erro Firebase no status:', firebaseError);
      statusData.firebase = {
        status: 'error',
        error: firebaseError.message,
        lastCheck: timestamp.toISOString()
      };
    }

    // Verificar variáveis de ambiente
    statusData.config = {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      netlifyFunctions: true
    };

    // Informações do sistema
    statusData.system = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: 'pt-BR'
    };

    // URLs importantes
    statusData.endpoints = {
      webhook: '/.netlify/functions/webhook-whatsapp',
      status: '/.netlify/functions/status',
      test: '/.netlify/functions/test-webhook'
    };

    const statusCode = statusData.firebase?.status === 'connected' ? 200 : 207;

    return {
      statusCode,
      headers,
      body: JSON.stringify(statusData, null, 2)
    };

  } catch (error) {
    console.error('❌ Erro geral no status:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        details: 'Erro interno no sistema de status'
      }, null, 2)
    };
  }
};