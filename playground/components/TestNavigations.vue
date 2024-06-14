<template>
  <div>
    <div style="margin-bottom: 56px">
      <NuxtLink to="/protected"> Protected </NuxtLink>
      <br />
      <NuxtLink to="/only-guest"> Only Guest Page </NuxtLink>
      <br />
      <NuxtLink to="/implicit-protected"> Implicit Protected </NuxtLink>
    </div>

    <button @click="triggerLogin">Login</button>
    <button @click="triggerLoginWithGithub">Github login</button>
    <button @click="triggerLoginWithGoogle">Google login</button>
    <button @click="triggerLogout">Logout</button>
    <button @click="triggerRefreshUser">Refresh User</button>
    <button @click="trigger">use auth fetch</button>
    <button @click="triggerAlways401">Always 401</button>

    <pre>
      {{ state }}
    </pre>
  </div>
</template>

<script setup>
const {
  loggedIn,
  user,
  token,
  refreshToken,
  provider,
  tokenType,
  login,
  logout,
  refreshUser,
} = useAuth();

const state = computed(() => ({
  loggedIn: loggedIn.value,
  user: user.value,
  token: token.value,
  refreshToken: refreshToken.value,
  provider: provider.value,
  tokenType: tokenType.value,
}));

function triggerLogin() {
  login("local", {
    principal: "david6@email.com",
    password: "password",
  }).then((res) => {
    console.log(res);
  });
}

function triggerLogout() {
  logout().then((res) => {
    console.log(res);
  });
}
function triggerLoginWithGoogle() {
  login("google").then((res) => {
    console.log(res);
  });
  console.log("login with google");
}

function triggerLoginWithGithub() {
  login("github").then((res) => {
    console.log(res);
  });
  console.log("login with google");
}
async function triggerRefreshUser() {
  await refreshUser();
}

function trigger() {
  useAuthFetch("/api/auth/melting");
}

function triggerAlways401() {
  useAuthFetch("/api/auth/always-401", {
    method: "POST",
  });
}
</script>
