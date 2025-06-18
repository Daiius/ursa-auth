import { NextResponse } from 'next/server'
import type { NextRequest, /*MiddlewareConfig*/ } from 'next/server'

import { log } from '@/lib/log'

const ursaAuthUrl = process.env.URSA_AUTH_URL!

// 基本全部のルートについて認証データを取得するが、
// 特に厳密（認証情報無ければ即401）なルートを定義してみる
const strictAuthCheckPaths = [
  '/api/hello-ursa-auth'
]

export async function middleware(req: NextRequest) {
  // clear x-ursa-auth-user header before use
  req.headers.delete('x-ursa-auth-user')

  // check cookie
  const sessionCookie = req.cookies.get('auth.js-session-token')
  if (sessionCookie) {
    const sessionToken = sessionCookie.value.split(';')[0]
      .replace('auth.js-session-token=', '')
    // if sessionToken is set, check it
    const ursaAuthResponse = await fetch(`${ursaAuthUrl}/me`, {
      headers: { 'Authorization': sessionToken }
    })
    if (!ursaAuthResponse.ok) {
      log(
        `failed to fetch from ${ursaAuthUrl}/me,`,
        `${ursaAuthResponse.statusText}, ${ursaAuthResponse.status}`
      )
      // TODO
      // 期限切れか、不正な値か、サーバ側エラーか、
      // 状況に応じて単に401を返すより適切な応答があるはず
      // (リダイレクトするとか)
      if (strictAuthCheckPaths.includes(req.nextUrl.pathname)) {
        return NextResponse.json('Unauthorized', { status: 401 })
      } else {
        return NextResponse.next()
      }
    }
    const response = NextResponse.next()
    response.headers.set(
      'x-ursa-auth-user', 
      JSON.stringify(await ursaAuthResponse.json())
    )
    return response
  }
}

