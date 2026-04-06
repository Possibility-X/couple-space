import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(data) {
    user.value = data.user
    token.value = data.token
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('token', data.token)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  async function fetchMe() {
    try {
      const res = await api.get('/api/auth/me')
      user.value = res.data
    } catch {
      logout()
    }
  }

  async function verifyOtp(phone, code) {
    const res = await api.post('/api/auth/verify-otp', { phone, code }, { _skipToast: true })
    setAuth(res.data)
  }

  return { user, token, isLoggedIn, setAuth, logout, fetchMe, verifyOtp }
})
