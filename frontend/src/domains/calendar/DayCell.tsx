import { Link } from 'react-router'
import { HEATMAP_CLASS } from '@/lib/categories'
import type { MonthCell } from '@/domains/calendar/monthGrid'

interface Props {
  cell: MonthCell
  level: 0 | 1 | 2 | 3
  isFavorite: boolean
  isFuture: boolean
  isToday: boolean
}

export function DayCell({ cell, level, isFavorite, isFuture, isToday }: Props) {
  if (!cell.dateKey) {
    return <div aria-hidden="true" />
  }

  const content = (
    <>
      <span className={isToday ? 'font-bold text-ink' : undefined}>{cell.day}</span>
      {isFavorite && (
        <span aria-hidden="true" className="absolute right-1 top-0.5 text-[10px] text-ink">
          ★
        </span>
      )}
    </>
  )

  const base = `relative flex aspect-square items-center justify-center rounded-cell text-content ${HEATMAP_CLASS[level]}`

  // 미래 날짜는 선택할 수 없다.
  if (isFuture) {
    return <div className={`${base} text-placeholder`}>{content}</div>
  }

  return (
    <Link
      to={`/entries/${cell.dateKey}`}
      aria-label={`${cell.dateKey}${isFavorite ? ' 즐겨찾기' : ''}`}
      className={`${base} text-body`}
    >
      {content}
    </Link>
  )
}
