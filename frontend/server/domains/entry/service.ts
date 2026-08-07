import type { Database } from '../../../shared/database.types.js'
import type {
  DailyEntryDto,
  DailyLogDto,
  ExpenseDto,
  PaymentMethod,
  UpdateEntryRequest,
} from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'

type EntryRow = Database['public']['Tables']['daily_entries']['Row']
type ExpenseRow = Database['public']['Tables']['expenses']['Row']

export function toEntryDto(row: EntryRow): DailyEntryDto {
  return {
    entryDate: row.entry_date,
    moodScore: row.mood_score,
    gratitude: row.gratitude,
    noteMarkdown: row.note_markdown,
    isFavorite: row.is_favorite,
  }
}

export function toExpenseDto(row: ExpenseRow): ExpenseDto {
  return {
    id: row.id,
    entryDate: row.entry_date,
    amount: row.amount,
    category: row.category,
    memo: row.memo,
    paymentMethod: row.payment_method as PaymentMethod | null,
  }
}

/**
 * 일기와 지출을 각각 조회한다. 두 테이블은 FK로 묶여 있지 않아 조인할 수 없고
 * user_id + entry_date 로만 이어진다.
 *
 * RLS가 이미 user_id 를 거르지만 쿼리에도 조건을 명시해 이중으로 방어한다.
 */
export async function getDailyLog(
  supabase: UserClient,
  userId: string,
  date: string,
): Promise<DailyLogDto> {
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

  return {
    entry: entryResult.data ? toEntryDto(entryResult.data) : null,
    expenses: expensesResult.data.map(toExpenseDto),
  }
}

/** (user_id, entry_date) 유니크를 충돌 대상으로 삼는 upsert */
export async function saveEntry(
  supabase: UserClient,
  userId: string,
  date: string,
  body: UpdateEntryRequest,
): Promise<DailyEntryDto> {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      {
        user_id: userId,
        entry_date: date,
        mood_score: body.moodScore,
        gratitude: body.gratitude?.trim() || null,
        note_markdown: body.noteMarkdown?.trim() || null,
      },
      { onConflict: 'user_id,entry_date' },
    )
    .select()
    .single()

  if (error) throw error

  return toEntryDto(data)
}

export async function setFavorite(
  supabase: UserClient,
  userId: string,
  date: string,
  isFavorite: boolean,
): Promise<DailyEntryDto> {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      { user_id: userId, entry_date: date, is_favorite: isFavorite },
      { onConflict: 'user_id,entry_date' },
    )
    .select()
    .single()

  if (error) throw error

  return toEntryDto(data)
}
