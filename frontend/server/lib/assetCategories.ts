export const ASSET_CATEGORIES = ['현금성자산', '투자자산', '은퇴자산', '사용자산'] as const

export const LIABILITY_CATEGORIES = [
  '카드대출',
  '신용대출',
  '주거관련대출',
  '담보대출',
  '기타대출',
] as const

export const ACCOUNT_CATEGORIES = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES] as const

export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number]

export function isAccountCategory(value: string): value is AccountCategory {
  return (ACCOUNT_CATEGORIES as readonly string[]).includes(value)
}

export function isLiabilityCategory(category: string): boolean {
  return (LIABILITY_CATEGORIES as readonly string[]).includes(category)
}
