import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { config } from 'dotenv'
config({ path: '.env.development' })

import { decode } from '@auth/core/jwt'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/hello-ursa-auth', async c => {
  const authHeader = c.req.raw.headers.get('Authorization')
  if (!authHeader) return c.body('Unauthorized.', 401)
  const jwe = authHeader.replace('bearer', '').trim()

  try {
    const jwt = await decode({ 
      token: jwe, 
      secret: process.env.AUTH_SECRET!, 
      salt: 'authjs.session-token' 
    });
    if (!jwt) return c.body('Unauthorized.', 401)
    return c.body(JSON.stringify(jwt), 200)
  } catch (err) {
    console.error(err)
    return c.body('Unauthorized.', 401)
  }

  //return c.body('Failed to process', 500)
})

serve({
  fetch: app.fetch,
  port: 5000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

