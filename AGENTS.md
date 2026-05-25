# AGENTS.md

Nuxt module package (`@workmate/nuxt-auth`). Published artifact is `dist/module.mjs` built by `@nuxt/module-builder`. There is no host app — `playground/` is the dev harness and `test/fixtures/basic/` is the test harness.

## Layout that matters

- `src/module.ts` — module entry. Registers plugins, server handlers (`/api/auth/*`), route middlewares, and the schema-generation templates. Adding a new server route or middleware requires editing here, not just dropping a file.
- `src/schema-utils.ts` — build-time only. Collects per-provider Zod schemas from user config, converts each to JSON Schema, strips schemas from the options written to `runtimeConfig`, and renders `auth-schemas.gen.mjs` + `auth-schemas.gen.d.ts` via `addTemplate`. Both Nuxt and Nitro aliases for `#auth-schemas` point at the generated runtime file (see the alias setup in `src/module.ts`).
- `src/runtime/` — code shipped to the host app. Composables, plugins, middleware, providers, server handlers wired by `module.ts`.
- `src/runtime/providers/` — `AuthProvider` is the base class; `Local`, `Github`, `Google` extend it. There are no Facebook/LinkedIn provider files.
- Github/Google server callback handlers (`/api/auth/callback/{provider}`) are only registered when that provider is present in user config — check the `providers.github` / `providers.google` conditionals in `src/module.ts`.
- `playground/nuxt.config.ts` and `test/fixtures/basic/nuxt.config.ts` import the module from `../src/module` (not the published package).
- `test/basic.test.ts` is the only test today. It boots Nuxt via `@nuxt/test-utils/e2e` — full SSR, not unit tests. `PLAN.md` describes a larger intended test suite but it is not built yet.

## Schema pipeline (non-obvious, easy to break)

- Providers accept `schemas: { login?, user? }` (Zod). These cannot survive `runtimeConfig` — Nuxt 4 runs Nitro in a separate worker and Zod instances aren't JSON-serializable.
- `collectSchemas` converts them to JSON Schema at build time; `stripSchemasFromProviders` removes them before defu-merge into `runtimeConfig.auth`. At runtime the generated `#auth-schemas` module rebuilds Zod via `z.fromJSONSchema()`.
- Providers read `loginSchemas[name]` / `userSchemas[name]` from `#auth-schemas` for validation. Never read schemas from `runtimeConfig` — they won't be there.
- This depends on **Zod 4** (`zod@4.x`). `z.toJSONSchema` / `z.fromJSONSchema` do not exist on Zod 3. Do not downgrade.
- After changing schemas in `playground/nuxt.config.ts`, the generated files in `.nuxt/` need a regen — re-run `dev` / `dev:prepare`.

## Commands

First-time / after `node_modules` reset:

```bash
npm run dev:prepare   # nuxt-module-build build --stub && nuxt-module-build prepare && nuxi prepare playground
```

Daily:

```bash
npm run dev           # runs playground at :3000
npm run lint          # eslint .
npm test              # vitest run (boots Nuxt; slow, not unit-level)
npm run test:watch
npm run prepack       # nuxt-module-build build → dist/
```

No `typecheck` script. Types are validated indirectly by `nuxt-module-build prepare` (which writes `.nuxt/tsconfig.json` that the root `tsconfig.json` extends) and by `npm test`.

Do **not** run `npm run release` locally — it publishes to npm and pushes tags. Releases happen on CI when commits land on the `release` branch (`.github/workflows/release.yml` runs `lint → nuxt-module-build prepare → prepack → test → semantic-release`).

## Conventions that bite

- **Conventional Commits required.** `semantic-release` derives the version from commit messages on the `release` branch. A non-conforming commit gets ignored or breaks the release.
- ESLint config (`eslint.config.js`) intentionally disables `no-explicit-any`, `no-empty-object-type`, `no-invalid-void-type`, `vue/multi-word-component-names`, `no-console`, stylistic rules, and more. Don't reintroduce these as "fixes" — the relaxations are deliberate.
- `ban-ts-comment` is configured to **allow** `@ts-expect-error`. Prefer it over `@ts-ignore`.
- `.editorconfig` enforces 2-space, LF, final newline. Source files use **double quotes** and trailing semicolons; match the existing style (ESLint stylistic is off so it won't catch you).
- Module options are merged into `runtimeConfig.auth` (private, full options minus Zod schemas) and a subset into `runtimeConfig.public.auth` (`redirects`, `global`, `apiClient` only). When adding options, decide which side they belong on — see the defu merges near the bottom of `src/module.ts`'s `setup`.
- `nuxt-module-build prepare` writes types into `.nuxt/` that `tsconfig.json` extends. Type errors after pulling new code usually mean re-running `npm run dev:prepare`.

## Things not to assume

- `README.md` and `CHANGELOG.md` are partly stale — `PLAN.md` (Stage 3) explicitly tracks doc updates for the schema-pipeline API still owed. Treat `PLAN.md` + source as truth; treat README config examples (`principal`/`password`, `defineAuthEndpointSchemas`) as outdated.
- There is no separate unit-test layer. Every test currently spins up Nuxt — adding cheap unit tests is fine but pick a non-`@nuxt/test-utils` import.
- No formatter (no Prettier). ESLint with stylistic off is the only lint pass.
- No husky / lint-staged / pre-commit hooks.
- Node 24 in the CI build step, Node 21 in the release step (`.github/workflows/release.yml`). Prefer Node ≥21 locally.
