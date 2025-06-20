import { GithubSignInButton } from '@/components/GithubSignInButton'
import { SignInButton } from '@/components/SignInButton'
import { SignOutButton } from '@/components/SignOutButton'

import { fetchUserInfo } from '@/lib/ursa-auth'

import { log } from '@/lib/log'

export default async function Home() {

  const ursaAuthUser = await fetchUserInfo()
  log('ursaAuthUser: %o', ursaAuthUser)

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {ursaAuthUser &&
          <>
            <pre>{JSON.stringify(ursaAuthUser, undefined, 2)}</pre>
            <SignOutButton />
          </>
        }
        <SignInButton />
        <GithubSignInButton />
      </main>
    </div>
  );
}

