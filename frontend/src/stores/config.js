import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/axios'

export const useConfigStore = defineStore('config', () => {
  const config = ref(null)

  async function fetchConfig() {
    const res = await api.get('/api/config')
    config.value = res.data
  }

  return { config, fetchConfig }
})
