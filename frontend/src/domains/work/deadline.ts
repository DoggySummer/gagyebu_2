import { todayKey } from '@/lib/date'

function toUTCDays(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

export function daysUntilDeadline(deadline: string): number {
  return Math.round(toUTCDays(deadline) - toUTCDays(todayKey()))
}

export function deadlineLabel(deadline: string | null): string {
  if (!deadline) return '마감일 없음'

  const diff = daysUntilDeadline(deadline)

  if (diff === 0) return 'D-DAY'
  if (diff > 0) return `D-${diff}`

  return `D+${Math.abs(diff)} 지남`
}

/** 오늘이거나 이미 지난 마감만 위험으로 본다. */
export function isUrgent(deadline: string | null): boolean {
  return deadline !== null && daysUntilDeadline(deadline) <= 0
}

/** 흐름 완료 시각 표시용. 서버가 준 ISO 문자열을 브라우저 로컬 시각 기준으로 짧게 보여준다. */
export function formatDoneAt(iso: string): string {
  const date = new Date(iso)
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')

  return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${min}`
}
