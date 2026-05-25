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
