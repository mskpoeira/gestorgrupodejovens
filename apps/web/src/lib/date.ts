export function localDateISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addLocalDays(days: number, date = new Date()): string {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12, 0, 0)
  return localDateISO(copy)
}

export function ageOn(birthDate: string, reference = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null
  const [year, month, day] = birthDate.split('-').map(Number)
  const birth = new Date(year, month - 1, day, 12, 0, 0)
  if (Number.isNaN(birth.getTime()) || birth > reference) return null
  let age = reference.getFullYear() - year
  const birthdayPassed = reference.getMonth() > month - 1 || (reference.getMonth() === month - 1 && reference.getDate() >= day)
  if (!birthdayPassed) age--
  return age
}

export function isMinor(birthDate: string, reference = new Date()): boolean {
  const age = ageOn(birthDate, reference)
  return age !== null && age < 18
}
