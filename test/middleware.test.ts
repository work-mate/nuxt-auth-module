import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, fetch, url } from '@nuxt/test-utils/e2e'

function extractCookies(res: Response): string {
  return res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
}

async function loginAndGetCookies(): Promise<string> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'local',
      email_address: 'test@example.com',
      password: 'password123',
    }),
  })
  return extractCookies(res)
}

describe('route middleware', async () => {
  process.env.TEST_BASE_URL = 'http://localhost:4001'

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth', import.meta.url)),
    server: true,
    port: 4001,
  })

  describe('auth middleware', () => {
    it('unauthenticated request to protected route redirects to login', async () => {
      const res = await globalThis.fetch(url('/protected'), { redirect: 'manual' })

      expect(res.status).toBeGreaterThanOrEqual(300)
      expect(res.status).toBeLessThan(400)
      const location = res.headers.get('location') || ''
      expect(location).toContain('/login')
    })

    it('authenticated request to protected route renders the page', async () => {
      const cookies = await loginAndGetCookies()

      const res = await fetch('/protected', {
        headers: { Cookie: cookies },
      })
      const html = await res.text()

      expect(res.status).toBe(200)
      expect(html).toContain('protected')
    })
  })

  describe('auth-guest middleware', () => {
    it('authenticated request to guest route redirects away', async () => {
      const cookies = await loginAndGetCookies()

      const res = await globalThis.fetch(url('/login'), {
        redirect: 'manual',
        headers: { Cookie: cookies },
      })

      expect(res.status).toBeGreaterThanOrEqual(300)
      expect(res.status).toBeLessThan(400)
      const location = res.headers.get('location') || ''
      expect(location).toMatch(/^\/$|.*\/.*/)
    })

    it('unauthenticated request to guest route renders the page', async () => {
      const res = await fetch('/login')
      const html = await res.text()

      expect(res.status).toBe(200)
      expect(html).toContain('login')
    })
  })

  describe('public route', () => {
    it('unauthenticated request to public route renders normally', async () => {
      const res = await fetch('/')
      const html = await res.text()

      expect(res.status).toBe(200)
      expect(html).toContain('public')
    })
  })
})
