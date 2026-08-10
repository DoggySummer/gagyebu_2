import { Link, Navigate, useParams } from 'react-router'
import { CategoryPie } from '@/domains/stats/CategoryPie'
import { MonthlyTrendBar } from '@/domains/stats/MonthlyTrendBar'
import { SavingsRateCard } from '@/domains/stats/SavingsRateCard'
import { SpendingDonut } from '@/domains/stats/SpendingDonut'
import { useExpenseStats } from '@/domains/stats/useExpenseStats'
import { shiftMonth } from '@/domains/calendar/monthGrid'
import { isValidYearMonth, todayKey } from '@/lib/date'

function monthPath(year: number, month: number): string {
  return `/stats/expenses/${year}/${String(month).padStart(2, '0')}`
}

export function ExpenseStatsPage() {
  const { year = '', month = '' } = useParams<{ year: string; month: string }>()

  if (!isValidYearMonth(year, month)) {
    const today = todayKey()

    return <Navigate to={monthPath(Number(today.slice(0, 4)), Number(today.slice(5, 7)))} replace />
  }

  return <ExpenseStatsScreen year={Number(year)} month={Number(month)} />
}

function ExpenseStatsScreen({ year, month }: { year: number; month: number }) {
  const { stats, isLoading, loadError, reload } = useExpenseStats(year, month)
  const previous = shiftMonth(year, month, -1)
  const next = shiftMonth(year, month, 1)
  const monthKey = `${year}-${String(month).padStart(2, '0')}`

  return (
    <main className="py-5 pb-10">
      <div className="flex items-center justify-between">
        <Link
          to={monthPath(previous.year, previous.month)}
          aria-label="이전 달"
          className="flex h-11 w-11 items-center justify-center text-content text-body"
        >
          ‹
        </Link>
        <h1 className="text-date font-bold tracking-title text-ink">
          {year}년 {month}월
        </h1>
        <Link
          to={monthPath(next.year, next.month)}
          aria-label="다음 달"
          className="flex h-11 w-11 items-center justify-center text-content text-body"
        >
          ›
        </Link>
      </div>

      <div className="mt-2 text-center">
        <Link to={`/budget/${monthKey}`} className="text-label font-semibold text-muted underline">
          이 달 수입·고정지출 설정
        </Link>
      </div>

      {isLoading && <p className="mt-8 text-center text-content text-muted">불러오는 중…</p>}

      {loadError && (
        <div className="mt-8 text-center">
          <p role="alert" className="text-content text-body">
            {loadError}
          </p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
          >
            다시 시도
          </button>
        </div>
      )}

      {!isLoading && !loadError && stats && (
        <div className="mt-5 flex flex-col gap-3">
          <SpendingDonut stats={stats} />
          <SavingsRateCard stats={stats} />
          <CategoryPie items={stats.variableByCategory} />
          <MonthlyTrendBar items={stats.monthlyTrend} />
        </div>
      )}
    </main>
  )
}
