import { useEffect, useRef } from 'react'
import { setFavorite } from '@/domains/entry/api'
import { FavoriteCard } from '@/domains/favorite/FavoriteCard'
import { useFavorites } from '@/domains/favorite/useFavorites'

export function FavoritesPage() {
  const { items, isInitialLoading, isLoadingMore, error, hasMore, loadMore, removeItem, retry } =
    useFavorites()
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

  const handleUnfavorite = async (entryDate: string) => {
    await setFavorite(entryDate, false)
    removeItem(entryDate)
  }

  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">즐겨찾기</h1>

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
          특별한 날을 ★로 표시해두면 여기 모여요.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 pb-6">
        {items.map((item) => (
          <FavoriteCard key={item.entryDate} item={item} onUnfavorite={handleUnfavorite} />
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}

      {isLoadingMore && <p className="pb-6 text-center text-label text-muted">불러오는 중…</p>}

      {error && items.length > 0 && (
        <div className="pb-6 text-center">
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
    </main>
  )
}
