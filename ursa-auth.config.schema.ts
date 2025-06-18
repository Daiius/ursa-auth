import { z } from 'zod'

export const ursaAuthClientConfigSchema = z.object({
  authSecrets: z.array(z.string()),
})

export const ursaAuthServerConfigSchema = z.object({
  host: z.string(),
  providers: z.array(
    z.object({
      name: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
    })
  ),
  allowedRedirectPatterns: z.array(z.string()),
  allowedMobileRedirectPatterns: z.array(z.string()),
})
.merge(ursaAuthClientConfigSchema)

