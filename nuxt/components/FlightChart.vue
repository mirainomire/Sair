<template>
  <div class="chart-wrap" :style="plotStyle" @mouseleave="active = null">
    <svg class="line-chart" viewBox="0 0 360 140" preserveAspectRatio="none" role="img" :aria-label="chartDescription">
      <defs>
        <linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--chart)" stop-opacity="0.45" />
          <stop offset="100%" stop-color="var(--chart)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line
        v-for="tick in yTicks"
        :key="`grid-${tick.value}`"
        class="y-grid"
        :x1="plotLeft"
        :x2="width - rightPad"
        :y1="tick.y"
        :y2="tick.y"
      />
      <text
        v-for="tick in yTicks"
        :key="`label-${tick.value}`"
        class="y-label"
        :x="plotLeft - 8"
        :y="tick.y + 3"
      >{{ formatHours(tick.value) }}h</text>
      <line
        v-if="limitY !== null"
        class="limit-line"
        :x1="plotLeft"
        :x2="width - rightPad"
        :y1="limitY"
        :y2="limitY"
      />
      <polygon class="area" :points="area" />
      <polyline class="stroke" :points="line" />
      <polyline
        v-for="(segment, index) in overLimitSegments"
        :key="'over-' + index"
        class="over-limit-line"
        :points="segment"
      />
      <circle
        v-for="point in geometry"
        :key="`${point.date}-dot`"
        class="dot"
        :class="{ today: point.isToday, 'over-limit': isOverLimit(point) }"
        :cx="point.x"
        :cy="point.y"
        :r="point.isToday ? 4 : 2.4"
      />
      <circle
        v-for="point in geometry"
        :key="point.date"
        class="hit"
        :cx="point.x"
        :cy="point.y"
        r="8"
        @mouseenter="active = point"
        @focus="active = point"
      >
        <title>{{ tip(point) }}</title>
      </circle>
      <text v-if="limitY !== null && limit !== undefined" class="limit-label" :x="width - rightPad" :y="Math.max(12, limitY - 4)">
        Limit {{ formatHours(limit) }}h
      </text>
    </svg>
    <div v-if="geometry.length" class="chart-axis">
      <span v-for="point in geometry" :key="`${point.date}-axis`" :class="{ today: point.isToday }">{{ point.date.slice(8) }}</span>
    </div>
    <p
      v-if="active"
      class="chart-tip"
      :style="{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 150}px` }"
    >{{ tip(active) }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  points: { date: string; hours: number; isToday?: boolean }[]
  yMax?: number
  limit?: number
  label?: string
}>()

const width = 360
const height = 140
const plotLeft = 24
const rightPad = 2
const topPad = 8
const bottomPad = 8
const plotStyle = {
  '--plot-left': `${(plotLeft / width) * 100}%`,
  '--plot-width': `${((width - plotLeft - rightPad) / width) * 100}%`,
}
const label = computed(() => props.label ?? 'Flight hours chart')
const chartDescription = computed(() => `${label.value}. Vertical axis shows flight hours; horizontal axis shows dates.`)
const active = ref<{ date: string; hours: number; x: number; y: number; isToday?: boolean } | null>(null)

const scaleMax = computed(() => {
  if (props.yMax && props.yMax > 0) return props.yMax
  return Math.max(1, ...props.points.map((item) => item.hours))
})

const tickStep = computed(() => {
  const rawStep = scaleMax.value / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const fraction = rawStep / magnitude
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * magnitude
})

const yTicks = computed(() => {
  const ticks: { value: number; y: number }[] = []
  const plotHeight = height - topPad - bottomPad
  const step = tickStep.value
  const yFor = (value: number) => height - bottomPad - (value / scaleMax.value) * plotHeight
  for (let value = 0; value < scaleMax.value - step / 100; value += step) {
    ticks.push({ value: Number(value.toPrecision(4)), y: yFor(value) })
  }
  ticks.push({ value: Number(scaleMax.value.toPrecision(4)), y: yFor(scaleMax.value) })
  return ticks
})

const geometry = computed(() => {
  const rows = props.points
  const plotHeight = height - topPad - bottomPad
  return rows.map((item, index) => {
    const x = rows.length === 1 ? (plotLeft + width - rightPad) / 2 : plotLeft + (index * (width - plotLeft - rightPad)) / (rows.length - 1)
    const y = height - bottomPad - (Math.min(item.hours, scaleMax.value) / scaleMax.value) * plotHeight
    return { ...item, x, y }
  })
})

const limitY = computed(() => {
  if (props.limit === undefined || !scaleMax.value) return null
  const plotHeight = height - topPad - bottomPad
  return height - bottomPad - (Math.min(props.limit, scaleMax.value) / scaleMax.value) * plotHeight
})

const line = computed(() => geometry.value.map((point) => `${point.x},${point.y}`).join(' '))
const overLimitSegments = computed(() => {
  if (props.limit === undefined || geometry.value.length < 2) return []
  const segments: string[] = []
  for (let index = 0; index < geometry.value.length - 1; index += 1) {
    const start = geometry.value[index]
    const end = geometry.value[index + 1]
    const startOver = start.hours > props.limit
    const endOver = end.hours > props.limit

    if (startOver && endOver) {
      segments.push(coordinate(start.x, start.y) + ' ' + coordinate(end.x, end.y))
      continue
    }
    if (startOver === endOver) continue

    const fraction = (props.limit - start.hours) / (end.hours - start.hours)
    const crossingX = start.x + (end.x - start.x) * fraction
    const crossingY = start.y + (end.y - start.y) * fraction
    segments.push(startOver
      ? coordinate(start.x, start.y) + ' ' + coordinate(crossingX, crossingY)
      : coordinate(crossingX, crossingY) + ' ' + coordinate(end.x, end.y))
  }
  return segments
})
const area = computed(() => {
  if (!geometry.value.length) return ''
  const first = geometry.value[0]
  const last = geometry.value[geometry.value.length - 1]
  return `${first.x},${height - bottomPad} ${line.value} ${last.x},${height - bottomPad}`
})

function coordinate(x: number, y: number) {
  return String(x) + ',' + String(y)
}

function isOverLimit(point: { hours: number }) {
  return props.limit !== undefined && point.hours > props.limit
}

function formatHours(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)))
}

function tip(point: { date: string; hours: number }) {
  const when = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${point.date}T00:00:00.000Z`),
  )
  return `${when} · ${point.hours} h`
}
</script>
