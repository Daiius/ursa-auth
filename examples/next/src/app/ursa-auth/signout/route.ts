// UrsaAuthからのsign out後リダイレクトを受け取る

import { NextResponse } from 'next/server'
import { log } from '@/lib/log'

import { ursaAuthServerSideConfig } from '@/ursa-auth/server-side-config'

export const GET = async () => {
  log('signing out...')
  const { hostUrl, sessionName } = ursaAuthServerSideConfig
  const response = NextResponse.redirect(`${hostUrl}`)
  response.cookies.set(
    sessionName,
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

