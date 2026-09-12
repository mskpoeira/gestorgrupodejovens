# SGJ — Estado funcional do projeto

## Versão 0.2

A aplicação já possui uma base única para Web/PWA e Windows.

### Funcionalidades implementadas

- Dashboard gerencial com métricas e radar de relacionamento.
- Cadastro e pesquisa de jovens, visitantes e lideranças.
- Cadastro de menores com responsável legal e telefone do responsável.
- Status individual: Ativo, Atenção e Acompanhamento.
- Eventos e controle simples de quantidade de inscritos.
- Check-in/presença diária offline.
- Grupos, equipes e ministérios com liderança e contagem de integrantes.
- Acompanhamentos com responsável, prazo e conclusão.
- Radar recalculável por dias sem presença, com limites configuráveis.
- Relatórios de presença, integração, menores, follow-up, equipes e aniversários.
- Usuários e perfis modelados para futura autorização pelo backend.
- Configuração do nome do grupo e cidade.
- Backup e restauração JSON da base local.
- PWA responsiva com cache offline básico.
- Desktop Windows via Tauri 2.
- CI para validar Web e Rust/Tauri.
- Workflow que gera instaladores `.msi` e `.exe` no GitHub Actions após atualização da `main`.

## Persistência atual

A versão 0.2 é offline-first e usa armazenamento local no dispositivo. Isso permite testar e operar a interface mesmo sem servidor.

**Importante:** ainda não existe sincronização central entre computadores. Até o backend entrar em produção, cada dispositivo mantém a sua própria base, e o recurso de backup deve ser utilizado.

## Próxima camada

1. Backend Laravel/API.
2. Banco PostgreSQL/MySQL multi-organização.
3. Autenticação, recuperação de senha e 2FA.
4. RBAC efetivo por módulo e ação.
5. Sincronização idempotente entre PC e Web.
6. Autorizações e consentimentos de responsáveis.
7. Inscrição nominal em eventos, lista de espera e QR Code.
8. Comunicação, notificações e integrações.
9. Auditoria e trilha LGPD.

## Execução Web

```bash
npm install
npm run dev
```

## Build Web

```bash
npm run build
```

## Desktop Windows

```bash
npm install
npm run desktop:dev
```

Gerar instaladores:

```bash
npm run desktop:build
```

Os pacotes são produzidos pelo Tauri em `apps/desktop/src-tauri/target/release/bundle/`.
