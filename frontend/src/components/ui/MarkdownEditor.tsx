import { useRef } from 'react'

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
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
}

/**
 * 툴바(제목·목록·인용·굵게) + textarea를 묶은 마크다운 입력 필드.
 * 하루 기록(NoteTab)과 월간 회고(ReviewCard)가 같은 편집 경험을 쓰도록 여기 하나로 모았다.
 */
export function MarkdownTextarea({ id, value, onChange, placeholder, rows = 10, maxLength = 10_000 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /** 툴바 조작 후 포커스를 유지해야 모바일에서 키보드가 닫히지 않는다. */
  const apply = (transform: (text: string, start: number, end: number) => { next: string; cursor: number }) => {
    const textarea = ref.current
    if (!textarea) return

    const { next, cursor } = transform(value, textarea.selectionStart, textarea.selectionEnd)
    onChange(next)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div>
      <div className="flex gap-2">
        <ToolbarButton label="제목" onClick={() => apply((text, start) => toggleLinePrefix(text, start, '### '))} />
        <ToolbarButton label="목록" onClick={() => apply((text, start) => toggleLinePrefix(text, start, '- '))} />
        <ToolbarButton label="인용" onClick={() => apply((text, start) => toggleLinePrefix(text, start, '> '))} />
        <ToolbarButton label="굵게" onClick={() => apply(wrapBold)} />
      </div>

      <textarea
        id={id}
        ref={ref}
        value={value}
        maxLength={maxLength}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-card border border-hairline bg-surface p-3 text-field leading-relaxed text-body placeholder:text-placeholder"
      />
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
