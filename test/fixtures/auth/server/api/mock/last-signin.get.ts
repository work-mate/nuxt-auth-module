import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return { keys: (globalThis as any).__lastSigninBodyKeys ?? [] }
})
