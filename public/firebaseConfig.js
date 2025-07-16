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
       loja: "string",
       categoria: "string", 
       descricao: "string",
       valor: number,
       data: "YYYY-MM-DD",
       recorrente: "Sim" | "Não",
       tipoRecorrencia: "Diária" | "Semanal" | "Mensal" | "Anual" | null,
       pago: "Sim" | "Não",
       origem: "manual" | "chat" | "multiplas",
       timestamp: timestamp,
       dataProcessamento: "string",
       processadoEm: "string"
     }

2. ⚙️ configuracoes
   - Estrutura: {
       tipo: "categorias" | "lojas",
       lista: ["array", "de", "strings"],
       ultimaAtualizacao: timestamp
     }

3. 📈 estatisticasUsuario (opcional para multi-usuário)
   - Estrutura: {
       usuarioNumero: "string",
       usuarioNome: "string", 
       mes: "YYYY-MM",
       totalSaidas: number,
       totalValor: number,
       categorias: {categoria: valor},
       criadoEm: timestamp,
       ultimaAtualizacao: timestamp
     }
*/

// ============================================================================
// INSTRUÇÕES DE DEPLOY NO NETLIFY:
// ============================================================================

/*
1. 📁 Estrutura de arquivos:
   /
   ├── index.html
   ├── painel.js
   ├── firebaseConfig.js
   ├── netlify.toml
   ├── package.json
   └── netlify/functions/
       ├── webhook-whatsapp.js
       ├── status.js
       └── test-webhook.js

2. 🌐 Variáveis de ambiente no Netlify:
   - FIREBASE_PROJECT_ID: seu-projeto-id
   - FIREBASE_CLIENT_EMAIL: email@seu-projeto.iam.gserviceaccount.com
   - FIREBASE_PRIVATE_KEY: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

3. 🚀 Deploy:
   - Conecte seu repositório GitHub ao Netlify
   - Configure build command: npm install
   - Configure publish directory: public
   - Configure variáveis de ambiente
   - Deploy!
*/

// ============================================================================
// TESTES DE FUNCIONAMENTO:
// ============================================================================

/*
Após configurar tudo:

1. ✅ Teste o Chat IA:
   - Digite: "Paguei R$ 500 de aluguel hoje"
   - Deve processar e adicionar automaticamente

2. ✅ Teste o formulário manual:
   - Preencha campos e clique "Adicionar Saída"
   - Deve salvar no Firebase

3. ✅ Teste múltiplas saídas:
   - Clique "Adicionar Múltiplas Saídas"
   - Adicione várias linhas
   - Clique "Adicionar Todas Saídas"

4. ✅ Teste categorias/lojas:
   - Clique "Editar Categorias"
   - Adicione nova categoria
   - Deve salvar no Firebase

5. ✅ Teste exclusão:
   - Clique no botão de lixeira em uma saída
   - Deve excluir do Firebase

6. ✅ Teste sincronização:
   - Abra em outro navegador
   - Dados devem aparecer automaticamente
   - Mudanças devem sincronizar em tempo real
*/

// ============================================================================
// RESOLUÇÃO DE PROBLEMAS COMUNS:
// ============================================================================

/*
❌ Erro: "Firebase not initialized"
✅ Solução: Verifique as configurações acima

❌ Erro: "Permission denied"  
✅ Solução: Configure as regras do Firestore

❌ Erro: Dados não sincronizam
✅ Solução: Verifique conexão com internet e configurações

❌ Erro: Botões não funcionam
✅ Solução: Verifique se está usando o painel.js corrigido

❌ Erro: Chat IA não responde
✅ Solução: Verifique se digitou valor e categoria válidos

❌ Erro: "localStorage only"
✅ Solução: Firebase não conectado, funcionando offline
*/

// Não altere nada abaixo desta linha
export default firebaseConfig;