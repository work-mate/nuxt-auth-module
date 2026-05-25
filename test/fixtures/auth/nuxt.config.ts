import { z } from 'zod'
import MyModule from '../../../src/module'

const BASE = process.env.TEST_BASE_URL || 'http://localhost:4001'

const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
})

export default defineNuxtConfig({
  modules: [MyModule],
  nitro: {
    logLevel: 0,
  },
  auth: {
    global: false,
    redirects: {
      redirectIfNotLoggedIn: '/login',
      redirectIfLoggedIn: '/',
    },
    providers: {
      local: {
        endpoints: {
          signIn: {
            path: `${BASE}/api/mock/signin`,
            method: 'POST',
            tokenKey: 'token',
            refreshTokenKey: 'refresh_token',
          },
          user: {
            path: `${BASE}/api/mock/user`,
            userKey: 'user',
          },
          refreshToken: {
            path: `${BASE}/api/mock/refresh`,
            method: 'POST',
            tokenKey: 'token',
            refreshTokenKey: 'refresh_token',
            body: { token: 'token', refreshToken: 'refresh_token' },
          },
          signOut: {
            path: `${BASE}/api/mock/logout`,
            method: 'POST',
          },
        },
        schemas: {
          login: z.object({
            email_address: z.email(),
            password: z.string().min(8),
          }).passthrough(),
          user: userSchema,
        },
      },
    },
  },
})
