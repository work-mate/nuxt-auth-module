<template>
  <div>
    This is the nuxt auth playground
  </div>
</template>

<script setup>
const {
  token, user, options
} = useAuth();

console.log(options);
</script>
