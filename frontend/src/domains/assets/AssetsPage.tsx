import { Link } from 'react-router'
import { NetWorthTrendChart } from '@/domains/assets/NetWorthTrendChart'
import { useAssets } from '@/domains/assets/useAssets'
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '@/lib/assetCategories'
import type { AccountDto } from '@shared/api.types'

const GROUPS = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES]

export function AssetsPage() {
  const { summary, trend, isLoading, loadError, reload } = useAssets()

  if (isLoading) {
    return (
      <main className="py-5">
        <p className="text-center text-content text-muted">불러오는 중…</p>
      </main>
    )
  }

  if (loadError || !summary) {
    return (
      <main className="py-5 text-center">
        <p role="alert" className="text-content text-body">
          {loadError ?? '자산 정보를 찾을 수 없어요.'}
        </p>
        <button
          type="button"
          onClick={reload}
          className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
        >
          다시 시도
        </button>
      </main>
    )
  }

  const accountsByCategory = new Map<string, AccountDto[]>()
  for (const account of summary.accounts) {
    const list = accountsByCategory.get(account.category) ?? []
    list.push(account)
    accountsByCategory.set(account.category, list)
  }

  return (
    <main className="py-5 pb-10">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-date font-bold tracking-title text-ink">자산</h1>
        <Link
          to="/assets/new"
          className="shrink-0 rounded-full bg-chip px-3 py-1.5 text-label font-semibold text-chip-fg"
        >
          + 계좌 추가
        </Link>
      </div>

      <section className="mt-4 rounded-card border border-hairline bg-surface p-4">
        <p className="text-label font-semibold uppercase tracking-label text-muted">순자산</p>
        <p className="mt-1 text-amount font-bold text-ink">{summary.netWorth.toLocaleString('ko-KR')}원</p>

        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-cell bg-cat-health-bg px-3 py-2.5">
            <p className="text-label font-semibold text-cat-health-fg">자산 총액</p>
            <p className="mt-0.5 text-field font-bold text-ink">
              {summary.assetTotal.toLocaleString('ko-KR')}원
            </p>
          </div>
          <div className="flex-1 rounded-cell bg-cat-food-bg px-3 py-2.5">
            <p className="text-label font-semibold text-cat-food-fg">부채 총액</p>
            <p className="mt-0.5 text-field font-bold text-ink">
              {summary.liabilityTotal.toLocaleString('ko-KR')}원
            </p>
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-card border border-hairline bg-surface p-4">
        <p className="text-label font-semibold uppercase tracking-label text-muted">순자산 추이</p>
        <NetWorthTrendChart snapshots={trend} />
      </section>

      <section className="mt-5">
        {GROUPS.map((category) => {
          const accounts = accountsByCategory.get(category) ?? []
          const subtotal = accounts.reduce((sum, account) => sum + account.balance, 0)

          return (
            <div key={category} className="mt-4 first:mt-0">
              <div className="mb-1.5 flex items-baseline justify-between px-0.5">
                <span className="text-label font-semibold uppercase tracking-label text-muted">
                  {category}
                </span>
                <span className="text-label font-semibold text-body">
                  {subtotal.toLocaleString('ko-KR')}원
                </span>
              </div>

              <ul className="overflow-hidden rounded-card border border-hairline bg-surface">
                {accounts.length === 0 ? (
                  <li className="px-4 py-3 text-center text-content text-placeholder">
                    등록된 계좌가 없어요.
                  </li>
                ) : (
                  accounts.map((account, index) => (
                    <li key={account.id} className={index > 0 ? 'border-t border-divider' : undefined}>
                      <Link
                        to={`/assets/${account.id}/edit`}
                        className="flex min-h-[44px] items-center justify-between gap-2 px-4 py-3"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-content font-semibold text-ink">
                            {account.name}
                          </span>
                          {account.institution && (
                            <span className="block text-label text-muted">{account.institution}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-content font-semibold text-body">
                          {account.balance.toLocaleString('ko-KR')}원
                        </span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )
        })}
      </section>
    </main>
  )
}
