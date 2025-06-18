
// avoid broken vim syntax highlight...
import type { AuthConfig } from '@auth/core'
import GitHub from '@auth/core/providers/github'
import { log } from './log'

import { config } from './config'

export const authConfig: AuthConfig = {
  basePath: '/api/auth',
  secret: config.authSecrets, // Auth.jsでセッション管理しないのでいらない？
  providers: [
    GitHub(config.providers.github!),
  ],
  //pages: {
  //  signIn: '/signin', // 専用のかっこいいログインページをつくれるかも？
  //},
  callbacks: {
    async redirect({ url, baseUrl }) {
      // リダイレクト先urlがリスト内に無ければ拒否
      if (
        !config.allowedRedirectPatterns
        .some(allowedUrl => url.startsWith(allowedUrl))
      ) {
        log(`${url} is not allowed (Auth.js redirect callback)`)
        return baseUrl
      }
      return url;
    },
    async jwt({ token, profile }) {
      // TODO 自作JWT発行
      return token
    },
  },
  // Auth.js v5 では trustHost: true が前提らしい
  // ということは不正なHost値を受け付けない設定が必須
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
};


