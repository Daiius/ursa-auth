import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { decode } from '@auth/core/jwt'

import { config } from '../.ursa-auth.config'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/hello-ursa-auth', async c => {
  console.log('/hello-ursa-auth called')
  const authHeader = c.req.raw.headers.get('Authorization')
  if (!authHeader) return c.body('Unauthorized.', 401)
  const jwe = authHeader.replace('bearer', '').trim()

  try {
    const jwt = await decode({ 
      token: jwe, 
      secret: config.authSecrets, 
      salt: 'authjs.session-token' 
    });
    if (!jwt) return c.body('Unauthorized.', 401)
    return c.body(JSON.stringify(jwt), 200)
  } catch (err) {
    console.error(err)
    return c.body('Unauthorized.', 401)
  }
})

serve({
  fetch: app.fetch,
  port: 5000,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

