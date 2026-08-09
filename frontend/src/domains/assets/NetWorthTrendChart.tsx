import type { NetWorthSnapshotDto } from '@shared/api.types'

const WIDTH = 320
const HEIGHT = 96
const PADDING_Y = 12

export function NetWorthTrendChart({ snapshots }: { snapshots: NetWorthSnapshotDto[] }) {
  if (snapshots.length === 0) {
    return <p className="mt-2 text-content text-placeholder">아직 순자산 기록이 없어요.</p>
  }

  const values = snapshots.map((snapshot) => snapshot.netWorth)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = snapshots.map((snapshot, index) => {
    const x = snapshots.length === 1 ? WIDTH : (index / (snapshots.length - 1)) * WIDTH
    const y = HEIGHT - PADDING_Y - ((snapshot.netWorth - min) / range) * (HEIGHT - PADDING_Y * 2)

    return { x, y }
  })

  const last = points[points.length - 1]

  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} preserveAspectRatio="none">
        {points.length > 1 && (
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            className="stroke-cat-health-fg"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <circle cx={last.x} cy={last.y} r={3.5} className="fill-cat-health-fg" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-placeholder">
        {snapshots.map((snapshot) => (
          <span key={snapshot.month}>{Number(snapshot.month.slice(5, 7))}월</span>
        ))}
      </div>
    </div>
  )
}
