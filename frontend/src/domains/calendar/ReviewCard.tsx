import { useState } from 'react'
import { Markdown } from '@/components/ui/Markdown'
import { MarkdownTextarea } from '@/components/ui/MarkdownEditor'
import type { MonthlyReviewDto, UpdateReviewRequest } from '@shared/api.types'

interface Props {
  month: string
  review: MonthlyReviewDto | null
  onSave: (body: UpdateReviewRequest) => Promise<void>
}

/**
 * 월간 회고. 오늘 화면의 "오늘의 기록"과 같은 보기/편집 모드를 쓴다 — 내용이 있으면
 * 렌더링된 보기 모드로 시작하고, 편집 버튼을 눌러야 툴바 달린 입력창이 열린다.
 * 다만 여기는 캘린더 화면에 얹힌 카드라 버튼은 헤더 안의 작은 버튼으로 둔다.
 */
export function ReviewCard({ month, review, onSave }: Props) {
  const initial = review?.noteMarkdown ?? ''
  // NoteTab(오늘 화면 전체)과 달리 여기는 캘린더 스크롤 중에 훑어보는 압축 카드다.
  // 내용이 없어도 곧장 편집창을 열지 않고, 목업처럼 "추가" 버튼이 있는 접힌 상태로 시작한다.
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [draft, setDraft] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = draft !== saved
  const monthLabel = `${Number(month.slice(5, 7))}월 회고`

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await onSave({ noteMarkdown: draft.trim() || null })
      setSaved(draft)
      setMode('view')
    } catch (caught) {
      // 저장에 실패해도 입력 내용은 화면에 그대로 둔다.
      setError(caught instanceof Error ? caught.message : '저장하지 못했어요.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-content font-semibold text-ink">{monthLabel}</span>

        {mode === 'view' ? (
          <button
            type="button"
            onClick={() => setMode('edit')}
            className="min-h-[32px] rounded-full bg-chip px-3 text-label font-semibold text-chip-fg"
          >
            {saved.trim() ? '편집' : '추가'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!isDirty || isSaving}
            className="min-h-[32px] rounded-full bg-ink px-3 text-label font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
          >
            {isSaving ? '저장 중…' : '저장'}
          </button>
        )}
      </div>

      <div className="mt-3">
        {mode === 'view' ? (
          saved.trim() ? (
            <Markdown>{saved}</Markdown>
          ) : (
            <p className="text-content text-placeholder">
              아직 작성하지 않았어요. 월이 끝나지 않아도 언제든 적을 수 있어요.
            </p>
          )
        ) : (
          <MarkdownTextarea
            value={draft}
            onChange={setDraft}
            rows={6}
            placeholder="이번 달을 돌아보며 남기고 싶은 말을 적어보세요"
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-content text-cat-food-fg">
          {error}
        </p>
      )}
    </div>
  )
}
