<template>
  <div>
    <header class="block-head account-page-head">
      <p class="eyebrow">Crew profile</p>
      <h1>Pilot profile</h1>
      <p>Your rank, base, and account information.</p>
    </header>
    <p v-if="loadError" class="error">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading pilot profile" :rows="2" />
    <template v-else-if="pilot">
      <article class="glass account-overview">
        <PilotAvatar :src="pilot.avatarUrl" :name="pilot.name" />
        <div class="account-overview-copy">
          <span class="account-rank">{{ pilot.rank }}</span>
          <h2>{{ pilot.name }}</h2>
          <p>Home base <strong>{{ pilot.homeBase }}</strong></p>
        </div>
      </article>

      <NuxtLink class="contact-link" to="/documents">
        <span><strong>Certificates and documents</strong><small>Check expiry dates and status</small></span>
        <span aria-hidden="true">Open</span>
      </NuxtLink>
      <button class="btn btn-danger btn-block account-signout" type="button" :disabled="signingOut" :aria-busy="signingOut" @click="logout">
        {{ signingOut ? 'Signing out...' : 'Sign out' }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Envelope } from '~/types/api'
import { errorText } from '~/utils/format'
import type { PilotProfile } from '~/stores/pilot'

const api = useApi()
const token = useAuthToken()
const pilotStore = usePilotStore()
const signingOut = ref(false)
const { data, pending, error } = await useAuthedAsyncData('more-pilot', () => api.get<Envelope<PilotProfile>>('/pilot/me'))
const pilot = computed(() => data.value?.data)
const loadError = computed(() => (error.value ? errorText(error.value) : ''))

watch(pilot, (value) => {
  if (value) pilotStore.setProfile(value)
}, { immediate: true })

async function logout() {
  signingOut.value = true
  token.value = null
  pilotStore.clear()
  clearNuxtData()
  await navigateTo('/login')
}

useHead({ title: 'Pilot profile - Susi Air Pilot Portal' })
</script>
