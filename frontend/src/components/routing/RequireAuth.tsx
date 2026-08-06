import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '@/domains/auth/useSession'

/**
 * 로그인하지 않았으면 로그인 화면으로 보낸다.
 * 세션 복구가 끝나기 전에 판단하면 새로고침할 때마다 로그인 화면이 깜빡이므로 로딩을 기다린다.
 */
export function RequireAuth() {
  const { session, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-content text-muted">불러오는 중…</p>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
