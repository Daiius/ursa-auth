import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { randomBytes, createHash } from 'crypto'

import { Auth } from '@auth/core'
import { decode } from '@auth/core/jwt'
import type { JWT } from '@auth/core/jwt'
import { authConfig } from './auth'

import { log } from './log'
import { config } from './config'

type CodeEntry = {
  jwe: string;
  expiresAt: number;
  codeChallenge: string;
}
const codeStore = new Map<string, CodeEntry>()
const CODE_TTL = 5 * 60 * 1000 // 5分

// PKCE用コード生成
const generateCode = (jwe: string, codeChallenge: string): string => {
  const code = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + CODE_TTL
  codeStore.set(code, { jwe, expiresAt, codeChallenge })
  setTimeout(() => codeStore.delete(code), CODE_TTL)
  return code
}

// PKCE用コード消費
const consumeCode = (code: string, codeVerifier: string): string | null => {
  const entry = codeStore.get(code)
  if (!entry || Date.now() > entry.expiresAt) {
    log('accessed expired code, deleting...: ', code)
    codeStore.delete(code)
    return null
  }
  // PKCE検証
  const hash = createHash('sha256').update(codeVerifier).digest()
  const expected = hash.toString('base64')
    .replace(/=/g,'').replace(/\+/g, '-').replace(/\//g, '_')
  if (expected !== entry.codeChallenge) {
    log('pkce verification failed, deleting: ', code)
    codeStore.delete(code)
    return null
  }
  // successful
  codeStore.delete(code)
  return entry.jwe
}

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

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// OAuth認証関連のエンドポイント
// NOTE: authConfigのbasePathと合わせます
//
// Auth.js のOAuth Providerとのコールバック処理に追加の処理を行い、
// 簡易的な認証サーバとしての働きをさせています
//
// ?? 
// 認証対象のクライアントと直接やり取りできるのは最初のアクセス時のみで、
// あとはAuth.jsとOAuth Providerが勝手にやり取りしてしまう
//
// 最初にPKCE verification codeを貰ったところで、
// JWEを貰えるのは何度か後に再度このエンドポイントが呼ばれた時なので
// どうやってJWE取得時に設定したいverification codeと
// 最初に呼ばれた時のverification codeを突き合わせるのだろう？
app.all('/api/auth/*', async c => {
  const { req } = c
  const url = new URL(req.url)
 
  // 初回にユーザからアクセスされたタイミングで
  // 各種パラメータのチェックをする
  // (あとはOAuth Providerもここを呼び出すため、次のリクエストではチェック不可) 
    // アプリケーションから指定された最終リダイレクト先は
    // 自作のアプリのみ許容する
    // また、code_challengeパラメータを設定されていることを要求する
    // (JWEをcodeを用いて受け渡しする際のPKCE用)
    const initialCallbackUrl = url.searchParams.get('callbackUrl');
    if (initialCallbackUrl) {
      if (
        !config.allowedRedirectPatterns
          .some(url => initialCallbackUrl.startsWith(url))
      ) {
        log('callbackUrl value is not allowed (/api/auth/* handler)', initialCallbackUrl)
        return c.text('Invalid request', 400)
      }
      // code_challengeのチェック
      const initialCodeChallenge = (new URL(initialCallbackUrl)).searchParams.get('codeChallenge')
      if (req.path.includes('signin') &&  !initialCodeChallenge) {
        log('codeChallenge parameter is not set in callbackUrl')
        return c.text('Invalid request', 400)
      }
    }
  
  // call Auth.js core function
  const response = await Auth(req.raw, authConfig)

  // プロバイダを指定してsignIn() を呼ぶ際には
  // skip-csrf-check をオプションに指定しているっぽい
  // この処理は自作ログインページで使用する
  //const response = await Auth(req.raw, { ...authConfig, skipCSRFCheck })
  
  // リダイレクト先の検証用
  const location = response.headers.get('Location');
  // JWEトークンが発行されたかチェック
  const jwe = response.headers.getSetCookie()
    .find(cookie => cookie.startsWith(config.authjsSessionName))
    ?.split(';')[0]
    ?.replace(`${config.authjsSessionName}=`, '') ?? ''
  
  // 認証成功時にjweをメモリに保存、codeChallengeと紐づけcode発行
  // set-cookieからセッション情報を削除
  if (
    response.status === 302 &&
    url.pathname.startsWith('/api/auth/callback/') &&
    jwe &&
    location
  ) {
    // callbackUrlがlocationにセットされているので、
    // codeChallengeを記録して削除し、代わりにcodeをセットする
    const url = new URL(location)
    const codeChallenge = url.searchParams.get('codeChallenge')
    if (!codeChallenge) {
      log('cannot find codeChallenge parameter in redirect location')
      return c.text('Internal server error', 500)
    }
    url.searchParams.delete('codeChallenge')
    url.searchParams.set('code', generateCode(jwe, codeChallenge))
    response.headers.set('Location', url.toString())

    // 特定のset-cookieだけ消す方法がなさそうなので、
    // 全部取得してフィルタしてセットしなおす
    const filteredCookies = response.headers.getSetCookie()
      .filter(cookie => !cookie.startsWith(config.authjsSessionName))
    response.headers.delete('Set-Cookie')
    for (const cookie of filteredCookies) {
      response.headers.append('Set-Cookie', cookie)
    }
    log('last response: %o', response)
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
      secret: config.authjsSecrets, 
      salt: config.authjsSessionName, 
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

// UrsaAuthのJWEトークンを取得します
app.post('/token', async c => {
  const { code, code_verifier } = await c.req.json()
  const jwe = consumeCode(code, code_verifier)
  if (!jwe) return c.text('Invalid request', 400)
  return c.text(jwe)
})

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

