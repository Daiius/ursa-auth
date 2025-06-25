
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


// UrsaAuth用にカスタマイズされたパラメータをチェックします
//
// callbackUrlが指定されているリクエストなら、
// その中にcodeChallengeもあるか確認します
// NOTE:
// callbackUrlに関連付けられたcodeChallengeが必要です
export const checkCustomParams = (url: URL): boolean => {

  const initialCallbackUrl = url.searchParams.get('callbackUrl');

  // そもそもcallbackUrlがセットされていないならばチェック対象にしない
  if (!initialCallbackUrl) return true

  // callbackUrl がホワイトリスト内でないなら失敗
  if (
    !config.allowedRedirectPatterns
      .some(url => initialCallbackUrl.startsWith(url))
  ) {
    log('callbackUrl value is not allowed (/api/auth/* handler)', initialCallbackUrl)
    return false
  }

  // callbackUrlが設定されているのにcodeChallengeがその中に無ければ失敗
  const initialCodeChallenge = (new URL(initialCallbackUrl))
    .searchParams.get('codeChallenge')
  if (url.pathname.includes('signin') &&  !initialCodeChallenge) {
    log('codeChallenge parameter is not set in callbackUrl')
    return false
  }

  return true
}


