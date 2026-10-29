<template>
  <div>
    <header class="block-head account-page-head">
      <NuxtLink class="back-link" to="/more">Back to Profile</NuxtLink>
      <p class="eyebrow">App information</p>
      <h1>Privacy policy</h1>
      <p>How this pilot portal handles information on this device.</p>
    </header>
    <article class="glass policy-card">
      <h2>Data used by the portal</h2>
      <p>The portal uses your authenticated profile, roster, documents, and flight-hour data to provide the operational screens.</p>
      <h2>Local preferences</h2>
      <p>Theme, text size, language, notification preferences, and biometric preference are stored locally in this browser.</p>
      <h2>Support</h2>
      <p>Contact Crew Scheduling or OCC if you need to correct profile data or report an access issue.</p>
    </article>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Privacy policy - Susi Air Pilot Portal' })
</script>
