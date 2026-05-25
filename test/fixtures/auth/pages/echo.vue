<script setup>
const { data } = await useAuthFetch('/api/mock/echo-headers')
</script>
<template>
  <div id="echo">{{ data }}</div>
</template>
