import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/routing/RequireAuth'
import { CurrentMonthRedirect, TodayRedirect } from '@/components/routing/Redirects'
import { LoginPage } from '@/domains/auth/LoginPage'
import { AccountFormPage } from '@/domains/assets/AccountFormPage'
import { AssetsPage } from '@/domains/assets/AssetsPage'
import { CalendarPage } from '@/domains/calendar/CalendarPage'
import { EntryPage } from '@/domains/entry/EntryPage'
import { FavoritesPage } from '@/domains/favorite/FavoritesPage'
import { InbodyFormPage } from '@/domains/inbody/InbodyFormPage'
import { InbodyPage } from '@/domains/inbody/InbodyPage'
import { MorePage } from '@/domains/more/MorePage'
import { SettingsPage } from '@/domains/settings/SettingsPage'
import { StatsPage } from '@/domains/stats/StatsPage'
import { WorkDetailPage } from '@/domains/work/WorkDetailPage'
import { WorkFormPage } from '@/domains/work/WorkFormPage'
import { WorkListPage } from '@/domains/work/WorkListPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <TodayRedirect /> },
          { path: '/entries/:date', element: <EntryPage /> },
          { path: '/calendar', element: <CurrentMonthRedirect /> },
          { path: '/calendar/:year/:month', element: <CalendarPage /> },
          { path: '/work', element: <WorkListPage /> },
          { path: '/work/:id', element: <WorkDetailPage /> },
          { path: '/assets', element: <AssetsPage /> },
          { path: '/more', element: <MorePage /> },
          { path: '/favorites', element: <FavoritesPage /> },
          { path: '/stats', element: <StatsPage /> },
          { path: '/stats/inbody', element: <InbodyPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      // 입력 화면은 목업대로 탭바 없이 단독으로 띄운다.
      { path: '/stats/inbody/new', element: <InbodyFormPage /> },
      { path: '/work/new', element: <WorkFormPage /> },
      { path: '/work/:id/edit', element: <WorkFormPage /> },
      { path: '/assets/new', element: <AccountFormPage /> },
      { path: '/assets/:id/edit', element: <AccountFormPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
