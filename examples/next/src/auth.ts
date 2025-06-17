import NextAuth from 'next-auth';

import { config } from '../.ursa-auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [],
  secret: config.authSecrets,
});

