import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.email_address || !body.password) {
    setResponseStatus(event, 401)
    return { message: 'invalid credentials' }
  }
  return { token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
})
