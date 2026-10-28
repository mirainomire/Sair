<template>
  <span class="doc-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="kind === 'medical'">
        <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" />
      </template>
      <template v-else-if="kind === 'license'">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 10h4M7 14h6" />
      </template>
      <template v-else-if="kind === 'security'">
        <path d="M12 3l7 3v6c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </template>
      <template v-else-if="kind === 'check'">
        <rect x="6" y="3.5" width="12" height="17" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </template>
      <template v-else>
        <path d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="8" />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ id?: string }>()

const kind = computed(() => {
  if (props.id === 'doc_medical') return 'medical'
  if (props.id === 'doc_license') return 'license'
  if (props.id === 'doc_security') return 'security'
  if (props.id === 'doc_ppc') return 'check'
  return 'recurrent'
})
</script>
