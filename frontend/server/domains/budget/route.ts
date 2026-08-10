import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { assertMonthKey, parseBudgetRequest } from '../../lib/validate.js'
import { getBudget, saveBudget } from './service.js'

const budgetRoute = new Hono<AppEnv>()

budgetRoute.use('*', requireAuth)

budgetRoute.get('/:month', async (c) => {
  const month = assertMonthKey(c.req.param('month'))

  return c.json(await getBudget(c.get('supabase'), c.get('userId'), month))
})

budgetRoute.put('/:month', async (c) => {
  const month = assertMonthKey(c.req.param('month'))
  const body = parseBudgetRequest(await c.req.json())

  return c.json(await saveBudget(c.get('supabase'), c.get('userId'), month, body))
})

export default budgetRoute
