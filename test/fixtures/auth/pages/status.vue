<script setup>
const { isLoggedIn, user } = useAuthUser()
</script>
<template>
  <div id="status">
    <span data-testid="logged-in">{{ isLoggedIn }}</span>
    <span data-testid="user-id">{{ user?.id ?? '' }}</span>
    <span data-testid="user-email">{{ user?.email ?? '' }}</span>
  </div>
</template>
