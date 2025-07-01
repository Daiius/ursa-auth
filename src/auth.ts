
import type { AuthConfig } from '@auth/core'
import GitHub from '@auth/core/providers/github'
import Twitter from '@auth/core/providers/twitter'
import Google from '@auth/core/providers/google'
import { log } from './log'

import { config } from './config'

export type UrsaAuthUser = {
  provider: string;
  id: string;
  image: string | null;
  name: string | null;
  email: string | null;
}

const notFalsy = <T>(value: T): value is Exclude<T, false | null | undefined> => {
  return Boolean(value)
}

export const authConfig: AuthConfig = {
  basePath: '/api/auth',
  secret: config.authjsSecrets, // Auth.jsでセッション管理しないのでいらない？
  cookies: {
    sessionToken: { name: config.authjsSessionName }
  },
  providers: [
    'github' in config.providers && GitHub({ ...config.providers.github }),
    'twitter' in config.providers && Twitter({ ...config.providers.twitter }),
    'google' in config.providers && Google({ ...config.providers.google }),
  ].filter(notFalsy),
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
      return url;
    },
    async jwt({ token, account }) {
      // name, picture, iat, exp, jti はそのまま返す
      if (!account) throw new Error('cannot get account information in jwt callback')
      token.sub = `${account.provider}:${account.providerAccountId}`
      return token
    },
  },
  // Auth.js v5 では trustHost: true が前提らしい
  // ということは不正なHost値を受け付けない設定が必須
  trustHost: true,
  debug: !!process.env.AUTH_DEBUG,
};


