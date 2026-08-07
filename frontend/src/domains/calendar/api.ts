import { apiFetch } from '@/lib/api/client'
import type { CalendarSummaryDto } from '@shared/api.types'

/** 화면이 날짜별로 바로 조회할 수 있게 배열을 맵으로 바꿔 들고 있는다. */
export interface MonthSummary {
  totals: Record<string, number>
  favorites: Set<string>
  max: number
}

export async function fetchMonthSummary(year: number, month: number): Promise<MonthSummary> {
  const dto = await apiFetch<CalendarSummaryDto>(`/calendar?year=${year}&month=${month}`)

  const totals: Record<string, number> = {}
  const favorites = new Set<string>()

  for (const day of dto.days) {
    if (day.totalAmount > 0) totals[day.entryDate] = day.totalAmount
    if (day.isFavorite) favorites.add(day.entryDate)
  }

  return { totals, favorites, max: dto.maxTotal }
}
