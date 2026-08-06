import { useSession } from '@/domains/auth/useSession'
import { supabase } from '@/lib/supabase'

/** 1차 범위는 로그아웃뿐이다. */
export function SettingsPage() {
  const { session } = useSession()

  const displayName =
    (session?.user.user_metadata.name as string | undefined) ?? session?.user.email ?? ''

  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">설정</h1>

      {displayName && (
        <div className="mt-5 rounded-card border border-hairline bg-surface p-4">
          <p className="text-label font-semibold uppercase tracking-label text-muted">계정</p>
          <p className="mt-2 text-content text-body">{displayName}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => void supabase.auth.signOut()}
        className="mt-5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
      >
        로그아웃
      </button>
    </main>
  )
}
