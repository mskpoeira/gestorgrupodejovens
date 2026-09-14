# Modelo inicial de dados

A versão 0.3.0 ainda não possui banco central. O estado local criptografado contém as seguintes coleções lógicas:

- `jovens`: cadastro, contato, data de nascimento, responsável, equipe, tipo e status.
- `eventos`: título, data, local e quantidade de inscritos.
- `presencas`: jovem, data e presença.
- `grupos`: equipes, grupos e ministérios com liderança e situação.
- `acompanhamentos`: motivo, responsável, prazo, status e data de criação.
- `usuarios`: perfis planejados para a futura camada de RBAC.
- `configuracao`: identificação do grupo e limites do radar.

## Persistência atual

O navegador/WebView mantém um único cofre `sgj_secure_vault` em armazenamento local. O conteúdo é cifrado com AES-GCM; a chave é derivada da senha informada em cada sessão por PBKDF2-SHA-256. A senha não é persistida.

## Banco central planejado

A camada central deverá separar, no mínimo: organizações, usuários, vínculos/permissões, jovens, responsáveis, consentimentos, eventos, presenças, grupos/equipes, acompanhamentos, filas de sincronização e trilha de auditoria. Toda entidade sincronizável deverá possuir identificador global, versão e carimbo de atualização para permitir operações idempotentes e resolução de conflitos.
