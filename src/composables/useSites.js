import { ref, computed } from 'vue'

const sites = ref([])
const loaded = ref(false)

export function useSites() {
  async function loadSites() {
    if (loaded.value) return
    try {
      const res = await fetch('/myfav/data/sites.json')
      if (!res.ok) throw new Error('Failed to load sites')
      sites.value = await res.json()
      loaded.value = true
    } catch (err) {
      console.error('Error loading sites:', err)
    }
  }

  const groupedByCategory = computed(() => {
    const groups = {}
    for (const site of sites.value) {
      if (!groups[site.category]) {
        groups[site.category] = []
      }
      groups[site.category].push(site)
    }
    return groups
  })

  return {
    sites,
    loadSites,
    groupedByCategory
  }
}