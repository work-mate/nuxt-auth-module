import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { authSchemas, defineAuthSchemas } from '../../src/runtime/auth-schemas'

// Use unique provider prefixes per test to avoid module-level map pollution.
let _counter = 0
const uid = () => `unit-${++_counter}`

describe('authSchemas store', () => {
  it('returns undefined for a key that has never been set', () => {
    expect(authSchemas.get('never-set', 'login')).toBeUndefined()
  })

  it('stores and retrieves a schema by provider + key', () => {
    const p = uid()
    const schema = z.object({ name: z.string() })
    authSchemas.set(p, 'login', schema)
    expect(authSchemas.get(p, 'login')).toBe(schema)
  })

  it('stores schemas for different providers independently', () => {
    const p1 = uid()
    const p2 = uid()
    const s1 = z.object({ a: z.string() })
    const s2 = z.object({ b: z.number() })
    authSchemas.set(p1, 'login', s1)
    authSchemas.set(p2, 'login', s2)
    expect(authSchemas.get(p1, 'login')).toBe(s1)
    expect(authSchemas.get(p2, 'login')).toBe(s2)
  })

  it('stores login and user schemas for the same provider independently', () => {
    const p = uid()
    const loginSchema = z.object({ email: z.string() })
    const userSchema = z.object({ id: z.string() })
    authSchemas.set(p, 'login', loginSchema)
    authSchemas.set(p, 'user', userSchema)
    expect(authSchemas.get(p, 'login')).toBe(loginSchema)
    expect(authSchemas.get(p, 'user')).toBe(userSchema)
  })

  it('overwrites an existing schema when set again', () => {
    const p = uid()
    const original = z.object({ x: z.string() })
    const replacement = z.object({ y: z.number() })
    authSchemas.set(p, 'login', original)
    authSchemas.set(p, 'login', replacement)
    expect(authSchemas.get(p, 'login')).toBe(replacement)
  })

  it('returns undefined for an unknown key on a known provider', () => {
    const p = uid()
    authSchemas.set(p, 'login', z.object({ x: z.string() }))
    expect(authSchemas.get(p, 'user')).toBeUndefined()
  })
})

describe('defineAuthSchemas', () => {
  it('populates authSchemas from a nested record', () => {
    const p = uid()
    const loginSchema = z.object({ email: z.email() })
    const userSchema = z.object({ id: z.string() })

    defineAuthSchemas({ [p]: { login: loginSchema, user: userSchema } })

    expect(authSchemas.get(p, 'login')).toBe(loginSchema)
    expect(authSchemas.get(p, 'user')).toBe(userSchema)
  })

  it('handles multiple providers in one call', () => {
    const p1 = uid()
    const p2 = uid()
    const s1 = z.object({ a: z.string() })
    const s2 = z.object({ b: z.string() })

    defineAuthSchemas({ [p1]: { login: s1 }, [p2]: { login: s2 } })

    expect(authSchemas.get(p1, 'login')).toBe(s1)
    expect(authSchemas.get(p2, 'login')).toBe(s2)
  })

  it('overwrites an existing schema for a provider/key pair', () => {
    const p = uid()
    const first = z.object({ v: z.string() })
    const second = z.object({ v: z.number() })

    defineAuthSchemas({ [p]: { login: first } })
    defineAuthSchemas({ [p]: { login: second } })

    expect(authSchemas.get(p, 'login')).toBe(second)
  })

  it('handles an empty record without error', () => {
    expect(() => defineAuthSchemas({})).not.toThrow()
  })
})
