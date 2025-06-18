// 今のところedge環境で動かすのはあきらめる
import { ursaAuthServerConfigSchema } from '../ursa-auth.config.schema'

import { readFile } from 'fs/promises'

export const config = ursaAuthServerConfigSchema.parse(
  await readFile(process.env.CONFIG_PATH!)
)

