<template>
  <div class="px-4 py-6 max-w-lg mx-auto">
    <h2 class="font-serif text-stone-700 font-semibold text-xl mb-6">上传回忆</h2>

    <!-- Drop zone -->
    <div class="card border-2 border-dashed border-rose-200 p-8 text-center mb-6 transition-colors"
      :class="dragging ? 'border-rose-400 bg-rose-50' : ''"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop">
      <div class="text-4xl mb-3">📷</div>
      <p class="text-stone-500 mb-3">拖拽文件到这里，或</p>
      <label class="btn-rose cursor-pointer inline-block">
        选择文件
        <input type="file" multiple accept="image/*,video/mp4,video/quicktime"
          class="hidden" @change="onFileSelect" capture="environment" />
      </label>
      <p class="text-xs text-stone-400 mt-3">支持 JPG、PNG、WebP 图片 及 MP4 视频，单文件最大 100MB</p>
    </div>

    <!-- Selected files preview -->
    <div v-if="files.length" class="space-y-4 mb-6">
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-stone-700">已选 {{ files.length }} 个文件</h3>
        <button @click="files = []" class="text-sm text-stone-400 hover:text-red-400">清空</button>
      </div>

      <!-- Options -->
      <div class="card p-4 space-y-3">
        <div>
          <label class="block text-sm text-stone-600 mb-1">选择相册（可选）</label>
          <select v-model="selectedAlbum" class="input-field">
            <option :value="null">不分类</option>
            <option v-for="a in albums" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-stone-600 mb-1">备注说明（可选）</label>
          <input v-model="caption" placeholder="为这批照片写点什么…" class="input-field" maxlength="500" />
        </div>
      </div>

      <!-- File list -->
      <div class="grid grid-cols-3 gap-2">
        <div v-for="(f, i) in files" :key="i" class="relative aspect-square rounded-xl overflow-hidden bg-rose-50">
          <img v-if="f.preview" :src="f.preview" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center">
            <span class="text-3xl">🎬</span>
            <span class="text-xs text-stone-500 mt-1 px-1 truncate w-full text-center">{{ f.file.name }}</span>
          </div>
          <!-- Progress overlay -->
          <div v-if="f.status === 'uploading'" class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div class="text-white text-xs">{{ f.progress }}%</div>
          </div>
          <div v-if="f.status === 'done'" class="absolute inset-0 bg-green-500/30 flex items-center justify-center">
            <span class="text-white text-xl">✓</span>
          </div>
          <div v-if="f.status === 'error'" class="absolute inset-0 bg-red-500/30 flex items-center justify-center">
            <span class="text-white text-xl">✗</span>
          </div>
          <button v-if="!f.status" @click="files.splice(i, 1)"
            class="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white text-xs flex items-center justify-center">×</button>
        </div>
      </div>

      <button @click="uploadAll" class="btn-rose w-full" :disabled="uploading">
        {{ uploading ? `上传中… (${doneCount}/${files.length})` : `上传 ${files.length} 个文件 ❤` }}
      </button>
    </div>

    <!-- Create album shortcut -->
    <div class="card p-4">
      <h3 class="font-medium text-stone-700 mb-3 text-sm">新建相册</h3>
      <div class="flex gap-2">
        <input v-model="newAlbumName" placeholder="相册名称" class="input-field flex-1" maxlength="50" />
        <button @click="createAlbum" class="btn-rose px-4">创建</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const files = ref([])
const albums = ref([])
const selectedAlbum = ref(null)
const caption = ref('')
const newAlbumName = ref('')
const dragging = ref(false)
const uploading = ref(false)
const doneCount = ref(0)

function processFiles(fileList) {
  for (const file of fileList) {
    const entry = { file, preview: null, status: null, progress: 0 }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => { entry.preview = e.target.result }
      reader.readAsDataURL(file)
    }
    files.value.push(entry)
  }
}

function onFileSelect(e) { processFiles(e.target.files) }
function onDrop(e) { dragging.value = false; processFiles(e.dataTransfer.files) }

async function uploadAll() {
  uploading.value = true
  doneCount.value = 0
  let errorCount = 0
  for (const f of files.value) {
    if (f.status === 'done') { doneCount.value++; continue }
    f.status = 'uploading'
    const fd = new FormData()
    fd.append('files', f.file)
    if (selectedAlbum.value) fd.append('album_id', selectedAlbum.value)
    if (caption.value) fd.append('caption', caption.value)
    try {
      await api.post('/api/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => { f.progress = Math.round(e.loaded / e.total * 100) },
        _skipToast: true
      })
      f.status = 'done'
      doneCount.value++
    } catch {
      f.status = 'error'
      errorCount++
    }
  }
  uploading.value = false
  if (errorCount === 0) {
    toast.success(`上传完成 (${doneCount.value} 个文件)`)
  } else {
    toast.error(`${errorCount} 个文件上传失败`)
  }
}

async function createAlbum() {
  if (!newAlbumName.value.trim()) return
  try {
    await api.post('/api/albums', { name: newAlbumName.value })
    newAlbumName.value = ''
    const res = await api.get('/api/albums')
    albums.value = res.data
    toast.success('相册已创建')
  } catch (e) {
    // Interceptor handles error display
  }
}

onMounted(async () => {
  try {
    const res = await api.get('/api/albums')
    albums.value = res.data
  } catch (e) {
    // Interceptor handles error display
  }
})
</script>
