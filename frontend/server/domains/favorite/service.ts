import type { FavoritesResponse } from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'

const PAGE_SIZE = 20

/** 마크다운 기호를 지운 평문 한 줄. 미리보기는 렌더링하지 않고 그대로 텍스트로 보여준다. */
function toPlainLine(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s?/, '')
    .replace(/^-\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim()
}

const PREVIEW_MAX_LENGTH = 60

/** 오늘의 기록(본문) 첫 줄을 우선하고, 없으면 감사한 일로 대체한다. 둘 다 없으면 null. */
function toPreview(noteMarkdown: string | null, gratitude: string | null): string | null {
  const firstNoteLine = noteMarkdown
    ?.split('\n')
    .map(toPlainLine)
    .find((line) => line.length > 0)

  const source = firstNoteLine || gratitude?.trim() || null

  if (!source) return null

  return source.length > PREVIEW_MAX_LENGTH ? `${source.slice(0, PREVIEW_MAX_LENGTH)}…` : source
}

/**
 * 즐겨찾기한 날을 최신순으로, 20건 단위 커서 페이지네이션으로 준다.
 * daily_entries_favorites_idx(user_id, entry_date desc) where is_favorite 인덱스를 그대로 탄다.
 */
export async function listFavorites(
  supabase: UserClient,
  userId: string,
  cursor: string | null,
): Promise<FavoritesResponse> {
  let query = supabase
    .from('daily_entries')
    .select('entry_date,mood_score,gratitude,note_markdown')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .order('entry_date', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (cursor) {
    query = query.lt('entry_date', cursor)
  }

  const { data, error } = await query

  if (error) throw error

  // 한 건 더 가져와서 다음 페이지 존재 여부를 별도 count 쿼리 없이 판단한다.
  const hasMore = data.length > PAGE_SIZE
  const page = hasMore ? data.slice(0, PAGE_SIZE) : data

  return {
    items: page.map((row) => ({
      entryDate: row.entry_date,
      moodScore: row.mood_score,
      preview: toPreview(row.note_markdown, row.gratitude),
    })),
    nextCursor: hasMore ? page[page.length - 1].entry_date : null,
  }
}
