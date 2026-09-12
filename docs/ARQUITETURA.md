# Arquitetura inicial do SGJ

## Direção técnica

O SGJ será disponibilizado em **duas plataformas oficiais**:

1. **Web/PWA** — acesso por navegador em computador, celular ou tablet.
2. **Desktop para PC/Windows** — aplicativo instalável, com recursos locais e operação offline nas funções críticas.

As duas versões deverão compartilhar a mesma API, regras de negócio, autenticação, permissões e base central de dados. A versão para PC terá armazenamento local para permitir continuidade de operação sem internet e sincronização posterior.

## Stack proposta

### Backend central

- PHP 8.2+ com Laravel
- API REST autenticada
- MySQL 8+ ou PostgreSQL
- filas para e-mail, notificações, relatórios e sincronizações
- jobs agendados para rotinas automáticas

### Frontend compartilhado

- Vue 3 + TypeScript + Vite
- biblioteca de componentes compartilhada entre Web e Desktop
- interface responsiva e acessível

### Web/PWA

- service worker
- cache da aplicação
- IndexedDB para dados offline temporários
- instalação como PWA em navegadores compatíveis

### Desktop PC/Windows

- Tauri como shell desktop
- frontend compartilhado com a versão Web
- banco local SQLite para cache e operação offline autorizada
- armazenamento seguro de credenciais/tokens do dispositivo
- sincronização automática com o servidor ao recuperar conexão
- instalador para Windows
- atualizações versionadas

### DevOps

- GitHub para versionamento
- GitHub Actions para CI/CD
- ambientes separados de desenvolvimento, homologação e produção

## Estrutura sugerida do repositório

```text
/
├── apps/
│   ├── web/                 # aplicação Web/PWA
│   └── desktop/             # shell Tauri para Windows
├── packages/
│   ├── ui/                  # componentes visuais compartilhados
│   ├── core/                # tipos, validações e regras compartilháveis
│   └── sync/                # cliente e regras de sincronização
├── server/                  # Laravel/API e regras centrais
├── docs/                    # documentação do projeto
└── .github/workflows/       # CI/CD
```

## Organização por domínios

A aplicação deve ser dividida por domínios, evitando um código monolítico sem fronteiras claras:

1. Identidade e acesso
2. Pessoas e responsáveis
3. Grupos e equipes
4. Eventos e inscrições
5. Presença e check-in
6. Acompanhamento
7. Escalas e voluntariado
8. Comunicação
9. Formação
10. Documentos
11. Financeiro operacional
12. Patrimônio
13. Mídia
14. Relatórios
15. Auditoria e configurações

## Multi-organização

Mesmo que a primeira instalação utilize apenas um grupo, o modelo deve ser preparado para suportar múltiplas organizações no futuro. Registros funcionais deverão possuir vínculo com `organization_id` quando aplicável.

## Estratégia offline

A primeira função offline obrigatória será presença/check-in, seguida por consultas básicas de pessoas, eventos e escalas.

### Fluxo esperado

1. baixar previamente eventos e dados autorizados para o dispositivo;
2. registrar ações localmente;
3. identificar cada operação com UUID;
4. manter fila local de sincronização;
5. sincronizar quando houver conexão;
6. garantir idempotência para evitar registros duplicados;
7. detectar conflitos de alteração;
8. registrar conflitos para revisão quando não puderem ser resolvidos automaticamente.

A versão Web utilizará IndexedDB. A versão Desktop utilizará SQLite local.

## Fonte de verdade

O banco de dados central do servidor será a fonte oficial de dados. O banco SQLite do PC funcionará como armazenamento local controlado e fila de sincronização, não como banco independente definitivo.

## Autenticação e autorização

- sessão/token seguro
- recuperação de senha
- 2FA opcional
- RBAC: usuários, funções e permissões
- permissões por módulo e ação
- possibilidade futura de escopo por grupo/equipe
- registro e identificação de dispositivos autorizados

## Auditoria

Ações críticas devem registrar:

- usuário
- dispositivo/origem
- ação
- entidade
- identificador do registro
- data/hora
- IP quando aplicável
- estado anterior
- estado posterior
- UUID da operação quando sincronizada offline

Logs de auditoria não devem ser editáveis por usuários comuns.

## Segurança

- senhas com hashing forte
- CSRF para fluxos Web aplicáveis
- validação de entrada no cliente e obrigatoriamente no servidor
- ORM/query builder e consultas parametrizadas
- rate limiting
- arquivos privados fora da pasta pública
- URLs temporárias para documentos protegidos
- criptografia para campos selecionados quando necessário
- princípio do menor privilégio
- armazenamento local restrito ao mínimo necessário
- expiração e revogação de dispositivos/tokens

## LGPD

O projeto deverá incorporar privacy by design:

- finalidade de tratamento documentada
- minimização de dados
- acesso restrito
- consentimentos quando juridicamente aplicáveis
- logs de acesso a dados sensíveis
- retenção configurável
- exportação dos dados do titular
- anonimização/exclusão quando cabível
- proteção especial a dados de menores e informações sensíveis

## Ambientes

- desenvolvimento
- homologação
- produção

Credenciais nunca deverão ser versionadas. Variáveis de ambiente e secrets do GitHub serão usados para configuração.

## Backups

- banco de dados central diário
- retenção configurável
- cópia externa à hospedagem principal
- teste periódico de restauração
- dados locais do PC não substituem backup do servidor

## Observabilidade

- logs estruturados
- registro de erros
- monitoramento de jobs
- histórico de deploy
- health check da aplicação
- monitoramento de falhas de sincronização
- identificação de versão do cliente Desktop

## Princípios de evolução

- migrations para toda alteração de banco
- testes para regras críticas
- regras de negócio centrais no servidor
- sem regra crítica escondida apenas na interface
- documentação de APIs
- recursos novos protegidos por permissões
- reutilização máxima de componentes entre Web e Desktop
- evitar dependência desnecessária de serviços proprietários
