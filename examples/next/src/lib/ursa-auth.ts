import { cookies } from 'next/headers'

import { log } from '@/lib/log'

import { ursaAuthServerSideConfig } from '@/ursa-auth/server-side-config'

/**
 * cookiesからUrsaAuthのユーザ情報を取得します
 */
export const fetchUserInfo = async (): Promise<any> => {

  const { sessionName, authServerUrl } = ursaAuthServerSideConfig

  const sessionToken = (await cookies()).get(sessionName)?.value
    .split(';')?.[0].replace(sessionName + '=', '')
  if (!sessionToken) {
    return undefined
  }
  try {
    const response = await fetch(`${authServerUrl}/me`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    })
    if (!response.ok) {
      log('failed to fetch ursa-auth/me, ', response.statusText, response.status)
      return undefined
    }
    return await response.json()
  } catch (err) {
    log('fetch errr: %o', err)
    return undefined
  }
}

