import { describe, it, expect } from 'vitest'
import { checkCustomParams } from '../src/lib'

describe('custom url test', () => {

  it('non-encoded url for web with callbackUrl', () => {
    const callbackUrl = 'https://next.localhost/signin?codeChallenge=12345'
    const url = `https://auth.localhost/api/auth/signin?callbackUrl=${callbackUrl}`
    
    const result = checkCustomParams(new URL(url))
    expect(result).toBe(true)
  }),

  it('encoded url for web with callbackUrl', () => {
    const callbackUrl = encodeURIComponent('https://next.localhost/signin?codeChallenge=12345')
    const url = `https://auth.localhost/api/auth/signin?callbackUrl=${callbackUrl}`
    
    const result = checkCustomParams(new URL(url))
    expect(result).toBe(true)
  }),

  it('non-encoded url for mobile with callbackUrl', () => {
    const callbackUrl = 'https://next.localhost/signin?codeChallenge=12345'
    const url = `https://auth.localhost/api/auth/signin?callbackUrl=${callbackUrl}`
    
    const result = checkCustomParams(new URL(url))
    expect(result).toBe(true)
  })
})

