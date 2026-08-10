import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { createWorkScreen, fetchWorkScreen, updateWorkScreen } from '@/domains/work/api'
import { todayKey } from '@/lib/date'
import type { WorkFlowInput, WorkScreenRequest } from '@shared/api.types'

interface FlowRow {
  key: string
  id?: string
  description: string
}

function newRow(): FlowRow {
  return { key: crypto.randomUUID(), description: '' }
}

export function WorkFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [unknownTerms, setUnknownTerms] = useState('')
  const [edgeCases, setEdgeCases] = useState('')
  const [deadline, setDeadline] = useState<string | null>(null)
  const [flows, setFlows] = useState<FlowRow[]>([newRow()])
  const [isLoading, setIsLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    fetchWorkScreen(id)
      .then((screen) => {
        if (cancelled) return

        setTitle(screen.title)
        setSummary(screen.summary ?? '')
        setUnknownTerms(screen.unknownTerms ?? '')
        setEdgeCases(screen.edgeCases ?? '')
        setDeadline(screen.deadline)
        setFlows(
          screen.flows.length > 0
            ? screen.flows.map((flow) => ({ key: flow.id, id: flow.id, description: flow.description }))
            : [newRow()],
        )
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '불러오지 못했어요.')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const canSave = title.trim().length > 0

  const close = () => void navigate(id ? `/work/${id}` : '/work')

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveError(null)

    const body: WorkScreenRequest = {
      title: title.trim(),
      summary: summary.trim() || null,
      unknownTerms: unknownTerms.trim() || null,
      edgeCases: edgeCases.trim() || null,
      deadline,
      // 빈 줄은 흐름으로 치지 않는다 — 최소 개수 제약이 없으므로 전부 비워도(0개) 저장된다.
      flows: flows
        .filter((flow) => flow.description.trim().length > 0)
        .map((flow): WorkFlowInput => ({ id: flow.id, description: flow.description.trim() })),
    }

    try {
      const saved = id ? await updateWorkScreen(id, body) : await createWorkScreen(body)
      void navigate(`/work/${saved.id}`)
    } catch (error) {
      // 저장에 실패해도 입력 내용은 화면에 그대로 둔다.
      setSaveError(error instanceof Error ? error.message : '저장하지 못했어요.')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-8 text-center text-content text-muted">
        불러오는 중…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-8 text-center">
        <p role="alert" className="text-content text-body">
          {loadError}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[560px] px-4 pb-10">
        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-content text-muted"
          >
            ✕
          </button>
          <h1 className="text-field font-semibold text-ink">{isEdit ? '작업 수정' : '작업 추가'}</h1>
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => void handleSave()}
            className="flex h-11 min-w-11 items-center justify-center px-1 text-field font-semibold text-ink disabled:text-placeholder"
          >
            저장
          </button>
        </div>

        <div className="mt-2">
          <label htmlFor="title" className="text-label font-semibold text-muted">
            화면 제목
          </label>
          <input
            id="title"
            value={title}
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 주문 상세 화면"
            autoComplete="off"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-ink placeholder:text-placeholder"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="summary" className="text-label font-semibold text-muted">
            요약
          </label>
          <input
            id="summary"
            value={summary}
            maxLength={500}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="이 화면을 내 말로 한 문장으로"
            autoComplete="off"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-body placeholder:text-placeholder"
          />
        </div>

        <section className="mt-6 border-t border-hairline pt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">
            알고리즘(흐름)
          </h2>

          <div className="mt-3 flex flex-col gap-2">
            {flows.map((flow, index) => (
              <div key={flow.key} className="flex items-center gap-2">
                <input
                  value={flow.description}
                  maxLength={300}
                  onChange={(event) =>
                    setFlows((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, description: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="트리거 → 로컬처리/API호출 → 결과"
                  autoComplete="off"
                  className="min-h-[44px] flex-1 rounded-card border border-hairline bg-surface px-3 text-field text-body placeholder:text-placeholder"
                />
                <button
                  type="button"
                  aria-label="흐름 삭제"
                  onClick={() => setFlows((prev) => prev.filter((_, i) => i !== index))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[20px] text-muted"
                >
                  −
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFlows((prev) => [...prev, newRow()])}
            className="mt-2 min-h-[44px] w-full rounded-card border border-hairline bg-chip text-field font-semibold text-chip-fg"
          >
            + 흐름 추가
          </button>
        </section>

        <section className="mt-6 border-t border-hairline pt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">모르는 용어</h2>
          <textarea
            value={unknownTerms}
            maxLength={2000}
            rows={3}
            onChange={(event) => setUnknownTerms(event.target.value)}
            placeholder="없으면 비워두지 말고 '없음'이라고 적어보세요"
            className="mt-2 w-full rounded-card border border-hairline bg-surface p-3 text-field leading-relaxed text-body placeholder:text-placeholder"
          />
        </section>

        <section className="mt-6 border-t border-hairline pt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">예외 케이스</h2>
          <textarea
            value={edgeCases}
            maxLength={2000}
            rows={3}
            onChange={(event) => setEdgeCases(event.target.value)}
            placeholder="값 없음, 0건, API 실패 같은 경우들"
            className="mt-2 w-full rounded-card border border-hairline bg-surface p-3 text-field leading-relaxed text-body placeholder:text-placeholder"
          />
        </section>

        <section className="mt-6 border-t border-hairline pt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">마감 기한</h2>
          {/* 빈 값인 네이티브 date input을 "없음" 필과 나란히 좁게 두면 기기별로 렌더링이
              깨진다(내부 mm/dd/yyyy 세그먼트가 다 접혀 캘린더 아이콘만 남는 경우가 있음).
              "없음"일 때는 date input 자체를 안 띄우고 버튼으로 대체해 그 상황을 피한다. */}
          {deadline === null ? (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeadline(todayKey())}
                className="min-h-[44px] flex-1 rounded-card border border-hairline bg-surface px-3 text-left text-field text-placeholder"
              >
                날짜 선택
              </button>
              <span className="shrink-0 rounded-full bg-ink px-4 py-2.5 text-field font-semibold text-canvas">
                없음
              </span>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value || null)}
                className="min-h-[44px] flex-1 rounded-card border border-hairline bg-surface px-3 text-field font-semibold text-ink"
              />
              <button
                type="button"
                onClick={() => setDeadline(null)}
                className="min-h-[44px] shrink-0 rounded-full bg-chip px-4 text-field font-semibold text-chip-fg"
              >
                없음
              </button>
            </div>
          )}
        </section>

        {saveError && (
          <p role="alert" className="mt-4 text-content text-cat-food-fg">
            {saveError}
          </p>
        )}

        <button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => void handleSave()}
          className="mt-6 min-h-[44px] w-full rounded-card bg-ink px-4 text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
        >
          {isSaving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  )
}
