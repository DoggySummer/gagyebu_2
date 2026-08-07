import { formatMetric, toShortDate } from '@/domains/inbody/fields'

export interface TrendPoint {
  dateKey: string
  value: number
}

interface Props {
  title: string
  points: TrendPoint[]
  decimals: number
}

// viewBox 기준 좌표. 실제 크기는 width="100%"로 늘어난다.
const VIEW_W = 326
const VIEW_H = 120
const PAD_X = 22
const TOP = 34
const BOTTOM = 92

/**
 * 항목별 독립 꺾은선. 스케일을 섞지 않으려고 차트마다 자기 값의 최소~최대로만 y를 잡는다.
 * ECharts를 쓰지 않는 이유는 이런 작은 차트가 6개나 되기 때문이다.
 */
export function TrendChart({ title, points, decimals }: Props) {
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min

  const x = (index: number) =>
    points.length === 1
      ? VIEW_W / 2
      : PAD_X + (index * (VIEW_W - PAD_X * 2)) / (points.length - 1)

  // 값이 전부 같으면 가운데 수평선으로 그린다.
  const y = (value: number) =>
    span === 0 ? (TOP + BOTTOM) / 2 : BOTTOM - ((value - min) / span) * (BOTTOM - TOP)

  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')

  const first = points[0]
  const last = points[points.length - 1]

  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <p className="text-content font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-label text-muted">
        {toShortDate(first.dateKey)} ~ {toShortDate(last.dateKey)} · {points.length}회 측정
      </p>

      <svg
        width="100%"
        height="120"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`${title} 추이`}
        className="mt-2 block"
      >
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => {
          const cy = y(point.value)
          // 위쪽에 붙은 점은 라벨을 아래로 내려 잘리지 않게 한다.
          const labelY = cy < TOP + 12 ? cy + 16 : cy - 10

          return (
            <g key={point.dateKey}>
              <circle cx={x(index)} cy={cy} r="3.5" fill="var(--color-ink)" />
              <text
                x={x(index)}
                y={labelY}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="var(--color-body)"
              >
                {formatMetric(point.value, decimals)}
              </text>
              <text
                x={x(index)}
                y={VIEW_H - 5}
                textAnchor="middle"
                fontSize="9"
                fill="var(--color-muted)"
              >
                {toShortDate(point.dateKey)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
