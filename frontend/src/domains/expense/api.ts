import { supabase } from '@/lib/supabase'
import type { Category } from '@/lib/categories'
import type { ExpenseRow } from '@/domains/entry/api'

export type PaymentMethod = 'card' | 'cash' | 'transfer'

export interface ExpenseDraft {
  amount: number
  category: Category
  memo: string
  paymentMethod: PaymentMethod | null
}

export async function createExpense(
  userId: string,
  date: string,
  draft: ExpenseDraft,
): Promise<ExpenseRow> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      entry_date: date,
      amount: draft.amount,
      category: draft.category,
      memo: draft.memo.trim(),
      payment_method: draft.paymentMethod,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateExpense(
  userId: string,
  id: string,
  draft: ExpenseDraft,
): Promise<ExpenseRow> {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      amount: draft.amount,
      category: draft.category,
      memo: draft.memo.trim(),
      payment_method: draft.paymentMethod,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteExpense(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId)

  if (error) throw error
}
