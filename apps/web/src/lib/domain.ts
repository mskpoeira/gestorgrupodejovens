export type RadarStatus = 'Ativo' | 'Atenção' | 'Acompanhamento'

export type PresenceLike = { jovemId: string; data: string; presente: boolean }
export type MemberLike = { id: string; cadastradoEm: string }

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date}T12:00:00`).getTime() / 86400000)
}

export function radarStatus(lastPresence: string | null, registeredAt: string, today: string, yellow: number, red: number): RadarStatus {
  const reference = lastPresence || registeredAt
  const days = Math.max(0, dayNumber(today) - dayNumber(reference))
  if (days >= red) return 'Acompanhamento'
  if (days >= yellow) return 'Atenção'
  return 'Ativo'
}

export function presenceRate(members: MemberLike[], presences: PresenceLike[]): number {
  const dates = [...new Set(presences.map(p => p.data))]
  if (!dates.length) return 0
  let eligibleTotal = 0
  let presentTotal = 0
  for (const date of dates) {
    const eligible = members.filter(member => member.cadastradoEm <= date)
    eligibleTotal += eligible.length
    const ids = new Set(eligible.map(member => member.id))
    presentTotal += presences.filter(p => p.data === date && p.presente && ids.has(p.jovemId)).length
  }
  return eligibleTotal ? Math.round((presentTotal / eligibleTotal) * 100) : 0
}
