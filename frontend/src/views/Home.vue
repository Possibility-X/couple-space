<template>
  <div class="relative min-h-screen">
    <HeartParticles />

    <div v-if="loading" class="relative z-10 flex items-center justify-center min-h-screen">
      <div class="text-rose-300 text-sm animate-pulse">加载中…</div>
    </div>

    <div v-else class="relative z-10 px-4 py-6 space-y-6">
      <!-- Couple names -->
      <div class="text-center">
        <p class="font-serif text-stone-500 text-lg">
          <span class="text-rose-500 font-bold">{{ config?.person1_name }}</span>
          <span class="mx-2 text-rose-300">♥</span>
          <span class="text-rose-500 font-bold">{{ config?.person2_name }}</span>
        </p>
      </div>

      <!-- Love counter card -->
      <div class="card p-6">
        <LoveCounter :anniversary-date="config?.anniversary_date" />
      </div>

      <!-- Love story snippet -->
      <div v-if="config?.love_story" class="card p-5">
        <p class="text-stone-500 text-sm leading-relaxed text-center italic font-serif">
          "{{ config.love_story }}"
        </p>
      </div>

      <!-- Recent memories -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-serif text-stone-700 font-semibold text-lg">最近的回忆</h2>
          <router-link to="/gallery" class="text-rose-400 text-sm hover:text-rose-500">查看全部 →</router-link>
        </div>
        <div v-if="recentMedia.length" class="grid grid-cols-3 gap-2">
          <PhotoCard v-for="item in recentMedia" :key="item.id" :item="item"
            @click="openLightbox(item)" />
        </div>
        <div v-else class="card p-8 text-center text-stone-400 text-sm">
          还没有照片，去上传第一张吧 📷
        </div>
      </div>
    </div>

    <Lightbox v-if="lightboxItem" :item="lightboxItem"
      :current-index="lightboxIndex" :total="recentMedia.length"
      @close="lightboxItem = null"
      @prev="lightboxIndex > 0 && (lightboxIndex--, lightboxItem = recentMedia[lightboxIndex])"
      @next="lightboxIndex < recentMedia.length-1 && (lightboxIndex++, lightboxItem = recentMedia[lightboxIndex])" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'
import HeartParticles from '@/components/HeartParticles.vue'
import LoveCounter from '@/components/LoveCounter.vue'
import PhotoCard from '@/components/PhotoCard.vue'
import Lightbox from '@/components/Lightbox.vue'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const config = configStore.config ? ref(configStore.config) : ref(null)
const recentMedia = ref([])
const loading = ref(false)
const lightboxItem = ref(null)
const lightboxIndex = ref(0)

function openLightbox(item) {
  lightboxIndex.value = recentMedia.value.indexOf(item)
  lightboxItem.value = item
}

onMounted(async () => {
  loading.value = true
  try {
    if (!config.value) {
      await configStore.fetchConfig()
      config.value = configStore.config
    }
    const res = await api.get('/api/media/recent')
    recentMedia.value = res.data
  } catch (e) {
    // Interceptor handles error display
  } finally {
    loading.value = false
  }
})
</script>
