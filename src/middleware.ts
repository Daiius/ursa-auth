
import type { MiddlewareHandler } from 'hono';

import { config } from './config'
import { log } from './log'

import { generateCode } from './pkce'
import { 
  checkCustomParams,
  getCustomRedirectLocation,
  getJWEFromSetCookieHeader,
  isSuccessfulRedirectResponse, 
} from './lib';

/**
 * x-forwarded-proto に従ってreq.urlを書き換えます
 */
export const trustProtoMiddleware: MiddlewareHandler = async (c, next) => {
  const xForwardedProto = c.req.header('x-forwarded-proto')
  if (xForwardedProto) {
    const trustedUrl = c.req.url.replace('http://', `${xForwardedProto}://`)
    const clonedReq = c.req.raw.clone()
    const newReq = new Request(trustedUrl.toString(), {
      method: clonedReq.method,
      headers: clonedReq.headers,
      body: ['GET', 'HEAD'].includes(clonedReq.method) ? undefined: clonedReq.body
    })
    c.req.raw = newReq
  }
  await next()
}

/**
 * UrsaAuthの認証情報中継機能を、Auth.js のコア機能のミドルウェアとして
 * 実装しています。より細かな処理は./lib.ts に記述されています
 */
export const ursaAuthMiddleware: MiddlewareHandler = async (c, next) => {

  // for debug
  const url = new URL(c.req.url);
  log('url: ', url)

  // 初回にユーザからアクセスされたタイミングで
  // 各種パラメータのチェックをする
  //
  // (あとはOAuth Providerもここを呼び出すため、次のリクエストではチェック不可) 
  // アプリケーションから指定された最終リダイレクト先は
  // 自作のアプリのみ許容する
  // また、code_challengeパラメータを設定されていることを要求する
  // (JWEをcodeを用いて受け渡しする際のPKCE用)
  //
  if (!checkCustomParams(url)) {
    return c.text('Invalid request', 400)
  }

  // Auth.js の処理
  await next()
  
  // JWEトークンが発行されたかチェック+転送の準備
  const jwe = getJWEFromSetCookieHeader(c.res)
  
  // UrsaAuth向けのcodeChallenge付きcallbackUrlが入っている場合
  if (isSuccessfulRedirectResponse(c.req.raw, c.res, jwe)) {

    const locationUrlString = c.res.headers.get('location')
    if (!locationUrlString || !URL.parse(locationUrlString)) {
      log('cannot find redirect location in header, or it is invalid')
      return c.text('Invalid request', 400)
    }
    const locationUrl = getCustomRedirectLocation(new URL(locationUrlString))

    if (!locationUrl || !jwe) {
      log('cannot find callbackUrl or jwe: ', locationUrl?.toString(), jwe)
      return c.text('Inavlid request', 400)
    }
    
    // callbackUrlがlocationにセットされているので、
    // codeChallengeを記録して削除し、代わりにcodeをセットする
    const codeChallenge = locationUrl.searchParams.get('codeChallenge')
    if (!codeChallenge) {
      log('cannot find codeChallenge parameter in redirect location')
      return c.text('Internal server error', 500)
    }
    locationUrl.searchParams.delete('codeChallenge')
    locationUrl.searchParams.set('code', generateCode(jwe, codeChallenge))
    c.res.headers.set('Location', locationUrl.toString())

    // 特定のset-cookieだけ消す方法がなさそうなので、
    // 全部取得してフィルタしてセットしなおす
    const filteredCookies = c.res.headers.getSetCookie()
      .filter(cookie => !cookie.startsWith(config.authjsSessionName))
    c.res.headers.delete('Set-Cookie')
    for (const cookie of filteredCookies) {
      c.res.headers.append('Set-Cookie', cookie)
    }
    log('last response: %o', c.res)
  }
}

