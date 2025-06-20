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
    //sessionStorage.setItem(process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME!, codeVerifier)
    document.cookie = `ursa-auth.code-verifier=${codeVerifier}; Max-Age=300; SameSite=Lax; Path=/ursa-auth`
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // callbackUrlにursa-authから返されるcodeを受け取るURLを指定し、
    // codeChallengeを追加しておきます
    const ursaAuthUrl = process.env.NEXT_PUBLIC_URSA_AUTH_URL!
    const hostUrl = process.env.NEXT_PUBLIC_HOST_URL!
    window.location.href = 
      `${ursaAuthUrl}/api/auth/signin?callbackUrl=${hostUrl}/ursa-auth?codeChallenge=${codeChallenge}`
  }

  return (
    <button
      onClick={handleSignin}
    >
      Sign in
    </button>
  )
}

