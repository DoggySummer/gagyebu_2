import type { MonthOverviewDto } from '@shared/api.types'
import { ReviewCard } from '@/domains/calendar/ReviewCard'
import { saveReview } from '@/domains/calendar/reviewApi'

const MOODS = [
  { score: 1, emoji: '😔' },
  { score: 2, emoji: '😐' },
  { score: 3, emoji: '🙂' },
  { score: 4, emoji: '😊' },
  { score: 5, emoji: '😄' },
]

interface Props {
  overview: MonthOverviewDto
  onReviewSaved: (month: string, noteMarkdown: string | null) => void
}

/** 캘린더 하단에 이어지는 월간 평가: 지출 요약 → 감정 분포 → 회고. */
export function MonthOverview({ overview, onReviewSaved }: Props) {
  const monthKey = `${overview.year}-${String(overview.month).padStart(2, '0')}`

  return (
    <section className="mt-8 border-t border-hairline pt-6">
      <h2 className="text-label font-semibold uppercase tracking-label text-muted">
        {overview.month}월 요약
      </h2>

      <div className="mt-3 flex gap-2">
        <SpendingCard overview={overview} />
        <TopCategoryCard overview={overview} />
      </div>

      <div className="mt-3">
        <EmotionBars moodCounts={overview.moodCounts} recordedDays={overview.recordedMoodDays} />
      </div>

      <div className="mt-3">
        {/* 월이 바뀌면 리마운트한다. NoteTab이 날짜가 바뀔 때 key={date}로 하는 것과 같은 이유:
            그러지 않으면 이전 달의 편집 중이던 초안이 다음 달로 넘어가 남는다. */}
        <ReviewCard
          key={monthKey}
          month={monthKey}
          review={overview.review}
          onSave={async (body) => {
            const saved = await saveReview(monthKey, body)
            onReviewSaved(monthKey, saved.noteMarkdown)
          }}
        />
      </div>
    </section>
  )
}

function SpendingCard({ overview }: { overview: MonthOverviewDto }) {
  const diffPercent =
    overview.previousMonthAmount === null || overview.previousMonthAmount === 0
      ? null
      : Math.round(
          ((overview.totalAmount - overview.previousMonthAmount) / overview.previousMonthAmount) * 100,
        )

  return (
    <div className="flex-1 rounded-card border border-hairline bg-surface p-3.5">
      <p className="text-label text-muted">이번 달 지출</p>
      <p className="mt-1.5 text-[19px] font-bold text-ink">
        {overview.totalAmount.toLocaleString('ko-KR')}원
      </p>
      {diffPercent !== null && (
        <p className="mt-0.5 text-label font-semibold text-muted">
          {diffPercent >= 0 ? '▲' : '▼'} 지난달보다 {Math.abs(diffPercent)}%
        </p>
      )}
    </div>
  )
}

function TopCategoryCard({ overview }: { overview: MonthOverviewDto }) {
  return (
    <div className="flex-1 rounded-card border border-hairline bg-surface p-3.5">
      <p className="text-label text-muted">가장 많은 지출</p>
      {overview.topCategory ? (
        <>
          <p className="mt-1.5 text-[19px] font-bold text-ink">{overview.topCategory.category}</p>
          <p className="mt-0.5 text-label font-semibold text-muted">
            {overview.topCategory.amount.toLocaleString('ko-KR')}원
          </p>
        </>
      ) : (
        <p className="mt-1.5 text-content text-placeholder">기록 없음</p>
      )}
    </div>
  )
}

function EmotionBars({
  moodCounts,
  recordedDays,
}: {
  moodCounts: MonthOverviewDto['moodCounts']
  recordedDays: number
}) {
  const max = Math.max(1, ...moodCounts.map((mood) => mood.count))

  return (
    <div className="rounded-card border border-hairline bg-surface p-4">
      <p className="text-label text-muted">이번 달 감정 분포 · {recordedDays}일 기록됨</p>

      {recordedDays === 0 ? (
        <p className="mt-3 text-content text-placeholder">아직 기분을 기록한 날이 없어요.</p>
      ) : (
        <div className="mt-3 flex h-14 items-end gap-2">
          {MOODS.map((mood) => {
            const count = moodCounts.find((item) => item.score === mood.score)?.count ?? 0
            const heightPercent = count === 0 ? 4 : Math.max(12, Math.round((count / max) * 100))

            return (
              <div key={mood.score} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="w-full rounded-t bg-ink/15" style={{ height: `${heightPercent}%` }} />
                <span className="text-[15px] leading-none">{mood.emoji}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
