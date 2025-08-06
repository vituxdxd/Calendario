# Funcionalidade de Backup e Restauração

## Visão Geral

O sistema MedStride agora inclui uma funcionalidade completa de backup e restauração que permite aos usuários:

1. **Exportar** todos os seus dados de estudo em um arquivo JSON
2. **Importar** dados de backup para restaurar o progresso anterior
3. **Migrar** dados entre dispositivos ou instalações

## Como Usar

### Exportando um Backup

1. Na tela principal (Dashboard), clique no botão **"Backup"** no canto superior direito
2. No diálogo que abrir, você verá um resumo dos seus dados atuais
3. Clique em **"Baixar Backup"** para gerar e baixar o arquivo JSON
4. O arquivo será salvo com o nome `med-stride-backup-YYYY-MM-DD.json`

### Importando um Backup

1. Na tela principal (Dashboard), clique no botão **"Backup"**
2. Na seção "Importar Backup", clique em **"Escolher arquivo"**
3. Selecione o arquivo `.json` de backup que você deseja importar
4. Um diálogo de confirmação aparecerá mostrando:
   - Número de exercícios no backup
   - Número de sessões de estudo no backup
   - Número de registros de quiz no backup
   - Data de criação do backup
5. ⚠️ **ATENÇÃO**: Importar um backup substituirá TODOS os seus dados atuais
6. Clique em **"Sim, Importar Backup"** para confirmar
7. O sistema recarregará automaticamente para aplicar os novos dados

## Estrutura do Arquivo de Backup

O arquivo de backup contém todos os dados necessários para restaurar completamente o estado do aplicativo:

```json
{
  "exercises": [...],           // Todos os exercícios criados
  "studySessions": [...],       // Histórico de sessões de estudo
  "quizAnswers": {...},         // Respostas detalhadas dos quizzes
  "createdAt": "2025-01-05T...", // Data de criação do backup
  "version": "1.0.0"            // Versão do formato do backup
}
```

### Dados Incluídos no Backup

#### Exercícios (`exercises`)
- Título e descrição
- Matéria e dificuldade
- Todas as questões com respostas e explicações
- Dados de repetição espaçada (intervalo, repetições, fator de facilidade)
- Estatísticas de desempenho
- Datas de criação e próxima revisão

#### Sessões de Estudo (`studySessions`)
- Histórico completo de todas as sessões realizadas
- Pontuação e tempo gasto
- Log detalhado de cada resposta

#### Respostas dos Quizzes (`quizAnswers`)
- Respostas detalhadas para cada questão
- Tempo gasto por questão
- Indicador de acerto/erro
- Histórico de revisões

## Casos de Uso

### 1. Backup Regular
- Recomenda-se fazer backup semanalmente
- Especialmente antes de realizar muitas mudanças
- Antes de limpar dados ou reinstalar o aplicativo

### 2. Migração de Dispositivos
- Exportar backup do dispositivo antigo
- Importar backup no novo dispositivo
- Todos os dados e progresso serão transferidos

### 3. Compartilhamento de Dados
- Professores podem criar exercícios e compartilhar via backup
- Estudantes podem importar exercícios pré-criados
- Grupos de estudo podem sincronizar conteúdo

### 4. Recuperação de Dados
- Em caso de perda acidental de dados
- Após problemas técnicos
- Para restaurar versões anteriores

## Validações de Segurança

O sistema inclui várias validações para garantir a integridade dos dados:

### Validação de Arquivo
- Verifica se o arquivo é um JSON válido
- Confirma se tem a extensão `.json`
- Valida a estrutura geral do backup

### Validação de Dados
- Verifica se todos os exercícios têm estrutura válida
- Confirma se as sessões de estudo estão bem formadas
- Valida se os quiz answers estão corretos
- Verifica integridade das referências entre dados

### Diálogo de Confirmação
- Mostra preview dos dados que serão importados
- Avisa claramente sobre substituição de dados
- Permite cancelar a operação a qualquer momento

## Solução de Problemas

### Erro: "Formato de arquivo inválido"
- Verifique se o arquivo tem extensão `.json`
- Confirme se é um arquivo de backup válido do MedStride
- Tente abrir o arquivo em um editor de texto para verificar se não está corrompido

### Erro: "Estrutura inválida no backup"
- O arquivo pode estar corrompido
- Pode ser de uma versão incompatível
- Verifique se todas as seções obrigatórias estão presentes

### Backup não é importado
- Verifique o console do navegador para erros detalhados
- Confirme se há espaço suficiente no navegador para os dados
- Tente com um arquivo de backup menor para teste

## Limitações

- O backup é específico para o navegador/dispositivo atual
- Dados muito grandes podem causar lentidão na importação
- Backups de versões futuras podem não ser compatíveis com versões anteriores

## Recomendações

1. **Backup Regular**: Faça backup pelo menos uma vez por semana
2. **Nomenclatura**: Mantenha nomes descritivos nos arquivos (`backup-antes-prova-anatomia.json`)
3. **Armazenamento**: Guarde backups em múltiplos locais (nuvem, disco local)
4. **Teste**: Teste periodicamente a restauração em um ambiente separado
5. **Limpeza**: Remova backups muito antigos para economizar espaço
