import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { createAccount, deleteAccount, fetchAccount, updateAccount } from '@/domains/assets/api'
import { ACCOUNT_CATEGORIES } from '@/lib/assetCategories'
import type { AccountRequest } from '@shared/api.types'

export function AccountFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [category, setCategory] = useState<string>(ACCOUNT_CATEGORIES[0])
  const [balance, setBalance] = useState('')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    fetchAccount(id)
      .then((account) => {
        if (cancelled) return

        setName(account.name)
        setInstitution(account.institution ?? '')
        setCategory(account.category)
        setBalance(String(account.balance))
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
  }, [id])

  const balanceValue = Number(balance)
  const canSave =
    name.trim().length > 0 &&
    balance.trim().length > 0 &&
    Number.isInteger(balanceValue) &&
    balanceValue >= 0

  const close = () => void navigate('/assets')

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveError(null)

    const body: AccountRequest = {
      name: name.trim(),
      institution: institution.trim() || null,
      category,
      balance: balanceValue,
    }

    try {
      if (id) {
        await updateAccount(id, body)
      } else {
        await createAccount(body)
      }
      void navigate('/assets')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장하지 못했어요.')
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteAccount(id)
      void navigate('/assets')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '삭제하지 못했어요.')
      setIsDeleting(false)
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
          <h1 className="text-field font-semibold text-ink">{isEdit ? '계좌 수정' : '계좌 추가'}</h1>
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => void handleSave()}
            className="flex h-11 min-w-11 items-center justify-center px-1 text-field font-semibold text-ink disabled:text-placeholder"
          >
            저장
          </button>
        </div>

        <div className="mt-2">
          <label htmlFor="name" className="text-label font-semibold text-muted">
            이름
          </label>
          <input
            id="name"
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 생활비 통장"
            autoComplete="off"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-ink placeholder:text-placeholder"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="institution" className="text-label font-semibold text-muted">
            기관명
          </label>
          <input
            id="institution"
            value={institution}
            maxLength={100}
            onChange={(event) => setInstitution(event.target.value)}
            placeholder="예: 신한은행 (선택)"
            autoComplete="off"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-body placeholder:text-placeholder"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="category" className="text-label font-semibold text-muted">
            대분류
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-ink"
          >
            {ACCOUNT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="balance" className="text-label font-semibold text-muted">
            잔액
          </label>
          <input
            id="balance"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            placeholder="0"
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field text-ink placeholder:text-placeholder"
          />
        </div>

        {saveError && (
          <p role="alert" className="mt-4 text-content text-cat-food-fg">
            {saveError}
          </p>
        )}

        <button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => void handleSave()}
          className="mt-6 min-h-[44px] w-full rounded-card bg-ink px-4 text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
        >
          {isSaving ? '저장 중…' : '저장'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-3 min-h-[44px] w-full rounded-card border border-hairline bg-surface text-field font-semibold text-cat-food-fg"
          >
            삭제
          </button>
        )}

        {deleteError && (
          <p role="alert" className="mt-2 text-center text-content text-cat-food-fg">
            {deleteError}
          </p>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="이 계좌를 삭제할까요?"
          description="삭제해도 이전 달 순자산 기록에는 영향을 주지 않아요."
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
