<template>
  <div>
    Login Page:: Only guests can access this page
    <pre>
        {{ state }}
      </pre>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["auth-guest"],
});

const {
  state
} = useAuth();
</script>
