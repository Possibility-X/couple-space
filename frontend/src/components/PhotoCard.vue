<template>
  <div class="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
    @click="$emit('click')">
    <!-- Thumbnail -->
    <div class="relative" :style="{ aspectRatio: isVideo ? '16/9' : '1/1' }">
      <img v-if="!isVideo" :src="thumbSrc" :alt="item.original_name"
        class="w-full h-full object-cover" loading="lazy" />
      <video v-else :src="mediaSrc" class="w-full h-full object-cover" preload="none" />
      <div v-if="isVideo" class="absolute inset-0 flex items-center justify-center bg-black/20">
        <div class="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
          <svg class="w-5 h-5 text-rose-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
          </svg>
        </div>
      </div>
      <!-- Uploader avatar badge -->
      <div v-if="item.uploader_avatar" class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full border-2 border-white overflow-hidden">
        <img :src="item.uploader_avatar" class="w-full h-full object-cover" />
      </div>
      <div v-else class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full border-2 border-white bg-rose-300 flex items-center justify-center">
        <span class="text-white text-xs font-bold">{{ uploaderInitial }}</span>
      </div>
    </div>
    <!-- Caption -->
    <div v-if="item.caption" class="px-3 py-2 text-xs text-stone-500 truncate">{{ item.caption }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ item: Object })
defineEmits(['click'])

const isVideo = computed(() => props.item.mime_type?.startsWith('video/'))
const thumbSrc = computed(() => {
  if (props.item.thumb_filename) return `/uploads/thumbs/${props.item.thumb_filename}`
  return `/uploads/originals/${props.item.filename}`
})
const mediaSrc = computed(() => `/uploads/originals/${props.item.filename}`)
const uploaderInitial = computed(() => (props.item.uploader_name || '?')[0].toUpperCase())
</script>
