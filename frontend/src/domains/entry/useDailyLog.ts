import { useCallback, useEffect, useState } from 'react'
import {
  fetchDailyLog,
  saveEntry,
  setFavorite,
  type DailyEntryRow,
  type EntryDraft,
  type ExpenseRow,
} from '@/domains/entry/api'
import {
  createExpense,
  deleteExpense,
  updateExpense,
  type ExpenseDraft,
} from '@/domains/expense/api'

interface Loaded {
  /** 이 데이터가 어느 사용자·날짜의 것인지. 렌더 중에 로딩 여부를 판단하는 기준이 된다. */
  key: string
  entry: DailyEntryRow | null
  expenses: ExpenseRow[]
  error: string | null
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

/** 하루치 일기와 지출을 함께 들고 있는다. */
export function useDailyLog(userId: string, date: string) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const key = `${userId}:${date}`

  useEffect(() => {
    let cancelled = false

    fetchDailyLog(userId, date)
      .then(({ entry, expenses }) => {
        if (!cancelled) setLoaded({ key, entry, expenses, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({ key, entry: null, expenses: [], error: messageOf(error, '불러오지 못했어요.') })
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId, date, key, reloadToken])

  // 날짜가 바뀌면 아직 이전 날짜 데이터를 들고 있으므로 로딩으로 취급한다.
  const current = loaded?.key === key ? loaded : null

  const reload = useCallback(() => {
    setLoaded(null)
    setReloadToken((token) => token + 1)
  }, [])

  const save = useCallback(
    async (draft: EntryDraft) => {
      const entry = await saveEntry(userId, date, draft)
      setLoaded((prev) => (prev && prev.key === key ? { ...prev, entry } : prev))
    },
    [userId, date, key],
  )

  const toggleFavorite = useCallback(async () => {
    const previous = current?.entry ?? null
    const next = !previous?.is_favorite

    // 토글은 즉시 반영하고 실패하면 되돌린다.
    setLoaded((prev) =>
      prev && prev.key === key && prev.entry
        ? { ...prev, entry: { ...prev.entry, is_favorite: next } }
        : prev,
    )

    try {
      const entry = await setFavorite(userId, date, next)
      setLoaded((prev) => (prev && prev.key === key ? { ...prev, entry } : prev))
    } catch (error) {
      setLoaded((prev) => (prev && prev.key === key ? { ...prev, entry: previous } : prev))
      throw error
    }
  }, [userId, date, key, current])

  const addExpense = useCallback(
    async (draft: ExpenseDraft) => {
      const created = await createExpense(userId, date, draft)
      setLoaded((prev) =>
        prev && prev.key === key ? { ...prev, expenses: [...prev.expenses, created] } : prev,
      )
    },
    [userId, date, key],
  )

  const editExpense = useCallback(
    async (id: string, draft: ExpenseDraft) => {
      const updated = await updateExpense(userId, id, draft)
      setLoaded((prev) =>
        prev && prev.key === key
          ? { ...prev, expenses: prev.expenses.map((item) => (item.id === id ? updated : item)) }
          : prev,
      )
    },
    [userId, key],
  )

  const removeExpense = useCallback(
    async (id: string) => {
      await deleteExpense(userId, id)
      setLoaded((prev) =>
        prev && prev.key === key
          ? { ...prev, expenses: prev.expenses.filter((item) => item.id !== id) }
          : prev,
      )
    },
    [userId, key],
  )

  return {
    entry: current?.entry ?? null,
    expenses: current?.expenses ?? [],
    isLoading: current === null,
    loadError: current?.error ?? null,
    reload,
    save,
    toggleFavorite,
    addExpense,
    editExpense,
    removeExpense,
  }
}
