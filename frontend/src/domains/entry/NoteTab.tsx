import { useRef, useState } from 'react'
import type { DailyEntryDto, UpdateEntryRequest } from '@shared/api.types'

type EntryDraft = { moodScore: number | null; gratitude: string; noteMarkdown: string }

const MOODS = [
  { score: 1, emoji: '😔' },
  { score: 2, emoji: '😐' },
  { score: 3, emoji: '🙂' },
  { score: 4, emoji: '😊' },
  { score: 5, emoji: '😄' },
]

function toDraft(entry: DailyEntryDto | null): EntryDraft {
  return {
    moodScore: entry?.moodScore ?? null,
    gratitude: entry?.gratitude ?? '',
    noteMarkdown: entry?.noteMarkdown ?? '',
  }
}

/** 커서가 있는 줄 앞의 접두사를 넣거나 뺀다. */
function toggleLinePrefix(text: string, cursor: number, prefix: string) {
  const lineStart = text.lastIndexOf('\n', cursor - 1) + 1
  const line = text.slice(lineStart)
  const hasPrefix = line.startsWith(prefix)
  const next = hasPrefix
    ? text.slice(0, lineStart) + line.slice(prefix.length)
    : text.slice(0, lineStart) + prefix + line
  const shift = hasPrefix ? -prefix.length : prefix.length

  return { next, cursor: Math.max(lineStart, cursor + shift) }
}

function wrapBold(text: string, start: number, end: number) {
  if (start === end) {
    return { next: `${text.slice(0, start)}****${text.slice(start)}`, cursor: start + 2 }
  }

  const selected = text.slice(start, end)

  return {
    next: `${text.slice(0, start)}**${selected}**${text.slice(end)}`,
    cursor: end + 4,
  }
}

interface Props {
  entry: DailyEntryDto | null
  onSave: (body: UpdateEntryRequest) => Promise<void>
}

export function NoteTab({ entry, onSave }: Props) {
  const [draft, setDraft] = useState<EntryDraft>(() => toDraft(entry))
  const [saved, setSaved] = useState<EntryDraft>(() => toDraft(entry))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // entry가 바뀌어도 초안을 덮어쓰지 않는다. 즐겨찾기 토글만으로도 entry가 갱신되는데
  // 그때 작성 중이던 글이 날아가면 안 된다. 날짜 전환은 부모가 key로 다시 마운트시킨다.
  const isDirty =
    draft.moodScore !== saved.moodScore ||
    draft.gratitude !== saved.gratitude ||
    draft.noteMarkdown !== saved.noteMarkdown

  /** 툴바 조작 후 포커스를 유지해야 모바일에서 키보드가 닫히지 않는다. */
  const applyToNote = (transform: (text: string, start: number, end: number) => { next: string; cursor: number }) => {
    const textarea = noteRef.current
    if (!textarea) return

    const { next, cursor } = transform(draft.noteMarkdown, textarea.selectionStart, textarea.selectionEnd)
    setDraft((prev) => ({ ...prev, noteMarkdown: next }))

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await onSave(draft)
      setSaved(draft)
    } catch (caught) {
      // 저장에 실패해도 입력 내용은 화면에 그대로 둔다.
      setError(caught instanceof Error ? caught.message : '저장하지 못했어요.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pb-6">
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
                  setDraft((prev) => ({
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
          onChange={(event) => setDraft((prev) => ({ ...prev, gratitude: event.target.value }))}
          placeholder="오늘 고마웠던 일 한 줄"
          className="mt-2 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-body placeholder:text-placeholder"
        />
      </section>

      <section className="mt-5">
        <span className="text-label font-semibold uppercase tracking-label text-muted">
          오늘의 기록
        </span>

        <div className="mt-2 flex gap-2">
          <ToolbarButton label="제목" onClick={() => applyToNote((text, start) => toggleLinePrefix(text, start, '### '))} />
          <ToolbarButton label="목록" onClick={() => applyToNote((text, start) => toggleLinePrefix(text, start, '- '))} />
          <ToolbarButton label="인용" onClick={() => applyToNote((text, start) => toggleLinePrefix(text, start, '> '))} />
          <ToolbarButton label="굵게" onClick={() => applyToNote(wrapBold)} />
        </div>

        <textarea
          ref={noteRef}
          value={draft.noteMarkdown}
          maxLength={10000}
          rows={10}
          onChange={(event) => setDraft((prev) => ({ ...prev, noteMarkdown: event.target.value }))}
          placeholder="오늘 있었던 일을 남겨보세요"
          className="mt-2 w-full rounded-card border border-hairline bg-surface p-3 text-field leading-relaxed text-body placeholder:text-placeholder"
        />
      </section>

      {error && (
        <p role="alert" className="mt-3 text-content text-cat-food-fg">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!isDirty || isSaving}
        className="mt-5 min-h-[44px] w-full rounded-card bg-ink px-4 text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
      >
        {isSaving ? '저장 중…' : '저장'}
      </button>
    </div>
  )
}

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="min-h-[44px] flex-1 rounded-card border border-hairline bg-chip text-content font-semibold text-chip-fg"
    >
      {label}
    </button>
  )
}
