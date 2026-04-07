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

      <!-- Delete -->
      <div v-if="canDelete" class="absolute top-4 left-4 z-10 flex items-center gap-2">
        <template v-if="confirmDelete">
          <span class="text-white/70 text-sm">确认删除？</span>
          <button class="text-red-400 hover:text-red-300 text-sm font-semibold px-2 py-1"
            @click="$emit('delete')">删除</button>
          <button class="text-white/60 hover:text-white text-sm px-2 py-1"
            @click="confirmDelete = false">取消</button>
        </template>
        <button v-else class="text-white/70 hover:text-red-400 transition-colors p-2"
          @click="confirmDelete = true">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>

      <!-- Prev -->
      <button v-if="hasPrev" class="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-3 hidden md:block"
        @click="$emit('prev')">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Media -->
      <div class="max-w-full max-h-screen p-4 flex flex-col items-center gap-3">
        <!-- Video: no autoplay (blocked on mobile without muted); playsinline for iOS -->
        <video v-if="isVideo" :key="src" :src="src" controls playsinline preload="metadata"
          class="max-w-full max-h-[80vh] rounded-lg" />

        <!-- Image: show blurred thumbnail while full-res loads -->
        <template v-else>
          <template v-if="!imageLoaded">
            <!-- Blurred thumbnail placeholder -->
            <img v-if="thumbSrc" :src="thumbSrc"
              class="max-w-full max-h-[80vh] object-contain rounded-lg blur-sm opacity-70" />
            <!-- Spinner when no thumbnail available -->
            <div v-else class="flex items-center justify-center h-64 w-64">
              <div class="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <!-- Hidden preloader for full-res; fires @load when ready -->
            <img :key="src" :src="src" @load="imageLoaded = true" class="hidden" aria-hidden="true" />
          </template>
          <img v-else :src="src" :alt="item?.original_name"
            class="max-w-full max-h-[80vh] object-contain rounded-lg" />
        </template>

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
import { computed, ref, watch } from 'vue'

const props = defineProps({
  item: Object,
  currentIndex: Number,
  total: Number,
  canDelete: Boolean
})
const emit = defineEmits(['close', 'prev', 'next', 'delete'])

const confirmDelete = ref(false)
const imageLoaded = ref(false)

// Reset state when switching items
watch(() => props.item?.id, () => {
  confirmDelete.value = false
  imageLoaded.value = false
})

const hasPrev = computed(() => props.currentIndex > 0)
const hasNext = computed(() => props.currentIndex < props.total - 1)
const isVideo = computed(() => props.item?.mime_type?.startsWith('video/'))
const src = computed(() => `/uploads/originals/${props.item?.filename}`)
const thumbSrc = computed(() =>
  props.item?.thumb_filename ? `/uploads/thumbs/${props.item.thumb_filename}` : null
)

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
