<template>
  <div>
    Login Page:: Only guests can access this page
    <test-navigations />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["auth-guest"],
});
</script>
