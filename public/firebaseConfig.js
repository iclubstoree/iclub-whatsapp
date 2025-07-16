// firebaseConfig.js - CONFIGURAÇÃO REAL DO SEU PROJETO
// ⚠️ SUBSTITUA pelas configurações do SEU projeto Firebase

const firebaseConfig = {
  // 🔥 COLE AQUI AS CONFIGURAÇÕES DO SEU FIREBASE
  // Pegar em: Firebase Console > Configurações do projeto > Configuração do SDK
  
  apiKey: "SUA-API-KEY-AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// 📋 EXEMPLO de como deve ficar (com suas configurações reais):
/*
const firebaseConfig = {
  apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789",
  authDomain: "iclub-saidas.firebaseapp.com",
  projectId: "iclub-saidas",
  storageBucket: "iclub-saidas.appspot.com",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:1234567890abcdef"
};
*/

// ============================================================================
// COMO PEGAR SUAS CONFIGURAÇÕES:
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
Vá em Firestore Database > Rules e cole estas regras:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso a todas as coleções do iClub
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

⚠️ ATENÇÃO: Estas regras permitem acesso total. 
Para produção, configure regras mais restritivas.
*/

// ============================================================================
// COLEÇÕES QUE SERÃO CRIADAS AUTOMATICAMENTE:
// ============================================================================

/*
1. 📊 saidasProfissional - Todas as saídas (pagas e pendentes)
2. ⚙️ configuracoes - Categorias, lojas e usuários
3. 📈 estatisticasUsuario - Estatísticas por usuário (opcional)

O sistema criará essas coleções automaticamente quando você adicionar a primeira saída.
*/

// Não altere nada abaixo desta linha
export default firebaseConfig;