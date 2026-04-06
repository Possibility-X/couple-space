<template>
  <teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div v-for="t in toastStore.toasts" :key="t.id"
          class="rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 max-w-sm pointer-events-auto text-sm text-white"
          :class="colors[t.type]">
          <span>{{ icons[t.type] }}</span>
          <span class="flex-1">{{ t.message }}</span>
          <button @click="toastStore.remove(t.id)" class="text-white/70 hover:text-white ml-1">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
const colors = { success: 'bg-green-500', error: 'bg-rose-500', info: 'bg-stone-700' }
const icons = { success: '✓', error: '✗', info: 'ℹ' }
</script>
