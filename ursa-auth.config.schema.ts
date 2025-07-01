import { z } from 'zod'

export const ursaAuthServerConfigSchema = z.object({
  host: z.string(),
  authjsSecrets: z.array(z.string()),
  authjsSessionName: z.string(), // NOTE this value is used as JWE encode/decode salt
  providers: z.object({
    github: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
      }).optional(),
    twitter: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
      }).optional(),
    google: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
      }),
  }).strict(),
  cors: z.object({
    // 設定しない場合はallowedRedirectPatternsが用いられます
    origins: z.array(z.string()).optional()
  }).optional(),
  allowedRedirectPatterns: z.array(z.string()),
  allowedMobileRedirectPatterns: z.array(z.string()),
})

