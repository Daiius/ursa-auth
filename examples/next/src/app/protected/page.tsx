
import { fetchUserInfo } from '@/lib/ursa-auth'

export default async function ProetctedPage() {
  const user = await fetchUserInfo()
  return (
    <div>
      <div>This is a protected page</div>
      <pre>{JSON.stringify(user, undefined, 2)}</pre>
    </div>
  )
}
