<template>
  <div class="schedule-page">
    <header class="block-head duty-log-head">
      <h1>Schedule</h1>
      <p>Your roster at a glance.</p>
    </header>
    <p v-if="loadError" class="error">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading schedule" :rows="4" />
    <template v-else-if="payload">
      <div class="view-switch" role="tablist" aria-label="Schedule view">
        <button type="button" role="tab" :aria-selected="viewMode === 'today'" :class="{ on: viewMode === 'today' }" @click="viewMode = 'today'">Today</button>
        <button type="button" role="tab" :aria-selected="viewMode === 'week'" :class="{ on: viewMode === 'week' }" @click="viewMode = 'week'">Weekly</button>
        <button type="button" role="tab" :aria-selected="viewMode === 'month'" :class="{ on: viewMode === 'month' }" @click="viewMode = 'month'">Monthly</button>
      </div>

      <template v-if="viewMode === 'today'">
      <article class="today-duty-card">
        <div class="today-duty-date">
          <small>{{ formatWeekday(payload.today) }}</small>
          <strong>{{ formatDay(payload.today) }}</strong>
          <span>{{ formatMonthYear(payload.today) }}</span>
        </div>
        <div v-if="todayDuty" class="today-duty-info">
          <strong>{{ todayDuty.baseName }} · {{ dutyTitle(todayDuty.dutyType) }}</strong>
          <small>{{ dutyProgress(todayDuty) }}</small>
        </div>
        <div v-else class="today-duty-info">
          <strong>No duty scheduled</strong>
          <small>There is no roster entry for today.</small>
        </div>
      </article>
      <article v-if="viewMode === 'today' && nextDutyEntry" class="week-duty-card schedule-next-duty" aria-label="Next duty">
        <span class="eyebrow">Next duty</span>
        <strong>{{ nextDutyEntry.baseName }} - {{ dutyTitle(nextDutyEntry.dutyType) }}</strong>
        <small>{{ formatLongDate(nextDutyEntry.date) }} - {{ dutyProgress(nextDutyEntry) }}</small>
      </article>
      </template>

      <template v-else-if="viewMode === 'week'">
        <div class="week-strip" role="tablist" aria-label="Days this week">
          <button class="week-nav-button" type="button" aria-label="Previous week" @click="weekOffset--">&lsaquo;</button>
          <button v-for="day in weekDays" :key="day.date" type="button" :class="{ on: selectedWeekDate === day.date }" @click="selectedWeekDate = day.date">
            <small>{{ day.weekday }}</small>
            <b>{{ day.day }}</b>
          </button>
          <button class="week-nav-button" type="button" aria-label="Next week" @click="weekOffset++">&rsaquo;</button>
        </div>
        <article class="week-duty-card">
          <template v-if="selectedWeekDuty">
            <strong>{{ selectedWeekDuty.baseName }} · {{ dutyTitle(selectedWeekDuty.dutyType) }}</strong>
            <small>{{ formatLongDate(selectedWeekDate) }} · {{ dutyProgress(selectedWeekDuty) }}</small>
          </template>
          <template v-else>
            <strong>No duty scheduled</strong>
            <small>{{ formatLongDate(selectedWeekDate) }}</small>
          </template>
        </article>
      </template>

      <template v-else>
        <div class="month-bar">
          <button type="button" aria-label="Previous month" @click="shift(-1)">&lt;</button>
          <h1>{{ monthLabel }}</h1>
          <button type="button" aria-label="Next month" @click="shift(1)">&gt;</button>
        </div>
        <button v-if="monthKey !== todayMonthKey" class="today-jump" type="button" @click="jumpToToday">Back to today</button>
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
              <span v-if="cell.duty" class="code">{{ cellCode(cell.duty) }}</span>
            </template>
          </button>
        </div>
        <div class="legend">
          <span v-for="item in payload.legend" :key="item.code"><i :style="{ background: item.color }" /><b>{{ item.code }}</b>{{ item.label }}</span>
          <span class="legend-no-roster"><i /> <b>—</b> No roster entry</span>
        </div>
        <p class="calendar-hint">Tap any date to open duty details. Number = scheduled sectors; ✓ = all sectors logged.</p>
      </template>
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
const pilotStore = usePilotStore()
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthKey = ref('')
const viewMode = ref<'today' | 'week' | 'month'>('today')
const selectedWeekDate = ref('')
const weekOffset = ref(0)

const { data: me, error: meError } = await useAuthedAsyncData('pilot-me-schedule', () => {
  const cached = pilotStore.profile
  if (cached) return Promise.resolve({ data: { scheduleToday: cached.scheduleToday, lastSyncedAt: cached.lastSyncedAt } })
  return api.get<Envelope<{ scheduleToday: string; lastSyncedAt: string }>>('/pilot/me')
})
const sampleToday = me.value?.data.scheduleToday ?? ''
if (me.value?.data.lastSyncedAt) pilotStore.setLastSyncedAt(me.value.data.lastSyncedAt)
monthKey.value = sampleToday.slice(0, 7)
const todayMonthKey = computed(() => sampleToday.slice(0, 7))

const { data, pending, error } = await useAuthedAsyncData(
  () => `schedule-${monthKey.value || 'pending'}`,
  () => {
    if (!monthKey.value) return Promise.resolve(null)
    const [year, month] = monthKey.value.split('-')
    return api.get<Envelope<CalendarPayload>>('/schedules', { year, month })
  },
  { watch: [monthKey], lazy: true },
)

const payload = computed(() => data.value?.data)
watch(payload, (value) => {
  if (value && !selectedWeekDate.value) selectedWeekDate.value = value.today
}, { immediate: true })
watch(weekOffset, (value) => {
  const anchor = addDays(sampleToday, value * 7)
  selectedWeekDate.value = anchor
  const targetMonth = anchor.slice(0, 7)
  if (targetMonth !== monthKey.value) monthKey.value = targetMonth
})
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

const entryByDate = computed(() => new Map((payload.value?.entries ?? []).map((entry) => [entry.date, entry])))
const todayDuty = computed(() => entryByDate.value.get(payload.value?.today ?? ''))
const weekDays = computed(() => {
  if (!sampleToday) return []
  const anchor = addDays(sampleToday, weekOffset.value * 7)
  const date = new Date(`${anchor}T00:00:00.000Z`)
  const mondayOffset = (date.getUTCDay() + 6) % 7
  return Array.from({ length: 7 }, (_, index) => {
    const iso = addDays(anchor, index - mondayOffset)
    return { date: iso, day: Number(iso.slice(8)), weekday: weekdays[index] }
  })
})
const selectedWeekDuty = computed(() => entryByDate.value.get(selectedWeekDate.value))
const nextDutyEntry = computed(() => (payload.value?.entries ?? [])
  .filter((entry) => entry.date > (payload.value?.today ?? '') && entry.countLogbooks < entry.countSchedules)
  .sort((a, b) => a.date.localeCompare(b.date))[0])

function dutyMark(duty: Duty) {
  const remaining = duty.countSchedules - duty.countLogbooks
  return remaining === 0 ? String.fromCharCode(0x2713) : String(remaining)
}

function cellCode(duty: Duty) {
  return duty.dutyType === 'DTY' ? duty.baseName : duty.dutyType
}

function dutyTitle(code: string) {
  return code === 'DTY' ? 'Flight duty' : code === 'RLV' ? 'Leave' : code
}

function dutyProgress(duty: Duty) {
  return duty.countLogbooks === duty.countSchedules ? 'All activities logged' : `${duty.countSchedules - duty.countLogbooks} activities remaining`
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatWeekday(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

function formatDay(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

function formatMonthYear(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

function formatLongDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00.000Z`))
}

function calendarLabel(cell: { date: string; duty: Duty | null }) {
  const dateLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(`${cell.date}T00:00:00.000Z`))
  if (!cell.duty) return `${dateLabel}, no duty recorded`
  const mark = dutyMark(cell.duty) === String.fromCharCode(0x2713) ? 'all duties logged' : `${dutyMark(cell.duty)} duties remaining`
  return `${dateLabel}, ${cell.duty.baseName}, ${mark}`
}

function shift(delta: number) {
  if (!monthKey.value) return
  const [year, monthNumber] = monthKey.value.split('-').map(Number)
  monthKey.value = new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7)
}

function jumpToToday() {
  monthKey.value = todayMonthKey.value
}

function openDay(date: string) {
  return navigateTo(`/schedule/${date}`)
}

useHead({ title: 'Schedule - Susi Air Pilot Portal' })
</script>
