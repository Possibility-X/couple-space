<template>
  <div class="text-center py-8">
    <!-- Days counter -->
    <div class="mb-2">
      <span class="font-display text-7xl font-bold text-rose-500 leading-none">{{ days }}</span>
    </div>
    <p class="text-stone-500 text-sm tracking-widest uppercase">天的陪伴</p>

    <!-- HH:MM:SS -->
    <div class="mt-3 flex justify-center gap-3">
      <TimeUnit :value="hours" label="时" />
      <span class="text-rose-300 text-2xl font-light self-center">:</span>
      <TimeUnit :value="minutes" label="分" />
      <span class="text-rose-300 text-2xl font-light self-center">:</span>
      <TimeUnit :value="seconds" label="秒" />
    </div>

    <!-- Anniversary countdown -->
    <div v-if="daysToAnniversary !== null" class="mt-5 inline-flex items-center gap-2 bg-gold/10 text-amber-600 rounded-full px-4 py-2 text-sm">
      <span>🌟</span>
      <span v-if="daysToAnniversary === 0">今天是周年纪念日！</span>
      <span v-else>距下个周年纪念日还有 <strong>{{ daysToAnniversary }}</strong> 天</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({ anniversaryDate: String })

const now = ref(new Date())
let timer

const start = computed(() => props.anniversaryDate ? new Date(props.anniversaryDate) : null)
const diff = computed(() => start.value ? now.value - start.value : 0)
const days = computed(() => Math.floor(diff.value / 86400000))
const hours = computed(() => String(Math.floor((diff.value % 86400000) / 3600000)).padStart(2, '0'))
const minutes = computed(() => String(Math.floor((diff.value % 3600000) / 60000)).padStart(2, '0'))
const seconds = computed(() => String(Math.floor((diff.value % 60000) / 1000)).padStart(2, '0'))

const daysToAnniversary = computed(() => {
  if (!start.value) return null
  const today = new Date()
  const next = new Date(today.getFullYear(), start.value.getMonth(), start.value.getDate())
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return Math.round((next - today) / 86400000)
})

onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<script>
// Inline sub-component
const TimeUnit = {
  props: ['value', 'label'],
  template: `
    <div class="flex flex-col items-center">
      <span class="font-display text-2xl text-rose-400 font-semibold w-10 text-center">{{ value }}</span>
      <span class="text-xs text-stone-400">{{ label }}</span>
    </div>
  `
}
export default { components: { TimeUnit } }
</script>
