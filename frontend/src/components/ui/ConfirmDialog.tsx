interface Props {
  title: string
  description?: string
  confirmLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 파괴적 액션(삭제 등) 확인용 공용 모달. 지금까지 이 앱의 삭제 액션들은 확인 없이
 * 바로 처리됐는데, 작업 화면 삭제부터는 되돌릴 수 없는 데이터 손실이라 확인 절차를 둔다.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = '삭제',
  isConfirming = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="닫기" onClick={onCancel} className="absolute inset-0 bg-ink/20" />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative mx-auto w-full max-w-[560px] rounded-t-sheet border-t border-hairline bg-surface p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:rounded-card sm:border"
      >
        <p className="text-content font-semibold text-ink">{title}</p>
        {description && <p className="mt-1.5 text-content text-muted">{description}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="min-h-[44px] flex-1 rounded-card border border-hairline bg-surface text-field font-semibold text-body"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="min-h-[44px] flex-1 rounded-card bg-cat-food-fg text-field font-semibold text-canvas disabled:opacity-60"
          >
            {isConfirming ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
