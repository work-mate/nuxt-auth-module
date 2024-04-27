<template>
  <div>
    Only logged in users can access this page
    <pre>
        {{ state }}
      </pre>
  </div>
</template>

<script setup lang="ts">

const {
  state
} = useAuth();
</script>
