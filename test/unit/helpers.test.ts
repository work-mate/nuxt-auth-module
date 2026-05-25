import { describe, it, expect } from 'vitest'
import { getRecursiveProperty } from '../../src/runtime/helpers'

describe('getRecursiveProperty', () => {
  describe('top-level access', () => {
    it('returns a top-level string value', () => {
      expect(getRecursiveProperty({ a: 'hello' }, 'a')).toBe('hello')
    })

    it('returns a top-level number value', () => {
      expect(getRecursiveProperty({ count: 42 }, 'count')).toBe(42)
    })

    it('returns a top-level boolean true', () => {
      expect(getRecursiveProperty({ flag: true }, 'flag')).toBe(true)
    })

    it('returns a top-level boolean false (falsy but defined)', () => {
      expect(getRecursiveProperty({ flag: false }, 'flag')).toBe(false)
    })

    it('returns a top-level zero (falsy but defined)', () => {
      expect(getRecursiveProperty({ count: 0 }, 'count')).toBe(0)
    })

    it('returns null for a null value', () => {
      expect(getRecursiveProperty({ val: null }, 'val')).toBeNull()
    })

    it('returns top-level object value', () => {
      const obj = { nested: { x: 1 } }
      expect(getRecursiveProperty(obj, 'nested')).toEqual({ x: 1 })
    })

    it('returns top-level array value', () => {
      const obj = { items: [1, 2, 3] }
      expect(getRecursiveProperty(obj, 'items')).toEqual([1, 2, 3])
    })
  })

  describe('nested access with dot separator', () => {
    it('returns a value two levels deep', () => {
      expect(getRecursiveProperty({ a: { b: 99 } }, 'a.b')).toBe(99)
    })

    it('returns a value three levels deep', () => {
      expect(getRecursiveProperty({ a: { b: { c: 'deep' } } }, 'a.b.c')).toBe('deep')
    })

    it('returns a value four levels deep', () => {
      const obj = { a: { b: { c: { d: 'very-deep' } } } }
      expect(getRecursiveProperty(obj, 'a.b.c.d')).toBe('very-deep')
    })

    it('returns a nested array', () => {
      const obj = { data: { items: [10, 20] } }
      expect(getRecursiveProperty(obj, 'data.items')).toEqual([10, 20])
    })
  })

  describe('array index access', () => {
    it('accesses array element via numeric string key', () => {
      const obj = { items: ['a', 'b', 'c'] }
      expect(getRecursiveProperty(obj, 'items.0')).toBe('a')
      expect(getRecursiveProperty(obj, 'items.2')).toBe('c')
    })
  })

  describe('missing key handling', () => {
    it('returns undefined for a missing top-level key', () => {
      expect(getRecursiveProperty({ a: 1 }, 'b')).toBeUndefined()
    })

    it('returns undefined when intermediate key is missing', () => {
      expect(getRecursiveProperty({ a: 1 }, 'a.b.c')).toBeUndefined()
    })

    it('returns undefined for an empty path', () => {
      // path.split('.') on '' gives [''], obj[''] is undefined
      expect(getRecursiveProperty({ a: 1 }, '')).toBeUndefined()
    })
  })

  describe('custom separator', () => {
    it('supports a custom separator', () => {
      expect(getRecursiveProperty({ a: { b: 7 } }, 'a/b', '/')).toBe(7)
    })

    it('custom separator does not split on default dot', () => {
      // Path treated as a single key when separator differs
      const obj = { 'a.b': 42 }
      expect(getRecursiveProperty(obj, 'a.b', '/')).toBe(42)
    })
  })
})
