// Vercel은 api/·server/ 를 @types/node 없이 컴파일한다(types: [] 로 고정).
// process 를 직접 참조하면 배포 빌드가 TS2591 로 깨지므로 최소한만 선언해서 쓴다.
declare const process: { env: Record<string, string | undefined> }
declare const console: { error: (...args: unknown[]) => void }

/** 서버 로그. Vercel 대시보드의 Runtime Logs에서 보인다. */
export function logError(...args: unknown[]): void {
  console.error(...args)
}

function firstOf(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]

    if (value) return value
  }

  throw new Error(`${names[0]} 환경변수가 없습니다.`)
}

// 모듈 로드 시점이 아니라 요청 시점에 읽는다. 환경변수가 빠졌을 때
// 함수 전체가 죽는 대신 해당 요청만 500으로 떨어져 원인을 알기 쉽다.
//
// VITE_ 이름으로도 찾는 이유: 이 두 값은 어차피 브라우저 번들에 들어가는 공개 값이라
// 클라이언트와 이름을 공유해도 안전하고, 같은 값을 두 번 등록하지 않아도 된다.
// secret 키였다면 절대 이렇게 하지 않는다.
export const supabaseUrl = () => firstOf('SUPABASE_URL', 'VITE_SUPABASE_URL')
export const supabasePublishableKey = () =>
  firstOf('SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY')
