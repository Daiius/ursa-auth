// UrsaAuthからのsign in後リダイレクトを受け取る

import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/log'

import { ursaAuthServerSideConfig } from '@/ursa-auth/server-side-config';

export const GET = async (req: NextRequest) =>  {

  const { 
    hostUrl,
    pkceName,
    authServerUrl, 
    sessionName,
  } = ursaAuthServerSideConfig

  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    // TODO what should we do if code is undefined?
    log('code not found')
    return NextResponse.redirect(`${hostUrl}/?error=AuthenticationError`)
  }
  const codeVerifier = req.cookies.get(pkceName)?.value
  if (!codeVerifier) {
    log('code_verifier not found')
    return NextResponse.redirect(`${hostUrl}/?error=AuthenticationError`)
  }
  const res = await fetch(`${authServerUrl}/token`, {
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
    sessionName,
    jwe, { 
      // prohibit read from client side code
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/',
      sameSite: 'lax', 
      maxAge: 60 * 60 * 34 * 30,
    }
  )
  response.cookies.delete(pkceName)

  return response;
}

