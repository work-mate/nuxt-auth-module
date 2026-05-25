import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, fetch } from '@nuxt/test-utils/e2e'

function extractCookies(res: Response): string {
  return res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
}

describe('schema validation', async () => {
  process.env.TEST_BASE_URL = 'http://localhost:4001'

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth', import.meta.url)),
    server: true,
    port: 4001,
  })

  describe('login schema', () => {
    it('valid body passes schema and returns tokens', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'local',
          email_address: 'test@example.com',
          password: 'password123',
        }),
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.tokens).toBeDefined()
    })

    it('invalid email format returns 400 with email_address fieldError', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'local',
          email_address: 'plaintext',
          password: 'password123',
        }),
      })
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.message).toBe('Invalid request body')
      expect(data.data?.email_address).toBeDefined()
      expect(Array.isArray(data.data.email_address)).toBe(true)
      expect(data.data.email_address.length).toBeGreaterThan(0)
    })

    it('password below min length returns 400 with password fieldError', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'local',
          email_address: 'test@example.com',
          password: 'abc',
        }),
      })
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.data?.password).toBeDefined()
      expect(Array.isArray(data.data.password)).toBe(true)
    })

    it('both fields invalid returns 400 with two fieldError keys', async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'local',
          email_address: 'bad',
          password: 'bad',
        }),
      })
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.data?.email_address).toBeDefined()
      expect(data.data?.password).toBeDefined()
    })
  })

  describe('user schema', () => {
    it('valid user response from backend passes schema and returns typed user', async () => {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'local',
          email_address: 'test@example.com',
          password: 'password123',
        }),
      })
      const cookies = loginRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')

      const res = await fetch('/api/auth/user', {
        headers: { Cookie: cookies },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(typeof data.user.id).toBe('string')
      expect(typeof data.user.email).toBe('string')
    })
  })
})
