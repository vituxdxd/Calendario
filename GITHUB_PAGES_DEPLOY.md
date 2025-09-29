# Deploy no GitHub Pages

Este guia mostra como configurar e fazer deploy da aplicação Medstride no GitHub Pages.

## Pré-requisitos

1. Repositório no GitHub
2. Node.js instalado (versão 18 ou superior)
3. Projeto commitado no GitHub

## Configuração Automática (Recomendada)

### 1. Habilitar GitHub Pages

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione **GitHub Actions**

### 2. Push do código

O deploy acontecerá automaticamente quando você fizer push para a branch `main`. O workflow do GitHub Actions irá:

- Instalar as dependências
- Fazer o build da aplicação
- Fazer deploy para GitHub Pages

### 3. Acessar a aplicação

Após o deploy, sua aplicação estará disponível em:
```
https://vituxdxd.github.io/Calendario/
```

## Configuração Manual (Alternativa)

### 1. Instalar gh-pages

```bash
npm install --save-dev gh-pages
```

### 2. Fazer deploy manual

```bash
npm run deploy
```

## Estrutura de Arquivos Adicionados

- `.github/workflows/deploy.yml` - Workflow do GitHub Actions
- Modificações em `vite.config.ts` - Base URL configurada para GitHub Pages
- Modificações em `package.json` - Script de deploy adicionado

## Troubleshooting

### Build falhando?
- Verifique se todas as dependências estão instaladas
- Certifique-se de que não há erros de TypeScript

### 404 após deploy?
- Verifique se o nome do repositório está correto no `vite.config.ts`
- Certifique-se de que o GitHub Pages está habilitado nas configurações do repositório

### Recursos não carregando?
- Verifique se a `base` URL no `vite.config.ts` está correta
- Certifique-se de que todos os caminhos são relativos

## Atualizações

Para atualizar a aplicação, basta fazer push das suas mudanças para a branch `main`. O deploy será automático.

```bash
git add .
git commit -m "Atualização da aplicação"
git push origin main
```

## Monitoramento

Você pode acompanhar o status do deploy na aba **Actions** do seu repositório no GitHub.