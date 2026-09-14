const ITERATIONS = 210_000

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function derive(password: string, salt: Uint8Array, iterations = ITERATIONS): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, keyMaterial, 256)
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string; iterations: number }> {
  if (password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await derive(password, salt)
  return { salt: bytesToBase64(salt), hash: bytesToBase64(new Uint8Array(bits)), iterations: ITERATIONS }
}

export async function verifyPassword(password: string, salt: string, expectedHash: string, iterations = ITERATIONS): Promise<boolean> {
  const bits = await derive(password, base64ToBytes(salt), iterations)
  const actual = new Uint8Array(bits)
  const expected = base64ToBytes(expectedHash)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}
