import { Navigate } from 'react-router'
import { KakaoLoginButton } from '@/domains/auth/KakaoLoginButton'
import { useSession } from '@/domains/auth/useSession'
import { todayKey } from '@/lib/date'

/** 로그인 수단은 카카오 단일. 이미 로그인된 상태면 오늘 화면으로 보낸다. */
export function LoginPage() {
  const { session, isLoading } = useSession()

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-content text-muted">불러오는 중…</p>
      </main>
    )
  }

  if (session) {
    return <Navigate to={`/entries/${todayKey()}`} replace />
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-date font-bold tracking-title text-ink">가계부 + 감사일기</h1>
        <p className="mt-2 text-content text-muted">하루를 기록하고, 그날의 지출을 남겨요</p>
      </div>
      <KakaoLoginButton />
    </main>
  )
}
