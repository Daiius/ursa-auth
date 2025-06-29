
import type { AuthConfig } from '@auth/core'
import GitHub from '@auth/core/providers/github'
import { log } from './log'

import { config } from './config'

export const authConfig: AuthConfig = {
  basePath: '/api/auth',
  secret: config.authjsSecrets, // Auth.jsでセッション管理しないのでいらない？
  cookies: {
    sessionToken: { name: config.authjsSessionName }
  },
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
        log('url not allowed (Auth.js redirect callback): ', url)
        return baseUrl
      }
      // 強制https callbackオプションが有効なら置き換え
      if (config.forceHttpsCallback && url.startsWith('http://')) {
        const newUrl = url.replace('http://', 'https://')
        log('forcing https callback: ', url, ' -> ', newUrl)
        return newUrl
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
  debug: process.env.NODE_ENV === 'development' || !!process.env.AUTH_DEBUG,
};


