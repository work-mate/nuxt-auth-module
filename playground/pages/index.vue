<template>
  <div>
    This is the nuxt auth playground
    <button @click="trigger">use auth fetch</button>
    <test-navigations />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false,
});

// onMounted(() => {
//   console.log($fetch)
//   // debugger

// })

function trigger() {
  useAuthFetch('/api/auth/melting');
}
</script>
