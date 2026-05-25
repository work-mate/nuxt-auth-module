import { defineEventHandler, getRequestHeader, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  const auth = getRequestHeader(event, 'authorization')
  if (!auth || (!auth.includes('mock-access-token') && !auth.includes('new-access-token'))) {
    setResponseStatus(event, 401)
    return { message: 'unauthorized' }
  }
  return { user: { id: '1', email: 'test@example.com', name: 'Test User' } }
})
