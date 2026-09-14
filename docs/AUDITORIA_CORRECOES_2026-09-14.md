# Correções da auditoria — 14/09/2026

Referência: `docs/AUDITORIA_2026-09-13.md`.

## Tratados na v0.3.0

- **A-01:** armazenamento local migrado para cofre cifrado com AES-GCM; senha não persistida.
- **A-02:** exportação de backup cifrada por senha.
- **A-04:** CSP restritiva habilitada no Tauri.
- **A-05:** service worker passa a cachear apenas recursos estáticos da mesma origem.
- **A-06:** data civil calculada no horário local, sem `toISOString()` para regras de negócio.
- **A-07:** desativação de grupo altera o registro original persistido.
- **A-08:** importação exige estrutura mínima completa e suporta migração de backup legado.
- **A-09:** jovem sem presença histórica passa para Atenção quando o radar é recalculado.
- **A-10:** menoridade calculada pela data de nascimento; responsável e telefone são exigidos para menores.
- **A-11:** indicador deixa de usar jovens atuais como denominador retroativo e passa a refletir marcações efetivamente registradas. Um modelo por encontro/elegibilidade continua previsto para a camada central.
- **A-12:** adicionados testes automatizados das regras centrais e etapa de testes no CI.
- **A-13:** adicionada automação para gerar e versionar `package-lock.json` e `Cargo.lock` na branch principal.
- **A-14:** versão alinhada em `0.3.0` nos pacotes Web/Desktop/Tauri/Cargo.
- **A-15:** manifesto PWA passa a declarar ícones 192 e 512.
- **A-16:** ativação do service worker remove caches antigos.
- **A-17:** formulários principais passam a ter labels e foco visível; interação da presença fica em botão dedicado.
- **A-18:** README diferencia funcionalidades implementadas das planejadas.
- **A-19:** documentação ausente foi criada e os links voltam a ser válidos.

## Pendências arquiteturais deliberadas

- **A-03 — autenticação/RBAC central:** ainda depende de backend, identidade, sessões e autorização no servidor. O aplicativo não apresenta mais os perfis locais como autenticação efetiva.
- **A-20 — SQLite/sincronização nativa no Desktop:** continua planejado para a etapa de sincronização Web ↔ PC.

## Critério de produção

A v0.3.0 melhora substancialmente a segurança do modo local e é apropriada para validação funcional controlada. O uso com dados pessoais reais em operação multiusuário, especialmente dados de menores, continua condicionado à implantação e revisão da camada central de autenticação, autorização, auditoria, retenção e sincronização.
