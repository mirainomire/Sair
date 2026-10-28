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
                  <span><small>Schedule date</small><strong>{{ todayLabel }}</strong></span>
                </div>
              </div>
            </div>
            <a class="home-hours-card" href="#flight-hours" aria-label="View flight hours history">
              <span class="hours-copy"><small>Flight hours</small><strong>{{ totalFlightHoursLabel }} h</strong></span>
            </a>
          </div>
        </div>
      </header>

      <Teleport to="body">
        <div class="home-compact-summary" :class="{ visible: compactHeader }" :aria-hidden="!compactHeader" :inert="!compactHeader">
          <div class="home-compact-left">
            <strong>{{ home.me.name }}</strong>
            <span><small>Schedule date</small><b>{{ todayLabelFull }}</b></span>
          </div>
          <div class="home-compact-right">
            <small>Flight hours</small>
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
            <strong>{{ card.used }} h</strong>
            <small>of {{ card.limit }} h</small>
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
            <small>Expires {{ formatDate(item.expiryDate) }}</small>
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
  state: 'safe' | 'soon' | 'expired'
}

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
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateHeaderOnScroll)
  if (greetingTimer) clearInterval(greetingTimer)
  if (welcomeTimer) clearTimeout(welcomeTimer)
})

const { data, pending, error } = await useAsyncData('home', async () => {
  const me = await api.get<Envelope<PilotProfile>>('/pilot/me')
  pilotStore.setProfile(me.data)
  const docs = await api.get<Envelope<{ documents: Doc[] }>>('/documents')
  return { me: me.data, docs: docs.data }
})

const { data: chart, error: chartError } = await useAsyncData(
  () => `home-chart-${range.value}`,
  () => api.get<Envelope<Summary>>('/flight-hours/summary', { range: range.value }),
  { watch: [range] },
)

const home = computed(() => data.value)
const summary = computed(() => chart.value?.data)
const loadError = computed(() => (error.value ? errorText(error.value) : ''))
const chartErrorText = computed(() => (chartError.value ? errorText(chartError.value) : ''))
const cards = computed(() => summary.value?.cards ?? [])
const documents = computed(() => home.value?.docs.documents ?? [])
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
  if (card.limit > 0 && card.used / card.limit >= 0.8) return 'near'
  return ''
}

function limitText(card: { used: number; limit: number; overLimit: boolean }) {
  return limitTone(card) === 'over' ? 'Over limit' : 'Near limit'
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

function badgeText(state: Doc['state']) {
  if (state === 'expired') return 'Expired'
  if (state === 'soon') return 'Due soon'
  return 'Valid'
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00.000Z'))
}

useHead({ title: 'Home - Susi Air Pilot Portal' })
</script>
