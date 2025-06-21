// UrsaAuthからのsign out後リダイレクトを受け取る

import { NextResponse } from 'next/server'
import { log } from '@/lib/log'

export const GET = async () => {
  log('signing out...')
  const hostUrl = process.env.HOST_URL!
  const response = NextResponse.redirect(`${hostUrl}`)
  response.cookies.set(
    process.env.URSA_AUTH_SESSION_NAME!,
    '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: true,
      maxAge: 0,
    }
  )
  return response
}

