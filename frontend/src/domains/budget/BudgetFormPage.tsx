import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { fetchBudget, saveBudget } from '@/domains/budget/api'
import { FIXED_CATEGORIES } from '@/lib/categories'
import type { UpdateBudgetRequest } from '@shared/api.types'

/** 'YYYY-MM' -> '2026년 8월' */
function toMonthLabel(month: string): string {
  const [year, m] = month.split('-')

  return `${year}년 ${Number(m)}월`
}

export function BudgetFormPage() {
  const { month = '' } = useParams<{ month: string }>()
  const navigate = useNavigate()

  const [income, setIncome] = useState('')
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(FIXED_CATEGORIES.map((category) => [category, ''])),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchBudget(month)
      .then((budget) => {
        if (cancelled) return

        setIncome(budget.income > 0 ? String(budget.income) : '')
        setAmounts((prev) => {
          const next = { ...prev }

          for (const item of budget.fixedExpenses) {
            if (item.amount > 0) next[item.category] = String(item.amount)
          }

          return next
        })
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '불러오지 못했어요.')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [month])

  const close = () => void navigate('/stats/expenses')

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)

    const body: UpdateBudgetRequest = {
      income: Number(income || '0'),
      fixedExpenses: FIXED_CATEGORIES.map((category) => ({
        category,
        amount: Number(amounts[category] || '0'),
      })),
    }

    try {
      await saveBudget(month, body)
      void navigate('/stats/expenses')
    } catch (error) {
      // 저장에 실패해도 입력 내용은 화면에 그대로 둔다.
      setSaveError(error instanceof Error ? error.message : '저장하지 못했어요.')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-8 text-center text-content text-muted">
        불러오는 중…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-8 text-center">
        <p role="alert" className="text-content text-body">
          {loadError}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[560px] px-4 pb-10">
        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-content text-muted"
          >
            ✕
          </button>
          <h1 className="text-field font-semibold text-ink">{toMonthLabel(month)} 설정</h1>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSave()}
            className="flex h-11 min-w-11 items-center justify-center px-1 text-field font-semibold text-ink disabled:text-placeholder"
          >
            저장
          </button>
        </div>

        <p className="mt-1 text-label text-muted">
          하루하루 입력하는 가계부는 전부 변동지출로 계산돼요. 수입과 고정지출은 여기서 한 번만
          입력해두면 매달 그대로 쓸 수 있어요.
        </p>

        <div className="mt-6">
          <label htmlFor="income" className="text-label font-semibold text-muted">
            이번 달 수입
          </label>
          <div className="mt-1.5 flex min-h-[44px] items-center gap-2 rounded-card border border-hairline bg-surface px-3">
            <input
              id="income"
              type="text"
              inputMode="numeric"
              value={income}
              onChange={(event) => setIncome(event.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent py-2 text-field font-semibold text-ink outline-none placeholder:font-normal placeholder:text-placeholder"
            />
            <span className="shrink-0 text-content font-semibold text-muted">원</span>
          </div>
        </div>

        <section className="mt-6 border-t border-hairline pt-5">
          <h2 className="text-label font-semibold uppercase tracking-label text-muted">고정지출</h2>

          <div className="mt-3 flex flex-col gap-3">
            {FIXED_CATEGORIES.map((category) => (
              <div key={category}>
                <label
                  htmlFor={`fixed-${category}`}
                  className="text-label font-semibold text-muted"
                >
                  {category}
                </label>
                <div className="mt-1.5 flex min-h-[44px] items-center gap-2 rounded-card border border-hairline bg-surface px-3">
                  <input
                    id={`fixed-${category}`}
                    type="text"
                    inputMode="numeric"
                    value={amounts[category]}
                    onChange={(event) =>
                      setAmounts((prev) => ({
                        ...prev,
                        [category]: event.target.value.replace(/[^0-9]/g, ''),
                      }))
                    }
                    placeholder="0"
                    className="min-w-0 flex-1 bg-transparent py-2 text-field font-semibold text-ink outline-none placeholder:font-normal placeholder:text-placeholder"
                  />
                  <span className="shrink-0 text-content font-semibold text-muted">원</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {saveError && (
          <p role="alert" className="mt-4 text-content text-cat-food-fg">
            {saveError}
          </p>
        )}

        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="mt-6 min-h-[44px] w-full rounded-card bg-ink px-4 text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
        >
          {isSaving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  )
}
