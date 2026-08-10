import type {
  CategoryAmountDto,
  ExpenseStatsDto,
  FixedExpenseDto,
  MonthlyExpenseTotalDto,
} from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'

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

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))

  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

function monthColumn(year: number, month: number): string {
  return `${year}-${pad(month)}-01`
}

function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`
}

async function getVariableTotal(
  supabase: UserClient,
  userId: string,
  year: number,
  month: number,
): Promise<number> {
  const { from, to } = monthRange(year, month)
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('entry_date', from)
    .lte('entry_date', to)

  if (error) throw error

  return data.reduce((sum, row) => sum + row.amount, 0)
}

const TREND_MONTHS = 6

/**
 * 더보기 > 통계 > 가계부 화면 전용 집계.
 * 수입·고정지출은 monthly_settings/fixed_expenses(월 설정)에서, 변동지출은 expenses에서,
 * 저축은 이미 있는 net_worth_snapshots(자산 기능)의 전월 대비 순자산 증감으로 계산한다.
 * 저축을 따로 입력받지 않는 이유는 설계 논의에서 이미 결정했다 — 투자 손익이 섞이는
 * 트레이드오프가 있지만, 매달 저축액을 또 입력하게 만드는 것보다 낫다고 판단.
 */
export async function getExpenseStats(
  supabase: UserClient,
  userId: string,
  year: number,
  month: number,
): Promise<ExpenseStatsDto> {
  const { from, to } = monthRange(year, month)
  const prev = shiftMonth(year, month, -1)

  const [settingsResult, fixedResult, variableResult, currentSnapshot, previousSnapshot] =
    await Promise.all([
      supabase
        .from('monthly_settings')
        .select('income')
        .eq('user_id', userId)
        .eq('month', monthColumn(year, month))
        .maybeSingle(),
      supabase
        .from('fixed_expenses')
        .select('category,amount')
        .eq('user_id', userId)
        .eq('month', monthColumn(year, month)),
      supabase
        .from('expenses')
        .select('category,amount')
        .eq('user_id', userId)
        .gte('entry_date', from)
        .lte('entry_date', to),
      supabase
        .from('net_worth_snapshots')
        .select('net_worth')
        .eq('user_id', userId)
        .eq('month', monthColumn(year, month))
        .maybeSingle(),
      supabase
        .from('net_worth_snapshots')
        .select('net_worth')
        .eq('user_id', userId)
        .eq('month', monthColumn(prev.year, prev.month))
        .maybeSingle(),
    ])

  if (settingsResult.error) throw settingsResult.error
  if (fixedResult.error) throw fixedResult.error
  if (variableResult.error) throw variableResult.error
  if (currentSnapshot.error) throw currentSnapshot.error
  if (previousSnapshot.error) throw previousSnapshot.error

  const income = settingsResult.data?.income ?? 0
  const fixedExpenses: FixedExpenseDto[] = fixedResult.data
  const fixedTotal = fixedExpenses.reduce((sum, item) => sum + item.amount, 0)

  const categoryTotals = new Map<string, number>()

  for (const row of variableResult.data) {
    categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + row.amount)
  }

  const variableByCategory: CategoryAmountDto[] = [...categoryTotals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
  const variableTotal = variableResult.data.reduce((sum, row) => sum + row.amount, 0)

  const savings =
    currentSnapshot.data && previousSnapshot.data
      ? currentSnapshot.data.net_worth - previousSnapshot.data.net_worth
      : null
  const savingsRate = savings !== null && income > 0 ? savings / income : null

  const trendMonths = Array.from({ length: TREND_MONTHS }, (_, i) =>
    shiftMonth(year, month, -(TREND_MONTHS - 1 - i)),
  )
  const monthlyTrend: MonthlyExpenseTotalDto[] = await Promise.all(
    trendMonths.map(async (m) => ({
      month: monthKey(m.year, m.month),
      total: await getVariableTotal(supabase, userId, m.year, m.month),
    })),
  )

  return {
    year,
    month,
    income,
    fixedTotal,
    fixedExpenses,
    variableTotal,
    variableByCategory,
    savings,
    savingsRate,
    monthlyTrend,
  }
}
