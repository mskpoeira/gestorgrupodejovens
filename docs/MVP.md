# SGJ — Estado funcional do projeto

## Versão 0.3.0 — hardening de segurança

A aplicação usa uma base Vue 3 compartilhada entre Web/PWA e Windows (Tauri 2), com foco offline-first.

### Funcionalidades implementadas

- Dashboard gerencial com métricas e radar de relacionamento.
- Cadastro e pesquisa de jovens, visitantes e lideranças.
- Menoridade calculada pela data de nascimento; responsável e telefone são obrigatórios para menores.
- Status individual: Ativo, Atenção e Acompanhamento.
- Eventos e controle simples de quantidade de inscritos.
- Check-in/presença diária offline com data local correta.
- Grupos, equipes e ministérios com liderança, contagem de integrantes e desativação persistente.
- Acompanhamentos com responsável, prazo e conclusão.
- Radar por dias sem presença, inclusive para pessoas sem histórico de comparecimento.
- Relatórios de presença com denominador histórico por data de cadastro.
- Autenticação local com senha derivada por PBKDF2 e perfis RBAC efetivos no cliente.
- Trilha local de auditoria de ações sensíveis.
- Persistência criptografada: IndexedDB na Web e SQLite no Desktop.
- Migração automática dos dados legados do `localStorage` para o armazenamento seguro.
- Backup local criptografado por senha em formato `.sgjbackup`, com validação estrutural na importação.
- PWA com manifesto completo, ícones e cache restrito a arquivos estáticos.
- Desktop Windows via Tauri 2 com CSP restritiva e plugin SQL oficial.
- CI com testes, auditoria npm e builds Web/Windows.

## Persistência e sincronização

A versão 0.3.0 é **local-first**. Cada dispositivo mantém sua própria base criptografada.

- Web/PWA: IndexedDB.
- Windows/Tauri: SQLite.
- Backup: arquivo criptografado por senha.

**Ainda não existe servidor central nem sincronização automática Web ↔ PC.** Essa capacidade depende da implantação do backend central e permanece no roadmap. Portanto, a existência de login local não deve ser interpretada como conta em nuvem.

## Segurança operacional

- Não há senha padrão. No primeiro uso é criado o Administrador Master.
- Perfis limitam telas e ações no modo local.
- O service worker não armazena respostas de `/api/`.
- O Desktop usa Content Security Policy restritiva.
- Dados persistidos localmente são armazenados cifrados.
- O backup exige senha e não contém JSON em texto claro.

Para uma implantação com múltiplos dispositivos, acesso remoto e governança central, ainda são necessários backend, autenticação central, sincronização idempotente, política de retenção e controles administrativos de servidor.

## Próxima camada

1. Backend central autenticado.
2. Banco PostgreSQL/MySQL multi-organização.
3. Recuperação de conta, 2FA e gestão/revogação de dispositivos.
4. Sincronização idempotente entre Desktop, PWA e servidor.
5. Autorizações e consentimentos digitais de responsáveis.
6. Inscrição nominal em eventos, lista de espera e QR Code.
7. Comunicação e notificações.
8. Política central de retenção, anonimização/exportação e auditoria LGPD.

## Execução Web

```bash
npm ci
npm run dev
```

## Testes e build Web

```bash
npm test
npm run build
```

## Desktop Windows

```bash
npm ci
npm run desktop:dev
```

Gerar instaladores:

```bash
npm run desktop:build
```

Os pacotes são produzidos pelo Tauri em `apps/desktop/src-tauri/target/release/bundle/`.
