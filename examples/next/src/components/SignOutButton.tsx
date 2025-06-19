'use client'


const ursaAuthUrl = 'http://localhost:4000'
const ursaAuthSessionName = 'ursa-auth.session'

export const SignOutButton = () => {
  const signOutHandler = async () => {
    document.cookie = `${ursaAuthSessionName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
    window.location.href = `${ursaAuthUrl}/api/auth/signout?callbackUrl=http://localhost:3000`
  }
  return (
    <button
      onClick={signOutHandler}
    >
      Sign out
    </button>
  ) 
}
