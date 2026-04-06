<template>
  <div class="min-h-screen flex flex-col pb-20">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-rose-100 px-4 py-3 flex items-center justify-between">
      <span class="font-serif text-rose-500 font-bold text-lg">💕 我们的小窝</span>
      <div class="flex items-center gap-3">
        <router-link to="/settings">
          <img v-if="auth.user?.avatar" :src="`/uploads/avatars/${auth.user.avatar}`"
            class="w-8 h-8 rounded-full object-cover border-2 border-rose-200" />
          <div v-else class="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-sm border-2 border-rose-200 text-rose-400">
            {{ auth.user?.displayName?.[0] || '?' }}
          </div>
        </router-link>
        <button @click="logout" class="text-stone-400 text-sm hover:text-rose-400 transition">退出</button>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Bottom navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 z-30 safe-area-bottom">
      <div class="flex">
        <router-link v-for="tab in tabs" :key="tab.to" :to="tab.to"
          class="flex-1 flex flex-col items-center py-3 text-xs transition-colors"
          :class="$route.path === tab.to ? 'text-rose-500' : 'text-stone-400 hover:text-rose-400'">
          <span class="text-xl mb-0.5">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const tabs = [
  { to: '/', icon: '🏠', label: '主页' },
  { to: '/gallery', icon: '🖼', label: '相册' },
  { to: '/timeline', icon: '📅', label: '时光' },
  { to: '/upload', icon: '➕', label: '上传' }
]

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
