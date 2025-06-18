import { GithubSignInButton } from '@/components/GithubSignInButton'
import { headers } from 'next/headers'

export default async function Home() {
  let ursaAuthUser: any = null; 
  try {
    ursaAuthUser = JSON.parse(
      (await headers()).get('x-ursa-auth-user') ?? ''
    )
  } catch (err) {
    console.error(err)
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {ursaAuthUser &&
          <>
            <pre>{JSON.stringify(ursaAuthUser, undefined, 2)}</pre>
            <a href='http://localhost:4000/api/auth/signout?callbackUrl=http://localhost:3000'>
              Sign out
            </a>
          </>
        }
        <a href='http://localhost:4000/api/auth/signin?callbackUrl=http://localhost:3000'>
          Test UrsaAuth Github Authentication
        </a>
        <GithubSignInButton />
      </main>
    </div>
  );
}

