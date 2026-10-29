<template>
  <nav class="tabbar" aria-label="Main navigation">
    <NuxtLink to="/" :class="{ active: route.path === '/' }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" /></svg>
      Home
    </NuxtLink>
    <NuxtLink to="/schedule" :class="{ active: route.path.startsWith('/schedule') }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 5h14v14H5z" /><path d="M5 9h14M9 5v4" /></svg>
      Schedule
    </NuxtLink>
    <NuxtLink to="/logbook" :class="{ active: route.path.startsWith('/logbook') }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2Z" /></svg>
      Logbook
    </NuxtLink>
    <NuxtLink to="/more" :class="{ active: route.path.startsWith('/more') }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></svg>
      Profile
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
