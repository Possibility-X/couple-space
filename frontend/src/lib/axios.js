import axios from 'axios'

const api = axios.create()

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.config?._skipToast) return Promise.reject(error)

    const { useToastStore } = await import('@/stores/toast')
    const toast = useToastStore()
    const status = error.response?.status
    const msg = error.response?.data?.error

    if (status === 401) {
      const { useAuthStore } = await import('@/stores/auth')
      const { default: router } = await import('@/router')
      useAuthStore().logout()
      router.push('/login')
      toast.error('登录已过期，请重新登录')
    } else if (status === 403) {
      toast.error(msg || '没有权限执行此操作')
    } else if (status === 429) {
      toast.error(msg || '操作过于频繁，请稍后再试')
    } else if (status >= 500) {
      toast.error('服务器错误，请稍后重试')
    } else if (!error.response) {
      toast.error('网络连接失败')
    } else if (msg) {
      toast.error(msg)
    }

    return Promise.reject(error)
  }
)

export default api
