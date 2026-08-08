import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchFavorites } from '@/domains/favorite/api'
import type { FavoriteItemDto } from '@shared/api.types'

interface State {
  items: FavoriteItemDto[]
  cursor: string | null
  hasMore: boolean
  isLoading: boolean
  error: string | null
}

const INITIAL: State = { items: [], cursor: null, hasMore: true, isLoading: true, error: null }

/** 20건 단위 커서 무한 스크롤. */
export function useFavorites() {
  const [state, setState] = useState<State>(INITIAL)
  const isFetching = useRef(false)

  const load = useCallback(async (cursor: string | null) => {
    if (isFetching.current) return
    isFetching.current = true
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const page = await fetchFavorites(cursor)
      setState((prev) => ({
        items: cursor ? [...prev.items, ...page.items] : page.items,
        cursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '불러오지 못했어요.',
      }))
    } finally {
      isFetching.current = false
    }
  }, [])

  useEffect(() => {
    void load(null)
  }, [load])

  const loadMore = useCallback(() => {
    setState((prev) => {
      if (prev.hasMore && !isFetching.current) void load(prev.cursor)
      return prev
    })
  }, [load])

  /** 목록에서 즐겨찾기를 해제하면 서버를 다시 불러오지 않고 바로 빼낸다. */
  const removeItem = useCallback((entryDate: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((item) => item.entryDate !== entryDate) }))
  }, [])

  const retry = useCallback(() => {
    void load(state.items.length > 0 ? state.cursor : null)
  }, [load, state.cursor, state.items.length])

  return {
    items: state.items,
    isInitialLoading: state.isLoading && state.items.length === 0,
    isLoadingMore: state.isLoading && state.items.length > 0,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    removeItem,
    retry,
  }
}
