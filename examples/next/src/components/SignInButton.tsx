// PKCE準備をして、UrsaAuth sign in 画面に遷移するボタン
// sessionStorageにアクセスするのでclient componentにする

'use client'

import {
  generateCodeVerifier, 
  generateCodeChallenge,
} from '@/lib/pkce'

import { log } from '@/lib/log'


export const SignInButton = () => {
    
  const handleSignin = async () => {
    const codeVerifier = generateCodeVerifier()
    sessionStorage.setItem(process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME!, codeVerifier)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // callbackUrlにursa-authから返されるcodeを受け取るURLを指定し、
    // codeChallengeを追加しておきます
    window.location.href = 
      `${process.env.NEXT_PUBLIC_URSA_AUTH_URL}/api/auth/signin?callbackUrl=http://localhost:3000/ursa-auth?codeChallenge=${codeChallenge}`
  }

  return (
    <button
      onClick={handleSignin}
    >
      Sign in
    </button>
  )
}

