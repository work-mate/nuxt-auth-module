import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, fetch } from '@nuxt/test-utils/e2e'

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

describe('composables', async () => {
  process.env.TEST_BASE_URL = 'http://localhost:4001'

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth', import.meta.url)),
    server: true,
    port: 4001,
  })

  describe('useAuthUser', () => {
    it('isLoggedIn is false before login (no auth cookie)', async () => {
      const res = await fetch('/status')
      const html = await res.text()

      expect(res.status).toBe(200)
      expect(html).toContain('data-testid="logged-in">false<')
    })

    it('isLoggedIn is true after login (with auth cookies)', async () => {
      const cookies = await loginAndGetCookies()

      const res = await fetch('/status', {
        headers: { Cookie: cookies },
      })
      const html = await res.text()

      expect(res.status).toBe(200)
      expect(html).toContain('data-testid="logged-in">true<')
    })

    it('user matches the API response after login', async () => {
      const cookies = await loginAndGetCookies()

      const res = await fetch('/status', {
        headers: { Cookie: cookies },
      })
      const html = await res.text()

      expect(html).toContain('data-testid="user-id">1<')
      expect(html).toContain('data-testid="user-email">test@example.com<')
    })

    it('isLoggedIn is false without auth cookies', async () => {
      const res = await fetch('/status')
      const html = await res.text()

      expect(html).toContain('data-testid="logged-in">false<')
      expect(html).toContain('data-testid="user-id"><')
    })
  })
})
