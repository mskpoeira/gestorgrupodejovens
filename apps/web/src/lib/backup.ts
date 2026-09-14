const BACKUP_ITERATIONS = 250_000

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptBackup(payload: unknown, passphrase: string): Promise<string> {
  if (passphrase.length < 8) throw new Error('A senha do backup deve ter pelo menos 8 caracteres.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, BACKUP_ITERATIONS)
  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return JSON.stringify({
    format: 'sgj-backup-encrypted',
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: BACKUP_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }, null, 2)
}

export async function decryptBackup(contents: string, passphrase: string): Promise<unknown> {
  const envelope = JSON.parse(contents)
  if (envelope?.format !== 'sgj-backup-encrypted' || envelope?.version !== 1) throw new Error('Formato de backup não suportado.')
  if (!Number.isInteger(envelope.iterations) || envelope.iterations < 100_000) throw new Error('Parâmetros de criptografia inválidos.')
  const key = await deriveKey(passphrase, base64ToBytes(envelope.salt), envelope.iterations)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(envelope.iv) },
    key,
    base64ToBytes(envelope.ciphertext),
  )
  return JSON.parse(new TextDecoder().decode(plaintext))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isString(value: unknown): value is string { return typeof value === 'string' }
function isBoolean(value: unknown): value is boolean { return typeof value === 'boolean' }
function isNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }

function everyRecord(array: unknown[], predicate: (item: Record<string, unknown>) => boolean): boolean {
  return array.every(item => isRecord(item) && predicate(item))
}

export function validateBackupPayload(value: unknown): value is { versao: string; dados: Record<string, unknown> } {
  if (!isRecord(value) || !isString(value.versao) || !isRecord(value.dados)) return false
  const data = value.dados
  const requiredArrays = ['jovens', 'eventos', 'presencas', 'grupos', 'acompanhamentos', 'usuarios', 'auditoria']
  if (!requiredArrays.every(key => Array.isArray(data[key]))) return false
  if (!isRecord(data.configuracao)) return false

  const jovens = data.jovens as unknown[]
  if (!everyRecord(jovens, j =>
    isString(j.id) && isString(j.nome) && isString(j.telefone) && isString(j.nascimento) &&
    ['Ativo','Atenção','Acompanhamento'].includes(String(j.status)) && isString(j.equipe) &&
    isBoolean(j.menor) && ['Participante','Visitante','Liderança'].includes(String(j.tipo)) &&
    isString(j.cadastradoEm) && (j.email === undefined || isString(j.email)) &&
    (j.responsavel === undefined || isString(j.responsavel)) &&
    (j.telefoneResponsavel === undefined || isString(j.telefoneResponsavel)))) return false

  const eventos = data.eventos as unknown[]
  if (!everyRecord(eventos, e => isString(e.id) && isString(e.titulo) && isString(e.data) && isString(e.local) && isNumber(e.inscritos) && e.inscritos >= 0)) return false

  const presencas = data.presencas as unknown[]
  if (!everyRecord(presencas, p => isString(p.jovemId) && isString(p.data) && isBoolean(p.presente))) return false

  const grupos = data.grupos as unknown[]
  if (!everyRecord(grupos, g => isString(g.id) && isString(g.nome) && ['Equipe','Grupo','Ministério'].includes(String(g.tipo)) && isString(g.lider) && isBoolean(g.ativo))) return false

  const acompanhamentos = data.acompanhamentos as unknown[]
  if (!everyRecord(acompanhamentos, a => isString(a.id) && isString(a.jovemId) && isString(a.motivo) && isString(a.responsavel) && isString(a.prazo) && ['Pendente','Concluído'].includes(String(a.status)) && isString(a.criadoEm))) return false

  const usuarios = data.usuarios as unknown[]
  if (!everyRecord(usuarios, u => isString(u.id) && isString(u.nome) && isString(u.login) &&
    ['Administrador Master','Coordenação','Liderança','Comunicação','Financeiro','Consulta'].includes(String(u.perfil)) &&
    isBoolean(u.ativo) && isString(u.passwordSalt) && isString(u.passwordHash) && isNumber(u.passwordIterations))) return false

  const auditoria = data.auditoria as unknown[]
  if (!everyRecord(auditoria, a => isString(a.id) && isString(a.timestamp) && isString(a.usuario) && isString(a.acao) && (a.detalhes === undefined || isString(a.detalhes)))) return false

  const config = data.configuracao
  return isString(config.nomeGrupo) && isString(config.cidade) && isNumber(config.radarAmarelo) && isNumber(config.radarVermelho) && config.radarAmarelo > 0 && config.radarVermelho > config.radarAmarelo
}
