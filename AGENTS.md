# AGENTS.md

Nuxt module package (`@workmate/nuxt-auth`). Published artifact is `dist/module.mjs` built by `@nuxt/module-builder`. There is no host app — the `playground/` is the dev harness and `test/fixtures/basic/` is the test harness.

## Layout that matters

- `src/module.ts` — module entry. Registers plugins, server handlers (`/api/auth/*`), and route middlewares. Adding a new server route or middleware requires editing here, not just dropping a file.
- `src/runtime/` — code shipped at runtime to the host Nuxt app. Composables, plugins, middleware, providers, and server handlers all live here and are wired by `module.ts`.
- `src/runtime/providers/` — `AuthProvider` is the base class; `Local`, `Github`, `Google` extend it. Facebook/LinkedIn are placeholders.
- Github/Google server callback handlers (`/api/auth/callback/{provider}`) are only registered when that provider is present in user config — see `src/module.ts:139-151`.
- `playground/nuxt.config.ts` imports the module from `../src/module` (not the published package).
- `test/fixtures/basic/nuxt.config.ts` does the same. The single test (`test/basic.test.ts`) boots Nuxt via `@nuxt/test-utils/e2e` — tests are full SSR, not unit tests.

## Commands

First-time / after `node_modules` reset:

```bash
npm run dev:prepare   # stubs module + prepares playground; required before dev or test
```

Daily:

```bash
npm run dev           # runs playground at :3000
npm run lint          # eslint .
npm test              # vitest run (boots Nuxt; slow, not unit-level)
npm run test:watch
npm run prepack       # nuxt-module-build build → dist/
```

Do **not** run `npm run release` locally — it publishes to npm and pushes tags. Releases happen on CI when commits land on the `release` branch (`.github/workflows/release.yml` runs `lint → nuxt-module-build prepare → prepack → test → semantic-release`).

## Conventions that bite

- **Conventional Commits required.** `semantic-release` derives the version from commit messages on the `release` branch. A non-conforming commit either gets ignored or breaks the release.
- ESLint config (`eslint.config.js`) intentionally disables `no-explicit-any`, `vue/multi-word-component-names`, stylistic rules, and others. Don't reintroduce these as "fixes" — the relaxations are deliberate for module/auth typing.
- `.editorconfig` enforces 2-space, LF, final newline. Source files use **double quotes** and trailing semicolons; match the existing style (ESLint stylistic is off so it won't catch you).
- Module options are merged into `runtimeConfig.auth` (private) and a subset into `runtimeConfig.public.auth` (`redirects`, `global`, `apiClient` only). When adding options, decide which side they belong on — see `src/module.ts:94-106`.
- `nuxt-module-build prepare` writes types into `.nuxt/` that `tsconfig.json` extends. Type errors after pulling new code usually mean re-running `npm run dev:prepare`.
- README opening comment is leftover boilerplate from the Nuxt module starter ("My Module" find/replace). Ignore it; the rest of the README is accurate.

## Things not to assume

- There is no separate unit-test layer. Every test currently spins up Nuxt — adding cheap unit tests is fine but pick a non-`@nuxt/test-utils` import.
- No formatter (no Prettier). ESLint with stylistic off is the only lint pass.
- No husky / lint-staged / pre-commit hooks.
- Node 24 in the CI build step, Node 21 in the release step (`.github/workflows/release.yml`). Prefer Node ≥21 locally.
