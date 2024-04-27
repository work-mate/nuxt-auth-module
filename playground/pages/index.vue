<template>
  <div>
    This is the nuxt auth playground
    <div style="margin-bottom: 56px;">
      <NuxtLink to="/protected">Protected</NuxtLink>
      <br />
      <NuxtLink to="/only-guest">Only Guest Page</NuxtLink>
    </div>

    <button @click="triggerLogin">Login</button>
    <button @click="triggerLogout">Logout</button>
    <button @click="triggerRefreshUser">Refresh User</button>

    <pre>
      {{ state }}
    </pre>
  </div>
</template>

<script setup>
const {
  state, login, logout, refreshUser
} = useAuth();

function triggerLogin() {
  login('local', {
    principal: "david6@email.com",
    password: "password"
  }).then(res => {
    console.log(res)
  })
}

function triggerLogout() {
  logout().then(res => {
    console.log(res)
  })
}

async function triggerRefreshUser() {
  await refreshUser()
}
</script>
