import { supabase } from '@/lib/supabase'
import type { Tables } from '@shared/database.types'

export type DailyEntryRow = Tables<'daily_entries'>
export type ExpenseRow = Tables<'expenses'>

export interface DailyLog {
  entry: DailyEntryRow | null
  expenses: ExpenseRow[]
}

/**
 * 일기와 지출을 각각 조회한다.
 * 두 테이블은 FK로 묶여 있지 않아 조인할 수 없고, user_id + entry_date로만 이어진다.
 * RLS가 user_id를 걸러주지만 쿼리에도 조건을 명시해 이중으로 방어한다.
 */
export async function fetchDailyLog(userId: string, date: string): Promise<DailyLog> {
  const [entryResult, expensesResult] = await Promise.all([
    supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', date)
      .maybeSingle(),
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', date)
      .order('created_at', { ascending: true }),
  ])

  if (entryResult.error) throw entryResult.error
  if (expensesResult.error) throw expensesResult.error

  return { entry: entryResult.data, expenses: expensesResult.data }
}

export interface EntryDraft {
  moodScore: number | null
  gratitude: string
  noteMarkdown: string
}

/** (user_id, entry_date) 유니크 제약을 충돌 대상으로 삼는 upsert. 없으면 만들고 있으면 갱신한다. */
export async function saveEntry(
  userId: string,
  date: string,
  draft: EntryDraft,
): Promise<DailyEntryRow> {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      {
        user_id: userId,
        entry_date: date,
        mood_score: draft.moodScore,
        gratitude: draft.gratitude.trim() || null,
        note_markdown: draft.noteMarkdown.trim() || null,
      },
      { onConflict: 'user_id,entry_date' },
    )
    .select()
    .single()

  if (error) throw error

  return data
}

/** 즐겨찾기는 명시적인 단일 동작이라 누르는 즉시 저장한다. */
export async function setFavorite(
  userId: string,
  date: string,
  isFavorite: boolean,
): Promise<DailyEntryRow> {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      { user_id: userId, entry_date: date, is_favorite: isFavorite },
      { onConflict: 'user_id,entry_date' },
    )
    .select()
    .single()

  if (error) throw error

  return data
}
