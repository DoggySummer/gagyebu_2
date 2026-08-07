import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * 카카오 로그인. 성공하면 카카오 → Supabase → 이 앱 순으로 리다이렉트되고,
 * 돌아온 URL의 code를 supabase-js가 자동으로 세션과 교환한다(detectSessionInUrl 기본값).
 * 그래서 별도의 콜백 라우트가 필요 없다.
 */
export function KakaoLoginButton() {
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleLogin}
        className="flex min-h-[44px] w-full items-center justify-center rounded-card bg-kakao px-4 text-field font-semibold text-kakao-fg"
      >
        카카오로 로그인
      </button>
      {error && (
        <p role="alert" className="mt-3 text-center text-content text-cat-food-fg">
          {error}
        </p>
      )}
    </div>
  )
}
