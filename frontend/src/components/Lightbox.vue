<template>
  <!-- Teleport to body for proper z-index -->
  <teleport to="body">
    <div class="fixed inset-0 z-50 bg-black flex items-center justify-center"
      @touchstart="onTouchStart" @touchend="onTouchEnd">
      <!-- Close -->
      <button class="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
        @click="$emit('close')">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Prev -->
      <button v-if="hasPrev" class="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-3 hidden md:block"
        @click="$emit('prev')">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Media -->
      <div class="max-w-full max-h-screen p-4 flex flex-col items-center gap-3">
        <video v-if="isVideo" :src="src" controls class="max-w-full max-h-[80vh] rounded-lg" autoplay />
        <img v-else :src="src" :alt="item?.original_name" class="max-w-full max-h-[80vh] object-contain rounded-lg" />

        <div v-if="item?.caption" class="text-white/70 text-sm text-center">{{ item.caption }}</div>
        <div class="text-white/40 text-xs">{{ item?.uploader_name }} · {{ formatDate(item?.taken_at || item?.created_at) }}</div>
      </div>

      <!-- Next -->
      <button v-if="hasNext" class="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-3 hidden md:block"
        @click="$emit('next')">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <!-- Dots indicator -->
      <div class="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5">
        <div v-for="(_, i) in total" :key="i"
          class="w-1.5 h-1.5 rounded-full transition-colors"
          :class="i === currentIndex ? 'bg-white' : 'bg-white/30'" />
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  item: Object,
  currentIndex: Number,
  total: Number
})
const emit = defineEmits(['close', 'prev', 'next'])

const hasPrev = computed(() => props.currentIndex > 0)
const hasNext = computed(() => props.currentIndex < props.total - 1)
const isVideo = computed(() => props.item?.mime_type?.startsWith('video/'))
const src = computed(() => `/uploads/originals/${props.item?.filename}`)

let touchStartX = 0
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (dx > 60 && hasPrev.value) emit('prev')
  else if (dx < -60 && hasNext.value) emit('next')
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
