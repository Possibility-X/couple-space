<template>
  <div class="min-h-screen bg-rose-50 flex flex-col items-center justify-center px-6">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">💑</div>
        <h1 class="text-2xl font-serif text-rose-600 font-bold">初始化你们的小窝</h1>
        <p class="text-rose-400 text-sm mt-1">只需设置一次</p>
      </div>

      <div class="card p-8 space-y-6">
        <form @submit.prevent="handleSetup">
          <!-- Person 1 -->
          <div class="space-y-3 mb-4">
            <h3 class="font-serif text-rose-500 font-semibold">TA 的账号</h3>
            <input v-model="form.person1.username" type="tel" placeholder="手机号（11位）" class="input-field" maxlength="11" required />
            <input v-model="form.person1.displayName" placeholder="昵称（如：小宝）" class="input-field" maxlength="30" required />
            <input v-model="form.person1.password" type="password" placeholder="密码" class="input-field" required />
          </div>

          <!-- Person 2 -->
          <div class="space-y-3 mb-4">
            <h3 class="font-serif text-rose-500 font-semibold">你的账号</h3>
            <input v-model="form.person2.username" type="tel" placeholder="手机号（11位）" class="input-field" maxlength="11" required />
            <input v-model="form.person2.displayName" placeholder="昵称（如：宝宝）" class="input-field" maxlength="30" required />
            <input v-model="form.person2.password" type="password" placeholder="密码" class="input-field" required />
          </div>

          <!-- Anniversary -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-stone-600 mb-1">在一起的日期 💗</label>
            <input v-model="form.anniversaryDate" type="date" class="input-field" required />
          </div>

          <div v-if="error" class="text-rose-500 text-sm text-center mb-3">{{ error }}</div>
          <button type="submit" class="btn-rose w-full" :disabled="loading">
            {{ loading ? '设置中…' : '开始我们的故事 ❤' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/lib/axios'

const router = useRouter()
const error = ref('')
const loading = ref(false)
const form = ref({
  person1: { username: '', displayName: '', password: '' },
  person2: { username: '', displayName: '', password: '' },
  anniversaryDate: ''
})

async function handleSetup() {
  const phoneRe = /^1[3-9]\d{9}$/
  if (!phoneRe.test(form.value.person1.username)) {
    error.value = 'TA 的手机号格式不正确'
    return
  }
  if (!phoneRe.test(form.value.person2.username)) {
    error.value = '你的手机号格式不正确'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await axios.post('/api/auth/setup', {
      person1: form.value.person1,
      person2: form.value.person2,
      anniversaryDate: form.value.anniversaryDate
    }, { _skipToast: true })
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.error || '设置失败'
  } finally {
    loading.value = false
  }
}
</script>
