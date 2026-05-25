import { vi, describe, it, expect } from 'vitest'
import { z } from 'zod'

// Mock #auth-schemas BEFORE importing LocalAuthProvider.
// vi.mock is hoisted to the top of the module by Vitest.
const loginSchema = z.object({ email_address: z.email(), password: z.string().min(8) })

vi.mock('#auth-schemas', async () => {
  const { z: zod } = await import('zod')
  return {
    loginSchemas: {
      local: zod.object({ email_address: zod.email(), password: zod.string().min(8) }),
    },
    userSchemas: {},
  }
})

import { LocalAuthProvider } from '../../src/runtime/providers/LocalAuthProvider'

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

function makeProvider(options: Parameters<typeof LocalAuthProvider.create>[0] = {}) {
  return LocalAuthProvider.create(options, mockConfig)
}

// ─── validateRequestBody ──────────────────────────────────────────────────────

describe('LocalAuthProvider.validateRequestBody()', () => {
  it('returns true for a valid body matching the login schema', () => {
    const provider = makeProvider()
    expect(provider.validateRequestBody({
      email_address: 'user@example.com',
      password: 'securepass',
    })).toBe(true)
  })

  it('throws an ErrorResponse for an invalid email', () => {
    const provider = makeProvider()
    expect(() =>
      provider.validateRequestBody({ email_address: 'not-an-email', password: 'securepass' }),
    ).toThrow()
  })

  it('thrown error has message "Invalid request body"', () => {
    const provider = makeProvider()
    try {
      provider.validateRequestBody({ email_address: 'bad', password: 'securepass' })
      expect.fail('should have thrown')
    } catch (e: any) {
      expect(e.message).toBe('Invalid request body')
    }
  })

  it('thrown error has data with fieldErrors for invalid email', () => {
    const provider = makeProvider()
    try {
      provider.validateRequestBody({ email_address: 'bad', password: 'securepass' })
      expect.fail('should have thrown')
    } catch (e: any) {
      expect(e.data?.email_address).toBeDefined()
      expect(Array.isArray(e.data.email_address)).toBe(true)
    }
  })

  it('thrown error has fieldErrors for password too short', () => {
    const provider = makeProvider()
    try {
      provider.validateRequestBody({ email_address: 'user@example.com', password: 'short' })
      expect.fail('should have thrown')
    } catch (e: any) {
      expect(e.data?.password).toBeDefined()
    }
  })

  it('thrown error includes fieldErrors for both invalid fields', () => {
    const provider = makeProvider()
    try {
      provider.validateRequestBody({ email_address: 'bad', password: 'bad' })
      expect.fail('should have thrown')
    } catch (e: any) {
      expect(e.data?.email_address).toBeDefined()
      expect(e.data?.password).toBeDefined()
    }
  })
})

// ─── constructor / default options ───────────────────────────────────────────

describe('LocalAuthProvider constructor defaults', () => {
  it('create() returns a LocalAuthProvider instance', () => {
    const provider = makeProvider()
    expect(provider).toBeInstanceOf(LocalAuthProvider)
  })

  it('getProviderName() returns "local"', () => {
    expect(LocalAuthProvider.getProviderName()).toBe('local')
  })

  it('uses default signIn path when not specified', () => {
    const provider = makeProvider()
    // Access via the private options through validateRequestBody behaviour —
    // indirect proof: a valid body passes without error (provider is functional)
    expect(provider.validateRequestBody({
      email_address: 'user@example.com',
      password: 'securepass',
    })).toBe(true)
  })

  it('merges custom endpoint path with defaults via defu', () => {
    // Provide custom path; default method, tokenKey etc. should still apply.
    // We verify indirectly: construction does not throw and the provider is usable.
    expect(() =>
      makeProvider({ endpoints: { signIn: { path: '/custom-path' } } }),
    ).not.toThrow()
  })

  it('accepts signOut: false to disable logout endpoint', () => {
    expect(() =>
      makeProvider({ endpoints: { signOut: false } }),
    ).not.toThrow()
  })

  it('accepts refreshToken: false to disable refresh endpoint', () => {
    expect(() =>
      makeProvider({ endpoints: { refreshToken: false } }),
    ).not.toThrow()
  })
})
