import { useState } from 'react'
import { Markdown } from '@/components/ui/Markdown'
import { MarkdownTextarea } from '@/components/ui/MarkdownEditor'
import { MOODS, moodEmoji } from '@/lib/moods'
import type { DailyEntryDto, UpdateEntryRequest } from '@shared/api.types'

type EntryDraft = { moodScore: number | null; gratitude: string; noteMarkdown: string }

type Mode = 'view' | 'edit'

function toDraft(entry: DailyEntryDto | null): EntryDraft {
  return {
    moodScore: entry?.moodScore ?? null,
    gratitude: entry?.gratitude ?? '',
    noteMarkdown: entry?.noteMarkdown ?? '',
  }
}

/** 셋 중 하나라도 있으면 "작성된 하루"로 본다. */
function hasContent(draft: EntryDraft): boolean {
  return draft.moodScore !== null || draft.gratitude.trim() !== '' || draft.noteMarkdown.trim() !== ''
}

interface Props {
  entry: DailyEntryDto | null
  onSave: (body: UpdateEntryRequest) => Promise<void>
}

export function NoteTab({ entry, onSave }: Props) {
  const initial = toDraft(entry)

  // 기분·감사한 일·기록 셋이 한 세트로 같이 잠기고 같이 풀린다.
  const [mode, setMode] = useState<Mode>(hasContent(initial) ? 'view' : 'edit')
  const [draft, setDraft] = useState<EntryDraft>(initial)
  const [saved, setSaved] = useState<EntryDraft>(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // entry가 바뀌어도 초안을 덮어쓰지 않는다. 즐겨찾기 토글만으로도 entry가 갱신되는데
  // 그때 작성 중이던 글이 날아가면 안 된다. 날짜 전환은 부모가 key로 다시 마운트시킨다.
  const isDirty =
    draft.moodScore !== saved.moodScore ||
    draft.gratitude !== saved.gratitude ||
    draft.noteMarkdown !== saved.noteMarkdown

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await onSave({
        moodScore: draft.moodScore,
        gratitude: draft.gratitude.trim() || null,
        noteMarkdown: draft.noteMarkdown.trim() || null,
      })
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
    <div className="pb-6">
      {mode === 'view' ? (
        <ViewMode draft={saved} onEdit={() => setMode('edit')} />
      ) : (
        <EditMode draft={draft} onChange={setDraft} />
      )}

      {error && (
        <p role="alert" className="mt-3 text-content text-cat-food-fg">
          {error}
        </p>
      )}

      {/* 내용 흐름의 맨 아래에 둔다. 화면에 띄우지 않으므로 본문을 가리지 않는다. */}
      {mode === 'view' ? (
        <button
          type="button"
          onClick={() => setMode('edit')}
          className="mt-6 min-h-[52px] w-full rounded-card border border-hairline bg-surface text-field font-semibold text-body"
        >
          편집
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isDirty || isSaving}
          className="mt-6 min-h-[52px] w-full rounded-card bg-ink text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
        >
          {isSaving ? '저장 중…' : '저장'}
        </button>
      )}
    </div>
  )
}

function ViewMode({ draft, onEdit }: { draft: EntryDraft; onEdit: () => void }) {
  const emoji = moodEmoji(draft.moodScore)

  return (
    <div>
      <section className="mt-5">
        <h2 className="text-label font-semibold uppercase tracking-label text-muted">기분</h2>
        <p className="mt-2 text-[28px] leading-none">
          {emoji ?? <span className="text-content text-placeholder">기록하지 않음</span>}
        </p>
      </section>

      <section className="mt-5">
        <h2 className="text-label font-semibold uppercase tracking-label text-muted">감사한 일</h2>
        <p className="mt-2 text-content text-body">
          {draft.gratitude || <span className="text-placeholder">기록하지 않음</span>}
        </p>
      </section>

      <section className="mt-5">
        <h2 className="text-label font-semibold uppercase tracking-label text-muted">
          오늘의 기록
        </h2>
        {/* 스펙대로 본문을 탭하면 편집으로 돌아간다. */}
        <div
          role="button"
          tabIndex={0}
          onClick={onEdit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onEdit()
            }
          }}
          className="mt-2 w-full rounded-card border border-hairline bg-surface p-4 text-left"
        >
          {draft.noteMarkdown ? (
            <Markdown>{draft.noteMarkdown}</Markdown>
          ) : (
            <p className="text-content text-placeholder">기록하지 않음</p>
          )}
        </div>
      </section>
    </div>
  )
}

interface EditModeProps {
  draft: EntryDraft
  onChange: React.Dispatch<React.SetStateAction<EntryDraft>>
}

function EditMode({ draft, onChange }: EditModeProps) {
  return (
    <div>
      <section className="mt-5">
        <h2 className="text-label font-semibold uppercase tracking-label text-muted">기분</h2>
        <div className="mt-2 flex gap-2">
          {MOODS.map((mood) => {
            const selected = draft.moodScore === mood.score

            return (
              <button
                key={mood.score}
                type="button"
                aria-label={`기분 ${mood.score}점`}
                aria-pressed={selected}
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    moodScore: prev.moodScore === mood.score ? null : mood.score,
                  }))
                }
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-[20px] ${
                  selected ? 'border-ink bg-surface' : 'border-hairline bg-chip'
                }`}
              >
                {mood.emoji}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-5">
        <label
          htmlFor="gratitude"
          className="text-label font-semibold uppercase tracking-label text-muted"
        >
          감사한 일
        </label>
        <input
          id="gratitude"
          value={draft.gratitude}
          maxLength={200}
          onChange={(event) => onChange((prev) => ({ ...prev, gratitude: event.target.value }))}
          placeholder="오늘 고마웠던 일 한 줄"
          className="mt-2 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-body placeholder:text-placeholder"
        />
      </section>

      <section className="mt-5">
        <span className="text-label font-semibold uppercase tracking-label text-muted">
          오늘의 기록
        </span>
        <div className="mt-2">
          <MarkdownTextarea
            value={draft.noteMarkdown}
            onChange={(noteMarkdown) => onChange((prev) => ({ ...prev, noteMarkdown }))}
            placeholder="오늘 있었던 일을 남겨보세요"
          />
        </div>
      </section>
    </div>
  )
}
