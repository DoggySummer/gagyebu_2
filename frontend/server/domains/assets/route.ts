import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { parseAccountRequest } from '../../lib/validate.js'
import {
  createAccount,
  deleteAccount,
  getAccount,
  getAssetsSummary,
  listNetWorthTrend,
  updateAccount,
} from './service.js'

const assetsRoute = new Hono<AppEnv>()

assetsRoute.use('*', requireAuth)

assetsRoute.get('/summary', async (c) => {
  return c.json(await getAssetsSummary(c.get('supabase'), c.get('userId')))
})

assetsRoute.get('/trend', async (c) => {
  return c.json(await listNetWorthTrend(c.get('supabase'), c.get('userId')))
})

assetsRoute.get('/accounts/:id', async (c) => {
  return c.json(await getAccount(c.get('supabase'), c.get('userId'), c.req.param('id')))
})

assetsRoute.post('/accounts', async (c) => {
  const body = parseAccountRequest(await c.req.json())

  return c.json(await createAccount(c.get('supabase'), c.get('userId'), body), 201)
})

assetsRoute.put('/accounts/:id', async (c) => {
  const body = parseAccountRequest(await c.req.json())

  return c.json(await updateAccount(c.get('supabase'), c.get('userId'), c.req.param('id'), body))
})

assetsRoute.delete('/accounts/:id', async (c) => {
  await deleteAccount(c.get('supabase'), c.get('userId'), c.req.param('id'))

  return c.body(null, 204)
})

export default assetsRoute
