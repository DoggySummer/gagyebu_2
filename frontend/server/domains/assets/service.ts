import { HTTPException } from 'hono/http-exception'
import type {
  AccountDto,
  AccountRequest,
  AssetsSummaryDto,
  NetWorthSnapshotDto,
} from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'
import { isLiabilityCategory } from '../../lib/assetCategories.js'

function toAccountDto(row: {
  id: string
  name: string
  institution: string | null
  category: string
  balance: number
}): AccountDto {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    category: row.category,
    balance: row.balance,
  }
}

function computeTotals(accounts: { category: string; balance: number }[]): {
  assetTotal: number
  liabilityTotal: number
  netWorth: number
} {
  let assetTotal = 0
  let liabilityTotal = 0

  for (const account of accounts) {
    if (isLiabilityCategory(account.category)) {
      liabilityTotal += account.balance
    } else {
      assetTotal += account.balance
    }
  }

  return { assetTotal, liabilityTotal, netWorth: assetTotal - liabilityTotal }
}

function currentMonthStart(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')

  return `${year}-${month}-01`
}

/**
 * 계좌를 만들거나 고치거나 지울 때마다 이번 달 순자산 스냅샷을 다시 계산해 덮어쓴다.
 * 사용자가 따로 "이번 달 마감" 같은 절차를 밟지 않아도, 잔액을 바꾸는 순간이 곧
 * 그 달의 기록이 된다. 지난달 행은 이번 upsert 대상이 아니므로 그대로 얼어붙는다.
 */
async function syncNetWorthSnapshot(supabase: UserClient, userId: string): Promise<void> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('category,balance')
    .eq('user_id', userId)

  if (error) throw error

  const { assetTotal, liabilityTotal, netWorth } = computeTotals(accounts)

  const { error: upsertError } = await supabase.from('net_worth_snapshots').upsert(
    {
      user_id: userId,
      month: currentMonthStart(),
      asset_total: assetTotal,
      liability_total: liabilityTotal,
      net_worth: netWorth,
    },
    { onConflict: 'user_id,month' },
  )

  if (upsertError) throw upsertError
}

export async function getAssetsSummary(supabase: UserClient, userId: string): Promise<AssetsSummaryDto> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id,name,institution,category,balance')
    .eq('user_id', userId)
    .order('category', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const accounts = data.map(toAccountDto)
  const { assetTotal, liabilityTotal, netWorth } = computeTotals(data)

  return { accounts, assetTotal, liabilityTotal, netWorth }
}

export async function getAccount(supabase: UserClient, userId: string, id: string): Promise<AccountDto> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id,name,institution,category,balance')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new HTTPException(404, { message: '계좌를 찾을 수 없어요.' })
  }

  return toAccountDto(data)
}

export async function listNetWorthTrend(
  supabase: UserClient,
  userId: string,
): Promise<NetWorthSnapshotDto[]> {
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .select('month,asset_total,liability_total,net_worth')
    .eq('user_id', userId)
    .order('month', { ascending: true })

  if (error) throw error

  return data.map((row) => ({
    month: row.month,
    assetTotal: row.asset_total,
    liabilityTotal: row.liability_total,
    netWorth: row.net_worth,
  }))
}

export async function createAccount(
  supabase: UserClient,
  userId: string,
  body: AccountRequest,
): Promise<AccountDto> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: body.name,
      institution: body.institution,
      category: body.category,
      balance: body.balance,
    })
    .select('id,name,institution,category,balance')
    .single()

  if (error) throw error

  await syncNetWorthSnapshot(supabase, userId)

  return toAccountDto(data)
}

export async function updateAccount(
  supabase: UserClient,
  userId: string,
  id: string,
  body: AccountRequest,
): Promise<AccountDto> {
  const { data, error } = await supabase
    .from('accounts')
    .update({
      name: body.name,
      institution: body.institution,
      category: body.category,
      balance: body.balance,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id,name,institution,category,balance')
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new HTTPException(404, { message: '계좌를 찾을 수 없어요.' })
  }

  await syncNetWorthSnapshot(supabase, userId)

  return toAccountDto(data)
}

export async function deleteAccount(supabase: UserClient, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', userId)

  if (error) throw error

  await syncNetWorthSnapshot(supabase, userId)
}
