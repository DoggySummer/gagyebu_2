import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import {
  assertDateKey,
  parseEntryRequest,
  parseExpenseRequest,
  parseFavoriteRequest,
} from '../../lib/validate.js'
import { createExpense } from '../expense/service.js'
import { getDailyLog, saveEntry, setFavorite } from './service.js'

const entryRoute = new Hono<AppEnv>()

entryRoute.use('*', requireAuth)

entryRoute.get('/:date', async (c) => {
  const date = assertDateKey(c.req.param('date'))

  return c.json(await getDailyLog(c.get('supabase'), c.get('userId'), date))
})

entryRoute.put('/:date', async (c) => {
  const date = assertDateKey(c.req.param('date'))
  const body = parseEntryRequest(await c.req.json())

  return c.json(await saveEntry(c.get('supabase'), c.get('userId'), date, body))
})

entryRoute.patch('/:date/favorite', async (c) => {
  const date = assertDateKey(c.req.param('date'))
  const isFavorite = parseFavoriteRequest(await c.req.json())

  return c.json(await setFavorite(c.get('supabase'), c.get('userId'), date, isFavorite))
})

entryRoute.post('/:date/expenses', async (c) => {
  const date = assertDateKey(c.req.param('date'))
  const body = parseExpenseRequest(await c.req.json())

  return c.json(await createExpense(c.get('supabase'), c.get('userId'), date, body), 201)
})

export default entryRoute
