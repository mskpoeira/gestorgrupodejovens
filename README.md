# SGJ — Sistema de Gestão de Grupo de Jovens

O **SGJ** é um sistema local-first para gestão de grupos de jovens, com aplicação Web/PWA e aplicativo Desktop para Windows.

## Estado atual — v0.3.0

A versão 0.3.0 é uma versão de **hardening e testes controlados**. Ela implementa cadastro, presença, grupos, eventos, acompanhamento, relatórios, autenticação local, perfis de acesso, auditoria, backup criptografado, PWA e Desktop/Tauri com SQLite.

### Implementado

- Dashboard e radar de acompanhamento.
- Cadastro de jovens, visitantes e lideranças.
- Cálculo automático de menoridade e obrigatoriedade de responsável para menores.
- Eventos e controle básico de inscritos.
- Presença offline.
- Grupos, equipes e ministérios.
- Acompanhamentos/follow-up.
- Relatórios e aniversariantes.
- Autenticação local sem senha padrão.
- RBAC local por perfil.
- Trilha local de auditoria.
- Persistência Web em IndexedDB com conteúdo criptografado.
- Persistência Desktop em SQLite com conteúdo criptografado.
- Backup protegido por senha (PBKDF2 + AES-GCM).
- PWA com ícones e cache limitado a conteúdo estático.
- Instaladores Windows via Tauri (`.exe` e `.msi`).
- Testes automatizados e CI.

### Ainda não é servidor central

A v0.3.0 **não possui um backend central hospedado**. Web e PC não compartilham automaticamente a mesma base entre dispositivos. Cada instalação possui sua própria base protegida. Sincronização entre dispositivos, API central e administração remota permanecem como próxima camada arquitetural.

Não se deve confundir o armazenamento SQLite/IndexedDB local com sincronização em nuvem.

## Desenvolvimento

```bash
npm ci
npm test
npm run build
npm run dev
```

Desktop Windows:

```bash
npm run desktop:dev
npm run desktop:build
```

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [MVP / estado atual](docs/MVP.md)
- [Requisitos](docs/REQUISITOS.md)
- [Banco de dados](docs/BANCO_DADOS.md)
- [Roadmap](docs/ROADMAP.md)
- [Pesquisa de concorrentes](docs/PESQUISA_CONCORRENTES.md)
- [Auditoria técnica de 13/09/2026](docs/AUDITORIA_2026-09-13.md)
- [Remediação da auditoria](docs/REMEDIACAO_AUDITORIA_2026-09-13.md)

## Segurança

A aplicação não possui credenciais padrão. No primeiro uso, é obrigatório criar o Administrador Master. Dados persistentes são cifrados antes da gravação e o Desktop usa SQLite como base física. Backups exigem senha própria e são criptografados.

Ainda assim, para operação multiunidade/multidispositivo com dados reais em escala, a arquitetura prevista inclui API central, autenticação centralizada, sincronização idempotente e políticas de retenção/consentimento.
