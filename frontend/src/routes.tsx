import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/routing/RequireAuth'
import { CurrentMonthRedirect, TodayRedirect } from '@/components/routing/Redirects'
import { LoginPage } from '@/domains/auth/LoginPage'
import { CalendarPage } from '@/domains/calendar/CalendarPage'
import { EntryPage } from '@/domains/entry/EntryPage'
import { FavoritesPage } from '@/domains/favorite/FavoritesPage'
import { MorePage } from '@/domains/more/MorePage'
import { SettingsPage } from '@/domains/settings/SettingsPage'
import { StatsPage } from '@/domains/stats/StatsPage'

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
          { path: '/more', element: <MorePage /> },
          { path: '/favorites', element: <FavoritesPage /> },
          { path: '/stats', element: <StatsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
