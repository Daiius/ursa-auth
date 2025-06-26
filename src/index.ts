import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { Auth } from '@auth/core'

import { authConfig } from './auth'
import { log } from './log'
import { config } from './config'

import { 
  ursaAuthMiddleware,
  trustProtoMiddleware,
} from './middleware'
import { consumeCode } from './pkce'
import { getBearerToken, decodeJWE } from './lib'

log('host: ', config.host)
log('forceHttpsCallback: ', config.forceHttpsCallback)


const app = new Hono()

const origins = config.cors?.origins != null
  ? config.cors?.origins.length === 0 
    ? config.allowedRedirectPatterns
    : config.cors?.origins
  : config.allowedRedirectPatterns

log('cors origins: %o', origins)
app.use('*', cors({
  origin: origins,
  credentials: true,
}))

app.use('*', logger())

app.use('*', trustProtoMiddleware)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// OAuth認証関連のエンドポイント
// NOTE: authConfigのbasePathと合わせます
//
// Auth.js のOAuth Providerとのコールバック処理に追加の処理を行い、
// 簡易的な認証サーバとしての働きをさせています
//
// 認証対象のクライアントと直接やり取りできるのは最初のアクセス時のみで、
// あとはAuth.jsとOAuth Providerが勝手にやり取りしてしまう
app.all('/api/auth/*', ursaAuthMiddleware, async c => await Auth(c.req.raw, authConfig))



// UrsaAuthのBearer tokenを解析し、
// ユーザの情報を取得します
// NOTE: /api/auth/sessionと同等の機能です
app.get('/me', async c => {
  const jwe = getBearerToken(c.req.header('Authorization'))
  if (!jwe) {
    log('failed to get bearer token')
    return c.text('Unauthorized', 401)
  }
  const jwt = await decodeJWE(jwe)
  if (!jwt) {
    log('faild to decode JWE')
    return c.text('Unauthorized', 401)
  }
  return c.json(jwt)
})

// UrsaAuthのBearer tokenを解析し、
// ユーザの情報を検証します
// /me と異なり結果を返しません
app.get('/validate', async c => {
  const jwe = getBearerToken(c.req.header('Authorization'))
  if (!jwe) {
    log('failed to get bearer token')
    return c.text('Unauthorized', 401)
  }
  const jwt = await decodeJWE(jwe)
  if (!jwt) {
    log('faild to decode JWE')
    return c.text('Unauthorized', 401)
  }
  return c.body(null, 204) 
})

// UrsaAuthのJWEトークンを取得します
app.post('/token', async c => {
  const { code, code_verifier } = await c.req.json()
  const jwe = consumeCode(code, code_verifier)
  if (!jwe) return c.text('Invalid request', 400)
  return c.text(jwe)
})


const server = serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

process.on('SIGTERM',  () => {
  log('received SIGTERM, closing connections...')
  server.close(() => {
    log('connection closed, terminating...')
    process.exit(0)
  })
})

