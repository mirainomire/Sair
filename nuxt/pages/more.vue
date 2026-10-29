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
      <section class="profile-details" aria-labelledby="profile-details-title">
        <div class="appearance-heading">
          <strong id="profile-details-title">Pilot details</strong>
          <small>Verify these details before operating.</small>
        </div>
        <dl class="profile-detail-grid">
          <div><dt>Crew ID</dt><dd>{{ pilot.crewId || 'Not provided' }}</dd></div>
          <div><dt>Aircraft ratings</dt><dd>{{ pilot.aircraftRatings?.length ? pilot.aircraftRatings.join(', ') : 'Not provided' }}</dd></div>
          <div><dt>Email</dt><dd>{{ pilot.email || 'Not provided' }}</dd></div>
          <div><dt>Mobile</dt><dd>{{ pilot.mobile || 'Not provided' }}</dd></div>
        </dl>
        <NuxtLink class="report-data-link" to="/contact">Report incorrect profile data</NuxtLink>
      </section>

      <NuxtLink class="contact-link" to="/documents">
        <span><strong>Certificates and documents</strong><small>Check expiry dates and status</small></span>
        <span aria-hidden="true">Open</span>
      </NuxtLink>
      <NuxtLink class="contact-link" to="/contact">
        <span><strong>Crew operations contacts</strong><small>Reach Crew Scheduling or OCC directly</small></span>
        <span aria-hidden="true">Open</span>
      </NuxtLink>
      <section class="appearance-settings" aria-labelledby="appearance-title">
        <div class="appearance-heading">
          <strong id="appearance-title">Appearance</strong>
          <small>Adjust the app for your preference</small>
        </div>
        <div class="appearance-group">
          <span class="appearance-label">Theme</span>
          <div class="appearance-options">
            <button type="button" :class="{ active: theme === 'light' }" :aria-pressed="theme === 'light'" @click="theme = 'light'">Light</button>
            <button type="button" :class="{ active: theme === 'dark' }" :aria-pressed="theme === 'dark'" @click="theme = 'dark'">Dark</button>
          </div>
        </div>
        <div class="appearance-group">
          <span class="appearance-label">Text size</span>
          <div class="appearance-options size-options">
            <button type="button" :class="{ active: textSize === 'small' }" :aria-pressed="textSize === 'small'" @click="textSize = 'small'">A</button>
            <button type="button" :class="{ active: textSize === 'normal' }" :aria-pressed="textSize === 'normal'" @click="textSize = 'normal'">A</button>
            <button type="button" :class="{ active: textSize === 'large' }" :aria-pressed="textSize === 'large'" @click="textSize = 'large'">A</button>
          </div>
        </div>
        <label class="appearance-group appearance-select-group">
          <span class="appearance-label">Language</span>
          <select v-model="language" aria-label="Language" class="settings-select">
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </label>
      </section>
      <section class="security-settings" aria-labelledby="security-title">
        <div class="appearance-heading">
          <strong id="security-title">Account security</strong>
          <small>Protect access to your pilot account.</small>
        </div>
        <label class="notification-option">
          <span><strong>Biometric unlock</strong><small>Use Face ID or fingerprint when supported by this device.</small></span>
          <input v-model="biometricUnlock" type="checkbox" :disabled="!biometricSupported" />
        </label>
        <p v-if="!biometricSupported" class="settings-note">Biometric unlock is not available in this browser yet.</p>
      </section>
      <section class="notification-settings" aria-labelledby="notification-title">
        <div class="appearance-heading">
          <strong id="notification-title">Notifications</strong>
          <small>Choose the operational updates you want to receive.</small>
        </div>
        <label class="notification-option">
          <span><strong>Roster changes</strong><small>Be alerted when a duty is added, changed, or removed.</small></span>
          <input v-model="notificationSettings.rosterChanges" type="checkbox" />
        </label>
        <label class="notification-option">
          <span><strong>Documents due soon</strong><small>Be alerted when a document reaches the 30-day warning tier.</small></span>
          <input v-model="notificationSettings.documentDueSoon" type="checkbox" />
        </label>
        <label class="notification-option">
          <span><strong>Flight-hour limits</strong><small>Be alerted when recorded hours approach a configured limit.</small></span>
          <input v-model="notificationSettings.flightHourLimits" type="checkbox" />
        </label>
        <p class="settings-note">Saved on this device. Notifications are shown when the matching data is refreshed.</p>
      </section>
      <section class="app-settings" aria-labelledby="app-settings-title">
        <div class="appearance-heading">
          <strong id="app-settings-title">App and support</strong>
          <small>Useful information for this installation.</small>
        </div>
        <div class="app-settings-row"><span>App version</span><strong>1.0.0</strong></div>
        <NuxtLink class="app-settings-link" to="/privacy"><span>Privacy policy</span><span aria-hidden="true">Open</span></NuxtLink>
        <NuxtLink class="app-settings-link" to="/contact"><span>Report a profile or contact issue</span><span aria-hidden="true">Open</span></NuxtLink>
      </section>
      <button class="btn btn-danger btn-block account-signout" type="button" :disabled="signingOut" :aria-busy="signingOut" @click="confirmSignOut = true">
        {{ signingOut ? 'Signing out...' : 'Sign out' }}
      </button>
      <div v-if="confirmSignOut" class="confirm-backdrop" role="presentation" @click.self="confirmSignOut = false">
        <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="signout-title" aria-describedby="signout-description">
          <h2 id="signout-title">Sign out?</h2>
          <p id="signout-description">You will need to sign in again to access your pilot portal.</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" type="button" @click="confirmSignOut = false">Cancel</button>
            <button class="btn btn-danger" type="button" :disabled="signingOut" @click="logout">{{ signingOut ? 'Signing out...' : 'Sign out' }}</button>
          </div>
        </section>
      </div>
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
const confirmSignOut = ref(false)
const { theme, textSize } = useAppearance()
const { language } = useLanguage()
const { settings: notificationSettings } = useNotifications()
const biometricSupported = ref(false)
const biometricUnlock = ref(false)
const { data, pending, error } = await useAuthedAsyncData('more-pilot', () => {
  if (pilotStore.profile) return Promise.resolve({ data: pilotStore.profile })
  return api.get<Envelope<PilotProfile>>('/pilot/me')
})
const pilot = computed(() => data.value?.data)
const loadError = computed(() => (error.value ? errorText(error.value) : ''))

watch(pilot, (value) => {
  if (value) pilotStore.setProfile(value)
}, { immediate: true })

onMounted(() => {
  biometricSupported.value = typeof window !== 'undefined' && 'PublicKeyCredential' in window
  biometricUnlock.value = localStorage.getItem('susiair-biometric-unlock') === 'true'
})

watch(biometricUnlock, (value) => {
  if (import.meta.client) localStorage.setItem('susiair-biometric-unlock', String(value))
})

async function logout() {
  signingOut.value = true
  token.value = null
  pilotStore.clear()
  clearNuxtData()
  await navigateTo('/login')
}

useHead({ title: 'Pilot profile - Susi Air Pilot Portal' })
</script>
