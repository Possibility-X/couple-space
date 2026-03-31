import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.guest && auth.isLoggedIn && to.path !== '/setup') return '/'
})

export default router
