<template>
  <div>
    Only logged in users can access this page

    <test-navigations />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

const {
  state
} = useAuth();
</script>
