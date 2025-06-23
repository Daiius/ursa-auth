
import { z } from 'zod'

const clientSideConfigSchema = z.object({
  authServerUrl: z.string().url(),
  hostUrl: z.string().url(),
  pkceName:z.string().min(1),
})

export const ursaAuthClientSideConfig = clientSideConfigSchema.parse({
  authServerUrl: process.env.NEXT_PUBLIC_URSA_AUTH_URL,
  hostUrl:       process.env.NEXT_PUBLIC_HOST_URL,
  pkceName:      process.env.NEXT_PUBLIC_URSA_AUTH_PKCE_NAME,
})

