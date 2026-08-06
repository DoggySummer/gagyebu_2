import { useState } from 'react'
import { CATEGORY_TAG_CLASS, type Category } from '@/lib/categories'
import type { ExpenseRow } from '@/domains/entry/api'
import type { ExpenseDraft } from '@/domains/expense/api'
import { ExpenseSheet } from '@/domains/expense/ExpenseSheet'

interface Props {
  expenses: ExpenseRow[]
  onAdd: (draft: ExpenseDraft) => Promise<void>
  onEdit: (id: string, draft: ExpenseDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ExpenseTab({ expenses, onAdd, onEdit, onDelete }: Props) {
  const [sheet, setSheet] = useState<{ expense: ExpenseRow | null } | null>(null)

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="pb-6">
      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-label font-semibold uppercase tracking-label text-muted">합계</span>
        <span className="text-date font-bold text-ink">{total.toLocaleString('ko-KR')}원</span>
      </div>

      {expenses.length === 0 ? (
        <p className="mt-8 text-center text-content text-muted">
          아직 기록한 지출이 없어요. ＋ 를 눌러 추가해보세요.
        </p>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-card border border-hairline bg-surface">
          {expenses.map((expense, index) => (
            <li key={expense.id} className={index > 0 ? 'border-t border-divider' : undefined}>
              <button
                type="button"
                onClick={() => setSheet({ expense })}
                className="flex min-h-[44px] w-full items-center gap-2 px-3 py-3 text-left"
              >
                <span className="flex-1 truncate text-content text-body">{expense.memo}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-label font-semibold ${
                    CATEGORY_TAG_CLASS[expense.category as Category] ?? 'bg-chip text-chip-fg'
                  }`}
                >
                  {expense.category}
                </span>
                <span className="shrink-0 text-content font-semibold text-ink">
                  {expense.amount.toLocaleString('ko-KR')}원
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        aria-label="지출 추가"
        onClick={() => setSheet({ expense: null })}
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-[max(16px,calc(50vw-264px))] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-[24px] text-canvas"
      >
        ＋
      </button>

      {sheet && (
        <ExpenseSheet
          expense={sheet.expense}
          onClose={() => setSheet(null)}
          onSubmit={(draft) =>
            sheet.expense ? onEdit(sheet.expense.id, draft) : onAdd(draft)
          }
          onDelete={sheet.expense ? () => onDelete(sheet.expense!.id) : undefined}
        />
      )}
    </div>
  )
}
