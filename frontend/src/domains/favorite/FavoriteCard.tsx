import { useState } from 'react'
import { Link } from 'react-router'
import { moodEmoji } from '@/lib/moods'
import type { FavoriteItemDto } from '@shared/api.types'

interface Props {
  item: FavoriteItemDto
  onUnfavorite: (entryDate: string) => Promise<void>
}

export function FavoriteCard({ item, onUnfavorite }: Props) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emoji = moodEmoji(item.moodScore)

  const handleUnfavorite = async () => {
    setIsRemoving(true)
    setError(null)

    try {
      await onUnfavorite(item.entryDate)
      // 성공하면 부모가 목록에서 이 카드를 빼내 언마운트하므로 isRemoving을 되돌릴 필요가 없다.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '즐겨찾기를 해제하지 못했어요.')
      setIsRemoving(false)
    }
  }

  return (
    <div>
      {/* 버튼은 <a> 안에 넣을 수 없어(HTML 콘텐츠 모델 위반) Link와 형제로 둔다. */}
      <div className="flex items-center gap-2 rounded-card border border-hairline bg-surface py-2 pl-4 pr-2">
        <Link
          to={`/entries/${item.entryDate}`}
          className="flex min-w-0 flex-1 items-center gap-3 py-2"
        >
          <span className="w-7 shrink-0 text-center text-[24px] leading-none">
            {emoji ?? <span className="text-placeholder">·</span>}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-content font-semibold text-ink">{item.entryDate}</p>
            {item.preview && (
              <p className="mt-0.5 truncate text-content text-muted">{item.preview}</p>
            )}
          </div>
        </Link>

        <button
          type="button"
          aria-label="즐겨찾기 해제"
          onClick={() => void handleUnfavorite()}
          disabled={isRemoving}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-[20px] text-ink disabled:opacity-40"
        >
          ★
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-1 px-1 text-label text-cat-food-fg">
          {error}
        </p>
      )}
    </div>
  )
}
