<template>
  <header class="topbar">
    <NuxtLink to="/" class="brand" aria-label="Susi Air Pilot Portal, home">
      <img src="/brand/logo.png" alt="Susi Air" />
      <span>Pilot Portal</span>
    </NuxtLink>
    <div class="sync-indicator" :class="{ offline: !isOnline }" role="status" aria-live="polite">
      <span class="sync-dot" aria-hidden="true" />
      <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
      <small v-if="lastSyncedLabel">{{ lastSyncedLabel }}</small>
    </div>
  </header>
</template>

<script setup lang="ts">
const pilotStore = usePilotStore()
const isOnline = ref(true)
const lastSyncedAt = ref('')
const now = ref(Date.now())
let syncClock: ReturnType<typeof setInterval> | undefined
const lastSyncedLabel = computed(() => {
  const iso = lastSyncedAt.value || pilotStore.profile?.lastSyncedAt
  if (!iso) return ''
  const elapsedMinutes = Math.max(0, Math.floor((now.value - new Date(iso).getTime()) / 60_000))
  if (elapsedMinutes < 1) return 'Updated just now'
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes} minutes ago`
  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `Updated ${elapsedHours} hours ago`
  return `Updated ${Math.floor(elapsedHours / 24)} days ago`
})

function updateConnectionStatus() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  lastSyncedAt.value = localStorage.getItem('susiair_last_synced_at') ?? ''
  updateConnectionStatus()
  syncClock = setInterval(() => { now.value = Date.now() }, 60_000)
  window.addEventListener('online', updateConnectionStatus)
  window.addEventListener('offline', updateConnectionStatus)
})

onBeforeUnmount(() => {
  if (syncClock) clearInterval(syncClock)
  window.removeEventListener('online', updateConnectionStatus)
  window.removeEventListener('offline', updateConnectionStatus)
})
</script>
