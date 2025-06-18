
import { NextResponse } from 'next/server'

import { cookies } from 'next/headers'
import { log } from '@/lib/log'

export const GET = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const response = await fetch(
    'http://ursa-auth-test-api:5000/hello-ursa-auth', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (!response.ok) {
    log('failed to fetch from api server: ', response.statusText, response.status)
    return NextResponse.json('Internal server error', { status: 500 })
  }
  const responseBody = await response.json()
  log('response body: %o', responseBody)
  return NextResponse.json(responseBody)
}

