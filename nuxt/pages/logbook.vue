<template>
  <div class="duty-log">
    <header class="duty-log-head">
      <h1>Duty log</h1>
      <p>Roster and flight-time summary. Not an official flight logbook.</p>
    </header>

    <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading duty log" :rows="6" />
    <template v-else-if="currentMonth">
      <section class="duty-month-card" aria-label="Month summary">
        <div class="duty-month-nav">
          <button type="button" aria-label="Previous month" :disabled="!olderMonth" @click="stepMonth(1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div class="duty-month-title">
            <strong>{{ currentMonth.label }}</strong>
            <span>{{ formatHours(currentMonth.totalHours) }} · {{ entryCountLabel(currentMonth.entries.length) }}</span>
          </div>
          <button type="button" aria-label="Next month" :disabled="!newerMonth" @click="stepMonth(-1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
        <div class="duty-month-foot">
          <p>Last 12 months · {{ totalActivities }} activities · {{ formatHours(totalHoursValue) }}</p>
          <label class="duty-jump">
            <span>Jump to</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            <select v-model.number="monthIndex" aria-label="Jump to month">
              <option v-for="(month, index) in months" :key="month.value" :value="index">{{ month.label }}</option>
            </select>
          </label>
        </div>
      </section>

      <div class="duty-tools">
        <label class="duty-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input v-model="searchQuery" type="search" aria-label="Search duty log" placeholder="Search date, base, duty" />
        </label>
        <select v-model="selectedActivity" class="duty-filter" aria-label="Filter by activity">
          <option value="all">All activities</option>
          <option v-if="hasFlightTimeOnly" value="flight-time">Flight time only</option>
          <option v-for="type in activityTypes" :key="type" :value="type">{{ dutyTitle(type) }}</option>
        </select>
      </div>

      <section class="duty-list" aria-label="Duty entries">
        <p v-if="visibleEntries.length === 0" class="duty-empty">
          {{ currentMonth.entries.length ? 'No matching entries' : 'No recorded entries' }}
        </p>
        <NuxtLink
          v-for="entry in visibleEntries"
          :key="entry.date"
          class="duty-row"
          :to="`/schedule/${entry.date}`"
        >
          <time :datetime="entry.date">
            <strong>{{ dayNumber(entry.date) }}</strong>
            <small>{{ weekday(entry.date) }}</small>
          </time>
          <span class="duty-row-copy">
            <strong>{{ entryTitle(entry) }}</strong>
            <span class="duty-row-meta">
              <span class="duty-badge" :data-code="badgeCode(entry)">{{ badgeCode(entry) }}</span>
              <span v-if="entryNote(entry)" class="duty-note">{{ entryNote(entry) }}</span>
            </span>
          </span>
          <b>{{ formatHours(entry.hours) }}</b>
        </NuxtLink>
      </section>

      <nav class="duty-pager" aria-label="Month pages">
        <button type="button" :disabled="!olderMonth" @click="stepMonth(1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          {{ olderMonth?.label ?? 'Previous' }}
        </button>
        <span>Month {{ monthIndex + 1 }} of {{ months.length }}</span>
        <button type="button" :disabled="!newerMonth" @click="stepMonth(-1)">
          Next
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </nav>
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
type MonthGroup = { value: string; label: string; entries: LogbookEntry[]; totalHours: number }

const api = useApi()
const pilotStore = usePilotStore()
const searchQuery = ref('')
const selectedActivity = ref('all')
const monthIndex = ref(0)

const { data, pending, error } = await useAuthedAsyncData('pilot-logbook', async () => {
  const pilot = pilotStore.profile
    ? { data: { scheduleToday: pilotStore.profile.scheduleToday } }
    : await api.get<Envelope<{ scheduleToday: string }>>('/pilot/me')
  const referenceDate = pilot.data.scheduleToday
  const start = `${shiftMonth(referenceDate.slice(0, 7), -11)}-01`
  const monthsToLoad = monthRangeBetween(start, referenceDate)
  const [schedules, hours] = await Promise.all([
    Promise.all(monthsToLoad.map(({ year, month }) => api.get<Envelope<SchedulePayload>>('/schedules', { year, month }))),
    api.get<Envelope<HourPayload>>('/flights-hours', { from: start, to: referenceDate }),
  ])

  const dutyByDate = new Map(schedules.flatMap((result) => result.data.entries).map((day) => [day.date, day]))
  const hoursByDate = new Map(hours.data.days.map((day) => [day.date, day.hours]))
  const dates = new Set<string>()
  for (const day of dutyByDate.values()) if (day.countLogbooks > 0) dates.add(day.date)
  for (const day of hours.data.days) if (day.hours > 0) dates.add(day.date)

  const entries: LogbookEntry[] = [...dates]
    .filter((date) => date >= start && date <= referenceDate)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({ date, duty: dutyByDate.get(date) ?? null, hours: hoursByDate.get(date) ?? 0 }))
  return { referenceDate, entries }
}, { lazy: true })

const loadError = computed(() => (error.value ? errorText(error.value) : ''))
const entries = computed(() => data.value?.entries ?? [])
const months = computed<MonthGroup[]>(() => {
  const referenceDate = data.value?.referenceDate
  if (!referenceDate) return []
  return Array.from({ length: 12 }, (_, index) => shiftMonth(referenceDate.slice(0, 7), -index)).map((value) => {
    const group = entries.value.filter((entry) => entry.date.startsWith(value))
    return {
      value,
      label: formatMonth(value),
      entries: group,
      totalHours: group.reduce((sum, entry) => sum + entry.hours, 0),
    }
  })
})
const currentMonth = computed(() => months.value[monthIndex.value] ?? months.value[0])
const olderMonth = computed(() => months.value[monthIndex.value + 1])
const newerMonth = computed(() => (monthIndex.value > 0 ? months.value[monthIndex.value - 1] : undefined))
const activityTypes = computed(() => [...new Set(entries.value.flatMap((entry) => entry.duty ? [entry.duty.dutyType] : []))].sort())
const hasFlightTimeOnly = computed(() => entries.value.some((entry) => !entry.duty))
const visibleEntries = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return (currentMonth.value?.entries ?? []).filter((entry) => {
    const matchesActivity = selectedActivity.value === 'all'
      || (selectedActivity.value === 'flight-time' ? !entry.duty : entry.duty?.dutyType === selectedActivity.value)
    if (!matchesActivity) return false
    if (!query) return true
    return searchableText(entry).includes(query)
  })
})
const totalActivities = computed(() => entries.value.reduce((sum, entry) => sum + (entry.duty?.countLogbooks ?? (entry.hours > 0 ? 1 : 0)), 0))
const totalHoursValue = computed(() => entries.value.reduce((sum, entry) => sum + entry.hours, 0))

function stepMonth(delta: number) {
  const next = monthIndex.value + delta
  if (next < 0 || next >= months.value.length) return
  monthIndex.value = next
}

function shiftMonth(yearMonth: string, delta: number) {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return date.toISOString().slice(0, 7)
}

function monthRangeBetween(start: string, end: string) {
  const [startYear, startMonth] = start.slice(0, 7).split('-').map(Number)
  const [endYear, endMonth] = end.slice(0, 7).split('-').map(Number)
  const result: { year: number; month: number }[] = []
  for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth);) {
    result.push({ year, month })
    month += 1
    if (month === 13) { month = 1; year += 1 }
  }
  return result
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00.000Z`))
}

function dayNumber(iso: string) {
  return String(Number(iso.slice(8, 10)))
}

function weekday(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

function formatHours(hours: number) {
  return `${hours.toFixed(1)} h`
}

function entryCountLabel(count: number) {
  return `${count} ${count === 1 ? 'entry' : 'entries'}`
}

function dutyTitle(code: string) {
  const labels: Record<string, string> = {
    DTY: 'Flight duty', RLV: 'Leave', SCK: 'Sick leave', TRD: 'Travel day',
    TRX: 'Training', ADM: 'Administration', FER: 'Ferry flight',
    MED: 'Medical', REC: 'Recurrent training', ULV: 'Unpaid leave',
  }
  return labels[code] ?? 'Duty'
}

function entryTitle(entry: LogbookEntry) {
  if (!entry.duty) return 'Flight time only'
  const title = dutyTitle(entry.duty.dutyType)
  if (entry.duty.dutyType === 'DTY' && entry.duty.baseName) return `${title} · ${entry.duty.baseName}`
  return title
}

function badgeCode(entry: LogbookEntry) {
  return entry.duty?.dutyType ?? 'FLT'
}

function entryNote(entry: LogbookEntry) {
  if (!entry.duty) return 'No rostered duty'
  if (entry.hours === 0) return 'No flight time recorded'
  return ''
}

function searchableText(entry: LogbookEntry) {
  return [
    entry.date,
    dayNumber(entry.date),
    weekday(entry.date),
    entryTitle(entry),
    badgeCode(entry),
    entryNote(entry),
    entry.duty?.baseName ?? '',
    entry.duty ? dutyTitle(entry.duty.dutyType) : 'Flight time only',
  ].join(' ').toLocaleLowerCase()
}

useHead({ title: 'Duty log - Susi Air Pilot Portal' })
</script>
