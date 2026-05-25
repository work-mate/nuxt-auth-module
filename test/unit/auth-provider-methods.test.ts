import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineEventHandler, toWebHandler } from 'h3'
import { AuthProvider } from '../../src/runtime/providers/AuthProvider'
import type { AuthProviderInterface } from '../../src/runtime/models'

const mockConfig = {
  token: {
    type: 'Bearer',
    maxAge: 3600000,
    cookiesNames: {
      accessToken: 'auth:token',
      refreshToken: 'auth:refreshToken',
      authProvider: 'auth:provider',
      tokenType: 'auth:tokenType',
    },
  },
} as any

function makeHandler(fn: (event: any) => any) {
  const app = createApp()
  app.use('/', defineEventHandler(fn))
  return toWebHandler(app)
}

function makeRequest(cookieHeader = '') {
  return new Request('http://localhost/', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  })
}

const AUTH_COOKIES =
  'auth:token=mock-token; auth:refreshToken=mock-refresh; auth:tokenType=Bearer; auth:provider=local'

function makeAuthCookies(override: Partial<Record<'token' | 'refresh' | 'type' | 'provider', string>> = {}) {
  return [
    `auth:token=${override.token ?? 'mock-token'}`,
    `auth:refreshToken=${override.refresh ?? 'mock-refresh'}`,
    `auth:tokenType=${override.type ?? 'Bearer'}`,
    `auth:provider=${override.provider ?? 'local'}`,
  ].join('; ')
}

// ─── provider() ──────────────────────────────────────────────────────────────

describe('AuthProvider.provider()', () => {
  it('returns the correct provider by key', () => {
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn(),
      validateRequestBody: vi.fn(),
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    expect(client.provider('local')).toBe(mockP)
  })

  it('throws when the provider key is not registered', () => {
    const client = new AuthProvider({ providers: {}, config: mockConfig })
    expect(() => client.provider('github')).toThrowError(/Cannot find provider/)
  })

  it('throws with the provider key name in the error message', () => {
    const client = new AuthProvider({ providers: {}, config: mockConfig })
    expect(() => client.provider('unknown-key')).toThrowError('unknown-key')
  })
})

// ─── getUserFromEvent() ───────────────────────────────────────────────────────

describe('AuthProvider.getUserFromEvent()', () => {
  it('returns null user when no provider cookie is set', async () => {
    const client = new AuthProvider({ providers: {}, config: mockConfig })
    const handler = makeHandler((event) => client.getUserFromEvent(event))
    const res = await handler(makeRequest())
    const data = await res.json()
    expect(data.user).toBeNull()
  })

  it('calls fetchUserData with tokens read from cookies', async () => {
    const fetchUserData = vi.fn().mockResolvedValue({ user: { id: '1', email: 'a@b.com' } })
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn(),
      validateRequestBody: vi.fn(),
      fetchUserData,
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.getUserFromEvent(event))

    await handler(makeRequest(AUTH_COOKIES))

    expect(fetchUserData).toHaveBeenCalledOnce()
    const [calledTokens] = fetchUserData.mock.calls[0]
    expect(calledTokens.accessToken).toBe('mock-token')
    expect(calledTokens.provider).toBe('local')
  })

  it('returns the user returned by fetchUserData', async () => {
    const mockUser = { id: '42', email: 'test@example.com' }
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn(),
      validateRequestBody: vi.fn(),
      fetchUserData: vi.fn().mockResolvedValue({ user: mockUser }),
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.getUserFromEvent(event))

    const res = await handler(makeRequest(AUTH_COOKIES))
    const data = await res.json()

    expect(data.user).toEqual(mockUser)
  })

  it('returns null user when provider has no fetchUserData method', async () => {
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn(),
      validateRequestBody: vi.fn(),
      // fetchUserData intentionally absent
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.getUserFromEvent(event))

    const res = await handler(makeRequest(AUTH_COOKIES))
    const data = await res.json()

    expect(data.user).toBeNull()
  })
})

// ─── logoutFromEvent() ────────────────────────────────────────────────────────

describe('AuthProvider.logoutFromEvent()', () => {
  it('calls provider.logout() with the tokens from cookies', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout,
      validateRequestBody: vi.fn(),
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.logoutFromEvent(event))

    await handler(makeRequest(AUTH_COOKIES))

    expect(logout).toHaveBeenCalledOnce()
    const [calledTokens] = logout.mock.calls[0]
    expect(calledTokens.accessToken).toBe('mock-token')
    expect(calledTokens.provider).toBe('local')
  })

  it('returns { message: "Logout successful" } on success', async () => {
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      validateRequestBody: vi.fn(),
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.logoutFromEvent(event))

    const res = await handler(makeRequest(AUTH_COOKIES))
    const data = await res.json()

    expect(data.message).toBe('Logout successful')
    expect(data.remote_error).toBeUndefined()
  })

  it('clears all 4 auth cookies on successful logout', async () => {
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      validateRequestBody: vi.fn(),
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.logoutFromEvent(event))

    const res = await handler(makeRequest(AUTH_COOKIES))
    const setCookies = res.headers.getSetCookie()
    const names = ['auth:token', 'auth:refreshToken', 'auth:provider', 'auth:tokenType']

    for (const name of names) {
      const cookie = setCookies.find((c) => c.startsWith(`${name}=`))
      expect(cookie, `${name} should be cleared`).toBeDefined()
      const value = cookie!.split(';')[0].split('=')[1]
      expect(value).toBeFalsy()
    }
  })

  it('clears cookies even when provider.logout() throws', async () => {
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn().mockRejectedValue(new Error('remote logout failed')),
      validateRequestBody: vi.fn(),
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.logoutFromEvent(event))

    const res = await handler(makeRequest(AUTH_COOKIES))
    const data = await res.json()
    const setCookies = res.headers.getSetCookie()

    // Should still clear cookies despite remote error
    expect(setCookies.length).toBeGreaterThan(0)
    // Should expose the remote error
    expect(data.remote_error).toBeDefined()
  })

  it('skips provider.logout() when no provider cookie is set', async () => {
    const logout = vi.fn()
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout,
      validateRequestBody: vi.fn(),
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.logoutFromEvent(event))

    await handler(makeRequest()) // no cookies

    expect(logout).not.toHaveBeenCalled()
  })
})

// ─── refreshTokensFromEvent() ─────────────────────────────────────────────────

describe('AuthProvider.refreshTokensFromEvent()', () => {
  it('calls provider.refreshTokens() with tokens from cookies', async () => {
    const newTokens = { accessToken: 'new-token', refreshToken: 'new-refresh', provider: 'local', tokenType: 'Bearer' }
    const refreshTokens = vi.fn().mockResolvedValue({ tokens: newTokens })
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn(),
      validateRequestBody: vi.fn(),
      refreshTokens,
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler((event) => client.refreshTokensFromEvent(event))

    const res = await handler(makeRequest(AUTH_COOKIES))
    const data = await res.json()

    expect(refreshTokens).toHaveBeenCalledOnce()
    expect(data.tokens.accessToken).toBe('new-token')
  })

  it('rejects when no provider cookie is present', async () => {
    const client = new AuthProvider({ providers: {}, config: mockConfig })
    const handler = makeHandler(async (event) => {
      try {
        await client.refreshTokensFromEvent(event)
        return { error: null }
      } catch (e) {
        return { error: String(e) }
      }
    })

    const res = await handler(makeRequest())
    const data = await res.json()

    expect(data.error).toBeTruthy()
    expect(data.error).toContain('provider is required')
  })

  it('rejects when provider has no refreshTokens method', async () => {
    const mockP: AuthProviderInterface = {
      login: vi.fn(),
      logout: vi.fn(),
      validateRequestBody: vi.fn(),
      // refreshTokens intentionally absent
    }
    const client = new AuthProvider({ providers: { local: mockP }, config: mockConfig })
    const handler = makeHandler(async (event) => {
      try {
        await client.refreshTokensFromEvent(event)
        return { error: null }
      } catch (e) {
        return { error: String(e) }
      }
    })

    const res = await handler(makeRequest(AUTH_COOKIES))
    const data = await res.json()

    expect(data.error).toBeTruthy()
  })
})
