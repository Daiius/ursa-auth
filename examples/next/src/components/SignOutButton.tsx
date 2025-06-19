'use client'

export const SignOutButton = () => {
  const signOutHandler = async () => {
    // サインアウト時にセッション情報が記録されたcookieを削除します
    // 有効期限切れの値をセットするのが常套手段らしいです
    document.cookie = 
      `${process.env.NEXT_PUBLIC_URSA_AUTH_SESSION_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
    // サインアウト後に遷移したいページをcallbackUrlで指定します
    window.location.href = 
      `${process.env.NEXT_PUBLIC_URSA_AUTH_URL}/api/auth/signout?callbackUrl=http://localhost:3000`
  }
  return (
    <button
      onClick={signOutHandler}
    >
      Sign out
    </button>
  ) 
}

