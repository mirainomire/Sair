<template>
  <div>
    <header class="block-head">
      <h1>Schedule</h1>
      <p>Monthly duties from the roster.</p>
    </header>
    <p v-if="loadError" class="error">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading schedule" :rows="4" />
    <template v-else-if="payload">
      <div class="month-bar">
        <button type="button" aria-label="Previous month" @click="shift(-1)">&lt;</button>
        <h1>{{ monthLabel }}</h1>
        <button type="button" aria-label="Next month" @click="shift(1)">&gt;</button>
      </div>
      <div class="weekdays">
        <span v-for="name in weekdays" :key="name">{{ name }}</span>
      </div>
      <div class="cal-grid">
        <button
          v-for="(cell, index) in cells"
          :key="cell?.date ?? `blank-${index}`"
          type="button"
          class="cal-cell"
          :class="{ blank: !cell, today: cell?.date === payload.today, 'has-duty': Boolean(cell?.duty) }"
          :style="cell?.duty ? { '--duty-color': cell.duty.baseColor } : undefined"
          :aria-label="cell ? calendarLabel(cell) : undefined"
          :disabled="!cell"
          @click="cell && openDay(cell.date)"
        >
          <template v-if="cell">
            <span v-if="cell.duty" class="mark" :class="{ complete: cell.duty.countLogbooks === cell.duty.countSchedules }">{{ dutyMark(cell.duty) }}</span>
            <span class="num">{{ cell.day }}</span>
            <span v-if="cell.duty" class="code">{{ cell.duty.baseName }}</span>
          </template>
        </button>
      </div>
      <div class="legend">
        <span v-for="item in payload.legend" :key="item.code"><i :style="{ background: item.color }" /><b>{{ item.code }}</b>{{ item.label }}</span>
      </div>
      <p class="calendar-hint">A tick means every duty is logged. A number is the count still remaining.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Envelope } from '~/types/api'
import { errorText } from '~/utils/format'

type Duty = {
  date: string
  baseName: string
  baseColor: string
  dutyType: string
  countSchedules: number
  countLogbooks: number
}

type CalendarPayload = {
  today: string
  legend: { code: string; label: string; color: string }[]
  entries: Duty[]
}

const api = useApi()
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthKey = ref('')

const { data: me, error: meError } = await useAuthedAsyncData('pilot-me-schedule', () => api.get<Envelope<{ scheduleToday: string }>>('/pilot/me'))
const sampleToday = me.value?.data.scheduleToday ?? ''
monthKey.value = sampleToday.slice(0, 7)

const { data, pending, error } = await useAuthedAsyncData(
  () => `schedule-${monthKey.value || 'pending'}`,
  () => {
    if (!monthKey.value) return Promise.resolve(null)
    const [year, month] = monthKey.value.split('-')
    return api.get<Envelope<CalendarPayload>>('/schedules', { year, month })
  },
  { watch: [monthKey] },
)

const payload = computed(() => data.value?.data)
const loadError = computed(() => (meError.value ? errorText(meError.value) : error.value ? errorText(error.value) : ''))
const monthLabel = computed(() => {
  if (!monthKey.value) return ''
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${monthKey.value}-01T00:00:00.000Z`),
  )
})

const cells = computed(() => {
  const month = monthKey.value
  if (!month || !payload.value) return []
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year, monthNumber - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const byDate = new Map(payload.value.entries.map((day) => [day.date, day]))
  const items: ({ date: string; day: number; duty: Duty | null } | null)[] = Array.from({ length: lead }, () => null)
  for (let day = 1; day <= count; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`
    items.push({ date, day, duty: byDate.get(date) ?? null })
  }
  return items
})

function dutyMark(duty: Duty) {
  const remaining = duty.countSchedules - duty.countLogbooks
  return remaining === 0 ? '✓' : String(remaining)
}

function calendarLabel(cell: { date: string; duty: Duty | null }) {
  const dateLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(`${cell.date}T00:00:00.000Z`))
  if (!cell.duty) return `${dateLabel}, no duty recorded`
  const mark = dutyMark(cell.duty) === '✓' ? 'all duties logged' : `${dutyMark(cell.duty)} duties remaining`
  return `${dateLabel}, ${cell.duty.baseName}, ${mark}`
}

function shift(delta: number) {
  if (!monthKey.value) return
  const [year, monthNumber] = monthKey.value.split('-').map(Number)
  monthKey.value = new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7)
}

function openDay(date: string) {
  return navigateTo(`/schedule/${date}`)
}

useHead({ title: 'Schedule - Susi Air Pilot Portal' })
</script>
