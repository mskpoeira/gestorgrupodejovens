import { describe, expect, it } from 'vitest'
import { adicionarDiasLocal, dataLocalISO, ehMenor, idadeEm, taxaPresencaRegistros, validarDadosBackup } from './domain'

describe('domínio SGJ', () => {
  it('usa a data civil local sem converter para UTC', () => {
    const data = new Date(2026, 8, 14, 23, 55, 0)
    expect(dataLocalISO(data)).toBe('2026-09-14')
  })

  it('soma dias respeitando calendário local', () => {
    expect(adicionarDiasLocal(new Date(2026, 8, 14, 12), 7)).toBe('2026-09-21')
  })

  it('calcula maioridade pela data de nascimento', () => {
    expect(idadeEm('2008-09-15', '2026-09-14')).toBe(17)
    expect(ehMenor('2008-09-15', '2026-09-14')).toBe(true)
    expect(ehMenor('2008-09-14', '2026-09-14')).toBe(false)
  })

  it('calcula presença sobre chamadas realmente registradas', () => {
    expect(taxaPresencaRegistros([{ presente: true }, { presente: false }, { presente: true }])).toBe(67)
  })

  it('rejeita backup estruturalmente incompleto', () => {
    expect(validarDadosBackup({ jovens: [] })).toBe(false)
    expect(validarDadosBackup({
      jovens: [], eventos: [], presencas: [], grupos: [], acompanhamentos: [], usuarios: [],
      configuracao: { nomeGrupo: 'Jovens', cidade: 'Ubatuba', radarAmarelo: 14, radarVermelho: 30 },
    })).toBe(true)
  })
})
