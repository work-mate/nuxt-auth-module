export default defineNuxtConfig({
  modules: ["../src/module"],
  auth: {
    global: true,
    redirects: {
      redirectIfLoggedIn: "/protected",
    },
    apiClient: {
      baseURL: "http://localhost:8080",
    },
    providers: {
      local: {
        endpoints: {
          user: {
            path: "http://localhost:8080/api/auth/user",
            userKey: "user",
          },
          signIn: {
            path: "http://localhost:8080/api/auth/login/password",
            body: {
              principal: "email_address",
            },
            tokenKey: "token",
            refreshTokenKey: "refresh_token",
          },
          refreshToken: {
            path: "http://localhost:8080/api/auth/refresh",
            method: "POST",
            tokenKey: "token",
            refreshTokenKey: "refresh_token",
            body: {
              token: "token",
              refreshToken: "refresh_token",
            },
          },
        },
      },
      github: {
        CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
        CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
        HASHING_SECRET: process.env.HASHING_SECRET || "secret",
        SCOPES: "user repo",
      },
      google: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
        HASHING_SECRET: process.env.HASHING_SECRET || "secret",
        SCOPES:
          "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      },
    },
  },
  devtools: { enabled: true },
});
