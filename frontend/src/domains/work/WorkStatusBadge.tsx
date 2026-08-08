import { deadlineLabel, isUrgent } from '@/domains/work/deadline'

interface Props {
  deadline: string | null
  isComplete: boolean
}

/**
 * 뱃지 색은 새 토큰을 만들지 않는다. 완료는 muted, 위험(D-DAY 또는 지남)만
 * 기존 카테고리 색(cat-food-bg/fg, 식비 태그)을 재사용한다 — "D-DAY" 텍스트가
 * 항상 같이 붙어 있어 카테고리 태그와 헷갈릴 일이 없다. 나머지는 뱃지 없이 텍스트만.
 */
export function WorkStatusBadge({ deadline, isComplete }: Props) {
  if (isComplete) {
    return (
      <span className="rounded-full bg-chip px-2 py-0.5 text-label font-semibold text-chip-fg">
        완료
      </span>
    )
  }

  if (deadline && isUrgent(deadline)) {
    return (
      <span className="rounded-full bg-cat-food-bg px-2 py-0.5 text-label font-semibold text-cat-food-fg">
        {deadlineLabel(deadline)}
      </span>
    )
  }

  return <span className="text-label font-semibold text-muted">{deadlineLabel(deadline)}</span>
}
