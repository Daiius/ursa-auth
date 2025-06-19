import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

import { Auth } from '@auth/core'
import { decode } from '@auth/core/jwt'
import type { JWT } from '@auth/core/jwt'
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

const getBearerToken = (
  authorizationHeaderContent: string | undefined
): string | undefined  => {
  const authHeader = authorizationHeaderContent?.split(' ')
  if (authHeader?.length !== 2 || authHeader[0] !== 'Bearer') {
    log('inavlid authorization header: ', authorizationHeaderContent)
    return undefined
  }
  return authHeader[1].trim()
}

const decodeJWE = async (token: string): Promise<JWT|null> => {
  try {
    const jwt = await decode({ 
      token, 
      secret: config.authSecrets, 
      salt: 'authjs.session-token' 
    });
    return jwt
  } catch (err) {
    console.error(err)
    log('exception occurred while decoding jwe, %o', err)
    return null
  }
}

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

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

