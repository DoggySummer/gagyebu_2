import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { parseWorkFlowToggle, parseWorkScreenRequest, parseWorkScreensCursor } from '../../lib/validate.js'
import {
  createWorkScreen,
  deleteWorkScreen,
  getWorkScreen,
  listWorkScreens,
  setWorkFlowDone,
  updateWorkScreen,
} from './service.js'

const workRoute = new Hono<AppEnv>()

workRoute.use('*', requireAuth)

workRoute.get('/screens', async (c) => {
  const cursor = parseWorkScreensCursor(c.req.query('cursor'))

  return c.json(await listWorkScreens(c.get('supabase'), c.get('userId'), cursor))
})

workRoute.post('/screens', async (c) => {
  const body = parseWorkScreenRequest(await c.req.json())

  return c.json(await createWorkScreen(c.get('supabase'), c.get('userId'), body), 201)
})

workRoute.get('/screens/:id', async (c) => {
  return c.json(await getWorkScreen(c.get('supabase'), c.get('userId'), c.req.param('id')))
})

workRoute.put('/screens/:id', async (c) => {
  const body = parseWorkScreenRequest(await c.req.json())

  return c.json(await updateWorkScreen(c.get('supabase'), c.get('userId'), c.req.param('id'), body))
})

workRoute.delete('/screens/:id', async (c) => {
  await deleteWorkScreen(c.get('supabase'), c.get('userId'), c.req.param('id'))

  return c.body(null, 204)
})

workRoute.patch('/flows/:id', async (c) => {
  const isDone = parseWorkFlowToggle(await c.req.json())

  return c.json(await setWorkFlowDone(c.get('supabase'), c.get('userId'), c.req.param('id'), isDone))
})

export default workRoute
