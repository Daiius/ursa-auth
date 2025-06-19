import { NextResponse } from 'next/server'
import type { NextRequest, MiddlewareConfig } from 'next/server'

import { log } from '@/lib/log'
import { 
  generateCodeVerifier,
  generateCodeChallenge,
} from '@/lib/pkce'

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

  const sessionName = process.env.NEXT_PUBLIC_URSA_AUTH_SESSION_NAME!
  const ursaAuthUrl = process.env.NEXT_PUBLIC_URSA_AUTH_URL!
  const ursaAuthPkceName = process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME!

  const publicHostUrl = process.env.NEXT_PUBLIC_HOST_URL

  // check cookie
  const sessionCookie = req.cookies.get(sessionName)
  if (sessionCookie) {
    // セッション情報がある場合、チェックする
    const jwe = sessionCookie.value.split(';')[0]
      .replace(`${sessionName}=`, '')
    // if sessionToken is set, check it
    const ursaAuthResponse = await fetch(`${ursaAuthUrl}/validate`, {
      headers: { 'Authorization': `Bearer ${jwe}` }
    })
    if (!ursaAuthResponse.ok) {
      log(
        `failed to fetch from ${ursaAuthUrl}/validate,`,
        `${ursaAuthResponse.statusText}, ${ursaAuthResponse.status}`
      )
      // TODO
      // 期限切れか、不正な値か、サーバ側エラーか、
      // 状況に応じて単に401を返すより適切な応答があるはず
      // (リダイレクトするとか)
      if (strictAuthCheckPaths.includes(req.nextUrl.pathname)) {
        // セッション情報が無い場合、ログインページにリダイレクトする
        const codeVerifier = generateCodeVerifier()
        sessionStorage.setItem(ursaAuthPkceName, codeVerifier)
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        // MAKE SURE NOT TO PASS CODE_VERIFIER TO URL!!!
        return NextResponse.redirect(
        `${ursaAuthUrl}/api/auth/signin?callbackUrl=${publicHostUrl}/ursa-auth?codeChallenge=${codeChallenge}`
      )
      } else {
        return NextResponse.next()
      }
    }
  } else {
    if (strictAuthCheckPaths.includes(req.nextUrl.pathname)) {
      // セッション情報が無い場合、ログインページにリダイレクトする
      const codeVerifier = generateCodeVerifier()
      sessionStorage.setItem(ursaAuthPkceName, codeVerifier)
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // MAKE SURE NOT TO PASS CODE_VERIFIER TO URL!!!
      return NextResponse.redirect(
        `${ursaAuthUrl}/api/auth/signin?callbackUrl=${publicHostUrl}/ursa-auth?codeChallenge=${codeChallenge}`
      )
    } else {
      return NextResponse.next()
    }
  }
}

