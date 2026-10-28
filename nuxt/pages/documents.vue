<template>
  <div>
    <h1 class="page-title">Certificates and documents</h1>
    <p v-if="payload" class="lede doc-reference">Status as of {{ referenceLabel }}.</p>
    <p v-if="loadError" class="error">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading certificates and documents" :rows="4" />
    <div v-else class="doc-list">
      <article v-for="item in documents" :key="item.id" class="doc" :class="item.state">
        <DocMark :id="item.id" />
        <div class="doc-copy">
          <strong>{{ item.label }}</strong>
          <small>Expires {{ formatLong(item.expiryDate) }}</small>
        </div>
        <span class="doc-status">{{ stateLabel(item.state) }}</span>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Envelope } from '~/types/api'
import { errorText } from '~/utils/format'

type DocumentPayload = {
  pilotName: string
  referenceDate: string
  warningDays: number
  documents: {
    id: string
    label: string
    expiryDate: string
    daysRemaining: number
    state: 'expired' | 'soon' | 'safe'
  }[]
}

const api = useApi()
const { data, pending, error } = await useAsyncData('crew-documents', () => api.get<Envelope<DocumentPayload>>('/documents'))
const payload = computed(() => data.value?.data)
const documents = computed(() => payload.value?.documents ?? [])
const loadError = computed(() => (error.value ? errorText(error.value) : ''))
const referenceLabel = computed(() => (payload.value ? formatLong(payload.value.referenceDate) : ''))

function stateLabel(state: string) {
  if (state === 'expired') return 'Expired'
  if (state === 'soon') return 'Due soon'
  return 'Valid'
}

function formatLong(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

useHead({ title: 'Documents - Susi Air Pilot Portal' })
</script>
