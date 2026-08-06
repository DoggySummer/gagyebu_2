export interface MonthCell {
  /** 빈 칸이면 null */
  dateKey: string | null
  day: number | null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toDateKeyParts(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * 일요일 시작 7열 그리드. 앞뒤 빈 칸을 채워 항상 7의 배수 길이를 만든다.
 * 로컬 타임존의 영향을 받지 않도록 요일 계산은 UTC로 한다.
 */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const total = daysInMonth(year, month)
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()

  const cells: MonthCell[] = []

  for (let i = 0; i < leading; i += 1) {
    cells.push({ dateKey: null, day: null })
  }

  for (let day = 1; day <= total; day += 1) {
    cells.push({ dateKey: toDateKeyParts(year, month, day), day })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null })
  }

  return cells
}

/**
 * 히트맵 4단계. 표시 중인 달의 일별 지출 합계 최댓값을 기준으로 한 상대값이다.
 * 달마다 기준이 다시 계산되므로 "이번 달 안에서 상대적으로 많이 쓴 날"을 보여준다.
 */
export function heatLevel(total: number, monthMax: number): 0 | 1 | 2 | 3 {
  if (total <= 0 || monthMax <= 0) return 0

  const ratio = total / monthMax

  if (ratio <= 0.33) return 1
  if (ratio <= 0.66) return 2

  return 3
}

export function shiftMonth(year: number, month: number, delta: number) {
  const base = new Date(Date.UTC(year, month - 1 + delta, 1))

  return { year: base.getUTCFullYear(), month: base.getUTCMonth() + 1 }
}
