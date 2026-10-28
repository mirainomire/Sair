<template>
  <main class="login-scene">
    <form class="login-card" novalidate @submit.prevent="submit" :aria-busy="pending">
      <img src="/brand/logo.png" alt="Susi Air" />
      <p class="eyebrow">Pilot portal</p>
      <h1 class="hello">Welcome back</h1>
      <p class="lede">Sign in to view your schedule, documents, and flight hours.</p>
      <label class="field">
        <span>Username</span>
        <input v-model="username" type="text" autocomplete="username" required :aria-invalid="Boolean(validation.username)" :aria-describedby="validation.username ? 'username-error' : undefined" @input="clearMessages" />
        <small v-if="validation.username" id="username-error" class="field-error" role="alert">{{ validation.username }}</small>
      </label>
      <label class="field">
        <span>Password</span>
        <input v-model="password" type="password" autocomplete="current-password" required minlength="6" :aria-invalid="Boolean(validation.password)" :aria-describedby="validation.password ? 'password-error' : undefined" @input="clearMessages" />
        <small v-if="validation.password" id="password-error" class="field-error" role="alert">{{ validation.password }}</small>
      </label>
      <p v-if="message" class="error" role="alert" aria-live="assertive">{{ message }}</p>
      <p v-if="pending" class="kicker" role="status" aria-live="polite">Verifying sign-in details...</p>
      <button class="btn btn-primary btn-block" type="submit" :disabled="pending" :aria-busy="pending">
        {{ pending ? 'Signing in...' : 'Sign in' }}
      </button>
      <button class="btn btn-ghost btn-block" type="button" @click="fillDemo">Use demo account</button>
      <p class="kicker">Demo account: johndoe / susiairtest</p>
    </form>
  </main>
</template>

<script setup lang="ts">
import { errorText } from '~/utils/format'

definePageMeta({ layout: 'auth', pageTransition: false })

const api = useApi()
const token = useAuthToken()
const username = ref('johndoe')
const password = ref('')
const message = ref('')
const pending = ref(false)
const validation = ref({ username: '', password: '' })

function fillDemo() {
  username.value = 'johndoe'
  password.value = 'susiairtest'
  clearMessages()
}

function clearMessages() {
  message.value = ''
  validation.value = { username: '', password: '' }
}

async function submit() {
  clearMessages()
  if (!username.value.trim()) validation.value.username = 'Enter your username.'
  if (password.value.length < 6) validation.value.password = 'Enter a password with at least 6 characters.'
  if (validation.value.username || validation.value.password) return
  pending.value = true
  try {
    const response = await api.post<{ data: { token: string } }>('/auth/login', {
      username: username.value.trim(),
      password: password.value,
    })
    token.value = response.data.token
    await nextTick()
    clearNuxtData()
    await navigateTo({ path: '/', query: { welcome: '1' } })
  } catch (error) {
    message.value = errorText(error)
  } finally {
    pending.value = false
  }
}

useHead({ title: 'Sign in - Susi Air Pilot Portal' })
</script>
