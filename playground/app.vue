<template>
  <div>
    This is the nuxt auth playground
  </div>
</template>

<script setup>
const token = useAuthToken();
const user = useAuthUser();

console.log(token.value)
console.log(user.value)
</script>
