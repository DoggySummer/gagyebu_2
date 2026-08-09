import { Link } from 'react-router'
import { todayKey } from '@/lib/date'

export function MorePage() {
  const today = todayKey()

  const menu = [
    { to: `/calendar/${today.slice(0, 4)}/${today.slice(5, 7)}`, label: '캘린더' },
    { to: '/favorites', label: '즐겨찾기' },
    { to: '/assets', label: '자산' },
    { to: '/stats', label: '통계' },
    { to: '/settings', label: '설정' },
  ]

  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">더보기</h1>

      <ul className="mt-5 overflow-hidden rounded-card border border-hairline bg-surface">
        {menu.map((item, index) => (
          <li key={item.to} className={index > 0 ? 'border-t border-divider' : undefined}>
            <Link
              to={item.to}
              className="flex min-h-[44px] items-center px-4 py-3 text-content text-body"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
