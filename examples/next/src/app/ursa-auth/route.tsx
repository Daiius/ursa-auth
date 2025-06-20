// UrsaAuthからのリダイレクトを受け取る部分


import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/log'

export const GET = async (req: NextRequest) =>  {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    // TODO what should we do if code is undefined?
    return NextResponse.redirect('/?error=AuthenticationError')
  }
  const codeVerifier = req.cookies.get(process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME!)?.value
  if (!codeVerifier) {
    return NextResponse.redirect('/?error=AuthenticationError')
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_URSA_AUTH_URL!}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code_verifier: codeVerifier,
      code: code
    })
  })
  if (!res.ok) {
    log('fetch from /token failed: ', res.statusText, res.status)
  }
  const jwe = await res.text()
  if (!jwe) {
    return NextResponse.redirect('/?error=AuthenticationError')
  }

  const response = NextResponse.redirect('/')
  response.cookies.set(
    process.env.NEXT_PUBLIC_URSA_AUTH_SESSION_NAME!,
    jwe, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      path: '/'
    }
  )
  response.cookies.delete(process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME!)

  return response;
}

