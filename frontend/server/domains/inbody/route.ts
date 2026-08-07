import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { parseInbodyRequest } from '../../lib/validate.js'
import { listRecords, saveRecord } from './service.js'

const inbodyRoute = new Hono<AppEnv>()

inbodyRoute.use('*', requireAuth)

inbodyRoute.get('/', async (c) => {
  return c.json(await listRecords(c.get('supabase'), c.get('userId')))
})

inbodyRoute.post('/', async (c) => {
  const body = parseInbodyRequest(await c.req.json())

  return c.json(await saveRecord(c.get('supabase'), c.get('userId'), body))
})

export default inbodyRoute
