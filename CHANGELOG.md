# [2.0.0](https://github.com/work-mate/nuxt-auth-module/compare/v1.6.0...v2.0.0) (2026-05-25)


### Bug Fixes

* support feat! breaking change notation in semantic-release ([1098f6f](https://github.com/work-mate/nuxt-auth-module/commit/1098f6ff58f372ad5247f1e97ef1792536575812))

## [1.5.1](https://github.com/work-mate/nuxt-auth-module/compare/v1.5.0...v1.5.1) (2025-10-12)

### Bug Fixes

- generate keys for useFetch when using useAuthFetch ([aa6ea8f](https://github.com/work-mate/nuxt-auth-module/commit/aa6ea8ff6160806af92a96a672c56ad10db040c4))

# [1.5.0](https://github.com/work-mate/nuxt-auth-module/compare/v1.4.0...v1.5.0) (2025-09-30)

### Bug Fixes

- invalidates cache data after login and logout ([b87e2b0](https://github.com/work-mate/nuxt-auth-module/commit/b87e2b063a470145a58a8b8ec820f6f774363879))
- lint ([c0d4ddb](https://github.com/work-mate/nuxt-auth-module/commit/c0d4ddb5172103f895a8130df7229e1554d0ef4d))

### Features

- migrate to nuxt 4 and npm ([4b952ea](https://github.com/work-mate/nuxt-auth-module/commit/4b952ea21f743c55338c995a0d4a3fead3b86d3a))
- refactor auth fetch ([7553f65](https://github.com/work-mate/nuxt-auth-module/commit/7553f65751ebc8af13c399e2b79ffa0a84590599))
- refactor auth.ts ([e34f1f2](https://github.com/work-mate/nuxt-auth-module/commit/e34f1f2f0c4b5bc8c555918c61da8aed0449cb85))
- support for nuxt 4 ([ed33399](https://github.com/work-mate/nuxt-auth-module/commit/ed333996d38dc57af628292b9150cfea394de27d))
- types definition ([9c3f6e3](https://github.com/work-mate/nuxt-auth-module/commit/9c3f6e38ea831de30c202a3ef8195a1c42f021ea))
- update type definition for useAuthFetch ([0af3dbc](https://github.com/work-mate/nuxt-auth-module/commit/0af3dbcadda6cc17f38cc736bace28caab62efda))

# [1.4.0](https://github.com/work-mate/nuxt-auth-module/compare/v1.3.2...v1.4.0) (2025-01-22)

### Features

- AuthUser as an interface ([03215e4](https://github.com/work-mate/nuxt-auth-module/commit/03215e4b0f4ffc489b8ed389a64f60993d45db4b))

## [1.3.2](https://github.com/work-mate/nuxt-auth-module/compare/v1.3.1...v1.3.2) (2025-01-22)

### Bug Fixes

- Fix the prepack error ([0fbd83f](https://github.com/work-mate/nuxt-auth-module/commit/0fbd83fe686a3ca967262f13fcf37d6e5ff2fd6a))

## [1.3.1](https://github.com/work-mate/nuxt-auth-module/compare/v1.3.0...v1.3.1) (2024-06-14)

### Bug Fixes

- Update docs ([ecbe945](https://github.com/work-mate/nuxt-auth-module/commit/ecbe94540c1584222723f1a79851408d9b356892))

# Changelog

## v2.0.0

### Breaking changes

- `body: { principal, password }` removed from `local` provider `signIn` config — use `schemas.login` instead
- Zod 4 required (`zod@^4.0.0`) — `z.toJSONSchema` / `z.fromJSONSchema` are Zod 4 only

### Features

- Open login body for local provider — any object is forwarded to the `signIn` endpoint; field names are no longer constrained to `principal`/`password`
- Per-provider Zod schema pipeline: define `schemas.login` and `schemas.user` in `nuxt.config.ts` per provider
- Build-time JSON Schema conversion via `src/schema-utils.ts`; runtime `#auth-schemas` virtual module reconstructs Zod schemas for both Nuxt and Nitro
- `useAuthLogin` composable — `localLogin`, `googleLogin`, `githubLogin` typed from your schemas
- `useAuthUser` composable — `{ user, isLoggedIn, refreshUser }`
- `useAuthToken` composable — `{ token, refreshToken, tokenType, provider, tokenNames, refreshTokens }`
- Server-side login body validation via `schemas.login` — invalid requests return HTTP 400 with field errors
- Server-side user response validation via `schemas.user` — mismatches throw with field-level detail

---

## v1.0.0

Initial release. See [migration guide](README.md#migration-v1--v2) for upgrading to v2.
