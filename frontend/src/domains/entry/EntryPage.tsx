import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { useSession } from '@/domains/auth/useSession'
import { NoteTab } from '@/domains/entry/NoteTab'
import { useDailyLog } from '@/domains/entry/useDailyLog'
import { ExpenseTab } from '@/domains/expense/ExpenseTab'
import { isValidDateKey, todayKey } from '@/lib/date'

type SubTab = 'note' | 'expense'

export function EntryPage() {
  const { date = '' } = useParams<{ date: string }>()
  const { session } = useSession()
  const [tab, setTab] = useState<SubTab>('note')

  if (!isValidDateKey(date)) {
    return <Navigate to={`/entries/${todayKey()}`} replace />
  }

  if (!session) {
    return null
  }

  return <EntryScreen userId={session.user.id} date={date} tab={tab} onTabChange={setTab} />
}

interface ScreenProps {
  userId: string
  date: string
  tab: SubTab
  onTabChange: (tab: SubTab) => void
}

function EntryScreen({ userId, date, tab, onTabChange }: ScreenProps) {
  const log = useDailyLog(userId, date)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)

  const handleFavorite = async () => {
    setFavoriteError(null)

    try {
      await log.toggleFavorite()
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : '즐겨찾기를 바꾸지 못했어요.')
    }
  }

  const isFavorite = log.entry?.is_favorite ?? false

  return (
    <main className="py-5">
      <div className="flex items-center justify-between">
        <h1 className="text-date font-bold tracking-title text-ink">{date}</h1>
        <button
          type="button"
          aria-label="즐겨찾기"
          aria-pressed={isFavorite}
          onClick={() => void handleFavorite()}
          className={`flex h-11 w-11 items-center justify-center text-[20px] ${
            isFavorite ? 'text-ink' : 'text-placeholder'
          }`}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      {favoriteError && (
        <p role="alert" className="text-content text-cat-food-fg">
          {favoriteError}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <SubTabButton label="기록" active={tab === 'note'} onClick={() => onTabChange('note')} />
        <SubTabButton
          label="가계부"
          active={tab === 'expense'}
          onClick={() => onTabChange('expense')}
        />
      </div>

      {log.isLoading && <p className="mt-8 text-center text-content text-muted">불러오는 중…</p>}

      {log.loadError && (
        <div className="mt-8 text-center">
          <p role="alert" className="text-content text-body">
            {log.loadError}
          </p>
          <button
            type="button"
            onClick={() => void log.reload()}
            className="mt-3 min-h-[44px] rounded-card border border-hairline bg-surface px-4 text-field font-semibold text-body"
          >
            다시 시도
          </button>
        </div>
      )}

      {!log.isLoading && !log.loadError && (
        <>
          {tab === 'note' && <NoteTab key={date} entry={log.entry} onSave={log.save} />}
          {tab === 'expense' && (
            <ExpenseTab
              expenses={log.expenses}
              onAdd={log.addExpense}
              onEdit={log.editExpense}
              onDelete={log.removeExpense}
            />
          )}
        </>
      )}
    </main>
  )
}

function SubTabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[44px] flex-1 rounded-card text-field font-semibold ${
        active ? 'bg-ink text-canvas' : 'bg-chip text-chip-fg'
      }`}
    >
      {label}
    </button>
  )
}
