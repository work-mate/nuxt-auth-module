# [1.6.0](https://github.com/work-mate/nuxt-auth-module/compare/v1.5.1...v1.6.0) (2026-05-25)


### Bug Fixes

* update semantic-release branches to main and v1 ([3f3660a](https://github.com/work-mate/nuxt-auth-module/commit/3f3660a8d1571f5a607fd9e93d8bf4dd758aad88))


### Features

* add data from the login function ([f405ea3](https://github.com/work-mate/nuxt-auth-module/commit/f405ea32e66e9f8c7ec208b4b091e272bc3b49f3))
* add debug logs ([8bc0c31](https://github.com/work-mate/nuxt-auth-module/commit/8bc0c3124899f3f7e296339ce5c1bbed14c8b546))
* endpoint schemas ([9e480bc](https://github.com/work-mate/nuxt-auth-module/commit/9e480bc9aeb6edec867bab1b9e6f98fa73189a5f))
* remove strict types for signin and introduce schema ([cb7a277](https://github.com/work-mate/nuxt-auth-module/commit/cb7a27707900bcb364196eb7a282a3740fc94c39))
* rename functions and add useAuthToken and useAuthUser ([a0e0307](https://github.com/work-mate/nuxt-auth-module/commit/a0e0307abbd78fc04da68593e1f80f3014702e30))
* update build ([11fb963](https://github.com/work-mate/nuxt-auth-module/commit/11fb963a2878596d8e075da14144cd911d8580ca))
* update types to have hints ([6884375](https://github.com/work-mate/nuxt-auth-module/commit/6884375abf89fa7f5ce3511e8caf2e20a3e8174d))
* zod schema validations ([8972b17](https://github.com/work-mate/nuxt-auth-module/commit/8972b17a0ebfed77dc9b533c33859ac53490f1d5))

## [1.5.1](https://github.com/work-mate/nuxt-auth-module/compare/v1.5.0...v1.5.1) (2025-10-12)


### Bug Fixes

* generate keys for useFetch when using useAuthFetch ([aa6ea8f](https://github.com/work-mate/nuxt-auth-module/commit/aa6ea8ff6160806af92a96a672c56ad10db040c4))

# [1.5.0](https://github.com/work-mate/nuxt-auth-module/compare/v1.4.0...v1.5.0) (2025-09-30)


### Bug Fixes

* invalidates cache data after login and logout ([b87e2b0](https://github.com/work-mate/nuxt-auth-module/commit/b87e2b063a470145a58a8b8ec820f6f774363879))
* lint ([c0d4ddb](https://github.com/work-mate/nuxt-auth-module/commit/c0d4ddb5172103f895a8130df7229e1554d0ef4d))


### Features

* migrate to nuxt 4 and npm ([4b952ea](https://github.com/work-mate/nuxt-auth-module/commit/4b952ea21f743c55338c995a0d4a3fead3b86d3a))
* refactor auth fetch ([7553f65](https://github.com/work-mate/nuxt-auth-module/commit/7553f65751ebc8af13c399e2b79ffa0a84590599))
* refactor auth.ts ([e34f1f2](https://github.com/work-mate/nuxt-auth-module/commit/e34f1f2f0c4b5bc8c555918c61da8aed0449cb85))
* support for nuxt 4 ([ed33399](https://github.com/work-mate/nuxt-auth-module/commit/ed333996d38dc57af628292b9150cfea394de27d))
* types definition ([9c3f6e3](https://github.com/work-mate/nuxt-auth-module/commit/9c3f6e38ea831de30c202a3ef8195a1c42f021ea))
* update type definition for useAuthFetch ([0af3dbc](https://github.com/work-mate/nuxt-auth-module/commit/0af3dbcadda6cc17f38cc736bace28caab62efda))

# [1.4.0](https://github.com/work-mate/nuxt-auth-module/compare/v1.3.2...v1.4.0) (2025-01-22)


### Features

* AuthUser as an interface ([03215e4](https://github.com/work-mate/nuxt-auth-module/commit/03215e4b0f4ffc489b8ed389a64f60993d45db4b))

## [1.3.2](https://github.com/work-mate/nuxt-auth-module/compare/v1.3.1...v1.3.2) (2025-01-22)


### Bug Fixes

* Fix the prepack error ([0fbd83f](https://github.com/work-mate/nuxt-auth-module/commit/0fbd83fe686a3ca967262f13fcf37d6e5ff2fd6a))

## [1.3.1](https://github.com/work-mate/nuxt-auth-module/compare/v1.3.0...v1.3.1) (2024-06-14)


### Bug Fixes

* Update docs ([ecbe945](https://github.com/work-mate/nuxt-auth-module/commit/ecbe94540c1584222723f1a79851408d9b356892))

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
