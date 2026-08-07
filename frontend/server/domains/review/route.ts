import { Hono } from 'hono'
import type { AppEnv } from '../../middleware/auth.js'
import { requireAuth } from '../../middleware/auth.js'
import { assertMonthKey, parseReviewRequest } from '../../lib/validate.js'
import { getReview, saveReview } from './service.js'

const reviewRoute = new Hono<AppEnv>()

reviewRoute.use('*', requireAuth)

reviewRoute.get('/:month', async (c) => {
  const month = assertMonthKey(c.req.param('month'))
  const review = await getReview(c.get('supabase'), c.get('userId'), month)

  return c.json(review ?? { month, noteMarkdown: null })
})

reviewRoute.put('/:month', async (c) => {
  const month = assertMonthKey(c.req.param('month'))
  const body = parseReviewRequest(await c.req.json())

  return c.json(await saveReview(c.get('supabase'), c.get('userId'), month, body))
})

export default reviewRoute
