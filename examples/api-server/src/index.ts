import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ursaAuthMiddleware } from './middlewares'
declare module 'hono' {
  interface Context {
    ursaAuthUser: Record<string, unknown>
  }
}


const app = new Hono()

app.use('*', logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/hello-ursa-auth', ursaAuthMiddleware,  async c => {
  console.log('/hello-ursa-auth called')
  return c.body(JSON.stringify(c.ursaAuthUser), 200)
})

serve({
  fetch: app.fetch,
  port: 5000,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

