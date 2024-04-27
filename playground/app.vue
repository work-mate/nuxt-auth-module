<template>
  <div>
    This is the nuxt auth playground

    <button @click="triggerLogin">Login</button>
    <button @click="triggerLogout">Logout</button>

    <pre>
      {{ state }}
    </pre>
  </div>
</template>

<script setup>
const {
  state, login, logout
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
</script>
