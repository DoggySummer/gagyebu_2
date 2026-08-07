import { Link } from 'react-router'

interface MenuItem {
  label: string
  description: string
  /** 아직 만들지 않은 항목은 링크 없이 비활성으로 둔다. */
  to?: string
}

const MENU: MenuItem[] = [
  { label: '가계부', description: '준비 중' },
  { label: '인바디', description: '체성분 측정값과 항목별 추이', to: '/stats/inbody' },
]

export function StatsPage() {
  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">통계</h1>

      <ul className="mt-5 overflow-hidden rounded-card border border-hairline bg-surface">
        {MENU.map((item, index) => {
          const className = index > 0 ? 'border-t border-divider' : undefined
          const body = (
            <>
              <span className={item.to ? 'text-content text-body' : 'text-content text-placeholder'}>
                {item.label}
              </span>
              <span className="text-label text-muted">{item.description}</span>
            </>
          )

          return (
            <li key={item.label} className={className}>
              {item.to ? (
                <Link to={item.to} className="flex min-h-[44px] flex-col justify-center px-4 py-3">
                  {body}
                </Link>
              ) : (
                <div className="flex min-h-[44px] flex-col justify-center px-4 py-3">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
