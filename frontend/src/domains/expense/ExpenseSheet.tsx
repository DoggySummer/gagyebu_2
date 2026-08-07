import { useState } from 'react'
import { CATEGORIES, CATEGORY_TAG_CLASS, type Category } from '@/lib/categories'
import type { ExpenseDto, ExpenseRequest, PaymentMethod } from '@shared/api.types'

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←']

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: '카드' },
  { value: 'cash', label: '현금' },
  { value: 'transfer', label: '이체' },
]

const MAX_AMOUNT = 100_000_000

interface Props {
  expense: ExpenseDto | null
  onSubmit: (body: ExpenseRequest) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export function ExpenseSheet({ expense, onSubmit, onDelete, onClose }: Props) {
  const [amount, setAmount] = useState(() => (expense ? String(expense.amount) : ''))
  const [category, setCategory] = useState<Category | null>(
    () => (expense?.category as Category | undefined) ?? null,
  )
  const [memo, setMemo] = useState(() => expense?.memo ?? '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    () => expense?.paymentMethod ?? null,
  )
  const [showPayment, setShowPayment] = useState(() => Boolean(expense?.paymentMethod))
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericAmount = Number(amount || '0')
  const canSubmit =
    numericAmount >= 1 && numericAmount <= MAX_AMOUNT && category !== null && memo.trim().length > 0

  const pressKey = (key: string) => {
    setAmount((prev) => {
      if (key === '←') return prev.slice(0, -1)

      const next = (prev + key).replace(/^0+(?=\d)/, '')

      return Number(next) > MAX_AMOUNT ? prev : next
    })
  }

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true)
    setError(null)

    try {
      await action()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '처리하지 못했어요.')
      setIsBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-end">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-ink/20"
      />

      <div
        role="dialog"
        aria-label={expense ? '지출 수정' : '지출 추가'}
        className="relative mx-auto w-full max-w-[560px] rounded-t-sheet border-t border-hairline bg-surface px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4"
      >
        <p className="text-right text-amount font-bold text-ink">
          {numericAmount.toLocaleString('ko-KR')}원
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((item) => {
            const selected = category === item

            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(item)}
                className={`min-h-[36px] rounded-full px-3 text-content font-semibold ${
                  selected ? CATEGORY_TAG_CLASS[item] : 'bg-chip text-chip-fg'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>

        <input
          value={memo}
          maxLength={100}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="메모"
          aria-label="메모"
          className="mt-4 min-h-[44px] w-full rounded-card border border-hairline bg-canvas px-3 text-field text-body placeholder:text-placeholder"
        />

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPayment((prev) => !prev)}
            className="text-label font-semibold uppercase tracking-label text-muted"
          >
            결제수단 {paymentMethod ? `· ${PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}` : ''}
          </button>

          {showPayment && (
            <div className="mt-2 flex gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  aria-pressed={paymentMethod === method.value}
                  onClick={() =>
                    setPaymentMethod((prev) => (prev === method.value ? null : method.value))
                  }
                  className={`min-h-[36px] flex-1 rounded-full text-content font-semibold ${
                    paymentMethod === method.value
                      ? 'bg-ink text-canvas'
                      : 'bg-chip text-chip-fg'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {KEYPAD.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => pressKey(key)}
              className="min-h-[52px] rounded-card bg-chip text-[20px] font-semibold text-ink"
            >
              {key}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-content text-cat-food-fg">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {expense && onDelete && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void run(onDelete)}
              className="min-h-[44px] flex-1 rounded-card border border-hairline bg-surface text-field font-semibold text-cat-food-fg"
            >
              삭제
            </button>
          )}
          <button
            type="button"
            disabled={!canSubmit || isBusy}
            onClick={() =>
              void run(() =>
                onSubmit({
                  amount: numericAmount,
                  category: category as Category,
                  memo,
                  paymentMethod,
                }),
              )
            }
            className="min-h-[44px] flex-[2] rounded-card bg-ink text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  )
}
