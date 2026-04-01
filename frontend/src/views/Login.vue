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

      <!-- Step 1: 手机号 + 密码 -->
      <div v-if="step === 1" class="card p-8">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">手机号</label>
            <input v-model="form.phone" type="tel" placeholder="输入手机号"
              class="input-field" autocomplete="username" maxlength="11" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">密码</label>
            <input v-model="form.password" type="password" placeholder="输入密码"
              class="input-field" autocomplete="current-password" required />
          </div>
          <div v-if="error" class="text-rose-500 text-sm text-center">{{ error }}</div>
          <button type="submit" class="btn-rose w-full" :disabled="loading">
            {{ loading ? '验证中…' : '获取验证码' }}
          </button>
        </form>
      </div>

      <!-- Step 2: 短信验证码 -->
      <div v-else class="card p-8">
        <div class="text-center mb-6">
          <p class="text-stone-500 text-sm">验证码已发送至</p>
          <p class="text-rose-600 font-semibold mt-1">{{ maskedPhone }}</p>
        </div>
        <form @submit.prevent="handleVerify" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">短信验证码</label>
            <input v-model="form.code" type="text" inputmode="numeric" placeholder="请输入 6 位验证码"
              class="input-field text-center text-2xl tracking-widest" maxlength="6" autocomplete="one-time-code" required />
          </div>
          <div v-if="error" class="text-rose-500 text-sm text-center">{{ error }}</div>
          <button type="submit" class="btn-rose w-full" :disabled="loading">
            {{ loading ? '验证中…' : '进入我们的小窝' }}
          </button>
          <div class="text-center">
            <button v-if="countdown > 0" type="button" class="text-stone-400 text-sm" disabled>
              重新发送（{{ countdown }}s）
            </button>
            <button v-else type="button" class="text-rose-500 text-sm hover:text-rose-600" @click="resend" :disabled="loading">
              重新发送验证码
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const step = ref(1)
const form = ref({ phone: '', password: '', code: '' })
const error = ref('')
const loading = ref(false)
const countdown = ref(0)
let countdownTimer = null

const maskedPhone = computed(() => {
  const p = form.value.phone
  return p.length === 11 ? p.slice(0, 3) + '****' + p.slice(7) : p
})

const hearts = ref([])
onMounted(() => {
  hearts.value = Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 6,
    size: 16 + Math.random() * 20, dur: 5 + Math.random() * 4
  }))
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

function startCountdown() {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function handleLogin() {
  const phone = form.value.phone.trim()
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    error.value = '请输入正确的手机号码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await axios.post('/api/auth/login', { phone, password: form.value.password })
    step.value = 2
    startCountdown()
  } catch (e) {
    error.value = e.response?.data?.error || '登录失败'
  } finally {
    loading.value = false
  }
}

async function handleVerify() {
  loading.value = true
  error.value = ''
  try {
    await auth.verifyOtp(form.value.phone.trim(), form.value.code.trim())
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || '验证失败'
  } finally {
    loading.value = false
  }
}

async function resend() {
  loading.value = true
  error.value = ''
  form.value.code = ''
  try {
    await axios.post('/api/auth/login', { phone: form.value.phone.trim(), password: form.value.password })
    startCountdown()
  } catch (e) {
    error.value = e.response?.data?.error || '发送失败'
  } finally {
    loading.value = false
  }
}
</script>
