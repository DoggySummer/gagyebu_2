interface Props {
  done: number
  total: number
}

/** ●●○ 형태의 진행률 점 표시. 작업 목록 카드, 상세 화면 헤더에서 공용으로 쓴다. */
export function ProgressDots({ done, total }: Props) {
  if (total === 0) {
    return <span className="text-label text-placeholder">흐름 없음</span>
  }

  return (
    <span aria-label={`${done}/${total} 완료`} className="inline-flex flex-wrap gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${index < done ? 'bg-ink' : 'bg-chip'}`}
        />
      ))}
    </span>
  )
}
