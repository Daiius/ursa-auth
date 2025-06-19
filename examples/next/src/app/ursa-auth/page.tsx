// UrsaAuthからのリダイレクトを受け取る部分
// sessionStorageの関連するコードを扱うので client componentとする

'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { log } from '@/lib/log'

const ursaAuthPkceName = 'ursa-auth.pkce'
const ursaAuthSessionName = 'ursa-auth.session'
const ursaAuthUrl = 'http://localhost:4000'

export const UrsaAuthPage = () => {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const code = params.get('code')
    const codeVerifier = sessionStorage.getItem(ursaAuthPkceName)
    fetch(`${ursaAuthUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code_verifier: codeVerifier,
        code: code
      })
    })
    .then(res => {
      if (!res.ok) {
        log('fetch from /token failed: ', res.statusText, res.status)
        return undefined
      }
      return res.text()
    })
    .then(jwe => {
      if (jwe) {
        document.cookie = 
          `${ursaAuthSessionName}=${jwe}; path=/; secure; samesite=lax`
        sessionStorage.removeItem(ursaAuthPkceName)
      }
      router.replace('/')
    })
  }, [params, router])

  return (
    <div>Siging in......</div>
  )
}

export default UrsaAuthPage

