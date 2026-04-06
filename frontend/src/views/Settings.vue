<template>
  <div class="px-4 py-6 max-w-lg mx-auto">
    <h2 class="font-serif text-stone-700 font-semibold text-xl mb-6">设置</h2>

    <div v-if="loaded" class="space-y-6">
      <!-- Avatar section -->
      <div class="card p-6 flex flex-col items-center">
        <div class="relative mb-3">
          <img v-if="avatarUrl" :src="avatarUrl" class="w-24 h-24 rounded-full object-cover border-4 border-rose-200" />
          <div v-else class="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center text-3xl border-4 border-rose-200 text-rose-400">
            {{ auth.user?.displayName?.[0] || '?' }}
          </div>
          <label class="absolute bottom-0 right-0 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-rose-600 transition">
            <span class="text-white text-sm">📷</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="uploadAvatar" />
          </label>
        </div>
        <p class="text-xs text-stone-400">点击相机图标更换头像（最大 2MB）</p>
      </div>

      <!-- Config form -->
      <div class="card p-6">
        <form @submit.prevent="saveConfig" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">TA 的昵称</label>
            <input v-model="form.person1_name" class="input-field" maxlength="30" placeholder="TA 的昵称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">你的昵称</label>
            <input v-model="form.person2_name" class="input-field" maxlength="30" placeholder="你的昵称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">纪念日 💗</label>
            <input v-model="form.anniversary_date" type="date" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">我们的故事</label>
            <textarea v-model="form.love_story" class="input-field resize-none" rows="5" maxlength="5000"
              placeholder="写下你们的故事…" />
            <p class="text-xs text-stone-400 text-right mt-1">{{ form.love_story?.length || 0 }} / 5000</p>
          </div>
          <button type="submit" class="btn-rose w-full" :disabled="saving">
            {{ saving ? '保存中…' : '保存设置 ❤' }}
          </button>
        </form>
      </div>
    </div>
    <div v-else class="text-center py-10 text-rose-300 animate-pulse">加载中…</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const configStore = useConfigStore()
const auth = useAuthStore()
const toast = useToastStore()
const loaded = ref(false)
const saving = ref(false)
const form = ref({ person1_name: '', person2_name: '', anniversary_date: '', love_story: '' })

const avatarUrl = computed(() => {
  return auth.user?.avatar ? `/uploads/avatars/${auth.user.avatar}` : null
})

onMounted(async () => {
  if (!configStore.config) await configStore.fetchConfig()
  const c = configStore.config
  if (c) {
    form.value = {
      person1_name: c.person1_name || '',
      person2_name: c.person2_name || '',
      anniversary_date: c.anniversary_date || '',
      love_story: c.love_story || ''
    }
  }
  loaded.value = true
})

async function saveConfig() {
  saving.value = true
  try {
    await api.put('/api/config', form.value)
    await configStore.fetchConfig()
    toast.success('设置已保存')
  } catch (e) {
    // Interceptor handles error display
  } finally {
    saving.value = false
  }
}

async function uploadAvatar(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    toast.error('头像文件不能超过 2MB')
    return
  }
  const fd = new FormData()
  fd.append('avatar', file)
  try {
    const res = await api.post('/api/auth/avatar', fd)
    auth.user.avatar = res.data.avatar
    localStorage.setItem('user', JSON.stringify(auth.user))
    toast.success('头像已更新')
  } catch (err) {
    // Interceptor handles error display
  }
}
</script>
