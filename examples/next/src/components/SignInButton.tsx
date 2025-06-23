// PKCE準備をして、UrsaAuth sign in 画面に遷移するボタン
// sessionStorageにアクセスするのでclient componentにする

'use client'

import { ursaAuthClientSideConfig } from '@/ursa-auth/client-side-config'

import {
  generateCodeVerifier, 
  generateCodeChallenge,
} from '@/lib/pkce'

import { log } from '@/lib/log'


export const SignInButton = () => {
    
  const handleSignin = async () => {
    const { pkceName, hostUrl, authServerUrl } = ursaAuthClientSideConfig;

    const codeVerifier = generateCodeVerifier()
    document.cookie = 
      `${pkceName}=${codeVerifier}; Max-Age=300; SameSite=Lax; Path=/`
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // callbackUrlにursa-authから返されるcodeを受け取るURLを指定し、
    // codeChallengeを追加しておきます
    window.location.href = 
      `${authServerUrl}/api/auth/signin?callbackUrl=${hostUrl}/ursa-auth/signin?codeChallenge=${codeChallenge}`
  }

  return (
    <button
      onClick={handleSignin}
    >
      Sign in
    </button>
  )
}

