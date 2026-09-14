# Auditoria Completa — SGJ

**Data:** 14/09/2026  
**Repositório:** `mskpoeira/gestorgrupodejovens`  
**Branch principal auditada:** `main`  
**Commit-base:** `9d4945b158962ab4ef847adb4eeb08c6c3c918c6`  
**Branch de remediação examinada:** `fix/auditoria-v0.3` (`7884e4df312e440365c486f5a5b974b1894788d4`)

## 1. Parecer executivo

O SGJ permanece **apto somente como MVP local de demonstração e desenvolvimento**. O estado efetivamente versionado em `main` **não deve ser utilizado em produção com dados reais**, principalmente dados de crianças, adolescentes, responsáveis, presenças e acompanhamentos.

Não foi comprovada, nesta auditoria, uma vulnerabilidade remota crítica explorável no código atual. Entretanto, há múltiplos achados de severidade **Alta** envolvendo confidencialidade, integridade, autenticação, autorização, proteção de dados, cadeia de entrega e erros funcionais capazes de comprometer a confiabilidade dos registros.

A branch `fix/auditoria-v0.3` contém uma proposta de remediação, porém as alterações estão encapsuladas em um pacote `tar.gz` codificado em Base64 e aplicado por workflow. Essa remediação **não foi consolidada**, porque o `cargo check --locked` falhou na validação Tauri: o ícone PNG utilizado não estava em formato RGBA. Portanto, a v0.3 não pode ser considerada release corrigida.

## 2. Classificação indicativa de prontidão

| Área | Nota | Situação |
|---|---:|---|
| Funcionalidade básica | 5/10 | Parcial, com bugs de integridade |
| Arquitetura | 4/10 | Planejamento melhor que implementação |
| Segurança | 2/10 | Não aprovada para dados reais |
| Privacidade/LGPD | 2/10 | Não aprovada para produção |
| PWA/offline | 4/10 | Funciona parcialmente, estratégia de cache insegura para evolução |
| Desktop/Tauri | 4/10 | Shell funcional; persistência nativa ausente na `main` |
| Testes | 1/10 | Nenhum teste versionado na `main` |
| CI/CD | 4/10 | Compila, mas não possui gates suficientes |
| Observabilidade/recuperação | 1/10 | Praticamente ausente |
| Prontidão de produção | **2/10** | **NÃO APROVADA** |

## 3. Achados de severidade Alta

| ID | Achado | Impacto |
|---|---|---|
| H-01 | Dados pessoais, dados de menores, responsáveis, presença e acompanhamento armazenados em `localStorage` | Confidencialidade, segregação e persistência inadequadas |
| H-02 | Backup exporta toda a base em JSON texto claro | Vazamento por arquivo, nuvem, e-mail ou dispositivo compartilhado |
| H-03 | Não existe autenticação real, senha, sessão nem autorização RBAC | Qualquer pessoa com acesso ao dispositivo consegue operar como administrador |
| H-04 | Tauri possui `"csp": null` | Redução importante da defesa contra XSS e carregamento indevido de conteúdo |
| H-05 | Service worker armazena genericamente qualquer resposta GET | Futuras respostas autenticadas/API podem ser persistidas no Cache Storage |
| H-06 | Data operacional usa `toISOString().slice(0,10)` | Em UTC-3 pode registrar presença/acompanhamento no dia seguinte após ~21h |
| H-07 | “Desativar” grupo altera uma cópia de objeto computado | A desativação não persiste no estado real |
| H-08 | Base nova é preenchida automaticamente com jovens/eventos de demonstração; corrupção JSON cai silenciosamente no fallback | Mistura de dados fictícios com reais e mascaramento de corrupção/perda |
| H-09 | Presença é identificada apenas por `jovemId + data`, sem `eventId`/sessão | Dois encontros no mesmo dia não podem ser distinguidos; modelo perde integridade |
| H-10 | README afirma conta/base central e sincronização automática que não existem na implementação | Risco operacional e expectativa falsa sobre backup e disponibilidade |
| H-11 | `main` não é protegida e não existe ruleset | Push direto pode contornar CI/revisão; nenhum status check é obrigatório |
| H-12 | Remediação v0.3 é um payload opaco Base64/tar extraído em CI com `contents: write` e auto-commit | Reduz revisão, facilita alteração não auditável e amplia risco de supply chain |
| H-13 | v0.3 não fecha `cargo check`; commit de consolidação foi pulado | Não existe release v0.3 validada; não deve ser mesclada como está |
| H-14 | Não há controles operacionais para finalidade/base legal, consentimentos quando aplicáveis, melhor interesse de menores, retenção, direitos do titular e evidências de conformidade | SGJ não demonstra requisitos mínimos para operação real com dados pessoais/minores |

## 4. Achados de severidade Média

| ID | Achado | Impacto |
|---|---|---|
| M-01 | Importação de backup valida praticamente apenas `dados.jovens` | Estado corrompido, tipos inválidos e incompatibilidade entre versões |
| M-02 | Versão do backup é emitida, mas não é validada/migrada na importação | Atualizações podem restaurar estruturas incompatíveis |
| M-03 | Radar ignora participante sem qualquer presença histórica | Pessoa pode permanecer “Ativo” indefinidamente |
| M-04 | Menoridade é checkbox manual e responsável não é obrigatório | Divergência com data de nascimento e cadastro incompleto de menor |
| M-05 | Taxa de presença usa base atual × todos os dias históricos | Novos cadastros reduzem retroativamente indicadores antigos |
| M-06 | Registros duplicados de presença vindos de backup podem elevar contagens/taxa acima do real | Indicadores sem garantia de unicidade |
| M-07 | Concluir acompanhamento não recalcula/encerra automaticamente o status do jovem | Status pode permanecer “Acompanhamento” sem tarefa pendente |
| M-08 | Jovem referencia equipe pelo nome, não pelo ID | Duplicidade/alteração de nomes causa ambiguidade e contagens incorretas |
| M-09 | `main` não possui testes automatizados versionados | Regressões funcionais chegam ao build sem detecção |
| M-10 | Não há `package-lock.json` nem `Cargo.lock` na `main`; CI usa `npm install` | Build não reproduzível e dependências podem mudar sem alteração de código |
| M-11 | Versões divergem: raiz/Tauri 0.2.0, Web/Cargo 0.1.0, cache `sgj-v1` | Diagnóstico, suporte e atualização ficam inconsistentes |
| M-12 | Manifest PWA não possui ícones 192/512 | Instalação/promover PWA fica incompleta em navegadores Chromium |
| M-13 | Service worker não remove caches antigos | Conteúdo obsoleto pode persistir após atualização |
| M-14 | Formulários usam placeholders como rótulos e linhas clicáveis sem tratamento completo de teclado | Acessibilidade/WCAG insuficiente |
| M-15 | Desktop da `main` é apenas shell Tauri; não há SQLite, fila offline ou credenciais seguras | Desktop não entrega a arquitetura local-first planejada |
| M-16 | Não existe trilha de auditoria imutável no produto atual | Sem responsabilização sobre alteração de cadastros/status/presença |
| M-17 | CI não executa testes, `npm audit`, `cargo audit`, SAST/CodeQL ou dependency review | Vulnerabilidades/regressões não funcionam como gate de merge |
| M-18 | Actions usam tags móveis (`@v4`, `@stable`) e os workflows não declaram permissões mínimas explícitas na `main` | Menor reprodutibilidade e maior superfície de supply chain |
| M-19 | MSI/EXE são publicados sem etapa de assinatura digital, checksum, SBOM ou provenance | Usuário não consegue verificar autoria/integridade de release por processo formal |
| M-20 | Não existem releases formais/tags de versão | Distribuição não possui marco imutável de release |
| M-21 | `App.vue` concentra UI, persistência e regras de todos os domínios | Manutenção, testes e evolução ficam frágeis |
| M-22 | Não há schema/migrations do armazenamento local | Evolução de dados entre versões não é controlada |
| M-23 | Escritas de `localStorage.setItem()` não possuem tratamento de quota/falha | Operador pode acreditar que salvou dados quando persistência falhou |
| M-24 | Não há logs estruturados, error reporting, health check ou monitoramento de sincronização | Falhas e perda de dados são difíceis de diagnosticar |
| M-25 | Não há mecanismo implementado de exportação do titular, anonimização/exclusão, retenção ou expurgo | Direitos e ciclo de vida de dados dependem de intervenção manual inexistente |
| M-26 | Não há registro verificável de autorização/consentimento de responsável nem versionamento de termos | Proteção de menores não é operacionalizável/auditável |
| M-27 | Eventos armazenam somente contador de inscritos, sem vínculo nominal | Não há integridade de inscrição, capacidade, lista de espera ou check-in por evento |
| M-28 | Limiares do radar podem ser importados/configurados em ordem inconsistente | Regras podem produzir classificação inesperada |

## 5. Achados Baixos / governança

| ID | Achado | Impacto |
|---|---|---|
| L-01 | README aponta para `BANCO_DADOS.md`, `ROADMAP.md` e `PESQUISA_CONCORRENTES.md`, que não existem | Documentação quebrada |
| L-02 | Não há `LICENSE` no repositório | Condições de reutilização do código não estão formalizadas |
| L-03 | Não há `SECURITY.md`, `CODEOWNERS` nem `CONTRIBUTING.md` | Processo de segurança/revisão não está documentado |
| L-04 | Falha de registro do service worker é engolida com `.catch(() => undefined)` | Erros de PWA ficam invisíveis |
| L-05 | Navegação é controlada por string local, sem router/deep link/histórico | Botão voltar, URLs específicas e recuperação de tela são limitados |
| L-06 | CI e workflow de instalador recompilam o Desktop separadamente; ZIP de fonte roda a cada push na `main` | Custo/tempo de pipeline desnecessário |

## 6. Pontos positivos confirmados

- Vue 3 + TypeScript + Vite com `vue-tsc` no build.
- IDs de novos registros usam `crypto.randomUUID()`.
- Contador de inscritos impede valor negativo via `Math.max(0, ...)`.
- Renderização principal utiliza interpolação do Vue; não foi localizado `v-html`, `innerHTML` ou `eval` no código da `main` auditado.
- `.gitignore` cobre `.env`, `node_modules`, builds Web e `target` do Tauri.
- Build Windows já foi demonstrado para a versão 0.2.
- A documentação de arquitetura descreve corretamente a direção desejada: backend central, SQLite/IndexedDB, RBAC, auditoria, idempotência, LGPD e backups.
- Na tentativa transitória de v0.3, 6 testes automatizados e `npm audit --audit-level=moderate` passaram; porém esses testes/lockfiles não foram consolidados no código versionado.

## 7. Avaliação da remediação v0.3

A v0.3 **não deve ser mesclada no formato atual**. O mecanismo `.github/remediation/*.txt` + extração de tar durante o workflow prejudica revisão normal, code scanning e rastreabilidade. O workflow possui permissão `contents: write`, modifica dependências durante a execução, gera lockfiles no runner e tenta auto-commitar o resultado. Esse padrão deve ser abandonado.

O pacote deve ser extraído em ambiente controlado, os arquivos resultantes devem ser commitados diretamente em uma branch normal, revisados em diff convencional e submetidos a PR. Só depois devem ocorrer CI, testes Web, testes Desktop/SQLite, auditoria npm/Rust e build Windows.

Erro final observado na última tentativa: `tauri::generate_context!()` falhou porque `apps/desktop/src-tauri/icons/icon.png` não estava em formato RGBA.

## 8. Conformidade e menores

O sistema trata ou pretende tratar nome, telefone, e-mail, nascimento, vínculo de responsável, presenças e acompanhamentos. Para operação real, a implantação deve materializar controles de finalidade, necessidade/minimização, segurança, prevenção, responsabilização, direitos do titular, retenção, resposta a incidentes e tratamento específico de crianças/adolescentes segundo seu melhor interesse.

A arquitetura documental já cita privacy by design, mas esses controles **não estão implementados** na `main`. Até isso ocorrer, recomenda-se usar exclusivamente dados fictícios de teste.

## 9. Gates mínimos para produção

A aprovação de produção deverá exigir, cumulativamente:

1. backend central como fonte de verdade, com autenticação e RBAC server-side;
2. persistência local controlada (IndexedDB/SQLite) com estratégia de criptografia/chaves adequada;
3. eliminação de `localStorage` para dados pessoais operacionais;
4. consentimentos/autorizações e ciclo de vida LGPD implementados;
5. correção dos bugs H-06, H-07, H-08 e H-09;
6. CSP restritiva e service worker com allowlist de assets;
7. lockfiles versionados e builds com `npm ci`/`cargo --locked`;
8. testes unitários, integração e E2E cobrindo regras críticas;
9. CI com auditoria npm e Rust, SAST/CodeQL e dependency review;
10. `main` protegida por ruleset, PR obrigatório e status checks;
11. ações do GitHub pinadas por SHA e permissões mínimas explícitas;
12. instaladores assinados e release com checksums/SBOM/provenance;
13. backup central, restauração testada, logs e observabilidade;
14. documentação atualizada para distinguir “implementado” e “planejado”.

## 10. Ordem recomendada de remediação

**P0 — imediatamente:** impedir uso com dados reais; remover mecanismo opaco da v0.3; corrigir build Tauri; proteger `main`; corrigir data local, grupos, seed de demonstração e modelo de presença.

**P1 — segurança/base:** backend, autenticação, RBAC, CSP, persistência segura, esquema/migrations, backup seguro, auditoria e controles de menores/LGPD.

**P2 — qualidade/release:** lockfiles, suíte de testes completa, CodeQL/dependency review, `cargo audit`, assinatura de instalador, releases/tags, SBOM/provenance e observabilidade.

**P3 — evolução funcional:** inscrições nominais, check-in por evento/sessão, sincronização idempotente, conflitos, escalas, comunicação e demais módulos planejados.

## 11. Conclusão

**Resultado da auditoria: NÃO APROVADO PARA PRODUÇÃO.**

O projeto tem uma base útil de demonstração, documentação arquitetural coerente com o destino desejado e build Windows funcional na versão 0.2. O risco dominante, contudo, é a distância entre a interface já disponível e os controles necessários para operar com dados reais de jovens e menores. A próxima entrega deve priorizar integridade, autenticação, autorização, proteção de dados, cadeia de entrega e persistência — antes de ampliar o número de módulos.