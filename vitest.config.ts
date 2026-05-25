import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      // Provide a resolvable stub for the #auth-schemas virtual module so unit
      // tests that import providers can compile. Individual test files override
      // this via vi.mock('#auth-schemas', factory).
      '#auth-schemas': fileURLToPath(
        new URL('./test/unit/__mocks__/auth-schemas.ts', import.meta.url),
      ),
    },
  },
})
