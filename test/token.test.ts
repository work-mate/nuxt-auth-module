import { describe, it, expect } from 'vitest'
import { createApp, defineEventHandler, toWebHandler } from 'h3'
import { AuthProvider } from '../src/runtime/providers/AuthProvider'

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

describe('AuthProvider token utilities', () => {
  describe('getTokensFromEvent', () => {
    it('reads all 4 cookie names correctly', async () => {
      const handler = makeHandler((event) =>
        AuthProvider.getTokensFromEvent(event, mockConfig),
      )

      const res = await handler(
        makeRequest(
          'auth:token=tok; auth:refreshToken=ref; auth:tokenType=Bearer; auth:provider=local',
        ),
      )
      const data = await res.json()

      expect(data).toEqual({
        accessToken: 'tok',
        refreshToken: 'ref',
        tokenType: 'Bearer',
        provider: 'local',
      })
    })

    it('returns empty strings when cookies are missing', async () => {
      const handler = makeHandler((event) =>
        AuthProvider.getTokensFromEvent(event, mockConfig),
      )

      const res = await handler(makeRequest())
      const data = await res.json()

      expect(data.accessToken).toBe('')
      expect(data.refreshToken).toBe('')
      expect(data.tokenType).toBe('')
      expect(data.provider).toBe('')
    })
  })

  describe('getProviderKeyFromEvent', () => {
    it('returns the provider from the auth:provider cookie', async () => {
      const handler = makeHandler((event) => ({
        provider: AuthProvider.getProviderKeyFromEvent(event, mockConfig),
      }))

      const res = await handler(makeRequest('auth:provider=github'))
      const data = await res.json()

      expect(data.provider).toBe('github')
    })

    it('returns empty string when auth:provider cookie is absent', async () => {
      const handler = makeHandler((event) => ({
        provider: AuthProvider.getProviderKeyFromEvent(event, mockConfig),
      }))

      const res = await handler(makeRequest())
      const data = await res.json()

      expect(data.provider).toBe('')
    })
  })

  describe('setProviderTokensToCookies', () => {
    it('sets all 4 cookies on the response', async () => {
      const tokens = {
        accessToken: 'access123',
        refreshToken: 'refresh456',
        provider: 'local',
        tokenType: 'Bearer',
      }

      const handler = makeHandler((event) => {
        AuthProvider.setProviderTokensToCookies(event, mockConfig, tokens)
        return { ok: true }
      })

      const res = await handler(makeRequest())
      const setCookies = res.headers.getSetCookie()

      expect(setCookies.some((c) => c.includes('auth:token=access123'))).toBe(true)
      expect(setCookies.some((c) => c.includes('auth:refreshToken=refresh456'))).toBe(true)
      expect(setCookies.some((c) => c.includes('auth:provider=local'))).toBe(true)
      expect(setCookies.some((c) => c.includes('auth:tokenType=Bearer'))).toBe(true)
    })

    it('applies the config maxAge as cookie expiry', async () => {
      const tokens = {
        accessToken: 'tok',
        refreshToken: '',
        provider: 'local',
        tokenType: 'Bearer',
      }

      const before = Date.now()

      const handler = makeHandler((event) => {
        AuthProvider.setProviderTokensToCookies(event, mockConfig, tokens)
        return { ok: true }
      })

      const res = await handler(makeRequest())
      const setCookies = res.headers.getSetCookie()
      const tokenCookie = setCookies.find((c) => c.includes('auth:token='))!

      const expiresMatch = tokenCookie.match(/Expires=([^;]+)/i)
      expect(expiresMatch).not.toBeNull()

      const expiresMs = new Date(expiresMatch![1]).getTime()
      const expectedExpiry = before + mockConfig.token.maxAge
      expect(expiresMs).toBeGreaterThanOrEqual(before + mockConfig.token.maxAge - 5000)
      expect(expiresMs).toBeLessThanOrEqual(expectedExpiry + 5000)
    })
  })

  describe('deleteProviderTokensFromCookies', () => {
    it('clears all 4 cookies', async () => {
      const handler = makeHandler((event) => {
        AuthProvider.deleteProviderTokensFromCookies(event, mockConfig)
        return { ok: true }
      })

      const res = await handler(
        makeRequest(
          'auth:token=tok; auth:refreshToken=ref; auth:provider=local; auth:tokenType=Bearer',
        ),
      )
      const setCookies = res.headers.getSetCookie()

      const names = ['auth:token', 'auth:refreshToken', 'auth:provider', 'auth:tokenType']
      for (const name of names) {
        const cookie = setCookies.find((c) => c.startsWith(`${name}=`))
        expect(cookie, `cookie ${name} should be cleared`).toBeDefined()
        const value = cookie!.split(';')[0].split('=')[1]
        expect(value).toBeFalsy()
      }
    })
  })

  describe('getTokenNames', () => {
    it('returns the configured cookie names from the auth client', () => {
      const providers = {}
      const client = new AuthProvider({ providers, config: mockConfig })
      const names = client.getTokenNames()

      expect(names.accessToken).toBe('auth:token')
      expect(names.refreshToken).toBe('auth:refreshToken')
      expect(names.authProvider).toBe('auth:provider')
      expect(names.tokenType).toBe('auth:tokenType')
    })
  })
})
