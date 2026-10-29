<template>
  <NuxtLoadingIndicator color="#22C5E8" :height="3" />
  <div v-if="routeLoading" class="route-loading" role="status" aria-live="polite">
    <div class="route-loading-card">
      <SkeletonLoader label="Loading page" :rows="3" />
    </div>
  </div>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useAppearance()

const router = useRouter()
const routeLoading = ref(false)

if (import.meta.client) {
  router.beforeEach(() => {
    routeLoading.value = true
  })
  router.afterEach(() => {
    routeLoading.value = false
  })
  router.onError(() => {
    routeLoading.value = false
  })
}
</script>
