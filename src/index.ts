import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { Auth } from '@auth/core'
import { decode } from '@auth/core/jwt'
import { authConfig } from './auth'

import { log } from './log'
import { config } from './config'


const app = new Hono()

const tokenRedirectPatterns = [
  `${config.host}/mobile`,
];

const isTokenRedirectLocation = (location: string) =>
tokenRedirectPatterns.some(pattern => location.startsWith(pattern))

app.use('*', logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/mobile', async c => {
  const callbackUrl = (new URL(c.req.url)).searchParams.get('callbackUrl')
  if (!callbackUrl) {
    log('callbackUrl is not set')
    return c.body('Invalid request', 400)
  }
  if (!config.allowedMobileRedirectPatterns.some(url => callbackUrl.startsWith(url))) {
    log('callbackUrl for mobile is not allowed')
    return c.body('Invalid request', 400)
  }
  return c.redirect(callbackUrl)
})

// OAuth認証関連のエンドポイント
// NOTE: authConfigのbasePathと合わせる必要がありそう
app.all('/api/auth/*', async c => {
  const { req } = c
  const url = new URL(req.url)
  
  // アプリケーションから指定された最終リダイレクト先は
  // 自作のアプリのみ許容する
  const callbackUrl = url.searchParams.get('callbackUrl');
  if (
    callbackUrl && 
    !config.allowedRedirectPatterns.some(url => callbackUrl?.startsWith(url))
  ) {
    log(`callbackUrl ${callbackUrl} is not allowed (/api/auth/* handler)`)
    return c.body('Invalid request', 400)
  }
  
  const response = await Auth(req.raw, authConfig)

  // プロバイダを指定してsignIn() を呼ぶ際には
  // skip-csrf-check をオプションに指定しているっぽい
  // この処理は自作ログインページで使用する
  //const response = await Auth(req.raw, { ...authConfig, skipCSRFCheck })
  
  // リダイレクト先の検証
  const location = response.headers.get('Location');
  
  // おそらく認証成功後に戻されるタイミングは検出可能なはず...
  if (
    response.status === 302 &&
    isTokenRedirectLocation(location ?? '') &&
    url.pathname.startsWith('/api/auth/callback/')
  ) {
    log('detected mobile authentication, modifying redirect URL param...')
    const authjsSessionSignature = 'authjs.session-token='
    const jwe = response.headers.getSetCookie()
      .find(cookie => cookie.startsWith(authjsSessionSignature))
      ?.split(';')[0]
      ?.replace(authjsSessionSignature, '') ?? ''
    const locationUrl = new URL(response.headers.get('Location')!)
    locationUrl.searchParams.set('token', jwe)
    response.headers.set('Location', locationUrl.toString())
  }

  return response;
})

app.get('/me', async c => {
  const authHeader = c.req.raw.headers.get('Authorization')?.split(' ')
  if ( authHeader?.length !== 2 || authHeader[0] !== 'Bearer') {
    return c.text('Unauthorized', 401)
  }

  const jwe = authHeader[1].trim()
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
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

