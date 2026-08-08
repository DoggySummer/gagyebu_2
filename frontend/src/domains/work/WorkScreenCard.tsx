import { Link } from 'react-router'
import { ProgressDots } from '@/components/ui/ProgressDots'
import { deadlineLabel } from '@/domains/work/deadline'
import { WorkStatusBadge } from '@/domains/work/WorkStatusBadge'
import type { WorkScreenSummaryDto } from '@shared/api.types'

export function WorkScreenCard({ screen }: { screen: WorkScreenSummaryDto }) {
  const isComplete = screen.totalFlows > 0 && screen.doneFlows === screen.totalFlows

  return (
    <Link to={`/work/${screen.id}`} className="block rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-content font-semibold text-ink">{screen.title}</p>
        <WorkStatusBadge deadline={screen.deadline} isComplete={isComplete} />
      </div>

      {screen.summary && <p className="mt-1.5 line-clamp-2 text-content text-muted">{screen.summary}</p>}

      <div className="mt-3 flex items-center justify-between">
        <ProgressDots done={screen.doneFlows} total={screen.totalFlows} />
        <span className="text-label text-muted">{deadlineLabel(screen.deadline)}</span>
      </div>
    </Link>
  )
}
