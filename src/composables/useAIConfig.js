import { computed, ref } from 'vue'
import { clearAIConfig, hasAIConfig, loadAIConfig, saveAIConfig } from '../lib/aiConfig'

const config = ref(loadAIConfig())

export function useAIConfig() {
  const configured = computed(() => hasAIConfig(config.value))
  return {
    config,
    configured,
    save(nextConfig) {
      config.value = saveAIConfig(nextConfig)
      return config.value
    },
    clear() {
      clearAIConfig()
      config.value = loadAIConfig()
    },
  }
}
