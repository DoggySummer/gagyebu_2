import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useWorkScreens } from '@/domains/work/useWorkScreens'
import { WorkScreenCard } from '@/domains/work/WorkScreenCard'

export function WorkListPage() {
  const { items, isInitialLoading, isLoadingMore, error, hasMore, loadMore, retry } = useWorkScreens()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [loadMore])

  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">작업</h1>

      {isInitialLoading && <p className="mt-8 text-center text-content text-muted">불러오는 중…</p>}

      {error && items.length === 0 && (
        <div className="mt-8 text-center">
          <p role="alert" className="text-content text-body">
            {error}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
          >
            다시 시도
          </button>
        </div>
      )}

      {!isInitialLoading && !error && items.length === 0 && (
        <p className="mt-10 text-center text-content text-muted">
          아직 기록한 작업이 없어요. ＋ 를 눌러 화면 하나를 정리해보세요.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 pb-24">
        {items.map((screen) => (
          <WorkScreenCard key={screen.id} screen={screen} />
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}

      {isLoadingMore && <p className="pb-6 text-center text-label text-muted">불러오는 중…</p>}

      <Link
        to="/work/new"
        aria-label="작업 추가"
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-[max(16px,calc(50vw-264px))] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-[24px] text-canvas"
      >
        ＋
      </Link>
    </main>
  )
}
