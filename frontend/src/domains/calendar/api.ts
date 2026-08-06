import { supabase } from '@/lib/supabase'
import { daysInMonth, toDateKeyParts } from '@/domains/calendar/monthGrid'

export interface MonthSummary {
  /** entry_date → 그날의 변동지출 합계 */
  totals: Record<string, number>
  favorites: Set<string>
  max: number
}

/**
 * 한 달치 지출 합계와 즐겨찾기 여부.
 *
 * PostgREST로는 GROUP BY를 직접 쓸 수 없어 해당 달의 행을 받아 클라이언트에서 합산한다.
 * 하루 몇 건 수준이라 한 달이면 많아야 수백 행이다. 느려지면 RPC로 옮긴다.
 */
export async function fetchMonthSummary(
  userId: string,
  year: number,
  month: number,
): Promise<MonthSummary> {
  const from = toDateKeyParts(year, month, 1)
  const to = toDateKeyParts(year, month, daysInMonth(year, month))

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

  const totals: Record<string, number> = {}

  for (const row of expensesResult.data) {
    totals[row.entry_date] = (totals[row.entry_date] ?? 0) + row.amount
  }

  return {
    totals,
    favorites: new Set(favoritesResult.data.map((row) => row.entry_date)),
    max: Math.max(0, ...Object.values(totals)),
  }
}
