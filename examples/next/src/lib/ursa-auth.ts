import { cookies } from 'next/headers'

import { log } from '@/lib/log'

const sessionTokenName = 'ursa-auth.session';
const ursaAuthUrl = process.env.URSA_AUTH_URL!;

/**
 * cookiesからUrsaAuthのユーザ情報を取得します
 */
export const fetchUserInfo = async (): Promise<any> => {
  const sessionToken = (await cookies()).get(sessionTokenName)?.value
    .split(';')?.[0].replace(sessionTokenName + '=', '')
  if (!sessionToken) {
    return undefined
  }
  const response = await fetch(`${ursaAuthUrl}/me`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` }
  })
  if (!response.ok) {
    log('failed to fetch ursa-auth/me, ', response.statusText, response.status)
    return undefined
  }
  return await response.json()
}

