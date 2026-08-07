import { useCallback, useEffect, useState } from 'react'
import { fetchDailyLog, saveEntry, setFavorite } from '@/domains/entry/api'
import { createExpense, deleteExpense, updateExpense } from '@/domains/expense/api'
import type { DailyEntryDto, ExpenseDto, ExpenseRequest, UpdateEntryRequest } from '@shared/api.types'

interface Loaded {
  /** 이 데이터가 어느 날짜의 것인지. 렌더 중에 로딩 여부를 판단하는 기준이 된다. */
  key: string
  entry: DailyEntryDto | null
  expenses: ExpenseDto[]
  error: string | null
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

/** 하루치 일기와 지출을 함께 들고 있는다. user_id 는 서버가 JWT에서 꺼내므로 넘기지 않는다. */
export function useDailyLog(date: string) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchDailyLog(date)
      .then(({ entry, expenses }) => {
        if (!cancelled) setLoaded({ key: date, entry, expenses, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoaded({
            key: date,
            entry: null,
            expenses: [],
            error: messageOf(error, '불러오지 못했어요.'),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [date, reloadToken])

  // 날짜가 바뀌면 아직 이전 날짜 데이터를 들고 있으므로 로딩으로 취급한다.
  const current = loaded?.key === date ? loaded : null

  const reload = useCallback(() => {
    setLoaded(null)
    setReloadToken((token) => token + 1)
  }, [])

  const save = useCallback(
    async (body: UpdateEntryRequest) => {
      const entry = await saveEntry(date, body)
      setLoaded((prev) => (prev && prev.key === date ? { ...prev, entry } : prev))
    },
    [date],
  )

  const toggleFavorite = useCallback(async () => {
    const previous = current?.entry ?? null
    const next = !previous?.isFavorite

    // 토글은 즉시 반영하고 실패하면 되돌린다.
    setLoaded((prev) =>
      prev && prev.key === date && prev.entry
        ? { ...prev, entry: { ...prev.entry, isFavorite: next } }
        : prev,
    )

    try {
      const entry = await setFavorite(date, next)
      setLoaded((prev) => (prev && prev.key === date ? { ...prev, entry } : prev))
    } catch (error) {
      setLoaded((prev) => (prev && prev.key === date ? { ...prev, entry: previous } : prev))
      throw error
    }
  }, [date, current])

  const addExpense = useCallback(
    async (body: ExpenseRequest) => {
      const created = await createExpense(date, body)
      setLoaded((prev) =>
        prev && prev.key === date ? { ...prev, expenses: [...prev.expenses, created] } : prev,
      )
    },
    [date],
  )

  const editExpense = useCallback(
    async (id: string, body: ExpenseRequest) => {
      const updated = await updateExpense(id, body)
      setLoaded((prev) =>
        prev && prev.key === date
          ? { ...prev, expenses: prev.expenses.map((item) => (item.id === id ? updated : item)) }
          : prev,
      )
    },
    [date],
  )

  const removeExpense = useCallback(
    async (id: string) => {
      await deleteExpense(id)
      setLoaded((prev) =>
        prev && prev.key === date
          ? { ...prev, expenses: prev.expenses.filter((item) => item.id !== id) }
          : prev,
      )
    },
    [date],
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
