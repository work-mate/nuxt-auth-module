<template>
  <div>
    Only logged in users can access this page
    <pre>
        {{ state }}
      </pre>
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
