// PKCE準備をして、UrsaAuth sign in 画面に遷移するボタン
// sessionStorageにアクセスするのでclient componentにする

'use client'

import {
  generateCodeVerifier, 
  generateCodeChallenge,
} from '@/lib/pkce'

import { log } from '@/lib/log'

const ursaAuthPkceName = 'ursa-auth.pkce'
// クライアントコンポーネントに伝搬する環境変数は限られる
//const ursaAuthUrl = process.env.URSA_AUTH_URL!
const ursaAuthUrl = 'http://localhost:4000'

export const SignInButton = () => {
    
  log('ursaAuthUrl: ', ursaAuthUrl)

  const handleSignin = async () => {
    const codeVerifier = generateCodeVerifier()
    sessionStorage.setItem(ursaAuthPkceName, codeVerifier)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    window.location.href = 
      `${ursaAuthUrl}/api/auth/signin?callbackUrl=http://localhost:3000/ursa-auth?codeChallenge=${codeChallenge}`
  }

  return (
    <button
      onClick={handleSignin}
    >
      Sign in
    </button>
  )
}

