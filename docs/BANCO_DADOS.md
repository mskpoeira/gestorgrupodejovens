# Banco de dados — SGJ

## v0.3.0

O SGJ utiliza uma abstração local-first:

- **Web/PWA:** IndexedDB.
- **Desktop/Tauri:** SQLite (`sgj.db`) via plugin SQL oficial do Tauri.
- O conteúdo de negócio é serializado e criptografado com AES-GCM antes de ser persistido.
- A chave AES do dispositivo é gerada pela Web Crypto API como não extraível e persistida no armazenamento de chaves do WebView/navegador.

A tabela Desktop inicial é `secure_kv`, com chave lógica, payload criptografado e data de atualização.

## Entidades lógicas

- jovens
- eventos
- presenças
- grupos/equipes/ministérios
- acompanhamentos
- usuários/perfis
- configurações
- auditoria

## Evolução prevista

A camada central futura deverá usar banco relacional servidor (PostgreSQL preferencialmente), IDs UUID, versionamento de registros, `updated_at`, tombstones e identificadores idempotentes para sincronização offline.
