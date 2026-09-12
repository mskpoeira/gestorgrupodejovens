# Arquitetura inicial do SGJ

## Direção técnica

O SGJ será construído como aplicação web responsiva e PWA, priorizando baixo custo operacional, facilidade de hospedagem e evolução modular.

### Stack proposta

- Backend: PHP 8.2+ com Laravel
- Banco de dados: MySQL 8+ ou PostgreSQL
- Frontend: Blade + componentes reativos ou SPA parcial, conforme necessidade do módulo
- PWA: service worker + cache de aplicação
- Offline: IndexedDB para operações críticas de presença/check-in
- Filas: jobs para e-mail, notificações, relatórios e sincronizações
- API: REST autenticada para integrações futuras
- Controle de versão: GitHub
- CI/CD: GitHub Actions

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

## Offline

A primeira função offline obrigatória será presença/check-in.

Fluxo esperado:

1. baixar previamente evento e lista autorizada
2. registrar presença localmente
3. identificar operação com UUID
4. sincronizar quando houver conexão
5. garantir idempotência para evitar duplicação
6. registrar conflitos para revisão

## Autenticação e autorização

- sessão segura
- recuperação de senha
- 2FA opcional
- RBAC: usuários, funções e permissões
- permissões por módulo e ação
- possibilidade futura de escopo por grupo/equipe

## Auditoria

Ações críticas devem registrar:

- usuário
- ação
- entidade
- identificador do registro
- data/hora
- IP quando aplicável
- estado anterior
- estado posterior

Logs de auditoria não devem ser editáveis por usuários comuns.

## Segurança

- senhas com hashing forte
- CSRF
- validação de entrada
- prepared statements via ORM/query builder
- rate limiting
- arquivos privados fora da pasta pública
- URLs temporárias para documentos protegidos
- criptografia para campos selecionados quando necessário
- princípio do menor privilégio

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

## Ambientes

- desenvolvimento
- homologação
- produção

Credenciais nunca deverão ser versionadas. Variáveis de ambiente e secrets do GitHub serão usados para configuração.

## Backups

- banco de dados diário
- retenção configurável
- cópia externa à hospedagem principal
- teste periódico de restauração

## Observabilidade

- logs estruturados
- registro de erros
- monitoramento de jobs
- histórico de deploy
- health check da aplicação

## Princípios de evolução

- migrations para toda alteração de banco
- testes para regras críticas
- sem regra de negócio escondida apenas na interface
- documentação de APIs
- recursos novos protegidos por permissões
- evitar dependência desnecessária de serviços proprietários
