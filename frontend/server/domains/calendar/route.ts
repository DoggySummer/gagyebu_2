import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { parseYearMonth } from '../../lib/validate.js'
import { getMonthOverview, getMonthSummary } from './service.js'

const calendarRoute = new Hono<AppEnv>()

calendarRoute.use('*', requireAuth)

calendarRoute.get('/', async (c) => {
  const { year, month } = parseYearMonth(c.req.query('year'), c.req.query('month'))

  return c.json(await getMonthSummary(c.get('supabase'), c.get('userId'), year, month))
})

calendarRoute.get('/overview', async (c) => {
  const { year, month } = parseYearMonth(c.req.query('year'), c.req.query('month'))

  return c.json(await getMonthOverview(c.get('supabase'), c.get('userId'), year, month))
})

export default calendarRoute
