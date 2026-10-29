<template>
  <div>
    <header class="contact-page-head">
      <p class="eyebrow">Need a hand?</p>
      <h1>Crew operations contacts</h1>
      <p>Use the right operational desk for roster, dispatch, or account support.</p>
    </header>

    <div class="contact-panels">
      <section class="contact-panel">
        <div class="contact-panel-heading">
          <span class="contact-kicker">Operational support</span>
          <h2>Who should I contact?</h2>
          <p>Keep your Crew ID and the affected schedule date ready when asking for help.</p>
        </div>
        <section class="operations-contact">
          <div class="contact-method-copy"><small>Crew Scheduling</small><strong>Roster changes, leave, and duty questions</strong></div>
          <div class="contact-actions"><a v-if="contacts.crewScheduling.phone" :href="`tel:${contacts.crewScheduling.phone}`" class="contact-action">Call</a><a v-if="contacts.crewScheduling.whatsapp" :href="`https://wa.me/${contacts.crewScheduling.whatsapp}`" class="contact-action">WhatsApp</a></div>
          <small class="contact-hours">{{ contacts.crewScheduling.hours }}</small>
        </section>
        <section class="operations-contact">
          <div class="contact-method-copy"><small>Operations Control (OCC)</small><strong>Urgent operational and dispatch matters</strong></div>
          <div class="contact-actions"><a v-if="contacts.occ.phone" :href="`tel:${contacts.occ.phone}`" class="contact-action">Call</a><a v-if="contacts.occ.whatsapp" :href="`https://wa.me/${contacts.occ.whatsapp}`" class="contact-action">WhatsApp</a></div>
          <small class="contact-hours">{{ contacts.occ.hours }}</small>
        </section>
        <p v-if="!hasConfiguredContact" class="contact-unconfigured">Official phone and WhatsApp details have not been configured yet.</p>
      </section>

      <p class="contact-footer">For urgent operational matters, contact OCC first and follow your airline's established crew communication procedure.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Envelope } from '~/types/api'
import type { PilotProfile } from '~/stores/pilot'

const api = useApi()
const { data } = await useAuthedAsyncData('operations-contacts', () => api.get<Envelope<PilotProfile>>('/pilot/me'))
const contacts = computed(() => data.value?.data.operationsContacts ?? {
  crewScheduling: { phone: '', whatsapp: '', hours: 'Service hours: Not provided' },
  occ: { phone: '', whatsapp: '', hours: 'Service hours: Not provided' },
})
const hasConfiguredContact = computed(() => Object.values(contacts.value).some((contact) => contact.phone || contact.whatsapp))
useHead({ title: 'Crew operations contacts - Susi Air Pilot Portal' })
</script>
