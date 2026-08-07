import type { MonthlyReviewDto, UpdateReviewRequest } from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'

/** month 는 'YYYY-MM'. DB 컬럼은 그 달 1일로 정규화된 date다. */
function toMonthColumn(month: string): string {
  return `${month}-01`
}

export async function getReview(
  supabase: UserClient,
  userId: string,
  month: string,
): Promise<MonthlyReviewDto | null> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select('note_markdown')
    .eq('user_id', userId)
    .eq('month', toMonthColumn(month))
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return { month, noteMarkdown: data.note_markdown }
}

/** (user_id, month) 유니크를 충돌 대상으로 삼는 upsert. 월 제한 없이 아무 때나 작성·수정된다. */
export async function saveReview(
  supabase: UserClient,
  userId: string,
  month: string,
  body: UpdateReviewRequest,
): Promise<MonthlyReviewDto> {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .upsert(
      {
        user_id: userId,
        month: toMonthColumn(month),
        note_markdown: body.noteMarkdown?.trim() || null,
      },
      { onConflict: 'user_id,month' },
    )
    .select('note_markdown')
    .single()

  if (error) throw error

  return { month, noteMarkdown: data.note_markdown }
}
