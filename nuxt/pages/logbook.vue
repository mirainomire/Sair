<template>
  <div>
    <header class="block-head">
      <h1>Logbook</h1>
      <p>Recorded duties and flight hours for the past 12 months.</p>
    </header>

    <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading logbook" :rows="4" />
    <template v-else-if="data">
      <div class="logbook-summary">
        <article class="glass stat">
          <span>Activities recorded</span>
          <strong>{{ totalActivities }}</strong>
          <small>across {{ entries.length }} days</small>
        </article>
        <article class="glass stat">
          <span>Flight time</span>
          <strong>{{ totalHours }}</strong>
          <small>hours in this period</small>
        </article>
      </div>

      <div v-if="entries.length" class="logbook-tools">
        <label class="logbook-search">
          <svg class="logbook-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
          <input v-model="searchQuery" type="search" aria-label="Search logbook entries" placeholder="Search date, base, or duty" />
        </label>
        <select v-model="selectedActivity" aria-label="Filter by activity type" class="logbook-filter">
          <option value="all">All activities</option>
          <option v-if="hasFlightTimeOnly" value="flight-time">Flight time only</option>
          <option v-for="type in activityTypes" :key="type" :value="type">{{ dutyTitle(type) }}</option>
        </select>
      </div>

      <div v-if="filteredEntries.length" class="logbook-list">
        <NuxtLink v-for="entry in pageEntries" :key="entry.date" class="logbook-entry" :to="`/schedule/${entry.date}`">
          <div class="logbook-line">
            <strong>{{ entryTitle(entry) }}</strong>
            <time :datetime="entry.date">{{ formatDate(entry.date) }}</time>
          </div>
          <div class="logbook-line sub">
            <span>{{ entry.duty ? recordedLabel(entry.duty) : 'Flight time only' }}</span>
            <b>{{ entry.hours.toFixed(1) }} h</b>
          </div>
        </NuxtLink>
        <nav v-if="filteredEntries.length > pageSize" class="logbook-pagination" aria-label="Logbook pages">
          <span class="logbook-page-count">Showing {{ rangeStart }} to {{ rangeEnd }} of {{ filteredEntries.length }}</span>
          <div class="logbook-page-controls">
            <button type="button" aria-label="Previous page" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
            <span>Page {{ currentPage }} of {{ pageCount }}</span>
            <button type="button" aria-label="Next page" :disabled="currentPage === pageCount" @click="currentPage++">Next</button>
          </div>
        </nav>
      </div>
      <article v-else-if="entries.length === 0" class="empty-card">
        <span class="empty-symbol" aria-hidden="true">LOGBOOK</span>
        <h2>No recorded entries</h2>
        <p>There are no recorded duties or flight hours for this period.</p>
        <NuxtLink class="btn btn-primary" to="/schedule">Open schedule</NuxtLink>
      </article>
      <article v-else class="empty-card">
        <span class="empty-symbol" aria-hidden="true">SEARCH</span>
        <h2>No matching entries</h2>
        <p>Try another search or activity type.</p>
        <button class="btn btn-ghost" type="button" @click="clearFilters">Clear search and filters</button>
      </article>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Envelope } from '~/types/api'
import { errorText } from '~/utils/format'

type Duty = {
  date: string
  baseName: string
  dutyType: string
  countSchedules: number
  countLogbooks: number
}

type SchedulePayload = { entries: Duty[] }
type HourPayload = { days: { date: string; hours: number }[] }
type LogbookEntry = { date: string; duty: Duty | null; hours: number }

const api = useApi()
const { data, pending, error } = await useAsyncData('pilot-logbook', async () => {
  const pilot = await api.get<Envelope<{ scheduleToday: string }>>('/pilot/me')
  const referenceDate = pilot.data.scheduleToday
  const months = monthRange(referenceDate, 12)
  const startDate = shiftDate(referenceDate, -364)
  const [schedules, hours] = await Promise.all([
    Promise.all(months.map(({ year, month }) => api.get<Envelope<SchedulePayload>>('/schedules', { year, month }))),
    api.get<Envelope<HourPayload>>('/flight-hours', { from: startDate, to: referenceDate }),
  ])

  const dutyByDate = new Map(schedules.flatMap((result) => result.data.entries).map((day) => [day.date, day]))
  const hoursByDate = new Map(hours.data.days.map((day) => [day.date, day.hours]))
  const dates = new Set<string>()
  for (const day of dutyByDate.values()) if (day.countLogbooks > 0) dates.add(day.date)
  for (const day of hours.data.days) if (day.hours > 0) dates.add(day.date)

  const entries: LogbookEntry[] = [...dates]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({ date, duty: dutyByDate.get(date) ?? null, hours: hoursByDate.get(date) ?? 0 }))
  return { referenceDate, entries }
})

const loadError = computed(() => (error.value ? errorText(error.value) : ''))
const entries = computed(() => data.value?.entries ?? [])
const searchQuery = ref('')
const selectedActivity = ref('all')
const activityTypes = computed(() => [...new Set(entries.value.flatMap((entry) => entry.duty ? [entry.duty.dutyType] : []))].sort())
const hasFlightTimeOnly = computed(() => entries.value.some((entry) => !entry.duty))
const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return entries.value.filter((entry) => {
    const matchesActivity = selectedActivity.value === 'all'
      || (selectedActivity.value === 'flight-time' ? !entry.duty : entry.duty?.dutyType === selectedActivity.value)
    if (!matchesActivity) return false
    if (!query) return true
    const searchable = [
      entry.date,
      formatDate(entry.date),
      entry.duty ? dutyTitle(entry.duty.dutyType) : 'Flight time only',
      entry.duty?.baseName ?? '',
    ].join(' ').toLocaleLowerCase()
    return searchable.includes(query)
  })
})
const pageSize = 7
const currentPage = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(filteredEntries.value.length / pageSize)))
const pageEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredEntries.value.slice(start, start + pageSize)
})
const rangeStart = computed(() => (filteredEntries.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize, filteredEntries.value.length))
const totalActivities = computed(() => entries.value.reduce((sum, entry) => sum + (entry.duty?.countLogbooks ?? 0), 0))
const totalHours = computed(() => entries.value.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1))

watch([entries, searchQuery, selectedActivity], () => {
  currentPage.value = 1
})

function clearFilters() {
  searchQuery.value = ''
  selectedActivity.value = 'all'
  currentPage.value = 1
}

function monthRange(iso: string, count: number) {
  const [year, month] = iso.slice(0, 7).split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1))
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
  })
}

function shiftDate(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00.000Z`))
}

function entryTitle(entry: LogbookEntry) {
  if (!entry.duty) return 'Flight time'
  const title = dutyTitle(entry.duty.dutyType)
  if (entry.duty.dutyType === 'DTY' && entry.duty.baseName) return `${title} (${entry.duty.baseName})`
  return title
}

function recordedLabel(duty: Duty) {
  return `${duty.countLogbooks} of ${duty.countSchedules} activities recorded`
}

function dutyTitle(code: string) {
  const labels: Record<string, string> = {
    DTY: 'Flight duty', RLV: 'Leave', SCK: 'Sick leave', TRD: 'Travel day',
    TRX: 'Training', ADM: 'Administration', FER: 'Ferry flight',
    MED: 'Medical', REC: 'Recurrent training', ULV: 'Unpaid leave',
  }
  return labels[code] ?? 'Duty'
}

useHead({ title: 'Logbook - Susi Air Pilot Portal' })
</script>
