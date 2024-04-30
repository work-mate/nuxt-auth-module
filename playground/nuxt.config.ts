export default defineNuxtConfig({
  modules: ['../src/module'],
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
            path:  "http://localhost:8080/api/auth/login/password",
            body: {
              principal: "email_address"
            },
          }
        }
      },
    }
  },
  devtools: { enabled: true }
})
