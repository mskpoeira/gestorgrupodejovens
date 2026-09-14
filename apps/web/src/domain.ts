export const APP_VERSION = '0.3.0'

export type PresenceLike = { presente: boolean }

export function dataLocalISO(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function adicionarDiasLocal(date: Date, dias: number): string {
  const copia = new Date(date)
  copia.setDate(copia.getDate() + dias)
  return dataLocalISO(copia)
}

export function idadeEm(nascimento: string, referencia = dataLocalISO()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || !/^\d{4}-\d{2}-\d{2}$/.test(referencia)) return null
  const [ny, nm, nd] = nascimento.split('-').map(Number)
  const [ry, rm, rd] = referencia.split('-').map(Number)
  if (!ny || !nm || !nd || !ry || !rm || !rd) return null
  let idade = ry - ny
  if (rm < nm || (rm === nm && rd < nd)) idade--
  return idade >= 0 && idade < 130 ? idade : null
}

export function ehMenor(nascimento: string, referencia = dataLocalISO()): boolean {
  const idade = idadeEm(nascimento, referencia)
  return idade !== null && idade < 18
}

export function taxaPresencaRegistros(registros: PresenceLike[]): number {
  if (!registros.length) return 0
  return Math.round((registros.filter(p => p.presente).length / registros.length) * 100)
}

export function validarDadosBackup(dados: unknown): dados is Record<string, unknown> {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return false
  const d = dados as Record<string, unknown>
  const arrays = ['jovens', 'eventos', 'presencas', 'grupos', 'acompanhamentos', 'usuarios']
  if (!arrays.every(k => Array.isArray(d[k]))) return false
  if (!d.configuracao || typeof d.configuracao !== 'object' || Array.isArray(d.configuracao)) return false
  const c = d.configuracao as Record<string, unknown>
  return typeof c.nomeGrupo === 'string' && typeof c.cidade === 'string' &&
    typeof c.radarAmarelo === 'number' && Number.isFinite(c.radarAmarelo) && c.radarAmarelo >= 1 &&
    typeof c.radarVermelho === 'number' && Number.isFinite(c.radarVermelho) && c.radarVermelho >= c.radarAmarelo
}
