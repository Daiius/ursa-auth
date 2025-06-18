import { NextResponse } from 'next/server'
import type { NextRequest, MiddlewareConfig } from 'next/server'

import { log } from '@/lib/log'

const ursaAuthUrl = process.env.URSA_AUTH_URL!

// 基本全部のルートについて認証データを取得するが、
// 特に厳密（認証情報無ければ即401）なルートを定義してみる
const strictAuthCheckPaths = [
  '/api/hello-ursa-auth',
  '/protected',
]
export const config: MiddlewareConfig = {
  matcher: [
    '/', 
    '/api/hello-ursa-auth',
    '/protected',
  ]
}

export async function middleware(req: NextRequest) {
  // check cookie
  const sessionCookie = req.cookies.get('authjs.session-token')
  if (sessionCookie) {
    const sessionToken = sessionCookie.value.split(';')[0]
      .replace('authjs.session-token=', '')
    // if sessionToken is set, check it
    const ursaAuthResponse = await fetch(`${ursaAuthUrl}/validate`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
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
  } else {
      if (strictAuthCheckPaths.includes(req.nextUrl.pathname)) {
        return NextResponse.json('Unauthorized', { status: 401 })
      } else {
        return NextResponse.next()
      }
  }
}

