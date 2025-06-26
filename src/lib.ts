
import { decode } from '@auth/core/jwt'
import type { JWT } from '@auth/core/jwt'

import { log } from './log'
import { config } from './config'

export const getBearerToken = (
  authorizationHeaderContent: string | undefined
): string | undefined  => {
  const authHeader = authorizationHeaderContent?.split(' ')
  if (authHeader?.length !== 2 || authHeader[0] !== 'Bearer') {
    log('inavlid authorization header: ', authorizationHeaderContent)
    return undefined
  }
  return authHeader[1].trim()
}

export const decodeJWE = async (token: string): Promise<JWT|null> => {
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

export const getJWEFromSetCookieHeader = (response: Response) => {
  return response.headers.getSetCookie()
    .find(cookie => cookie.startsWith(config.authjsSessionName))
    ?.split(';')[0]
    ?.replace(`${config.authjsSessionName}=`, '')
}

const isMobileRedirectUrl = (url: URL | string) =>
url.toString().startsWith(`${config.host}/mobile`)

// UrsaAuth用にカスタマイズされたパラメータをチェックします
//
// callbackUrlが指定されているリクエストなら、
// その中にcodeChallengeもあるか確認します
// NOTE:
// callbackUrlに関連付けられたcodeChallengeが必要です
export const checkCustomParams = (url: URL): boolean => {

  const callbackUrl = url.searchParams.get('callbackUrl');

  // そもそもcallbackUrlがセットされていないならばチェック対象にしない
  if (!callbackUrl) return true

  // callbackUrl がホワイトリスト内でないなら失敗
  if (
    config.allowedRedirectPatterns
      .every(url => !callbackUrl.startsWith(url))
  ) {
    log('callbackUrl value is not allowed (/api/auth/* handler)', callbackUrl)
    return false
  }

  // モバイルコールバック向けかで場合分け
  if (isMobileRedirectUrl(callbackUrl)) {
    // モバイル向けの場合、更に内側にカスタムスキーマが設定される
    const mobileCallbackUrl = 
      (new URL(callbackUrl)).searchParams.get('callbackUrl')
    if (!mobileCallbackUrl) {
      log('mobile callback pattern detected, but no inner callbakUrl')
      return false
    }
    // リダイレクト先のカスタムスキーマもホワイトリスト管理
    if (
      !config.allowedMobileRedirectPatterns
        .some(url => mobileCallbackUrl.startsWith(url))
    ) {
      log(
        'mobile callback pattern, innter callbackUrl detected, but not allowed: ',
        mobileCallbackUrl
      )
      return false
    }

    // カスタムスキーマにはcodeChallengeパラメータが存在しているかチェック
    const codeChallenge = 
      (new URL(mobileCallbackUrl)).searchParams.get('codeChallenge')
    if (!codeChallenge) {
      log('mobile callback pattern, innter callbackUrl detected, but no codeChallenge: ', mobileCallbackUrl)
      return false
    }

  } else {
    // Web向け
    // callbackUrlが設定されているのにcodeChallengeがその中に無ければ失敗
    const codeChallenge = 
      (new URL(callbackUrl)).searchParams.get('codeChallenge')
    if (url.pathname.includes('signin') &&  !codeChallenge) {
      log('codeChallenge parameter is not set in callbackUrl')
      return false
    }
  }

  return true
}

/**
 * UrsaAuthが介入するのは認証成功時のアプリへのリダイレクト時で、
 * それを検出するための条件判定を行います
 * NOTE
 * けっこう繊細なのでリファクタリング時には気を付ける
 */
export const isSuccessfulRedirectResponse = (
  req: Request,
  res: Response,
  jwe: string | undefined
) => {
  if (!URL.canParse(req.url)) return false
  const url = new URL(req.url)
  return (
    res.status === 302 &&
    url.pathname.startsWith('/api/auth/callback') &&
    jwe &&
    res.headers.get('location')
  )
}

/**
 * UrsaAuth向けに設定されたcallbackUrlから、
 * 目的とするLocationを取得します
 */
export const getCustomRedirectLocation = (locationUrl: URL): URL | undefined  => {
  // TODO
  // 実装が複雑になるが、applinkやUniversal linkを用いてcallbackできれば
  // 複雑な設定が不要になる、要件等
 
  if (!isMobileRedirectUrl(locationUrl)) {
    // Web向けならこの時点での編集の必要はない
    // (後でcodeChallengeを読み取ってcodeに置き換える)
    return locationUrl
  }

  // mobile向けのコールバックならこんな形式
  // locationUrl: ${host}/mobile?callbackUrl=custom.cheme://callback?codeChallenge...
  const customSchemeUrlString = locationUrl.searchParams.get('callbackUrl')
  if (!customSchemeUrlString || !URL.canParse(customSchemeUrlString)) {
    log(
      'mobile callback pattern detected, but callbackUrl is empty or invalid: ',
      customSchemeUrlString
    )
    return undefined
  }
  // モバイル向けカスタムスキーマURLがホワイトリストに入るかチェック
  const customSchemeUrl = new URL(customSchemeUrlString)
  if (!config.allowedMobileRedirectPatterns.some(url => customSchemeUrl.toString().startsWith(url))) {
    log(
      'given mobile callback uri pattern is not allowed',
      customSchemeUrl.toString(),
    )
    return undefined
  }

  return customSchemeUrl
}

