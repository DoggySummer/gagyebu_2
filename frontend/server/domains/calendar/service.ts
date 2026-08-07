import type {
  CalendarDayDto,
  CalendarSummaryDto,
  CategoryTotalDto,
  MonthOverviewDto,
  MoodCountDto,
} from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'
import { getReview } from '../review/service.js'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function monthRange(year: number, month: number): { from: string; to: string } {
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`,
  }
}

function previousMonth(year: number, month: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 2, 1))

  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
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
  const { from, to } = monthRange(year, month)

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

/**
 * 캘린더 하단 월간 평가 섹션 전용 데이터.
 * 지출 요약(이번 달 합계·전월 대비·최다 카테고리), 감정 분포, 회고를 한 번에 묶는다.
 * 셋 다 캘린더 화면이 뜰 때 같이 필요하므로 화면 하나에 왕복 하나로 맞춘다.
 */
export async function getMonthOverview(
  supabase: UserClient,
  userId: string,
  year: number,
  month: number,
): Promise<MonthOverviewDto> {
  const current = monthRange(year, month)
  const prev = previousMonth(year, month)
  const previous = monthRange(prev.year, prev.month)

  const [currentExpenses, previousExpenses, moods, review] = await Promise.all([
    supabase
      .from('expenses')
      .select('amount,category')
      .eq('user_id', userId)
      .gte('entry_date', current.from)
      .lte('entry_date', current.to),
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('entry_date', previous.from)
      .lte('entry_date', previous.to),
    supabase
      .from('daily_entries')
      .select('mood_score')
      .eq('user_id', userId)
      .not('mood_score', 'is', null)
      .gte('entry_date', current.from)
      .lte('entry_date', current.to),
    getReview(supabase, userId, `${year}-${pad(month)}`),
  ])

  if (currentExpenses.error) throw currentExpenses.error
  if (previousExpenses.error) throw previousExpenses.error
  if (moods.error) throw moods.error

  const totalAmount = currentExpenses.data.reduce((sum, row) => sum + row.amount, 0)

  const previousMonthAmount = previousExpenses.data.length
    ? previousExpenses.data.reduce((sum, row) => sum + row.amount, 0)
    : null

  const categoryTotals = new Map<string, number>()

  for (const row of currentExpenses.data) {
    categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + row.amount)
  }

  const topCategory: CategoryTotalDto | null = categoryTotals.size
    ? [...categoryTotals.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)[0]
    : null

  const moodTotals = new Map<number, number>()

  for (const row of moods.data) {
    const score = row.mood_score as number
    moodTotals.set(score, (moodTotals.get(score) ?? 0) + 1)
  }

  const moodCounts: MoodCountDto[] = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: moodTotals.get(score) ?? 0,
  }))

  return {
    year,
    month,
    totalAmount,
    previousMonthAmount,
    topCategory,
    moodCounts,
    recordedMoodDays: moods.data.length,
    review,
  }
}
