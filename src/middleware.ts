
import type { MiddlewareHandler } from 'hono';

import { config } from './config'
import { log } from './log'

import { generateCode } from './pkce'
import { checkCustomParams, getJWEFromSetCookieHeader } from './lib';

/**
 * UrsaAuthの認証情報中継機能を、Auth.js のコア機能のミドルウェアとして
 * 実装しています。より細かな処理は./lib.ts に記述されています
 */
export const ursaAuthMiddleware: MiddlewareHandler = async (c, next) => {

  const url = new URL(c.req.url);

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
  
  // UrsaAuth向けのcodeChallenge付きcallbackUrlが入っている
  const location = c.res.headers.get('Location');
  if (
    c.res.status === 302 &&
    url.pathname.startsWith('/api/auth/callback/') &&
    jwe &&
    location
  ) {
    let url = new URL(location)
    log('calling back, location: ', location)
    // Auth.js はカスタムスキーマコールバックに対応していないので、
    // ダミーで設定されたurlであればcallbackUrlにまるまるおきかえる
    if (location.startsWith(`${config.host}/mobile`)) {
      const callbackUrlForMobile = url.searchParams.get('callbackUrl')
      if (!callbackUrlForMobile) {
        log(
          'mobile callback pattern detected, but callbackUrl is not set: ',
          callbackUrlForMobile
        )
        return c.text('Invalid request', 400)
      }
      if (!config.allowedMobileRedirectPatterns.includes(callbackUrlForMobile)) {
        log(
          'given mobile callback uri pattern is not allowed',
          callbackUrlForMobile,
        )
        return c.text('Invalid request', 400)
      }
      const originalSearchParams = url.searchParams
      url = new URL(callbackUrlForMobile)
      if (url.searchParams.size) {
        log(
          'mobile callback should not have search parameters: ',
          url,
        )
        return c.text('Invalid request', 400)
      }
      // add original searchParams to mobile callback url
      for (const [key, value] of originalSearchParams) {
        url.searchParams.set(key, value)
      }
      log('mobile callback pattern applied: ', url)
    }

    log('url: ', url.toString())
    
    // callbackUrlがlocationにセットされているので、
    // codeChallengeを記録して削除し、代わりにcodeをセットする
    const codeChallenge = url.searchParams.get('codeChallenge')
    if (!codeChallenge) {
      log('cannot find codeChallenge parameter in redirect location')
      return c.text('Internal server error', 500)
    }
    url.searchParams.delete('codeChallenge')
    url.searchParams.set('code', generateCode(jwe, codeChallenge))
    c.res.headers.set('Location', url.toString())

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

