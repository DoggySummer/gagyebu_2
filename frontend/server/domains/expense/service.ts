import { HTTPException } from 'hono/http-exception'
import type { ExpenseDto, ExpenseRequest } from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'
import { toExpenseDto } from '../entry/service.js'

export async function createExpense(
  supabase: UserClient,
  userId: string,
  date: string,
  body: ExpenseRequest,
): Promise<ExpenseDto> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      entry_date: date,
      amount: body.amount,
      category: body.category,
      memo: body.memo,
      payment_method: body.paymentMethod,
    })
    .select()
    .single()

  if (error) throw error

  return toExpenseDto(data)
}

export async function updateExpense(
  supabase: UserClient,
  userId: string,
  id: string,
  body: ExpenseRequest,
): Promise<ExpenseDto> {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      amount: body.amount,
      category: body.category,
      memo: body.memo,
      payment_method: body.paymentMethod,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle()

  if (error) throw error

  // RLS가 남의 행을 걸러내므로, 없으면 존재하지 않거나 내 것이 아니라는 뜻이다.
  if (!data) {
    throw new HTTPException(404, { message: '지출을 찾을 수 없어요.' })
  }

  return toExpenseDto(data)
}

export async function deleteExpense(
  supabase: UserClient,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId)

  if (error) throw error
}
