# Auditoria Técnica — SGJ 0.2

Data: 13/09/2026
Repositório: `mskpoeira/gestorgrupodejovens`
Commit-base auditado: `5239b90b9f2dd4c7f3808e10b34c3deef52fcdf6`

## Parecer executivo

O SGJ 0.2 está apto como **MVP local para demonstração e testes funcionais**, mas **não está pronto para produção** nem para uso real com dados pessoais de jovens e menores de idade.

O build Windows foi gerado com sucesso no GitHub Actions e os artefatos `.exe`/`.msi` existem. Entretanto, a aplicação atual ainda é essencialmente uma aplicação Vue armazenando dados no navegador/WebView por `localStorage`, sem backend central, autenticação efetiva, autorização RBAC, sincronização, trilha de auditoria, criptografia de dados locais ou banco SQLite.

## Achados críticos / alta prioridade

### A-01 — Dados pessoais e de menores em `localStorage`
**Severidade: Alta**

Arquivos: `apps/web/src/App.vue`, linhas aproximadas 33–64.

O sistema armazena nome, telefone, e-mail, data de nascimento, indicação de menor, nome e telefone do responsável, presenças e acompanhamentos diretamente em `localStorage`.

Riscos:
- armazenamento sem criptografia específica da aplicação;
- persistência por tempo indeterminado;
- acesso por qualquer JavaScript executado na mesma origem;
- inexistência de segregação por usuário/perfil;
- inadequado para dados reais de menores enquanto a camada de segurança não existir.

**Recomendação:** não utilizar dados reais de participantes até implantação de backend autenticado, RBAC, minimização de dados e armazenamento local controlado/criptografado quando aplicável.

### A-02 — Backup JSON contém toda a base em texto claro
**Severidade: Alta**

Arquivo: `apps/web/src/App.vue`, função `exportarBackup()`.

O backup exporta jovens, responsáveis, telefones, presenças, acompanhamentos, usuários e configurações em JSON sem criptografia ou senha.

**Recomendação:** em produção, utilizar backup central protegido e, se exportação local for mantida, adotar criptografia, aviso explícito de sensibilidade, controle de permissão e registro de auditoria.

### A-03 — Não existe autenticação nem autorização real
**Severidade: Alta**

A tela mostra “Administrador Master / Acesso total”, porém isso é apenas interface. Usuários e perfis são registros locais e não restringem ações.

**Recomendação:** backend com autenticação, sessão/token seguro, RBAC por módulo/ação, 2FA opcional e revogação de dispositivos.

### A-04 — CSP do Tauri desabilitada
**Severidade: Alta**

Arquivo: `apps/desktop/src-tauri/tauri.conf.json`.

Configuração atual: `"csp": null`.

A CSP é uma camada importante de defesa contra carregamento/execução de conteúdo não autorizado e XSS no WebView.

**Recomendação:** definir CSP restritiva, permitindo apenas as origens realmente necessárias.

### A-05 — Service worker faz cache de qualquer requisição GET
**Severidade: Alta para evolução futura**

Arquivo: `apps/web/public/sw.js`.

O `fetch` do service worker tenta armazenar toda resposta GET no Cache Storage. Quando a API for adicionada na mesma origem, isso poderá armazenar respostas de dados pessoais no cache do navegador, caso a estratégia não seja revista.

**Recomendação:** cachear somente assets estáticos explicitamente permitidos. Nunca aplicar cache genérico a endpoints autenticados ou respostas contendo dados pessoais.

### A-06 — Data “hoje” calculada em UTC
**Severidade: Alta funcional**

Arquivo: `apps/web/src/App.vue`, linha aproximada 24.

Uso atual: `new Date().toISOString().slice(0,10)`.

No Brasil (UTC-3), após aproximadamente 21h, o valor UTC já pode estar no dia seguinte. Isso pode registrar presença, acompanhamento e backup com a data incorreta.

**Recomendação:** gerar a data local do dispositivo ou usar biblioteca/rotina de timezone definida para a organização.

### A-07 — Botão “Desativar” grupo/equipe não persiste
**Severidade: Alta funcional**

Arquivo: `apps/web/src/App.vue`.

`distribuicaoEquipes` cria cópias dos objetos com spread (`{...g}`), e o template executa `g.ativo=false` sobre essa cópia. O estado original de `grupos` não é alterado.

**Recomendação:** alterar o registro original por `id` em uma função dedicada.

## Achados médios

### A-08 — Importação de backup sem validação estrutural completa
**Severidade: Média**

Somente é verificado se `dados.jovens` é um array. Os demais campos e tipos são aceitos diretamente.

Riscos: corrupção lógica local, dados incompatíveis entre versões e falhas de interface.

**Recomendação:** schema versionado (ex.: Zod/JSON Schema), validação de todos os campos e migrations de backup.

### A-09 — Radar ignora jovens sem qualquer presença
**Severidade: Média**

Se não houver presença histórica para o jovem, `recalcularRadar()` retorna sem alterar o status. Um participante que nunca compareceu pode permanecer indefinidamente como “Ativo”.

**Recomendação:** definir regra para ausência de histórico, visitantes sem retorno e faltas consecutivas.

### A-10 — Situação de menor é manual e pode divergir da data de nascimento
**Severidade: Média**

O checkbox “Menor de idade” não é validado contra a data de nascimento e o responsável não é obrigatório.

**Recomendação:** calcular idade automaticamente, permitir exceção administrativa apenas quando necessária e exigir responsável/contato conforme regra definida.

### A-11 — Métrica de presença pode distorcer períodos históricos
**Severidade: Média**

A taxa usa `jovens atuais × dias com presença` como denominador. Jovens cadastrados depois de encontros anteriores entram retroativamente no denominador.

**Recomendação:** presença por evento/encontro com lista de elegíveis naquela data ou snapshots de participação.

### A-12 — Sem testes automatizados
**Severidade: Média**

Não há testes unitários, de componentes, integração ou E2E no repositório.

**Recomendação:** cobrir inicialmente data local, presença, radar, backup/importação, grupos e regras de menor/responsável.

### A-13 — Builds não são totalmente reprodutíveis
**Severidade: Média**

Não há `package-lock.json` nem `Cargo.lock` versionados. CI usa `npm install`, permitindo resolução diferente de dependências ao longo do tempo.

**Recomendação:** versionar lockfiles e usar `npm ci` no CI.

### A-14 — Versões inconsistentes
**Severidade: Média/Baixa**

- raiz: `0.2.0`
- Tauri: `0.2.0`
- `apps/web/package.json`: `0.1.0`
- `Cargo.toml`: `0.1.0`
- cache do service worker: `sgj-v1`

**Recomendação:** manter uma única versão de release e política automática de atualização.

### A-15 — PWA incompleta para promoção de instalação
**Severidade: Média**

O `manifest.webmanifest` não possui `icons`. Em navegadores Chromium, a promoção de instalação tradicional exige ícones adequados, além dos demais critérios.

**Recomendação:** adicionar ao menos 192×192 e 512×512, preferencialmente também versão maskable.

### A-16 — Cache antigo não é removido
**Severidade: Média/Baixa**

O service worker usa `sgj-v1` e não elimina caches antigos no evento `activate`.

**Recomendação:** versionamento de cache e exclusão explícita das versões anteriores.

### A-17 — Acessibilidade de formulários insuficiente
**Severidade: Média/Baixa**

Grande parte dos campos usa apenas `placeholder`, sem `<label>` programaticamente associado. Há também linhas clicáveis de presença sem tratamento completo de teclado/ARIA.

**Recomendação:** labels associados, navegação por teclado, estados de foco, ARIA quando necessário e testes WCAG.

## Achados de documentação/arquitetura

### A-18 — README pode transmitir capacidades ainda não implementadas
**Severidade: Média**

O README apresenta Web/Desktop compartilhando conta/base central e sincronização offline, enquanto `docs/MVP.md` corretamente informa que isso ainda não existe.

**Recomendação:** distinguir claramente “implementado” de “arquitetura planejada”.

### A-19 — Links de documentação quebrados
**Severidade: Baixa**

O README referencia arquivos inexistentes:
- `docs/BANCO_DADOS.md`
- `docs/ROADMAP.md`
- `docs/PESQUISA_CONCORRENTES.md`

### A-20 — Desktop ainda é somente shell Tauri
**Severidade: Informativa**

Não há SQLite, fila offline, armazenamento seguro de credenciais nem lógica Rust de domínio. O desktop carrega a mesma aplicação Vue e usa a persistência Web atual.

## Pontos positivos confirmados

- Vue 3 + TypeScript + Vite organizados em workspace.
- Tauri 2 gera instaladores Windows `.exe` e `.msi`.
- Workflow de build Windows executado com sucesso.
- Interface possui persistência local e permite testes offline básicos.
- Não foi identificado uso de `v-html`, `eval()` ou injeção direta de HTML no componente principal.
- Dados exibidos por interpolação Vue são escapados por padrão.
- Não há credenciais ou secrets evidentes versionados nos arquivos auditados.
- `.gitignore` exclui `.env` e diretório de build Tauri.
- Documentação arquitetural já reconhece a necessidade de autenticação, RBAC, auditoria, backend e LGPD.

## Classificação de prontidão

| Área | Situação |
|---|---|
| Demonstração local | Apto com ressalvas |
| Cadastro/presença básicos | Funcional com bugs identificados |
| Build Windows | Aprovado |
| PWA instalável completa | Parcial |
| Segurança para dados reais | Não aprovado |
| LGPD para produção | Não aprovado |
| Multiusuário | Não implementado |
| Sincronização Web ↔ PC | Não implementada |
| Backend central | Não implementado |
| Auditoria de ações | Não implementada |
| Produção | Não aprovado |

## Ordem recomendada de correção

1. Corrigir data local e desativação de grupos.
2. Corrigir service worker e implementar CSP.
3. Remover/adequar dados de demonstração para release real.
4. Versionar lockfiles e adicionar testes essenciais.
5. Corrigir PWA/ícones e versionamento.
6. Implementar backend, autenticação e RBAC.
7. Migrar persistência Web para IndexedDB controlado e Desktop para SQLite conforme arquitetura.
8. Implementar sincronização idempotente, trilha de auditoria e políticas LGPD.
9. Somente então habilitar uso com dados pessoais reais e menores de idade.

## Conclusão

O projeto apresenta uma base visual e funcional útil para evolução, mas deve ser tratado neste momento como **MVP de desenvolvimento**. O principal risco não é de compilação: é a distância entre a interface atual e os controles necessários para operar com dados reais, múltiplos usuários e menores de idade de maneira segura e auditável.
