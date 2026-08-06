export const APP_TIME_ZONE = 'Asia/Seoul'

/** en-CA 로캘은 YYYY-MM-DD 형식을 준다. */
const dateKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function toDateKey(date: Date): string {
  return dateKeyFormat.format(date)
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

export function isValidYearMonth(year: string, month: string): boolean {
  return /^\d{4}$/.test(year) && /^(0[1-9]|1[0-2])$/.test(month)
}
