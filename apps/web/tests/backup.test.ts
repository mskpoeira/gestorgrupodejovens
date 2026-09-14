import { describe, expect, it } from 'vitest'
import { decryptBackup, encryptBackup, validateBackupPayload } from '../src/lib/backup'

describe('backup criptografado', () => {
  it('criptografa e restaura sem texto claro', async () => {
    const payload = { versao: '0.3.0', dados: { jovens: [], eventos: [], presencas: [], grupos: [], acompanhamentos: [], usuarios: [], auditoria: [], configuracao: { nomeGrupo: 'Teste', cidade: '', radarAmarelo: 14, radarVermelho: 30 } } }
    const encrypted = await encryptBackup(payload, 'senha-segura-123')
    expect(encrypted).not.toContain('"jovens":[]')
    const restored = await decryptBackup(encrypted, 'senha-segura-123')
    expect(restored).toEqual(payload)
    expect(validateBackupPayload(restored)).toBe(true)
  })
})
