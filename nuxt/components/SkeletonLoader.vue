<template>
  <div class="skeleton-loader" role="status" aria-live="polite" :aria-label="label">
    <span class="skeleton-bar skeleton-title" />
    <span class="skeleton-bar skeleton-copy" />
    <div v-for="row in rows" :key="row" class="skeleton-card">
      <span class="skeleton-bar skeleton-icon" />
      <span class="skeleton-lines">
        <i class="skeleton-bar skeleton-line" />
        <i class="skeleton-bar skeleton-line short" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  rows?: number
}>(), {
  label: 'Loading content',
  rows: 2,
})
</script>
