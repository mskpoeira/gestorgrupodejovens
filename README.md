# SGJ — Sistema de Gestão de Grupo de Jovens

Sistema **Web/PWA e Desktop para PC/Windows** para gestão de grupos de jovens, ministérios e equipes, com foco em cadastro, presença, eventos, equipes, responsáveis e acompanhamento.

## Estado atual — v0.3.0

### Implementado
- 🌐 Web/PWA responsiva e instalável.
- 🖥️ Desktop Windows empacotado com Tauri 2.
- 🔐 Cofre local criptografado com AES-GCM e chave derivada por PBKDF2.
- 💾 Operação local/offline para cadastros, eventos, presença, grupos e acompanhamentos.
- 🔒 Backup local criptografado por senha.
- 🧭 Radar de acompanhamento configurável.
- 👶 Identificação automática de menoridade pela data de nascimento e exigência de responsável no cadastro de menores.
- ✅ Testes automatizados para regras centrais e CI para Web/Windows.
- 📦 PWA com service worker restrito a recursos estáticos e ícones de instalação.

### Em evolução — não considerar implementado ainda
- Conta central e autenticação multiusuário.
- RBAC efetivo por usuário/perfil.
- Backend e banco de dados central.
- Sincronização Web ↔ PC e resolução de conflitos offline.
- Auditoria central de ações.
- SQLite nativo no Desktop.

> Até a implantação da camada central, cada dispositivo mantém seu próprio cofre local. A senha local protege os dados daquele dispositivo, mas não substitui autenticação central entre usuários.

## Plataformas

- **Web/PWA:** navegador em computador, celular e tablet, com instalação como aplicativo quando suportada.
- **Desktop PC/Windows:** aplicativo instalável gerado pelo pipeline do GitHub Actions.

## Princípios arquiteturais

1. Web e Desktop como plataformas oficiais.
2. Mobile first e responsivo na versão Web.
3. PWA instalável e offline para funções críticas.
4. Dados locais protegidos por criptografia.
5. Sincronização futura segura e idempotente entre dispositivo e servidor.
6. Permissões granulares por módulo e ação quando o backend central for habilitado.
7. Segurança, privacidade e minimização de dados desde a arquitetura.
8. Registro de auditoria para ações administrativas na camada central.

## Documentação

- [Requisitos e módulos](docs/REQUISITOS.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Modelo inicial de dados](docs/BANCO_DADOS.md)
- [Roadmap](docs/ROADMAP.md)
- [Pesquisa de sistemas semelhantes](docs/PESQUISA_CONCORRENTES.md)
- [Auditoria técnica de 13/09/2026](docs/AUDITORIA_2026-09-13.md)

## Desenvolvimento

```bash
npm install
npm test
npm run build
npm run desktop:build
```

## Repositório oficial

`mskpoeira/gestorgrupodejovens`
