
// avoid broken vim syntax highlight...
import type { AuthConfig } from '@auth/core'
import GitHub from '@auth/core/providers/github'

import { config } from 'dotenv';
config({ path: '.env.development' });

export const authConfig: AuthConfig = {
  basePath: '/api/auth',
  secret: process.env.AUTH_SECRET!, // Auth.jsでセッション管理しないのでいらない？
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  //pages: {
  //  signIn: '/signin', // 専用のかっこいいログインページをつくれるかも？
  //},
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('redirect to: ', url)
      // TODO check url host safety!!!
      return url;
    },
    async jwt({ token, profile }) {
      // 自作JWT発行
      return token
    },
  },
  // Auth.js v5 では trustHost: true が前提らしい
  // ということは不正なHost値を受け付けない設定が必須
  trustHost: true,
  debug: true,
};


