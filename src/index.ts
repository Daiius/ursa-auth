import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { config } from 'dotenv';
config({ path: '.env.development' });

import { Auth } from '@auth/core'
import { authConfig } from './auth'


const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

const tokenRedirectPatterns = [
  'http://localhost:4000/mobile',
];

const isTokenRedirectLocation = (location: string) =>
tokenRedirectPatterns.some(pattern => location.startsWith(pattern))



app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/mobile', async c => {
  const redirectUrl = (new URL(c.req.url)).searchParams.get('callbackUrl')
  if (!redirectUrl) return c.body('callbackUrl not found.', 400)
  // TODO ホワイトリスト検証!
  return c.redirect(redirectUrl)
})

// authConfigのbasePathと合わせる必要がありそう
app.all('/api/auth/*', async c => {
  const { req } = c
  const url = new URL(req.url)
  console.log(url)
  
  const response = await Auth(req.raw, authConfig)

  // プロバイダを指定してsignIn() を呼ぶ際には
  // skip-csrf-check をオプションに指定しているっぽい
  //const response = await Auth(req.raw, { ...authConfig, skipCSRFCheck })
  
  // リダイレクト先の検証
  const location = response.headers.get('Location');


  // おそらく認証成功後に戻されるタイミングは検出可能なはず...
  if (
    response.status === 302 &&
    isTokenRedirectLocation(location ?? '') &&
    url.pathname.startsWith('/api/auth/callback/')
  ) {
    console.log('Response: %o', response)
    //const token = await getToken({ req: req.raw, secret: process.env.AUTH_SECRET })
    const authjsSessionSignature = 'authjs.session-token='
    const jwe = response.headers.getSetCookie()
      .find(cookie => cookie.startsWith(authjsSessionSignature))
      ?.split(';')[0]
      ?.replace(authjsSessionSignature, '') ?? ''
    console.log(jwe)

    const locationUrl = new URL(response.headers.get('Location')!)
    locationUrl.searchParams.set('token', jwe)
    response.headers.set('Location', locationUrl.toString())
  }

  return response;
})

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

