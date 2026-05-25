import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  collectSchemas,
  stripSchemasFromProviders,
  renderAuthSchemasRuntime,
  renderAuthSchemasTypes,
  type CollectedSchemas,
} from '../../src/schema-utils'

// ─── collectSchemas ───────────────────────────────────────────────────────────

describe('collectSchemas', () => {
  it('returns empty login+user when no providers given', () => {
    const result = collectSchemas({})
    expect(result.login).toEqual({})
    expect(result.user).toEqual({})
  })

  it('collects a local login schema', () => {
    const result = collectSchemas({
      local: {
        schemas: {
          login: z.object({ email: z.email(), password: z.string() }),
        },
      },
    })
    expect(result.login.local).toBeDefined()
    expect(result.user.local).toBeUndefined()
  })

  it('collects a local user schema', () => {
    const result = collectSchemas({
      local: {
        schemas: {
          user: z.object({ id: z.string(), email: z.email() }),
        },
      },
    })
    expect(result.user.local).toBeDefined()
    expect(result.login.local).toBeUndefined()
  })

  it('collects both login and user schemas for the same provider', () => {
    const result = collectSchemas({
      local: {
        schemas: {
          login: z.object({ email: z.email() }),
          user: z.object({ id: z.string() }),
        },
      },
    })
    expect(result.login.local).toBeDefined()
    expect(result.user.local).toBeDefined()
  })

  it('collects schemas for multiple providers', () => {
    const userSchema = z.object({ id: z.string() })
    const result = collectSchemas({
      local: { schemas: { user: userSchema } },
      github: { schemas: { user: userSchema } },
      google: { schemas: { user: userSchema } },
    })
    expect(result.user.local).toBeDefined()
    expect(result.user.github).toBeDefined()
    expect(result.user.google).toBeDefined()
  })

  it('skips a provider with no schemas property', () => {
    const result = collectSchemas({
      local: { endpoints: { signIn: { path: '/login' } } } as any,
    })
    expect(result.login.local).toBeUndefined()
    expect(result.user.local).toBeUndefined()
  })

  it('produces a JSON Schema object with correct type for a string field', () => {
    const result = collectSchemas({
      local: {
        schemas: {
          login: z.object({ email: z.email(), password: z.string() }),
        },
      },
    })
    const schema = result.login.local as any
    expect(schema.type).toBe('object')
    expect(schema.properties).toBeDefined()
  })
})

// ─── stripSchemasFromProviders ────────────────────────────────────────────────

describe('stripSchemasFromProviders', () => {
  it('removes the schemas key from the local provider', () => {
    const input = {
      local: {
        schemas: { login: z.object({ email: z.email() }) },
        endpoints: { signIn: { path: '/login' } },
      },
    } as any

    const result = stripSchemasFromProviders(input)

    expect((result.local as any).schemas).toBeUndefined()
  })

  it('preserves other provider options after stripping', () => {
    const input = {
      local: {
        schemas: { login: z.object({ email: z.email() }) },
        endpoints: { signIn: { path: '/custom-login', method: 'POST' } },
      },
    } as any

    const result = stripSchemasFromProviders(input)

    expect((result.local as any).endpoints?.signIn?.path).toBe('/custom-login')
  })

  it('handles a provider without a schemas key', () => {
    const input = {
      local: { endpoints: { signIn: { path: '/login' } } },
    } as any

    expect(() => stripSchemasFromProviders(input)).not.toThrow()
    expect((stripSchemasFromProviders(input).local as any).endpoints).toBeDefined()
  })

  it('ignores providers not present in the input', () => {
    const result = stripSchemasFromProviders({})
    expect(result.local).toBeUndefined()
    expect(result.github).toBeUndefined()
    expect(result.google).toBeUndefined()
  })

  it('strips schemas from all three providers independently', () => {
    const schema = z.object({ id: z.string() })
    const input = {
      local: { schemas: { user: schema }, endpoints: { signIn: { path: '/l' } } },
      github: { schemas: { user: schema }, CLIENT_ID: 'gid', CLIENT_SECRET: 'gsec', HASHING_SECRET: 'h', SCOPES: 'user' },
      google: { schemas: { user: schema }, CLIENT_ID: 'goid', CLIENT_SECRET: 'gosec', HASHING_SECRET: 'h', SCOPES: 'email' },
    } as any

    const result = stripSchemasFromProviders(input)

    expect((result.local as any).schemas).toBeUndefined()
    expect((result.github as any).schemas).toBeUndefined()
    expect((result.google as any).schemas).toBeUndefined()
    expect((result.github as any).CLIENT_ID).toBe('gid')
    expect((result.google as any).CLIENT_ID).toBe('goid')
  })
})

// ─── renderAuthSchemasRuntime ─────────────────────────────────────────────────

describe('renderAuthSchemasRuntime', () => {
  const sample: CollectedSchemas = {
    login: {
      local: {
        type: 'object',
        properties: { email: { type: 'string' }, password: { type: 'string' } },
        required: ['email', 'password'],
      },
    },
    user: {
      local: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  }

  it('exports loginSchemas', () => {
    expect(renderAuthSchemasRuntime(sample)).toContain('export const loginSchemas')
  })

  it('exports userSchemas', () => {
    expect(renderAuthSchemasRuntime(sample)).toContain('export const userSchemas')
  })

  it('uses z.fromJSONSchema to reconstruct Zod schemas', () => {
    expect(renderAuthSchemasRuntime(sample)).toContain('z.fromJSONSchema')
  })

  it('embeds the login JSON correctly', () => {
    const output = renderAuthSchemasRuntime(sample)
    expect(output).toContain('"email"')
    expect(output).toContain('"password"')
  })

  it('embeds the user JSON correctly', () => {
    const output = renderAuthSchemasRuntime(sample)
    expect(output).toContain('"id"')
  })

  it('produces valid JavaScript (no syntax errors)', () => {
    const output = renderAuthSchemasRuntime(sample)
    // Sanity check: balanced braces
    const opens = (output.match(/\{/g) || []).length
    const closes = (output.match(/\}/g) || []).length
    expect(opens).toBe(closes)
  })

  it('handles completely empty schemas', () => {
    const output = renderAuthSchemasRuntime({ login: {}, user: {} })
    expect(output).toContain('export const loginSchemas')
    expect(output).toContain('export const userSchemas')
  })
})

// ─── renderAuthSchemasTypes ───────────────────────────────────────────────────

describe('renderAuthSchemasTypes', () => {
  it('exports LoginData type', () => {
    const output = renderAuthSchemasTypes({ login: {}, user: {} })
    expect(output).toContain('export type LoginData')
  })

  it('exports UserDataByProvider type', () => {
    const output = renderAuthSchemasTypes({ login: {}, user: {} })
    expect(output).toContain('export type UserDataByProvider')
  })

  it('falls back to Record<string, any> when schema is missing', () => {
    const output = renderAuthSchemasTypes({ login: {}, user: {} })
    expect(output).toContain('Record<string, any>')
  })

  it('generates correct field types for a string field', () => {
    const schemas: CollectedSchemas = {
      login: {
        local: {
          type: 'object',
          properties: { email: { type: 'string' } },
          required: ['email'],
        },
      },
      user: {},
    }
    const output = renderAuthSchemasTypes(schemas)
    expect(output).toContain('email: string')
  })

  it('marks optional fields with ?', () => {
    const schemas: CollectedSchemas = {
      login: {
        local: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: [], // name is NOT required
        },
      },
      user: {},
    }
    const output = renderAuthSchemasTypes(schemas)
    expect(output).toContain('name?: string')
  })

  it('generates number type', () => {
    const schemas: CollectedSchemas = {
      login: {
        local: {
          type: 'object',
          properties: { age: { type: 'number' } },
          required: ['age'],
        },
      },
      user: {},
    }
    const output = renderAuthSchemasTypes(schemas)
    expect(output).toContain('age: number')
  })

  it('generates boolean type', () => {
    const schemas: CollectedSchemas = {
      login: {
        local: {
          type: 'object',
          properties: { active: { type: 'boolean' } },
          required: ['active'],
        },
      },
      user: {},
    }
    const output = renderAuthSchemasTypes(schemas)
    expect(output).toContain('active: boolean')
  })

  it('generates array type', () => {
    const schemas: CollectedSchemas = {
      login: {
        local: {
          type: 'object',
          properties: { tags: { type: 'array', items: { type: 'string' } } },
          required: ['tags'],
        },
      },
      user: {},
    }
    const output = renderAuthSchemasTypes(schemas)
    expect(output).toContain('Array<string>')
  })

  it('generates union type from anyOf', () => {
    const schemas: CollectedSchemas = {
      login: {
        local: {
          type: 'object',
          properties: {
            id: { anyOf: [{ type: 'string' }, { type: 'number' }] },
          },
          required: ['id'],
        },
      },
      user: {},
    }
    const output = renderAuthSchemasTypes(schemas)
    expect(output).toContain('string | number')
  })

  it('always includes github and google redirectUrl fields', () => {
    const output = renderAuthSchemasTypes({ login: {}, user: {} })
    expect(output).toContain('github: { redirectUrl?: string }')
    expect(output).toContain('google: { redirectUrl?: string }')
  })
})
