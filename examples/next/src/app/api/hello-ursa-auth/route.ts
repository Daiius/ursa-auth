import { cookies } from 'next/headers'

export const GET = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  return await fetch(
    'http://ursa-auth-test-api:5000/hello-ursa-auth', {
      headers: {
        Authorization: `bearer ${token}`
      }
    }
  );
}

