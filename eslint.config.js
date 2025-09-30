import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false
  },
  dirs: {
    src: [
      './src',
      './playground'
    ]
  }
}, {
  ignores: [
    'dist',
    'node_modules',
    '.nuxt',
    '.output',
    'coverage'
  ]
}, {
  rules: {
    // Allow console.log for debugging
    'no-console': 'off',
    // Allow any component names in playground
    'vue/multi-word-component-names': 'off',
    // Allow unused variables with underscore prefix
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Allow any types in certain contexts (auth module complexity)
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow empty interfaces for extensibility
    '@typescript-eslint/no-empty-object-type': 'off',
    // Allow void types in auth contexts
    '@typescript-eslint/no-invalid-void-type': 'off',
    // Allow import type side effects (Nuxt specific)
    '@typescript-eslint/no-import-type-side-effects': 'off',
    // Allow ts-expect-error for complex Nuxt typing issues
    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': false }],
    // Relax import ordering for Nuxt auto-imports
    'import/first': 'off',
    // Allow missing JSDoc returns
    'jsdoc/require-returns-description': 'off'
  }
})