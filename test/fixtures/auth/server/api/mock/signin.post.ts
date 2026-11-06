import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  ;(globalThis as any).__lastSigninBodyKeys = Object.keys(body).sort()
  if (!body.email_address || body.password !== 'password123') {
    setResponseStatus(event, 401)
    return { message: 'invalid credentials' }
  }
  return { token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
})
