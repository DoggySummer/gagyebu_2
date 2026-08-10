import type { BudgetDto, UpdateBudgetRequest } from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'

/** month는 'YYYY-MM'. DB 컬럼은 그 달 1일로 정규화된 date다. */
function toMonthColumn(month: string): string {
  return `${month}-01`
}

export async function getBudget(
  supabase: UserClient,
  userId: string,
  month: string,
): Promise<BudgetDto> {
  const monthColumn = toMonthColumn(month)

  const [settingsResult, fixedResult] = await Promise.all([
    supabase
      .from('monthly_settings')
      .select('income')
      .eq('user_id', userId)
      .eq('month', monthColumn)
      .maybeSingle(),
    supabase
      .from('fixed_expenses')
      .select('category,amount')
      .eq('user_id', userId)
      .eq('month', monthColumn),
  ])

  if (settingsResult.error) throw settingsResult.error
  if (fixedResult.error) throw fixedResult.error

  return {
    month,
    income: settingsResult.data?.income ?? 0,
    fixedExpenses: fixedResult.data,
  }
}

/**
 * 수입과 고정지출 6종을 한 화면에서 같이 저장한다. 인풋 폼이 항상 6개 항목을 전부
 * 제출하도록 만들었으므로(비워도 0원으로) 삭제 로직 없이 upsert만으로 충분하다.
 */
export async function saveBudget(
  supabase: UserClient,
  userId: string,
  month: string,
  body: UpdateBudgetRequest,
): Promise<BudgetDto> {
  const monthColumn = toMonthColumn(month)

  const { error: settingsError } = await supabase
    .from('monthly_settings')
    .upsert({ user_id: userId, month: monthColumn, income: body.income }, { onConflict: 'user_id,month' })

  if (settingsError) throw settingsError

  if (body.fixedExpenses.length > 0) {
    const { error: fixedError } = await supabase.from('fixed_expenses').upsert(
      body.fixedExpenses.map((item) => ({
        user_id: userId,
        month: monthColumn,
        category: item.category,
        amount: item.amount,
      })),
      { onConflict: 'user_id,month,category' },
    )

    if (fixedError) throw fixedError
  }

  return getBudget(supabase, userId, month)
}
