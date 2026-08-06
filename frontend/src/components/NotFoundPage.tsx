import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <p className="text-content text-body">페이지를 찾을 수 없어요</p>
      <Link to="/" className="text-content font-semibold text-ink underline">
        오늘로 돌아가기
      </Link>
    </main>
  )
}
