import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { assertDateKey } from '../../lib/validate.js'
import { listFavorites } from './service.js'

const favoriteRoute = new Hono<AppEnv>()

favoriteRoute.use('*', requireAuth)

favoriteRoute.get('/', async (c) => {
  const cursorParam = c.req.query('cursor')
  const cursor = cursorParam ? assertDateKey(cursorParam, '커서') : null

  return c.json(await listFavorites(c.get('supabase'), c.get('userId'), cursor))
})

export default favoriteRoute
