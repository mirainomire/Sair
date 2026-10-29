<template>
  <div>
    <h1 class="page-title">Certificates and documents</h1>
    <p v-if="payload" class="lede doc-reference">Status as of {{ referenceLabel }}.</p>
    <aside v-if="attentionCount" class="documents-alert" role="status">
      <strong>{{ attentionCount }} document{{ attentionCount === 1 ? '' : 's' }} need{{ attentionCount === 1 ? 's' : '' }} attention.</strong>
      <span>Review expired and expiring documents below.</span>
    </aside>
    <p v-if="loadError" class="error">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading certificates and documents" :rows="4" />
    <div v-else class="doc-list">
      <article v-for="item in documents" :id="item.id" :key="item.id" class="doc" :class="item.state">
        <DocMark :id="item.id" />
        <div class="doc-copy">
          <strong>{{ item.label }}</strong>
          <small>{{ remainingLabel(item) }} · Expires {{ formatLong(item.expiryDate) }}</small>
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
    state: 'expired' | 'critical' | 'urgent' | 'soon' | 'safe'
  }[]
}

const api = useApi()
const { data, pending, error } = await useAuthedAsyncData('crew-documents', () => api.get<Envelope<DocumentPayload>>('/documents'))
const payload = computed(() => data.value?.data)
const documents = computed(() => payload.value?.documents ?? [])
const attentionCount = computed(() => documents.value.filter((item) => item.state !== 'safe').length)
const loadError = computed(() => (error.value ? errorText(error.value) : ''))
const referenceLabel = computed(() => (payload.value ? formatLong(payload.value.referenceDate) : ''))

function stateLabel(state: string) {
  if (state === 'expired') return 'Expired'
  if (state === 'critical') return 'Critical'
  if (state === 'urgent') return 'Urgent'
  if (state === 'soon') return 'Due soon'
  return 'Valid'
}

function remainingLabel(item: DocumentPayload['documents'][number]) {
  if (item.daysRemaining <= 0) {
    const days = Math.abs(item.daysRemaining)
    return `${days} day${days === 1 ? '' : 's'} overdue`
  }
  return `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'} remaining`
}

function formatLong(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

useHead({ title: 'Documents - Susi Air Pilot Portal' })
</script>
