# AGENTS.md

Nuxt module package (`@workmate/nuxt-auth`). Published artifact is `dist/module.mjs` built by `@nuxt/module-builder`. There is no host app — `playground/` is the dev harness and `test/fixtures/` holds the test apps.
.

## Layout that matters

- `src/module.ts` — module entry. Registers plugins, server handlers (`/api/auth/*`), route middlewares, and the schema-generation templates. Adding a new server route or middleware requires editing here, not just dropping a file.
- `src/schema-utils.ts` — build-time only. Collects per-provider Zod schemas from user config, converts each to JSON Schema, strips schemas from the options written to `runtimeConfig`, and renders `auth-schemas.gen.mjs` + `auth-schemas.gen.d.ts` via `addTemplate`. Both Nuxt and Nitro aliases for `#auth-schemas` point at the generated runtime file (see the alias setup in `src/module.ts`).
- `src/runtime/` — code shipped to the host app. Composables, plugins, middleware, providers, server handlers wired by `module.ts`.
- `src/runtime/providers/` — `AuthProvider` is the base class; `Local`, `Github`, `Google` extend it. There are no Facebook/LinkedIn provider files.
- Github/Google server callback handlers (`/api/auth/callback/{provider}`) are only registered when that provider is present in user config — check the `providers.github` / `providers.google` conditionals in `src/module.ts`.
- `playground/nuxt.config.ts` and the `test/fixtures/*/nuxt.config.ts` files import the module from `src/module` (not the published package).
- The e2e tests (`test/basic`, `composables`, `local-auth`, `middleware`, `schema`) boot a built Nuxt server via `@nuxt/test-utils/e2e`. `basic.test.ts` uses `test/fixtures/basic`. The others use `test/fixtures/auth`, which has mock backend routes under `server/api/mock/`, and they all listen on port 4001. `vitest.config.ts` sets `fileParallelism: false` for that reason — do not remove it.
- `test/token.test.ts` and `test/unit/*.test.ts` are plain unit tests. `vitest.config.ts` aliases `#auth-schemas` to `test/unit/__mocks__/auth-schemas.ts`; a test overrides it with `vi.mock('#auth-schemas', ...)`.

## Schema pipeline (non-obvious, easy to break)

- Providers accept `schemas: { login?, user? }`, each a function that returns a Zod schema. A Zod instance cannot be put directly in the config: Nuxt 4.5+ deep-clones `nuxt.config` with `klona`, which calls the Zod constructor without a definition and throws. `collectSchemas` calls the function and rejects a value that is not a function.
- These cannot survive `runtimeConfig` — Nuxt 4 runs Nitro in a separate worker and Zod instances aren't JSON-serializable.
- `collectSchemas` converts them to JSON Schema at build time; `stripSchemasFromProviders` removes them before defu-merge into `runtimeConfig.auth`. At runtime the generated `#auth-schemas` module rebuilds Zod via `z.fromJSONSchema()`.
- Providers and `src/runtime/composables/useAuthLogin.ts` read `loginSchemas[name]` / `userSchemas[name]` from `#auth-schemas` for validation. Never read schemas from `runtimeConfig` — they won't be there.
- Generated type file exports `LoginData` and `UserDataByProvider` (keyed by `local | github | google`). `useAuthLogin().local()` is typed off `LoginData["local"]`, which is derived from the user's Zod schema in `nuxt.config.ts` — so changing that schema changes public types.
- Zod is a peer dependency (`zod@^4.2.0`); the app's copy builds the schemas and the module's code reads them. `z.fromJSONSchema` does not exist before Zod 4.2. Do not lower the range.
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
npm test              # vitest run (unit tests + e2e tests that build and boot Nuxt)
npm run test:watch
npm run prepack       # nuxt-module-build build → dist/
```

No `typecheck` script. Types are validated indirectly by `nuxt-module-build prepare` (which writes `.nuxt/tsconfig.json` that the root `tsconfig.json` extends) and by `npm test`. `npx tsc --noEmit` works after `npm run dev:prepare`, but it reports known errors and is not a gate; compare its output before and after a change.

Do **not** run `npm run release` locally — it publishes to npm and pushes tags. Releases happen on CI: `.github/workflows/main.yml` runs on a push to `main`, and `.github/workflows/versioned.yml` runs on a push to a `v*` branch (it skips the release when the branch is `vars.LATEST_VERSION_BRANCH`). Each runs `lint → nuxt-module-build prepare → prepack → test`, then `semantic-release`.

## Conventions that bite

- **Conventional Commits required.** `semantic-release` derives the version from commit messages on `main` and the `v*` branches. A non-conforming commit gets ignored or breaks the release.
- ESLint config (`eslint.config.js`) intentionally disables `no-explicit-any`, `no-empty-object-type`, `no-invalid-void-type`, `vue/multi-word-component-names`, `no-console`, stylistic rules, and more. Don't reintroduce these as "fixes" — the relaxations are deliberate.
- `ban-ts-comment` is configured to **allow** `@ts-expect-error`. Prefer it over `@ts-ignore`.
- `.editorconfig` enforces 2-space, LF, final newline. Source files use **double quotes** and trailing semicolons; match the existing style (ESLint stylistic is off so it won't catch you).
- Module options are merged into `runtimeConfig.auth` (private, full options minus Zod schemas) and a subset into `runtimeConfig.public.auth` (`redirects`, `global`, `apiClient` only). When adding options, decide which side they belong on — see the defu merges near the bottom of `src/module.ts`'s `setup`.
- `nuxt-module-build prepare` writes types into `.nuxt/` that `tsconfig.json` extends. Type errors after pulling new code usually mean re-running `npm run dev:prepare`.

## Dependencies that bite

- **`h3` stays on v1.** Nuxt runs Nitro 2, which uses h3 v1, and Nuxt 4.6 aliases every `h3` import to its own copy, so the server handlers always run on h3 v1. h3 v2 keeps the v1 helper names, so tests pass with it, but v2-only APIs fail in a real app. Move to v2 only when Nuxt ships Nitro 3.
- **`zod` is a peer dependency** and is also a dev dependency for the tests. Do not add it to `dependencies`: a second copy would read schemas that the app's copy built.
- **`@nuxt/kit` is the only Nuxt runtime dependency.** `nuxt` and `@nuxt/schema` are dev dependencies. The module was checked on Nuxt 3.21.11, 4.1.2 and 4.6.1.
- `useAuthFetch` is exported as `typeof useFetch`. Do not derive its types with `Parameters<typeof useFetch>` or `ReturnType<typeof useFetch>`: `useFetch` is overloaded, and those read only the last overload.
- `useRuntimeConfig()` is typed from the generated `.nuxt/types/runtime-config.d.ts`, which Nuxt builds from the default option values. From Nuxt 4.6, the `declare module "@nuxt/schema"` block in `src/module.ts` does not change that type. When a field has no default (for example `apiClient.credentials`), annotate the value with the `ModuleOptions` type.
- The toolchain (`nuxt`, `semantic-release` and its plugins) needs Node `^22.22.3` or `>=24.15`. All CI jobs use Node 24.

## Things not to assume

- `CHANGELOG.md` is written by `semantic-release`. Do not edit it by hand.
- No formatter (no Prettier). ESLint with stylistic off is the only lint pass.
- No husky / lint-staged / pre-commit hooks.
