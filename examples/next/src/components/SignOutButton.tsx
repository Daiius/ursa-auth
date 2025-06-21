'use client'

export const SignOutButton = () => {
  const signOutHandler = async () => {
    // サインアウト後に遷移したいページをcallbackUrlで指定します
    const ursaAuthUrl = process.env.NEXT_PUBLIC_URSA_AUTH_URL!
    const hostUrl = process.env.NEXT_PUBLIC_HOST_URL!
    window.location.href = 
      `${ursaAuthUrl}/api/auth/signout?callbackUrl=${hostUrl}/ursa-auth/signout`
  }
  return (
    <button
      onClick={signOutHandler}
    >
      Sign out
    </button>
  ) 
}

