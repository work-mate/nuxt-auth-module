import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.refresh_token || body.refresh_token !== 'mock-refresh-token') {
    setResponseStatus(event, 401)
    return { message: 'invalid refresh token' }
  }
  return { token: 'new-access-token', refresh_token: 'new-refresh-token' }
})
