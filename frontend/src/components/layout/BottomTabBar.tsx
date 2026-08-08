import { Link, useLocation } from 'react-router'
import { todayKey } from '@/lib/date'

interface Tab {
  key: string
  label: string
  to: string
  isActive: (pathname: string) => boolean
}

const MORE_PATHS = ['/more', '/calendar', '/favorites', '/stats', '/settings']

function buildTabs(today: string): Tab[] {
  return [
    {
      key: 'today',
      label: '오늘',
      to: `/entries/${today}`,
      isActive: (pathname) => pathname === '/' || pathname.startsWith('/entries'),
    },
    {
      key: 'work',
      label: '작업',
      to: '/work',
      isActive: (pathname) => pathname.startsWith('/work'),
    },
    {
      key: 'more',
      label: '더보기',
      to: '/more',
      isActive: (pathname) => MORE_PATHS.some((path) => pathname.startsWith(path)),
    },
  ]
}

export function BottomTabBar() {
  const { pathname } = useLocation()
  const tabs = buildTabs(todayKey())

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex w-full max-w-[560px]">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)

          return (
            <li key={tab.key} className="flex-1">
              <Link
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] items-center justify-center py-3 text-label font-semibold tracking-label ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
