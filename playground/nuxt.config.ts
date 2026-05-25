import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().optional(),
});

export default defineNuxtConfig({
  modules: ["../src/module"],
  auth: {
    global: true,
    redirects: {
      redirectIfLoggedIn: "/protected",
    },
    apiClient: {
      baseURL: "http://localhost:3000",
    },
    providers: {
      local: {
        endpoints: {
          user: {
            path: "http://localhost:3000/api/auth/user",
            userKey: "user",
          },
          signIn: {
            path: "http://localhost:3000/api/auth/login/password",
            tokenKey: "token",
            refreshTokenKey: "refresh_token",
          },
          refreshToken: {
            path: "http://localhost:3000/api/auth/refresh",
            method: "POST",
            tokenKey: "token",
            refreshTokenKey: "refresh_token",
            body: {
              token: "token",
              refreshToken: "refresh_token",
            },
          },
        },
        schemas: {
          login: z.object({
            email_address: z.email(),
            password: z.string().min(8),
          }),
          user: userSchema,
        },
      },
      github: {
        CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
        CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
        HASHING_SECRET: process.env.HASHING_SECRET || "secret",
        SCOPES: "user repo",
        schemas: { user: userSchema },
      },
      google: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
        HASHING_SECRET: process.env.HASHING_SECRET || "secret",
        SCOPES:
          "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        schemas: { user: userSchema },
      },
    },
  },
  devtools: { enabled: true },
});
