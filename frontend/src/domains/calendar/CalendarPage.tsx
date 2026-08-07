import { useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { MonthCalendar } from '@/domains/calendar/MonthCalendar'
import { MonthOverview } from '@/domains/calendar/MonthOverview'
import { shiftMonth } from '@/domains/calendar/monthGrid'
import { useMonthOverview } from '@/domains/calendar/useMonthOverview'
import { useMonthSummary } from '@/domains/calendar/useMonthSummary'
import { isValidYearMonth, todayKey } from '@/lib/date'

const SWIPE_THRESHOLD = 50

function monthPath(year: number, month: number): string {
  return `/calendar/${year}/${String(month).padStart(2, '0')}`
}

export function CalendarPage() {
  const { year = '', month = '' } = useParams<{ year: string; month: string }>()

  if (!isValidYearMonth(year, month)) {
    const today = todayKey()

    return <Navigate to={monthPath(Number(today.slice(0, 4)), Number(today.slice(5, 7)))} replace />
  }

  return <CalendarScreen year={Number(year)} month={Number(month)} />
}

function CalendarScreen({ year, month }: { year: number; month: number }) {
  const navigate = useNavigate()
  const { summary, isLoading, loadError, reload } = useMonthSummary(year, month)
  const overview = useMonthOverview(year, month)
  const touchStartX = useRef<number | null>(null)

  const previous = shiftMonth(year, month, -1)
  const next = shiftMonth(year, month, 1)

  const handleTouchEnd = (endX: number) => {
    const startX = touchStartX.current
    touchStartX.current = null

    if (startX === null) return

    const delta = endX - startX

    if (delta > SWIPE_THRESHOLD) {
      void navigate(monthPath(previous.year, previous.month))
    } else if (delta < -SWIPE_THRESHOLD) {
      void navigate(monthPath(next.year, next.month))
    }
  }

  return (
    <main className="py-5">
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

      {loadError ? (
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
      ) : (
        <div
          className={`mt-4 ${isLoading ? 'opacity-50' : ''}`}
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0].clientX
          }}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
        >
          <MonthCalendar year={year} month={month} summary={summary} today={todayKey()} />
        </div>
      )}

      {overview.loadError ? (
        <div className="mt-8 text-center">
          <p role="alert" className="text-content text-body">
            {overview.loadError}
          </p>
          <button
            type="button"
            onClick={overview.reload}
            className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
          >
            다시 시도
          </button>
        </div>
      ) : (
        overview.overview && (
          <MonthOverview overview={overview.overview} onReviewSaved={overview.applyReview} />
        )
      )}
    </main>
  )
}
