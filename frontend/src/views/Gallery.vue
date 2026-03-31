<template>
  <div class="px-4 py-6">
    <!-- Album filter -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      <button @click="selectedAlbum = null"
        :class="selectedAlbum === null ? 'bg-rose-500 text-white' : 'bg-white text-stone-500'"
        class="flex-shrink-0 px-4 py-1.5 rounded-full text-sm border border-rose-200 transition">
        全部
      </button>
      <button v-for="album in albums" :key="album.id"
        @click="selectedAlbum = album.id"
        :class="selectedAlbum === album.id ? 'bg-rose-500 text-white' : 'bg-white text-stone-500'"
        class="flex-shrink-0 px-4 py-1.5 rounded-full text-sm border border-rose-200 transition">
        {{ album.name }} <span class="opacity-60">{{ album.media_count }}</span>
      </button>
    </div>

    <!-- Media grid -->
    <div v-if="media.length" class="columns-2 md:columns-3 gap-2 space-y-2">
      <div v-for="item in media" :key="item.id" class="break-inside-avoid">
        <PhotoCard :item="item" @click="openLightbox(item)" />
      </div>
    </div>
    <div v-else-if="!loading" class="text-center py-16 text-stone-400">
      <div class="text-5xl mb-3">📷</div>
      <p>还没有照片，快去上传吧</p>
      <router-link to="/upload" class="btn-rose mt-4 inline-block">去上传</router-link>
    </div>

    <!-- Load more -->
    <div v-if="hasMore" class="text-center mt-6">
      <button @click="loadMore" class="btn-ghost" :disabled="loading">
        {{ loading ? '加载中…' : '加载更多' }}
      </button>
    </div>

    <Lightbox v-if="lightboxItem" :item="lightboxItem"
      :current-index="lightboxIndex" :total="media.length"
      @close="lightboxItem = null"
      @prev="lightboxIndex > 0 && (lightboxIndex--, lightboxItem = media[lightboxIndex])"
      @next="lightboxIndex < media.length-1 && (lightboxIndex++, lightboxItem = media[lightboxIndex])" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import PhotoCard from '@/components/PhotoCard.vue'
import Lightbox from '@/components/Lightbox.vue'

const albums = ref([])
const media = ref([])
const selectedAlbum = ref(null)
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const lightboxItem = ref(null)
const lightboxIndex = ref(0)

function openLightbox(item) {
  lightboxIndex.value = media.value.indexOf(item)
  lightboxItem.value = item
}

async function fetchMedia(reset = false) {
  loading.value = true
  if (reset) { page.value = 1; media.value = [] }
  const params = { page: page.value, limit: 20 }
  if (selectedAlbum.value) params.album = selectedAlbum.value
  const res = await axios.get('/api/media', { params })
  media.value.push(...res.data.items)
  hasMore.value = media.value.length < res.data.total
  loading.value = false
}

async function loadMore() {
  page.value++
  await fetchMedia()
}

watch(selectedAlbum, () => fetchMedia(true))

onMounted(async () => {
  const res = await axios.get('/api/albums')
  albums.value = res.data
  await fetchMedia(true)
})
</script>
