<template>
  <div class="min-h-screen bg-rose-50 flex flex-col items-center justify-center relative overflow-hidden px-6">
    <!-- Background hearts -->
    <div class="absolute inset-0 pointer-events-none">
      <span v-for="h in hearts" :key="h.id"
        class="absolute text-rose-200 select-none animate-float-up"
        :style="{ left: h.x + '%', animationDelay: h.delay + 's', fontSize: h.size + 'px', animationDuration: h.dur + 's' }">
        ♥
      </span>
    </div>

    <div class="w-full max-w-sm relative z-10">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">💝</div>
        <h1 class="text-3xl font-serif text-rose-600 font-bold">我们的小窝</h1>
        <p class="text-rose-400 text-sm mt-1">你的专属私密空间</p>
      </div>

      <!-- Form -->
      <div class="card p-8">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">账号</label>
            <input v-model="form.username" type="text" placeholder="输入你的账号"
              class="input-field" autocomplete="username" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">密码</label>
            <input v-model="form.password" type="password" placeholder="输入密码"
              class="input-field" autocomplete="current-password" required />
          </div>
          <div v-if="error" class="text-rose-500 text-sm text-center">{{ error }}</div>
          <button type="submit" class="btn-rose w-full" :disabled="loading">
            {{ loading ? '登录中…' : '进入我们的小窝' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const hearts = ref([])
onMounted(() => {
  hearts.value = Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 6,
    size: 16 + Math.random() * 20, dur: 5 + Math.random() * 4
  }))
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.post('/api/auth/login', form.value)
    auth.setAuth(res.data)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
