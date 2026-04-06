import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/axios'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { guest: true } },
  { path: '/setup', component: () => import('@/views/Setup.vue'), meta: { guest: true } },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@/views/Home.vue') },
      { path: 'gallery', component: () => import('@/views/Gallery.vue') },
      { path: 'timeline', component: () => import('@/views/Timeline.vue') },
      { path: 'upload', component: () => import('@/views/Upload.vue') },
      { path: 'settings', component: () => import('@/views/Settings.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from) => {
  const auth = useAuthStore()

  // 检查 /setup 是否已完成
  if (to.path === '/setup') {
    try {
      const res = await api.get('/api/auth/setup-status')
      if (res.data.setupDone) {
        return '/login'
      }
    } catch (e) {
      console.error('Failed to check setup status:', e)
      return '/login'
    }
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.guest && auth.isLoggedIn && to.path !== '/setup') return '/'
})

export default router
