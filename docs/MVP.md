# MVP 0.1 — SGJ

## Entregue nesta base

- Aplicação Web responsiva em Vue 3 + TypeScript.
- PWA com manifesto e service worker para cache básico.
- Dashboard com métricas, radar de relacionamento e próximos eventos.
- Cadastro e listagem de jovens com persistência local.
- Identificação de menores de idade.
- Cadastro e listagem de eventos.
- Check-in/presença diária com persistência local.
- Estrutura visual para grupos/equipes, acompanhamento, relatórios e administração.
- Wrapper Tauri 2 para geração de aplicativo Windows MSI/NSIS.

## Próximas entregas

1. Backend Laravel e autenticação.
2. PostgreSQL/MySQL e migrations multi-organização.
3. RBAC: Administrador Master, coordenação, liderança, comunicação, financeiro e consulta.
4. API de sincronização offline idempotente.
5. Responsáveis, autorizações e consentimento de imagem.
6. Radar automático por regras configuráveis.
7. Eventos com inscrição, lista de espera e QR Code.
8. Relatórios e exportações.
9. Comunicação e notificações.
10. Auditoria, LGPD e 2FA.

## Execução Web

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Desktop

O código Tauri está em `apps/desktop/src-tauri`. Para empacotar no Windows será necessário Node.js, Rust e Tauri CLI 2. O frontend utilizado pelo Desktop é o mesmo de `apps/web`.
