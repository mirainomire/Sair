<template>
  <div>
    <p v-if="loadError" class="error">{{ loadError }}</p>
    <SkeletonLoader v-else-if="pending" label="Loading home" :rows="4" />
    <template v-else-if="home">
      <Teleport to="body">
        <Transition name="welcome-toast">
          <p v-if="welcomeMessage" class="welcome-toast" role="status" aria-live="polite">{{ welcomeMessage }}</p>
        </Transition>
      </Teleport>
      <header class="home-head">
        <div class="home-expanded">
          <div class="home-hero-top">
            <div class="home-profile">
              <PilotAvatar class="home-portrait" :src="home.me.avatarUrl" :name="home.me.name" />
              <div class="home-identity">
                <p class="eyebrow">{{ greeting }}</p>
                <h1>{{ home.me.name }}</h1>
                <div class="home-date-chip">
                  <span><small>Roster as of</small><strong>{{ todayLabel }}</strong></span>
                </div>
              </div>
            </div>
            <a class="home-hours-card" href="#flight-hours" aria-label="View flight hours history">
              <span class="hours-copy"><small>Total flight time</small><strong>{{ totalFlightHoursLabel }} h</strong></span>
            </a>
          </div>
        </div>
      </header>

      <section v-if="homeDuty" class="next-duty-card" aria-labelledby="home-duty-title">
        <div class="next-duty-heading">
          <span class="eyebrow">{{ homeDuty.date === home.me.scheduleToday ? "Today's duty" : 'Next duty' }}</span>
          <strong id="home-duty-title">{{ homeDuty.baseName }} - {{ dutyTitle(homeDuty.dutyType) }}</strong>
          <small>{{ formatScheduleDate(homeDuty.date) }}</small>
        </div>
        <div class="next-duty-meta">
          <strong>{{ homeDuty.countLogbooks === homeDuty.countSchedules ? 'All activities logged' : `${homeDuty.countSchedules - homeDuty.countLogbooks} activities remaining` }}</strong>
          <NuxtLink to="/schedule">Open Schedule</NuxtLink>
        </div>
      </section>

      <Teleport to="body">
        <div class="home-compact-summary" :class="{ visible: compactHeader }" :aria-hidden="!compactHeader" :inert="!compactHeader">
          <div class="home-compact-left">
            <strong>{{ home.me.name }}</strong>
            <span><small>Roster as of</small><b>{{ todayLabelFull }}</b></span>
          </div>
          <div class="home-compact-right">
            <small>Total flight time</small>
            <strong>{{ totalFlightHoursLabel }} h</strong>
          </div>
        </div>
      </Teleport>

      <section id="flight-hours">
        <header class="block-head">
          <h2>Hours to Limit</h2>
          <p>Recorded flight time compared with the limit for each period.</p>
        </header>
        <div class="limit-grid">
          <article
            v-for="card in cards"
            :key="card.label"
            class="glass stat"
            :class="limitTone(card)"
          >
            <div class="stat-top">
              <span>{{ cardLabel(card.label) }}</span>
              <em v-if="limitTone(card)" class="limit-flag">{{ limitText(card) }}</em>
            </div>
            <small class="stat-window">{{ cardWindow(card) }}</small>
            <strong>{{ remainingHours(card) }} h left</strong>
            <small>{{ card.used }} of {{ card.limit }} h used</small>
            <div class="meter">
              <div class="meter-fill" :class="{ hot: card.overLimit }" :style="{ width: `${card.indicator}%` }" />
            </div>
          </article>
        </div>
        <article class="glass chart-card">
          <header class="block-head">
            <h3>Flight time history</h3>
            <p>Total flight time for the selected period. The red line shows the limit.</p>
          </header>
          <div class="range-row">
            <button
              v-for="item in ranges"
              :key="item"
              type="button"
              :aria-label="rangeDescription(item)"
              :class="{ on: range === item }"
              @click="range = item"
            >
              {{ item }}
            </button>
          </div>
          <p v-if="summary" class="chart-window">{{ windowCaption }}</p>
          <p v-if="chartErrorText" class="error">{{ chartErrorText }}</p>
          <FlightChart
            v-else-if="summary"
            :points="rollingPoints"
            :y-max="summary.plotMax"
            :limit="summary.limit"
            label="Flight hours chart"
          />
        </article>
      </section>

      <section>
        <header class="block-head">
          <h2>My documents</h2>
        </header>
        <p v-if="documents.length === 0" class="empty">No documents are available.</p>
        <article v-for="item in documents" :key="item.id" class="doc" :class="item.state">
          <DocMark :id="item.id" />
          <div class="doc-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ remainingLabel(item) }} · Expires {{ formatDate(item.expiryDate) }}</small>
          </div>
          <span class="doc-status">{{ badgeText(item.state) }}</span>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Envelope } from '~/types/api'
import { errorText } from '~/utils/format'
import type { PilotProfile } from '~/stores/pilot'

definePageMeta({ pageTransition: false })

type RangeKey = '1w' | '1m' | '3m' | '6m' | '1y'

type Summary = {
  limit: number
  max: number
  plotMax: number
  cards: { label: string; used: number; limit: number; windowDays: number; overLimit: boolean; indicator: number }[]
  series: { date: string; hours: number; rollingSum: number; isToday: boolean }[]
}

type Doc = {
  id: string
  label: string
  expiryDate: string
  daysRemaining: number
  state: 'safe' | 'soon' | 'urgent' | 'critical' | 'expired'
}

type ScheduleEntry = { date: string; baseName: string; dutyType: string; countSchedules: number; countLogbooks: number }

const ranges: RangeKey[] = ['1w', '1m', '3m', '6m', '1y']
const range = ref<RangeKey>('1w')
const compactHeader = ref(false)
const currentTime = ref(Date.now())
const api = useApi()
const pilotStore = usePilotStore()
const route = useRoute()
const router = useRouter()
let greetingTimer: ReturnType<typeof setInterval> | undefined
let welcomeTimer: ReturnType<typeof setTimeout> | undefined
const welcomeMessage = ref('')

function updateHeaderOnScroll() {
  const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
  compactHeader.value = window.scrollY > 110 && remaining > 100
}

onMounted(() => {
  updateHeaderOnScroll()
  window.addEventListener('scroll', updateHeaderOnScroll, { passive: true })
  greetingTimer = setInterval(() => { currentTime.value = Date.now() }, 60_000)
  if (route.query.welcome === '1' && home.value) {
    welcomeMessage.value = 'Welcome aboard, ' + home.value.me.rank + ' ' + home.value.me.name + '!'
    welcomeTimer = setTimeout(() => { welcomeMessage.value = '' }, 4200)
    const query = { ...route.query }
    delete query.welcome
    void router.replace({ path: '/', query })
  }
}, { lazy: true })

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateHeaderOnScroll)
  if (greetingTimer) clearInterval(greetingTimer)
  if (welcomeTimer) clearTimeout(welcomeTimer)
})

const { data, pending, error } = await useAuthedAsyncData('home', async () => {
  const me = await api.get<Envelope<PilotProfile>>('/pilot/me')
  const reference = me.data.scheduleToday
  const [year, month] = reference.slice(0, 7).split('-').map(Number)
  const nextMonth = new Date(Date.UTC(year, month, 1))
  const scheduleMonths = [
    { year, month },
    { year: nextMonth.getUTCFullYear(), month: nextMonth.getUTCMonth() + 1 },
  ]
  const [docs, schedules] = await Promise.all([
    api.get<Envelope<{ documents: Doc[] }>>('/documents'),
    Promise.all(scheduleMonths.map(({ year: scheduleYear, month: scheduleMonth }) => api.get<Envelope<{ entries: ScheduleEntry[] }>>('/schedules', { year: scheduleYear, month: scheduleMonth }))),
  ])
  pilotStore.setProfile(me.data)
  return { me: me.data, docs: docs.data, schedule: schedules.flatMap((schedule) => schedule.data.entries) }
})

const { data: chart, error: chartError } = await useAuthedAsyncData(
  () => `home-chart-${range.value}`,
  () => api.get<Envelope<Summary>>('/flights-hours/summary', { range: range.value }),
  { watch: [range], lazy: true },
)

const home = computed(() => data.value)
const summary = computed(() => chart.value?.data)
const loadError = computed(() => (error.value ? errorText(error.value) : ''))
const chartErrorText = computed(() => (chartError.value ? errorText(chartError.value) : ''))
const cards = computed(() => summary.value?.cards ?? [])
const documents = computed(() => home.value?.docs.documents ?? [])
const scheduleEntries = computed(() => home.value?.schedule ?? [])
const homeDuty = computed(() => scheduleEntries.value
  .filter((entry) => entry.date >= (home.value?.me.scheduleToday ?? '') && entry.countLogbooks < entry.countSchedules)
  .sort((a, b) => a.date.localeCompare(b.date))[0] ?? scheduleEntries.value.find((entry) => entry.date === home.value?.me.scheduleToday))
const greeting = computed(() => {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: 'numeric', hourCycle: 'h23' }).format(new Date(currentTime.value)))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})
const totalFlightHoursLabel = computed(() => (home.value?.me.totalFlightHours ?? 0).toLocaleString('en-GB', { maximumFractionDigits: 1 }))
const windowCaption = computed(() => {
  const windows: Record<RangeKey, string> = {
    '1w': 'Last 7 days',
    '1m': 'Last 30 days',
    '3m': 'Last 90 days',
    '6m': 'Last 180 days',
    '1y': 'Last 365 days',
  }
  if (!summary.value) return ''
  return `${windows[range.value]} - limit ${summary.value.limit} h`
})

function cardLabel(label: string) {
  const labels: Record<string, string> = { Daily: 'Daily', Weekly: 'Weekly', Monthly: 'Monthly', Annual: 'Annual' }
  return labels[label] ?? label
}

function dutyTitle(code: string) {
  return code === 'DTY' ? 'Flight duty' : code === 'RLV' ? 'Leave' : code
}

function cardWindow(card: Summary['cards'][number]) {
  return card.windowDays === 1 ? 'Today only' : `Rolling ${card.windowDays} days`
}

function rangeDescription(range: RangeKey) {
  const labels: Record<RangeKey, string> = {
    '1w': 'Last 7 days', '1m': 'Last 30 days', '3m': 'Last 90 days',
    '6m': 'Last 180 days', '1y': 'Last 365 days',
  }
  return labels[range]
}

function limitTone(card: { used: number; limit: number; overLimit: boolean }) {
  if (card.overLimit || card.used > card.limit) return 'over'
  if (card.limit > 0 && card.used / card.limit >= 0.95) return 'critical'
  if (card.limit > 0 && card.used / card.limit >= 0.8) return 'near'
  return ''
}

function limitText(card: { used: number; limit: number; overLimit: boolean }) {
  const tone = limitTone(card)
  if (tone === 'over') return 'Over limit'
  if (tone === 'critical') return 'Critical'
  return 'Near limit'
}

function remainingHours(card: { used: number; limit: number }) {
  return Math.max(0, card.limit - card.used).toFixed(1)
}

const rollingPoints = computed(() =>
  summary.value?.series.map((point) => ({ date: point.date, hours: point.rollingSum, isToday: point.isToday })) ?? [],
)

const todayLabel = computed(() => scheduleDateLabel(false))
const todayLabelFull = computed(() => scheduleDateLabel(true))

function scheduleDateLabel(includeYear: boolean) {
  const iso = home.value?.me.scheduleToday
  if (!iso) return ''
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00.000Z`))
  return formatted
}

function formatScheduleDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00.000Z`))
}

function badgeText(state: Doc['state']) {
  if (state === 'expired') return 'Expired'
  if (state === 'critical') return 'Critical'
  if (state === 'urgent') return 'Urgent'
  if (state === 'soon') return 'Due soon'
  return 'Valid'
}

function remainingLabel(item: Doc) {
  if (item.daysRemaining <= 0) return overdueLabel(item)
  return `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'} remaining`
}

function overdueLabel(item: { daysRemaining: number }) {
  const days = Math.abs(item.daysRemaining)
  return `${days} day${days === 1 ? '' : 's'} overdue`
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00.000Z'))
}

useHead({ title: 'Home - Susi Air Pilot Portal' })
</script>
