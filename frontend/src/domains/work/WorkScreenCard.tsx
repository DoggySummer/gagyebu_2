import { Link } from 'react-router'
import { ProgressDots } from '@/components/ui/ProgressDots'
import { WorkStatusBadge } from '@/domains/work/WorkStatusBadge'
import type { WorkScreenSummaryDto } from '@shared/api.types'

export function WorkScreenCard({ screen }: { screen: WorkScreenSummaryDto }) {
  const isComplete = screen.totalFlows > 0 && screen.doneFlows === screen.totalFlows

  return (
    <Link to={`/work/${screen.id}`} className="block rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-content font-semibold text-ink">{screen.title}</p>
        {/* 마감 상태는 여기 뱃지 하나로만 보여준다. 아래 진행률 줄에 같은 문구를 또 넣지 않는다. */}
        <WorkStatusBadge deadline={screen.deadline} isComplete={isComplete} />
      </div>

      {screen.summary && <p className="mt-1.5 line-clamp-2 text-content text-muted">{screen.summary}</p>}

      <div className="mt-3">
        <ProgressDots done={screen.doneFlows} total={screen.totalFlows} />
      </div>
    </Link>
  )
}
