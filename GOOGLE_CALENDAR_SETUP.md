# 📅 Configuração do Google Calendar

Este guia te ajudará a conectar sua aplicação Med Stride Calendar com o Google Calendar para sincronizar automaticamente seus exercícios.

## 🚀 Passo a Passo para Configuração

### 1. Acesse o Google Cloud Console
1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google (a mesma que você usa no Google Calendar)

### 2. Crie ou Selecione um Projeto
1. Clique no seletor de projeto no topo da página
2. Clique em "Novo Projeto" ou selecione um existente
3. Dê um nome como "Med Stride Calendar"

### 3. Habilite a Google Calendar API
1. Vá para "APIs e Serviços" > "Biblioteca"
2. Pesquise por "Google Calendar API"
3. Clique na API e depois em "Habilitar"

### 4. Crie Credenciais OAuth 2.0
1. Vá para "APIs e Serviços" > "Credenciais"
2. Clique em "Criar credenciais" > "ID do cliente OAuth"
3. Selecione "Aplicativo da Web"
4. Nome: "Med Stride Calendar Client"
5. **Origens JavaScript autorizadas**: Adicione `http://localhost:8080`
6. **URIs de redirecionamento autorizados**: Adicione `http://localhost:8080`
7. Clique em "Criar"

### 5. Obtenha uma API Key
1. Ainda em "Credenciais", clique em "Criar credenciais" > "Chave de API"
2. Copie a chave gerada
3. **IMPORTANTE**: Clique em "Restringir chave" e configure:
   - **Restrições de aplicativo**: Selecione "Referenciadores HTTP (sites)"
   - **Restrições de referenciador de sites**: Adicione:
     - `http://localhost:8080/*`
     - `http://127.0.0.1:8080/*`
   - **Restrições de API**: Selecione "Restringir chave" e marque apenas:
     - ✅ Google Calendar API

### 4.1. **Configurações Importantes do OAuth 2.0:**
Após criar as credenciais OAuth, certifique-se de:

1. **Origens JavaScript autorizadas:**
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`

2. **URIs de redirecionamento autorizados:**
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`

3. **Tela de consentimento OAuth:**
   - Vá em "APIs e Serviços" > "Tela de consentimento OAuth"
   - Se estiver em modo "Externo" e "Em teste":
     - Adicione seu email em "Usuários de teste"
   - Em "Escopos", adicione:
     - `.../auth/calendar.events` (para criar/editar eventos)

### 6. Configure no seu Projeto
1. Na raiz do projeto Med Stride Calendar, crie um arquivo `.env`:

```env
# Configuração Google Calendar API
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua_api_key_aqui
```

2. Substitua os valores pelas suas credenciais obtidas nos passos anteriores

### 7. Reinicie a Aplicação
```bash
npm run dev
```

## ✅ Como Usar

1. **Navegue até o Dashboard**: Você verá um card "Google Calendar" na barra lateral direita
2. **Clique em "Conectar Google Calendar"**: Uma janela popup aparecerá
3. **Faça login**: Use a mesma conta Google do seu calendário
4. **Autorize**: Permita o acesso ao seu Google Calendar
5. **Sincronize**: Clique em "Sincronizar Exercícios"

## 🎯 O que Acontece

- ✨ Cada exercício vira um evento no seu Google Calendar
- ⏰ Eventos têm duração de 1 hora na data de revisão agendada
- 🔔 Lembretes automáticos: 30 minutos antes (popup) + 1 hora antes (email)
- 📝 Descrição completa: matéria, dificuldade, número de questões
- 🏷️ Título: "📚 Revisão: [Nome do Exercício]"

## 🔒 Segurança

- Suas credenciais ficam apenas no seu computador (arquivo `.env`)
- O token de acesso é armazenado localmente no navegador
- Você pode desconectar a qualquer momento clicando em "Desconectar"

## ❗ Dicas Importantes

1. **Arquivo `.env`**: Nunca compartilhe este arquivo! Adicione `.env` no `.gitignore`
2. **Mesma conta**: Use a mesma conta Google que você acessa o Google Calendar
3. **Localhost**: A configuração atual funciona apenas em `http://localhost:8080`
4. **Firewall**: Certifique-se que a porta 8080 não está bloqueada

## 🆘 Problemas Comuns

### "Erro na autenticação"
- Verifique se as credenciais estão corretas no arquivo `.env`
- Confirme que adicionou `http://localhost:8080` nas origens autorizadas

### "Não foi possível sincronizar"
- Verifique sua conexão com internet
- Confirme que a Google Calendar API está habilitada
- Tente desconectar e conectar novamente

### "This app isn't verified"
- Clique em "Advanced" e depois "Go to Med Stride Calendar (unsafe)"
- Isso é normal para aplicações em desenvolvimento

---

🎓 **Pronto!** Agora você pode sincronizar seus estudos médicos com o Google Calendar e nunca mais perder uma revisão importante! 