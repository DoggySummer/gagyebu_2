import ReactMarkdown, { type Components } from 'react-markdown'

/**
 * 스펙이 정한 지원 문법만 남긴다: 제목·목록·굵게·기울임·인용·인라인 코드.
 * 링크·이미지·표는 렌더하지 않고 내용만 남긴다(unwrapDisallowed).
 *
 * 별도 새니타이저를 붙이지 않는 이유: react-markdown 은 rehype-raw 를 쓰지 않는 한
 * 원시 HTML을 아예 파싱하지 않는다. 그러니 rehype-raw 를 추가하면 안 된다.
 */
const ALLOWED = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  'code',
  'br',
]

const components: Components = {
  h1: ({ children }) => <h3 className="mt-4 text-[18px] font-bold text-ink first:mt-0">{children}</h3>,
  h2: ({ children }) => <h4 className="mt-4 text-[17px] font-bold text-ink first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mt-4 text-[16px] font-bold text-ink first:mt-0">{children}</h5>,
  h4: ({ children }) => <h6 className="mt-3 text-content font-semibold text-ink first:mt-0">{children}</h6>,
  h5: ({ children }) => <h6 className="mt-3 text-content font-semibold text-ink first:mt-0">{children}</h6>,
  h6: ({ children }) => <h6 className="mt-3 text-content font-semibold text-ink first:mt-0">{children}</h6>,
  p: ({ children }) => <p className="mt-2 text-content leading-relaxed text-body first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc pl-5 first:mt-0">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal pl-5 first:mt-0">{children}</ol>,
  li: ({ children }) => <li className="mt-1 text-content leading-relaxed text-body">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-l-2 border-hairline pl-3 text-content text-muted first:mt-0">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-chip px-1 py-0.5 text-[13px] text-chip-fg">{children}</code>
  ),
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown allowedElements={ALLOWED} unwrapDisallowed components={components}>
      {children}
    </ReactMarkdown>
  )
}
