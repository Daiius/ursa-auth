
import { log } from './log'
import { randomBytes, createHash } from 'crypto'

type CodeEntry = {
  jwe: string;
  expiresAt: number;
  codeChallenge: string;
}
export const codeStore = new Map<string, CodeEntry>()
const CODE_TTL = 5 * 60 * 1000 // 5分

// PKCE用コード生成
export const generateCode = (jwe: string, codeChallenge: string): string => {
  const code = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + CODE_TTL
  codeStore.set(code, { jwe, expiresAt, codeChallenge })
  setTimeout(() => codeStore.delete(code), CODE_TTL)
  return code
}

// PKCE用コード消費
export const consumeCode = (code: string, codeVerifier: string): string | null => {
  const entry = codeStore.get(code)
  if (!entry || Date.now() > entry.expiresAt) {
    log('accessed expired code, deleting...: ', code)
    codeStore.delete(code)
    return null
  }
  // PKCE検証
  const hash = createHash('sha256').update(codeVerifier).digest()
  const expected = hash.toString('base64')
    .replace(/=/g,'').replace(/\+/g, '-').replace(/\//g, '_')
  if (expected !== entry.codeChallenge) {
    log('pkce verification failed, deleting: ', code)
    codeStore.delete(code)
    return null
  }
  // successful
  codeStore.delete(code)
  return entry.jwe
}
