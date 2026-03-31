import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useConfigStore = defineStore('config', () => {
  const config = ref(null)

  async function fetchConfig() {
    const res = await axios.get('/api/config')
    config.value = res.data
  }

  return { config, fetchConfig }
})
