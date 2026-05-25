import { describe, it, expect, beforeAll } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, fetch } from '@nuxt/test-utils/e2e'

const VALID_CREDS = { email_address: 'test@example.com', password: 'password123' }

function extractCookies(res: Response): string {
  return res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
}

async function loginRequest(creds = VALID_CREDS) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'local', ...creds }),
  })
  const cookies = extractCookies(res)
  const data = await res.json()
  return { res, cookies, data }
}

describe('local auth API routes', async () => {
  process.env.TEST_BASE_URL = 'http://localhost:4001'

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth', import.meta.url)),
    server: true,
    port: 4001,
  })

  it('valid login returns 200 and sets auth cookies', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'local', ...VALID_CREDS }),
    })
    const data = await res.json()
    const setCookies = res.headers.getSetCookie()

    expect(res.status).toBe(200)
    expect(data.tokens).toBeDefined()
    expect(data.tokens.accessToken).toBe('mock-access-token')
    expect(setCookies.some((c) => c.startsWith('auth:token='))).toBe(true)
    expect(setCookies.some((c) => c.startsWith('auth:refreshToken='))).toBe(true)
    expect(setCookies.some((c) => c.startsWith('auth:provider='))).toBe(true)
    expect(setCookies.some((c) => c.startsWith('auth:tokenType='))).toBe(true)
  })

  it('missing provider returns 400', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.message).toBe('provider is required')
    expect(data.data?.provider).toBeDefined()
  })

  it('unknown provider throws an error', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'unknown' }),
    })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('extra fields in login body are forwarded to the backend', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'local', ...VALID_CREDS, extra: 'field' }),
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tokens).toBeDefined()
  })

  it('schema-invalid email returns 400 with field errors', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'local', email_address: 'not-an-email', password: 'password123' }),
    })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.data?.email_address).toBeDefined()
    expect(Array.isArray(data.data.email_address)).toBe(true)
  })

  it('schema-invalid password (too short) returns 400 with field errors', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'local', email_address: 'test@example.com', password: 'short' }),
    })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.data?.password).toBeDefined()
    expect(Array.isArray(data.data.password)).toBe(true)
  })

  it('missing required field returns 400 with field errors', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'local', email_address: 'test@example.com' }),
    })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.data).toBeDefined()
  })

  it('logout clears auth cookies', async () => {
    const { cookies } = await loginRequest()

    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookies },
    })
    const setCookies = res.headers.getSetCookie()

    expect(res.status).toBe(200)
    const tokenCookie = setCookies.find((c) => c.startsWith('auth:token='))
    expect(tokenCookie).toBeDefined()
    expect(tokenCookie).toMatch(/auth:token=;|auth:token=\s*;|Max-Age=0/)
  })

  it('GET /api/auth/user with valid cookie returns user', async () => {
    const { cookies } = await loginRequest()

    const res = await fetch('/api/auth/user', {
      headers: { Cookie: cookies },
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe('1')
    expect(data.user.email).toBe('test@example.com')
  })

  it('GET /api/auth/user without cookie returns null user', async () => {
    const res = await fetch('/api/auth/user')
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.user).toBeNull()
  })

  it('POST /api/auth/refresh with valid token returns new tokens', async () => {
    const { cookies } = await loginRequest()

    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { Cookie: cookies },
    })
    const data = await res.json()
    const setCookies = res.headers.getSetCookie()

    expect(res.status).toBe(200)
    expect(data.tokens).toBeDefined()
    expect(data.tokens.accessToken).toBe('new-access-token')
    expect(setCookies.some((c) => c.startsWith('auth:token='))).toBe(true)
  })

  it('POST /api/auth/refresh without provider cookie is rejected', async () => {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
    })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
