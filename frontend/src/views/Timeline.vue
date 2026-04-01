<template>
  <div class="px-4 py-6">
    <!-- Add event button -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-serif text-stone-700 font-semibold text-xl">我们的故事</h2>
      <button @click="showForm = true" class="btn-rose py-2 px-4 text-sm">+ 添加</button>
    </div>

    <!-- Timeline -->
    <div v-if="events.length" class="relative">
      <!-- Center line -->
      <div class="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-rose-200" />

      <div v-for="(event, i) in events" :key="event.id"
        class="relative flex mb-8"
        :class="i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'">

        <!-- Card -->
        <div class="w-[calc(50%-24px)]"
          :class="i % 2 === 0 ? 'mr-12' : 'ml-12'">
          <div class="card p-4 animate-fade-in" style="animation-fill-mode: both"
            :style="{ animationDelay: (i * 0.1) + 's' }">
            <!-- Milestone badge -->
            <div v-if="event.is_milestone" class="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full mb-2">
              🌟 里程碑
            </div>
            <p class="text-xs text-rose-400 mb-1">{{ formatDate(event.event_date) }}</p>
            <h3 class="font-serif font-semibold text-stone-800 text-sm">{{ event.emoji }} {{ event.title }}</h3>
            <p v-if="event.description" class="text-stone-500 text-xs mt-1 leading-relaxed">{{ event.description }}</p>
            <img v-if="event.media_thumb" :src="`/uploads/thumbs/${event.media_thumb}`"
              class="mt-2 rounded-lg w-full object-cover max-h-32" loading="lazy" />
            <div class="flex gap-2 mt-2">
              <button @click="editEvent(event)" class="text-xs text-rose-400 hover:text-rose-500">编辑</button>
              <button @click="deleteEvent(event.id)" class="text-xs text-stone-400 hover:text-red-400">删除</button>
            </div>
          </div>
        </div>

        <!-- Center dot -->
        <div class="absolute left-1/2 -translate-x-1/2 top-4 w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-sm z-10" />
      </div>
    </div>

    <div v-else class="text-center py-16 text-stone-400">
      <div class="text-5xl mb-3">💌</div>
      <p>还没有故事，记录第一个美好时刻吧</p>
    </div>

    <!-- Event form modal -->
    <teleport to="body">
      <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center"
        @click.self="showForm = false">
        <div class="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 space-y-4">
          <h3 class="font-serif text-rose-500 font-semibold text-lg">
            {{ editingEvent ? '编辑事件' : '添加新事件' }}
          </h3>
          <form @submit.prevent="saveEvent" class="space-y-3">
            <input v-model="form.title" placeholder="事件标题 *" class="input-field" required />
            <input v-model="form.event_date" type="date" class="input-field" required />
            <input v-model="form.emoji" placeholder="表情 (如 ❤️)" class="input-field" />
            <textarea v-model="form.description" placeholder="描述（可选）"
              class="input-field resize-none" rows="3" />
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.is_milestone" type="checkbox" class="accent-rose-500" />
              <span class="text-sm text-stone-600">🌟 标记为里程碑</span>
            </label>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="showForm = false" class="btn-ghost flex-1">取消</button>
              <button type="submit" class="btn-rose flex-1">保存</button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const events = ref([])
const showForm = ref(false)
const editingEvent = ref(null)
const form = ref({ title: '', event_date: '', emoji: '❤️', description: '', is_milestone: false })

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function editEvent(event) {
  editingEvent.value = event
  form.value = { title: event.title, event_date: event.event_date, emoji: event.emoji || '❤️', description: event.description || '', is_milestone: !!event.is_milestone }
  showForm.value = true
}

async function saveEvent() {
  try {
    if (editingEvent.value) {
      await axios.put(`/api/timeline/${editingEvent.value.id}`, form.value)
    } else {
      await axios.post('/api/timeline', form.value)
    }
    showForm.value = false
    editingEvent.value = null
    form.value = { title: '', event_date: '', emoji: '❤️', description: '', is_milestone: false }
    await fetchEvents()
  } catch (e) {
    console.error('Failed to save event:', e)
    alert('保存失败，请重试')
  }
}

async function deleteEvent(id) {
  if (!confirm('确定删除这条记忆吗？')) return
  try {
    await axios.delete(`/api/timeline/${id}`)
    await fetchEvents()
  } catch (e) {
    console.error('Failed to delete event:', e)
    alert('删除失败，请重试')
  }
}

async function fetchEvents() {
  try {
    const res = await axios.get('/api/timeline')
    events.value = res.data
  } catch (e) {
    console.error('Failed to fetch events:', e)
  }
}

onMounted(fetchEvents)
</script>
