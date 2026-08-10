import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { parseYearMonth } from '../../lib/validate.js'
import { getExpenseStats } from './service.js'

const statsRoute = new Hono<AppEnv>()

statsRoute.use('*', requireAuth)

statsRoute.get('/expenses', async (c) => {
  const { year, month } = parseYearMonth(c.req.query('year'), c.req.query('month'))

  return c.json(await getExpenseStats(c.get('supabase'), c.get('userId'), year, month))
})

export default statsRoute
