import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * 배포 진단용 임시 엔드포인트. import도 설정도 없는 가장 단순한 함수다.
 * /api/ping 은 되는데 /api/health 가 안 되면 원인이 Hono 쪽 import에 있고,
 * 둘 다 안 되면 함수 런타임 자체의 문제다. 원인을 잡은 뒤 지운다.
 */
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ ok: true, node: process.version }))
}
