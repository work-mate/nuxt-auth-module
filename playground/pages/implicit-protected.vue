<template>
  <div>
    Only logged in users can access this page

    <test-navigations />
  </div>
</template>

<script setup lang="ts">

const {
  state
} = useAuth();
</script>
