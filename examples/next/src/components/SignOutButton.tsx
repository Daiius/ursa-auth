'use client'

import { ursaAuthClientSideConfig } from '@/ursa-auth/client-side-config'

export const SignOutButton = () => {

  const { authServerUrl, hostUrl } = ursaAuthClientSideConfig;
  
  const signOutHandler = async () => {
    // サインアウト後に遷移したいページをcallbackUrlで指定します
    window.location.href = 
      `${authServerUrl}/api/auth/signout?callbackUrl=${hostUrl}/ursa-auth/signout`
  }
  return (
    <button
      onClick={signOutHandler}
    >
      Sign out
    </button>
  ) 
}

