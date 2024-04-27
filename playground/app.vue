<template>
  <div>
    This is the nuxt auth playground

    <button @click="triggerLogin">Login</button>
  </div>
</template>

<script setup>
const {
  state, login
} = useAuth();

function triggerLogin() {
  login('local', {
    principal: "david6@email.com",
    password: "password"
  }).then(res => {
    console.log(res)
  })
}
</script>
