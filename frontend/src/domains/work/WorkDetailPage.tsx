import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgressDots } from '@/components/ui/ProgressDots'
import { deadlineLabel, formatDoneAt } from '@/domains/work/deadline'
import { useWorkScreen } from '@/domains/work/useWorkScreen'
import { WorkStatusBadge } from '@/domains/work/WorkStatusBadge'

export function WorkDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  return <WorkDetailScreen id={id} />
}

function WorkDetailScreen({ id }: { id: string }) {
  const { screen, isLoading, loadError, reload, toggleFlow, remove } = useWorkScreen(id)
  const navigate = useNavigate()
  const [flowError, setFlowError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleToggle = async (flowId: string, next: boolean) => {
    setFlowError(null)

    try {
      await toggleFlow(flowId, next)
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : '흐름 상태를 바꾸지 못했어요.')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await remove()
      void navigate('/work')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '삭제하지 못했어요.')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="py-5">
        <p className="text-center text-content text-muted">불러오는 중…</p>
      </main>
    )
  }

  if (loadError || !screen) {
    return (
      <main className="py-5 text-center">
        <p role="alert" className="text-content text-body">
          {loadError ?? '작업을 찾을 수 없어요.'}
        </p>
        <button
          type="button"
          onClick={reload}
          className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
        >
          다시 시도
        </button>
      </main>
    )
  }

  const isComplete = screen.totalFlows > 0 && screen.doneFlows === screen.totalFlows

  return (
    <main className="py-5 pb-10">
      <div className="flex items-start justify-between gap-2">
        <h1 className="min-w-0 flex-1 text-date font-bold tracking-title text-ink">{screen.title}</h1>
        <Link
          to={`/work/${screen.id}/edit`}
          className="shrink-0 rounded-full bg-chip px-3 py-1.5 text-label font-semibold text-chip-fg"
        >
          수정
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <WorkStatusBadge deadline={screen.deadline} isComplete={isComplete} />
        <ProgressDots done={screen.doneFlows} total={screen.totalFlows} />
        <span className="text-label text-muted">{deadlineLabel(screen.deadline)}</span>
      </div>

      {screen.summary && (
        <section className="mt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">요약</h2>
          <p className="mt-2 whitespace-pre-wrap text-content text-body">{screen.summary}</p>
        </section>
      )}

      <section className="mt-5">
        <h2 className="text-label font-semibold uppercase tracking-label text-muted">알고리즘(흐름)</h2>

        {screen.flows.length === 0 ? (
          <p className="mt-2 text-content text-placeholder">등록된 흐름이 없어요.</p>
        ) : (
          <ul className="mt-2 overflow-hidden rounded-card border border-hairline bg-surface">
            {screen.flows.map((flow, index) => (
              <li key={flow.id} className={index > 0 ? 'border-t border-divider' : undefined}>
                <label className="flex min-h-[44px] cursor-pointer items-start gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={flow.isDone}
                    onChange={(event) => void handleToggle(flow.id, event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-ink"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-content ${flow.isDone ? 'text-muted line-through' : 'text-body'}`}
                    >
                      {flow.description}
                    </span>
                    <span className="block text-label text-muted">
                      {flow.isDone && flow.doneAt ? `${formatDoneAt(flow.doneAt)} 완료` : '미완료'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {flowError && (
          <p role="alert" className="mt-2 text-content text-cat-food-fg">
            {flowError}
          </p>
        )}
      </section>

      {screen.unknownTerms && (
        <section className="mt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">모르는 용어</h2>
          <p className="mt-2 whitespace-pre-wrap text-content text-body">{screen.unknownTerms}</p>
        </section>
      )}

      {screen.edgeCases && (
        <section className="mt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">예외 케이스</h2>
          <p className="mt-2 whitespace-pre-wrap text-content text-body">{screen.edgeCases}</p>
        </section>
      )}

      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="mt-8 min-h-[44px] w-full rounded-card border border-hairline bg-surface text-field font-semibold text-cat-food-fg"
      >
        삭제
      </button>

      {deleteError && (
        <p role="alert" className="mt-2 text-center text-content text-cat-food-fg">
          {deleteError}
        </p>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="이 작업을 삭제할까요?"
          description="흐름 기록도 함께 지워지고 되돌릴 수 없어요."
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </main>
  )
}
