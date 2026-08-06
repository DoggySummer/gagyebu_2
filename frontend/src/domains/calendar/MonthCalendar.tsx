import { DayCell } from '@/domains/calendar/DayCell'
import { buildMonthGrid, heatLevel } from '@/domains/calendar/monthGrid'
import type { MonthSummary } from '@/domains/calendar/api'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  year: number
  month: number
  summary: MonthSummary
  today: string
}

export function MonthCalendar({ year, month, summary, today }: Props) {
  const cells = buildMonthGrid(year, month)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="pb-1 text-center text-label font-semibold tracking-label text-muted"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => (
          <DayCell
            key={cell.dateKey ?? `blank-${index}`}
            cell={cell}
            level={cell.dateKey ? heatLevel(summary.totals[cell.dateKey] ?? 0, summary.max) : 0}
            isFavorite={cell.dateKey ? summary.favorites.has(cell.dateKey) : false}
            isFuture={cell.dateKey ? cell.dateKey > today : false}
            isToday={cell.dateKey === today}
          />
        ))}
      </div>
    </div>
  )
}
