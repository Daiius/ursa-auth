import { ursaAuthServerConfigSchema } from '../ursa-auth.config.schema'

// 今のところedge環境で動かすのはあきらめる
import { readFile } from 'fs/promises'

import { log } from './log'

log('CONFIG_PATH: ', process.env.CONFIG_PATH)
const configContent = JSON.parse(
  (await readFile(process.env.CONFIG_PATH!)).toString()
)
export const config = ursaAuthServerConfigSchema.parse(configContent)

