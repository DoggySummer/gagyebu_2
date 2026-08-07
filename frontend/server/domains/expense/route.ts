import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { parseExpenseRequest } from '../../lib/validate.js'
import { deleteExpense, updateExpense } from './service.js'

const expenseRoute = new Hono<AppEnv>()

expenseRoute.use('*', requireAuth)

expenseRoute.patch('/:id', async (c) => {
  const body = parseExpenseRequest(await c.req.json())

  return c.json(await updateExpense(c.get('supabase'), c.get('userId'), c.req.param('id'), body))
})

expenseRoute.delete('/:id', async (c) => {
  await deleteExpense(c.get('supabase'), c.get('userId'), c.req.param('id'))

  return c.body(null, 204)
})

export default expenseRoute
