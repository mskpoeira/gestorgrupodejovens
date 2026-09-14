# Remediação da Auditoria — SGJ v0.3.0

Data: 13/09/2026

## Status dos achados A-01 a A-20

| ID | Status | Remediação |
|---|---|---|
| A-01 | Mitigado localmente | `localStorage` removido como persistência primária; IndexedDB/SQLite com payload AES-GCM. Migração do legado ocorre uma única vez e remove as chaves antigas. |
| A-02 | Resolvido | Backup passou a exigir senha e usar PBKDF2-SHA256 + AES-GCM. |
| A-03 | Resolvido no modo local | Primeiro administrador sem senha padrão, login por senha, perfis e permissões efetivas. Backend central continua evolução futura. |
| A-04 | Resolvido | CSP restritiva configurada no Tauri. |
| A-05 | Resolvido | Service worker não intercepta `/api/` e só faz runtime cache de assets estáticos da mesma origem. |
| A-06 | Resolvido | Data lógica gerada por calendário local do dispositivo. |
| A-07 | Resolvido | Desativação altera o registro original por `id`. |
| A-08 | Resolvido | Backup criptografado possui validação estrutural e de tipos para todas as coleções. |
| A-09 | Resolvido | Radar usa a data de cadastro quando não existe presença anterior. |
| A-10 | Resolvido | Menoridade calculada automaticamente; responsável e telefone obrigatórios para menores. |
| A-11 | Resolvido | Denominador considera apenas membros já cadastrados em cada data histórica. |
| A-12 | Resolvido | Vitest cobre datas, menoridade, radar, presença e backup. |
| A-13 | Resolvido pelo pipeline v0.3 | Lockfiles versionados e CI configurado para `npm ci`; Cargo.lock também passa a ser controlado. |
| A-14 | Resolvido | Versão unificada em 0.3.0 e cache `sgj-v3-static`. |
| A-15 | Resolvido | Manifesto possui ícones 192, 512 e maskable. |
| A-16 | Resolvido | Caches antigos são removidos no `activate`. |
| A-17 | Resolvido | Formulários receberam labels, foco visível e presença usa botão com `aria-pressed`. |
| A-18 | Resolvido | README separa explicitamente o implementado da arquitetura futura. |
| A-19 | Resolvido | Documentos referenciados foram criados. |
| A-20 | Resolvido | Desktop usa SQLite via plugin SQL oficial do Tauri, mantendo payload de negócio criptografado. |

## Limite arquitetural remanescente

A auditoria original também registrou a inexistência de backend central e sincronização entre dispositivos. A v0.3 resolve os riscos locais e oferece autenticação/RBAC no dispositivo, mas **não afirma possuir nuvem/sincronização central**. Essa funcionalidade exige infraestrutura de servidor e será implementada como camada separada, sem comprometer o modo offline.
