import { describe, expect, it } from 'vitest'
import { localDateISO, ageOn, isMinor } from '../src/lib/date'
import { presenceRate, radarStatus } from '../src/lib/domain'

describe('datas locais', () => {
  it('não usa UTC para formar a data', () => {
    const local = new Date(2026, 8, 13, 23, 30, 0)
    expect(localDateISO(local)).toBe('2026-09-13')
  })
  it('calcula idade e menoridade', () => {
    const ref = new Date(2026, 8, 13, 12, 0, 0)
    expect(ageOn('2009-09-14', ref)).toBe(16)
    expect(isMinor('2009-09-14', ref)).toBe(true)
  })
})

describe('radar', () => {
  it('usa a data de cadastro quando nunca houve presença', () => {
    expect(radarStatus(null, '2026-08-01', '2026-09-13', 14, 30)).toBe('Acompanhamento')
  })
  it('mantém ativo quem compareceu recentemente', () => {
    expect(radarStatus('2026-09-10', '2026-01-01', '2026-09-13', 14, 30)).toBe('Ativo')
  })
})

describe('métrica de presença', () => {
  it('não inclui retroativamente cadastro posterior', () => {
    const members = [
      { id: 'a', cadastradoEm: '2026-01-01' },
      { id: 'b', cadastradoEm: '2026-02-01' },
    ]
    const presences = [
      { jovemId: 'a', data: '2026-01-15', presente: true },
      { jovemId: 'a', data: '2026-02-15', presente: true },
      { jovemId: 'b', data: '2026-02-15', presente: false },
    ]
    expect(presenceRate(members, presences)).toBe(67)
  })
})
