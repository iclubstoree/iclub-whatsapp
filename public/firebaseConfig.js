// firebaseConfig.js - CONFIGURAÇÃO REAL DO SEU PROJETO FIREBASE
// ⚠️ IMPORTANTE: SUBSTITUA pelas configurações do SEU projeto Firebase

const firebaseConfig = {
  // 🔥 COLE AQUI AS CONFIGURAÇÕES DO SEU FIREBASE
  // Pegar em: Firebase Console > Configurações do projeto > Configuração do SDK
  
  apiKey: "AIzaSyC8Q5X4Z9Y2A3B1C2D3E4F5G6H7I8J9K0L",
  authDomain: "iclub-saidas.firebaseapp.com",
  projectId: "iclub-saidas",
  storageBucket: "iclub-saidas.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1a2b3c4d5e6f7g8h9i0j"
};

// ============================================================================
// COMO PEGAR SUAS CONFIGURAÇÕES REAIS:
// ============================================================================

/*
1. 🌐 Acesse: https://console.firebase.google.com
2. 🏗️ Selecione seu projeto (ou crie um novo)
3. ⚙️ Vá em "Configurações do projeto" (ícone de engrenagem)
4. 📱 Na aba "Geral", role até "Seus apps"
5. 🌐 Clique no ícone "</>" (Web app)
6. 📋 Copie a configuração que aparece
7. 📝 Cole aqui substituindo o exemplo acima

Exemplo do que vai aparecer:
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
*/

// ============================================================================
// REGRAS DE FIRESTORE NECESSÁRIAS:
// ============================================================================

/*
1. 🌐 Acesse: https://console.firebase.google.com
2. 🏗️ Selecione seu projeto
3. 🗃️ Clique em "Firestore Database"
4. 📋 Clique em "Rules" (Regras)
5. 📝 Cole estas regras:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso total para desenvolvimento
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

6. 🚀 Clique em "Publicar"

⚠️ ATENÇÃO: Estas regras permitem acesso total. 
Para produção, configure regras mais restritivas.
*/

// ============================================================================
// COLEÇÕES QUE SERÃO CRIADAS AUTOMATICAMENTE:
// ============================================================================

/*
O sistema criará automaticamente estas coleções no Firestore:

1. 📊 saidasProfissional 
   - Estrutura: {
       id: "string",
       usuario: "string", // Novo campo para identificar quem criou
       loja: "string",
       categoria: "string", 
       descricao: "string",
       valor: number,
       data: "YYYY-MM-DD",
       recorrente: "Sim" | "Não",
       tipoRecorrencia: "Diária" | "Semanal" | "Mensal" | "Anual" | "Personalizada" | null,
       configRecorrencia: {
         tipo: "string",
         diasIntervalo: number,
         mesesAtivos: [number],
         anoRecorrencia: number
       },
       pago: "Sim" | "Não",
       origem: "manual" | "chat" | "multiplas",
       timestamp: timestamp,
       dataProcessamento: "string",
       processadoEm: "string",
       editadoEm: "string", // Histórico de edições
       editadoPor: "string",
       pagoEm: "string", // Quando foi marcado como pago
       pagoPor: "string" // Quem marcou como pago
     }

2. ⚙️ configuracoes
   - Estrutura: {
       tipo: "categorias" | "lojas",
       lista: ["array", "de", "strings"],
       ultimaAtualizacao: timestamp,
       atualizadoPor: "string"
     }

3. 👥 usuarios (Novo para sistema multi-usuário)
   - Estrutura: {
       id: "string",
       nome: "string",
       email: "string",
       senha: "hash",
       permissoes: {
         adicionar: boolean,
         editar: boolean,
         excluir: boolean,
         configurar: boolean
       },
       criadoEm: timestamp,
       ultimoLogin: timestamp
     }

4. 📈 estatisticasUsuario
   - Estrutura: {
       usuarioId: "string",
       usuarioNome: "string", 
       mes: "YYYY-MM",
       totalSaidas: number,
       totalValor: number,
       categorias: {categoria: valor},
       lojas: {loja: valor},
       criadoEm: timestamp,
       ultimaAtualizacao: timestamp
     }

5. 🧠 treinamentoIA (Novo para Chat IA)
   - Estrutura: {
       id: "string",
       usuarioId: "string",
       frase: "string",
       categoria: "string",
       valor: number,
       loja: "string",
       tipo: "manual" | "natural",
       criadoEm: timestamp
     }
*/

// ============================================================================
// FUNCIONALIDADES V4.0 IMPLEMENTADAS:
// ============================================================================

/*
✅ Sistema de Login Multi-usuário
✅ Menu de Configurações Completo
✅ Seleção Múltipla com Ações em Lote
✅ Paginação em Todas as Seções
✅ Badges Coloridos para "Recorrente"
✅ Exclusão Universal (qualquer saída pode ser excluída)
✅ Site Totalmente Responsivo
✅ Gráficos Atualizados Automaticamente
✅ Chat IA Melhorado com Treinamento
✅ Coluna "Usuário" em Todas as Tabelas
✅ Múltiplas Saídas com Todas as Funcionalidades
✅ Análise Inteligente de Dados
✅ Comparativo Entre Lojas
✅ Sistema de Backup e Exportação
✅ Notificações Inteligentes
✅ Filtros Avançados para Recorrentes
*/

// ============================================================================
// MELHORIAS DE EXPERIÊNCIA DO USUÁRIO:
// ============================================================================

/*
🎨 DESIGN MODERNO:
- Interface completamente responsiva
- Animações suaves e transições
- Cores e gradientes modernos
- Badges coloridos para status
- Cards com hover effects

⚡ PERFORMANCE:
- Lazy loading de dados
- Paginação inteligente
- Cache local com localStorage
- Gráficos otimizados

🔧 USABILIDADE:
- Menu de configurações intuitivo
- Seleção múltipla com feedback visual
- Notificações contextuais
- Atalhos de teclado no chat
- Validação em tempo real

📱 RESPONSIVIDADE:
- Layout adaptativo para celular
- Gráficos responsivos
- Menus otimizados para touch
- Tabelas com scroll horizontal
- Modais redimensionáveis
*/

// ============================================================================
// ESTRUTURA DE ARQUIVOS ATUALIZADA:
// ============================================================================

/*
📁 Projeto iClub V4.0:
/
├── index.html (Interface principal com login)
├── painel.js (Lógica completa do sistema)
├── firebaseConfig.js (Este arquivo)
├── netlify.toml (Configuração de deploy)
├── package.json (Dependências npm)
├── README.md (Documentação)
└── netlify/functions/ (Funções serverless)
    ├── webhook-whatsapp.js
    ├── status.js
    ├── test-webhook.js
    └── auth.js (Nova função de autenticação)
*/

// ============================================================================
// INSTRUÇÕES DE DEPLOY ATUALIZADAS:
// ============================================================================

/*
🚀 Deploy no Netlify:

1. 📁 Estrutura de arquivos correta ✅
2. 🔧 Configurar variáveis de ambiente:
   - FIREBASE_PROJECT_ID: seu-projeto-id
   - FIREBASE_CLIENT_EMAIL: email@seu-projeto.iam.gserviceaccount.com
   - FIREBASE_PRIVATE_KEY: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   - JWT_SECRET: chave-secreta-para-tokens

3. 🌐 Conectar repositório GitHub ao Netlify
4. ⚙️ Configurações de build:
   - Build command: npm install
   - Publish directory: public
   - Functions directory: netlify/functions

5. 🎯 Deploy automático configurado ✅
*/

// ============================================================================
// TESTES DE FUNCIONAMENTO COMPLETOS:
// ============================================================================

/*
Após configurar tudo, teste TODAS as funcionalidades:

🔐 SISTEMA DE LOGIN:
✅ Login com credenciais corretas
✅ Erro com credenciais incorretas
✅ Sessão mantida após reload
✅ Logout funcional

💬 CHAT IA:
✅ Interpretação de linguagem natural
✅ Adição automática de saídas
✅ Treinamento da IA
✅ Histórico de mensagens

📝 FORMULÁRIOS:
✅ Adicionar saída simples
✅ Adicionar múltiplas saídas
✅ Recorrência personalizada
✅ Validação de campos

📊 TABELAS E LISTAS:
✅ Seleção múltipla
✅ Ações em lote (pagar/editar/excluir)
✅ Paginação funcional
✅ Filtros avançados

📈 GRÁFICOS:
✅ Atualização automática
✅ Responsividade
✅ Comparativo entre lojas
✅ Filtros por loja

⚙️ CONFIGURAÇÕES:
✅ Editar categorias e lojas
✅ Permissões de usuário
✅ Alertas e notificações
✅ Backup e exportação

🔧 RESPONSIVIDADE:
✅ Layout mobile otimizado
✅ Tabelas com scroll
✅ Menus adaptativos
✅ Gráficos responsivos
*/

// ============================================================================
// RESOLUÇÃO DE PROBLEMAS ATUALIZADOS:
// ============================================================================

/*
❌ Login não funciona:
✅ Verificar credenciais demo no código
✅ Verificar localStorage para sessão

❌ Gráficos não atualizam:
✅ Verificar função atualizarGraficos()
✅ Verificar filtros aplicados

❌ Seleção múltipla não funciona:
✅ Verificar eventos onchange nos checkboxes
✅ Verificar arrays selecionados

❌ Paginação não aparece:
✅ Verificar se há mais de 10 itens
✅ Verificar elementos HTML de paginação

❌ Chat IA não responde:
✅ Verificar interpretarMensagemIA()
✅ Verificar padrões de regex

❌ Site não responsivo:
✅ Verificar CSS media queries
✅ Verificar viewport meta tag

❌ Dados não salvam:
✅ Verificar salvarDadosLocal()
✅ Verificar localStorage disponível

❌ Notificações não aparecem:
✅ Verificar mostrarNotificacaoInteligente()
✅ Verificar CSS de posicionamento
*/

// ============================================================================
// PRÓXIMAS VERSÕES PLANEJADAS:
// ============================================================================

/*
🚀 V4.1 - Melhorias de Performance:
- Cache inteligente
- Lazy loading avançado
- Compressão de dados
- PWA (Progressive Web App)

🚀 V4.2 - Integrações:
- WhatsApp Business API
- Google Sheets sync
- Banco de dados real
- API REST completa

🚀 V4.3 - Analytics Avançado:
- Machine Learning para previsões
- Relatórios automáticos
- Dashboards personalizáveis
- Exportação para BI

🚀 V4.4 - Multi-empresa:
- Gestão de múltiplas empresas
- Relatórios consolidados
- Permissões granulares
- Auditoria completa
*/

// Não altere nada abaixo desta linha
export default firebaseConfig;