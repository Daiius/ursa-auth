// UrsaAuthからのsign in後リダイレクトを受け取る

import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/log'

export const GET = async (req: NextRequest) =>  {

  const hostUrl = process.env.HOST_URL!;

  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    // TODO what should we do if code is undefined?
    log('code not found')
    return NextResponse.redirect(`${hostUrl}/?error=AuthenticationError`)
  }
  const codeVerifier = req.cookies.get(process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME!)?.value
  if (!codeVerifier) {
    log('code_verifier not found')
    return NextResponse.redirect(`${hostUrl}/?error=AuthenticationError`)
  }
  const res = await fetch(`${process.env.URSA_AUTH_URL!}/token`, {
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
    return NextResponse.redirect(`${hostUrl}/?error=AuthenticationError`)
  }

  const response = NextResponse.redirect(`${hostUrl}`)
  response.cookies.set(
    process.env.URSA_AUTH_SESSION_NAME!,
    jwe, { 
      // prohibit read from client side code
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/',
      sameSite: 'lax', 
      maxAge: 60 * 60 * 34 * 30,
    }
  )
  response.cookies.delete(process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME!)

  return response;
}

