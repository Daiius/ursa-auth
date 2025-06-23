import 'server-only'

import { z } from 'zod'

import { ursaAuthClientSideConfig } from '@/ursa-auth/client-side-config'

const serverSideConfigSchema = z.object({
  sessionName: z.string().min(1),
})

export const ursaAuthServerSideConfig = {
  ...serverSideConfigSchema.parse({
    sessionName: process.env.URSA_AUTH_SESSION_NAME,
  }),
  ...ursaAuthClientSideConfig,
}

