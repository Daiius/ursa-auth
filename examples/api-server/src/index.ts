import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ursaAuthMiddleware } from './middlewares'
import { log } from './log'
declare module 'hono' {
  interface ContextVariableMap {
    ursaAuthUser: Record<string, unknown>
  }
}


const app = new Hono()

app.use('*', logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/hello-ursa-auth', ursaAuthMiddleware,  async c => {
  log('/hello-ursa-auth called')
  const user = c.get('ursaAuthUser')
  log('user@handler: %o', user)
  return c.json(user)
})

serve({
  fetch: app.fetch,
  port: 5000,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

