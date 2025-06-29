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
  }).strict(),
  cors: z.object({
    // 設定しない場合はallowedRedirectPatternsが用いられます
    origins: z.array(z.string()).optional()
  }).optional(),
  allowedRedirectPatterns: z.array(z.string()),
  allowedMobileRedirectPatterns: z.array(z.string()),
  // 本番環境でcallbackUrlにhttpsを指定しても強制的にhttpに書き換えられ、
  // AUTH_URL指定も無視される場合があるので、書き換えオプションを設定します
  forceHttpsCallback: z.boolean().optional(),
})

