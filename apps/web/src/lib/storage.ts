type StoredEnvelope = { iv: string; ciphertext: string }
const DB_NAME = 'sgj-secure-v1'
const DB_VERSION = 1
const KEY_ID = 'device-aes-key'
let sqlDbPromise: Promise<any> | null = null

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
      if (!db.objectStoreNames.contains('keys')) db.createObjectStore('keys')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function idbGet<T>(store: 'kv' | 'keys', key: string): Promise<T | undefined> {
  const db = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const request = tx.objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function idbSet(store: 'kv' | 'keys', key: string, value: unknown): Promise<void> {
  const db = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getDeviceKey(): Promise<CryptoKey> {
  let key = await idbGet<CryptoKey>('keys', KEY_ID)
  if (!key) {
    key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    await idbSet('keys', KEY_ID, key)
  }
  return key
}

async function encrypt(value: unknown): Promise<string> {
  const key = await getDeviceKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  const envelope: StoredEnvelope = { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) }
  return JSON.stringify(envelope)
}

async function decrypt<T>(stored: string): Promise<T> {
  const envelope = JSON.parse(stored) as StoredEnvelope
  const key = await getDeviceKey()
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(envelope.iv) },
    key,
    base64ToBytes(envelope.ciphertext),
  )
  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}

async function getSqlDb(): Promise<any> {
  if (!sqlDbPromise) {
    sqlDbPromise = (async () => {
      const { default: Database } = await import('@tauri-apps/plugin-sql')
      const db = await Database.load('sqlite:sgj.db')
      await db.execute('CREATE TABLE IF NOT EXISTS secure_kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL)')
      return db
    })()
  }
  return sqlDbPromise
}

async function rawGet(key: string): Promise<string | null> {
  if (isTauri()) {
    const db = await getSqlDb()
    const rows = await db.select('SELECT value FROM secure_kv WHERE key = $1 LIMIT 1', [key]) as Array<{ value: string }>
    return rows[0]?.value ?? null
  }
  return (await idbGet<string>('kv', key)) ?? null
}

async function rawSet(key: string, value: string): Promise<void> {
  if (isTauri()) {
    const db = await getSqlDb()
    await db.execute(
      'INSERT INTO secure_kv (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [key, value, new Date().toISOString()],
    )
    return
  }
  await idbSet('kv', key, value)
}

export async function loadSecure<T>(key: string, fallback: T): Promise<T> {
  try {
    let stored = await rawGet(key)
    if (!stored) {
      const legacy = localStorage.getItem(key)
      if (legacy) {
        const migrated = JSON.parse(legacy) as T
        await saveSecure(key, migrated)
        localStorage.removeItem(key)
        return migrated
      }
      return fallback
    }
    return await decrypt<T>(stored)
  } catch {
    return fallback
  }
}

export async function saveSecure<T>(key: string, value: T): Promise<void> {
  await rawSet(key, await encrypt(value))
}

export async function appendAudit(entry: Record<string, unknown>): Promise<void> {
  const current = await loadSecure<Record<string, unknown>[]>('sgj_auditoria', [])
  current.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...entry })
  await saveSecure('sgj_auditoria', current.slice(0, 5000))
}
