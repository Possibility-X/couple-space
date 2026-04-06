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

// null = unchecked, true/false = cached result
// Invalidated when leaving /setup so the completed setup is picked up immediately.
let setupDone = null

router.beforeEach(async (to, from) => {
  const auth = useAuthStore()

  // Re-fetch after leaving /setup (setup may have just been completed)
  if (from.path === '/setup') setupDone = null

  if (setupDone === null) {
    try {
      const res = await api.get('/api/auth/setup-status', { _skipToast: true })
      setupDone = !!res.data.setupDone
    } catch {
      setupDone = false
    }
  }

  // Setup not done → force /setup for every route
  if (!setupDone && to.path !== '/setup') return '/setup'
  // Setup done → block /setup
  if (setupDone && to.path === '/setup') return '/login'

  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.guest && auth.isLoggedIn) return '/'
})

export default router
