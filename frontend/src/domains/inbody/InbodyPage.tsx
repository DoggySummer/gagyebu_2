import { Link } from 'react-router'
import { METRICS, formatMetric, toDottedDate, type InbodyRecord } from '@/domains/inbody/fields'
import { TrendChart, type TrendPoint } from '@/domains/inbody/TrendChart'
import { useInbodyRecords } from '@/domains/inbody/useInbodyRecords'

/** 라벨이 겹치지 않도록 최근 8회만 그린다. */
const MAX_POINTS = 8

export function InbodyPage() {
  const { records, isLoading, loadError, reload } = useInbodyRecords()
  const latest = records.at(-1) ?? null

  return (
    <main className="py-5">
      <h1 className="text-date font-bold tracking-title text-ink">인바디</h1>
      <p className="mt-1 text-label text-muted">더보기 › 통계 › 인바디</p>

      {isLoading && <p className="mt-8 text-center text-content text-muted">불러오는 중…</p>}

      {loadError && (
        <div className="mt-8 text-center">
          <p role="alert" className="text-content text-body">
            {loadError}
          </p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
          >
            다시 시도
          </button>
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          {latest ? <LatestCard record={latest} /> : <EmptyState />}
          <TrendSection records={records} />
        </>
      )}

      <Link
        to="/stats/inbody/new"
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-[max(16px,calc(50vw-264px))] flex min-h-[44px] items-center gap-1 rounded-full bg-ink px-4 text-field font-semibold text-canvas"
      >
        ＋ 기록 추가
      </Link>
    </main>
  )
}

function LatestCard({ record }: { record: InbodyRecord }) {
  return (
    <section className="mt-5 rounded-card border border-hairline bg-surface p-4">
      <p className="text-label font-semibold uppercase tracking-label text-muted">
        최근 측정 · {toDottedDate(record.measuredAt)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
        {METRICS.map((metric) => {
          const value = record[metric.key]

          return (
            <div key={metric.key}>
              <p className="text-label text-muted">{metric.label}</p>
              <p className="text-content font-semibold text-ink">
                {value === null ? (
                  <span className="text-placeholder">—</span>
                ) : (
                  <>
                    {formatMetric(value, metric.decimals)}
                    {metric.unit && <span className="ml-0.5 text-label text-muted">{metric.unit}</span>}
                  </>
                )}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TrendSection({ records }: { records: InbodyRecord[] }) {
  const recent = records.slice(-MAX_POINTS)

  const charts = METRICS.map((metric) => {
    const points: TrendPoint[] = recent
      .filter((record) => record[metric.key] !== null)
      .map((record) => ({ dateKey: record.measuredAt, value: record[metric.key] as number }))

    return { metric, points }
    // 측정이 1회뿐인 항목은 추이라고 부를 수 없으므로 2회부터 보여준다.
  }).filter((chart) => chart.points.length >= 2)

  if (charts.length === 0) {
    return null
  }

  return (
    <section className="mt-6 pb-24">
      <h2 className="text-label font-semibold uppercase tracking-label text-muted">추이</h2>

      <div className="mt-2 flex flex-col gap-3">
        {charts.map(({ metric, points }) => (
          <TrendChart
            key={metric.key}
            title={metric.unit ? `${metric.label} (${metric.unit})` : metric.label}
            points={points}
            decimals={metric.decimals}
          />
        ))}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <p className="mt-10 text-center text-content text-muted">
      아직 기록이 없어요. ＋ 를 눌러 첫 측정을 남겨보세요.
    </p>
  )
}
