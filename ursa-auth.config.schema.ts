import { z } from 'zod'

export const ursaAuthServerConfigSchema = z.object({
  host: z.string(),
  authSecrets: z.array(z.string()),
  providers: z.object({
    github: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
      }).optional(),
  }).strict(),
  allowedRedirectPatterns: z.array(z.string()),
  allowedMobileRedirectPatterns: z.array(z.string()),
})

