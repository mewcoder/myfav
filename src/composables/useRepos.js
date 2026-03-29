import { ref, computed } from 'vue'

const repos = ref([])
const loaded = ref(false)

export function useRepos() {
  async function loadRepos() {
    if (loaded.value) return
    try {
      const res = await fetch(`/myfav/data/repos.json?t=${Date.now()}`)
      if (!res.ok) throw new Error('Failed to load repos')
      repos.value = await res.json()
      loaded.value = true
    } catch (err) {
      console.error('Error loading repos:', err)
    }
  }

  const allTags = computed(() => {
    const tags = new Set()
    for (const repo of repos.value) {
      for (const tag of repo.tags) {
        tags.add(tag)
      }
    }
    return Array.from(tags).sort()
  })

  return {
    repos,
    loadRepos,
    allTags
  }
}