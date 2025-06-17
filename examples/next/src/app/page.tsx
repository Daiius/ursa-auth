import Image from "next/image";
import { GithubSignInButton } from '@/components/GithubSignInButton';

import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {session &&
          <>
            <div>{`You've been singed in as: ${session.user?.name ?? 'unknown'}`}</div>
            <pre>{JSON.stringify(session, undefined, 2)}</pre>
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
