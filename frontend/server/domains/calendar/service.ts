import type { CalendarDayDto, CalendarSummaryDto } from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * 날짜별 지출 합계와 즐겨찾기 여부.
 *
 * PostgREST로는 GROUP BY를 직접 쓸 수 없어 해당 달의 행을 받아 합산한다.
 * 하루 몇 건 수준이면 한 달에 많아야 수백 행이다. 느려지면 RPC로 옮긴다.
 */
export async function getMonthSummary(
  supabase: UserClient,
  userId: string,
  year: number,
  month: number,
): Promise<CalendarSummaryDto> {
  const from = `${year}-${pad(month)}-01`
  const to = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`

  const [expensesResult, favoritesResult] = await Promise.all([
    supabase
      .from('expenses')
      .select('entry_date,amount')
      .eq('user_id', userId)
      .gte('entry_date', from)
      .lte('entry_date', to),
    supabase
      .from('daily_entries')
      .select('entry_date')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .gte('entry_date', from)
      .lte('entry_date', to),
  ])

  if (expensesResult.error) throw expensesResult.error
  if (favoritesResult.error) throw favoritesResult.error

  const totals = new Map<string, number>()

  for (const row of expensesResult.data) {
    totals.set(row.entry_date, (totals.get(row.entry_date) ?? 0) + row.amount)
  }

  const favorites = new Set(favoritesResult.data.map((row) => row.entry_date))
  const dates = new Set([...totals.keys(), ...favorites])

  const days: CalendarDayDto[] = [...dates].sort().map((entryDate) => ({
    entryDate,
    totalAmount: totals.get(entryDate) ?? 0,
    isFavorite: favorites.has(entryDate),
  }))

  return {
    year,
    month,
    days,
    maxTotal: Math.max(0, ...totals.values()),
  }
}
