import { NextResponse } from 'next/server'
import type { NextRequest, MiddlewareConfig } from 'next/server'

import { log } from '@/lib/log'

import { ursaAuthServerSideConfig } from '@/ursa-auth/server-side-config'

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

  const { 
    sessionName, 
    authServerUrl,
    hostUrl, 
  } = ursaAuthServerSideConfig;

  // check cookie
  const sessionCookie = req.cookies.get(sessionName)
  if (sessionCookie) {
    // セッション情報がある場合、チェックする
    const jwe = sessionCookie.value.split(';')[0]
      .replace(`${sessionName}=`, '')
    // if sessionToken is set, check it
    const validationUrl = `${authServerUrl}/validate`
    log('validation url: ', validationUrl)
    try {
      const ursaAuthResponse = await fetch(validationUrl, {
        headers: { 'Authorization': `Bearer ${jwe}` }
      })
      if (!ursaAuthResponse.ok) {
        log(
          `failed to fetch from ${authServerUrl}/validate,`,
          `${ursaAuthResponse.statusText}, ${ursaAuthResponse.status}`
        )
        // TODO
        // 期限切れか、不正な値か、サーバ側エラーか、
        // 状況に応じて単に401を返すより適切な応答があるはず
        // (リダイレクトするとか)
        if (strictAuthCheckPaths.includes(req.nextUrl.pathname)) {
          return NextResponse.redirect(`${hostUrl}`)
        } else {
          return NextResponse.next()
        }
      }
    } catch (err) {
      log('fetch failed error: %o', err)
      return NextResponse.next()
    }
  } else {
    if (strictAuthCheckPaths.includes(req.nextUrl.pathname)) {
      return NextResponse.redirect(`${hostUrl}`)
    } else {
      return NextResponse.next()
    }
  }
}

