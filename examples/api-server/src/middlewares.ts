import type { MiddlewareHandler } from 'hono'
import { log } from './log'

const ursaAuthUrl = process.env.URSA_AUTH_URL!
log('ursaAuthUrl: ', ursaAuthUrl)

/**
 * Authorization: Bearer にUrsaAuthの発行した
 * 有効なJWEトークンがセットされていることを担保するmiddleware
 *
 * c.ursaAuthUser にユーザ情報を保存します
 */
export const ursaAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.text('Unauthorized', 401)

  const authHeaderTokens = authHeader?.split(' ')
  // accepts only bearer token
  if (
    authHeaderTokens?.length !== 2 ||
    authHeaderTokens?.[0] !== 'Bearer'
  ) {
    log(`invalid authorization header: ${authHeader}`)
    return c.text('Invalid request', 400)
  }
  const token = authHeaderTokens[1]
  const response = await fetch(`${ursaAuthUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) {
    log(
      `fetch from ursa-auth server failed: ${response.statusText} ${response.status}`
    )
    // どんな理由で失敗したかユーザには通知しない
    // ログには出力する
    return c.text('Unauthorized', 401)
  }
  const user = await response.json()
  log('user@middleware: %o', user)
  
  c.set('ursaAuthUser', user)

  await next()
}

