<template>
  <div class="sites-view">
    <aside class="category-sidebar">
      <button
        v-for="cat in filteredCategories"
        :key="cat"
        class="category-btn"
        :class="{ active: activeCategory === cat }"
        @click="scrollToCategory(cat)"
      >
        {{ cat }}
        <span class="count">{{ getCategoryCount(cat) }}</span>
      </button>
    </aside>

    <div class="sites-content">
      <div v-if="filteredCategories.length === 0" class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">暂无收藏的网站</div>
      </div>

      <div
        v-for="cat in filteredCategories"
        :key="cat"
        class="category-section"
        :id="'category-' + cat"
      >
        <h2 class="category-title">{{ cat }}</h2>
        <div class="sites-grid">
          <SiteCard v-for="site in groupedByFilteredCategory[cat]" :key="site.url" :site="site" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSites } from '../composables/useSites'
import { useGlobalSearch } from '../composables/useGlobalSearch'
import SiteCard from '../components/SiteCard.vue'

const { sites, loadSites } = useSites()
const { searchQuery } = useGlobalSearch()
const activeCategory = ref('')

const filteredSites = computed(() => {
  let result = sites.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(site =>
      site.title.toLowerCase().includes(query) ||
      site.description.toLowerCase().includes(query) ||
      site.category.toLowerCase().includes(query)
    )
  }

  return result
})

const groupedByFilteredCategory = computed(() => {
  const groups = {}
  for (const site of filteredSites.value) {
    if (!groups[site.category]) {
      groups[site.category] = []
    }
    groups[site.category].push(site)
  }
  return groups
})

const filteredCategories = computed(() => {
  return Object.keys(groupedByFilteredCategory.value).sort()
})

// Set initial active category when data loads
watch(filteredCategories, (cats) => {
  if (cats.length > 0 && !activeCategory.value) {
    activeCategory.value = cats[0]
  }
}, { immediate: true })

function getCategoryCount(cat) {
  return groupedByFilteredCategory.value[cat]?.length || 0
}

function scrollToCategory(cat) {
  activeCategory.value = cat
  const section = document.getElementById('category-' + cat)
  if (section) {
    const headerHeight = 60
    const offsetTop = section.offsetTop - headerHeight - 16
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    })
  }
}

// Update active category on scroll
const handleScroll = () => {
  const headerHeight = 60
  const scrollTop = window.scrollY + headerHeight + 100
  for (const cat of filteredCategories.value) {
    const section = document.getElementById('category-' + cat)
    if (section) {
      const offsetTop = section.offsetTop
      const nextSection = filteredCategories.value.indexOf(cat) < filteredCategories.value.length - 1
        ? document.getElementById('category-' + filteredCategories.value[filteredCategories.value.indexOf(cat) + 1])
        : null
      const nextOffsetTop = nextSection ? nextSection.offsetTop : Infinity

      if (scrollTop >= offsetTop && scrollTop < nextOffsetTop) {
        activeCategory.value = cat
        break
      }
    }
  }
}

onMounted(() => {
  loadSites()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.sites-view {
  display: flex;
  gap: 24px;
}

.category-sidebar {
  width: 140px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 92px);
  overflow-y: auto;
}

.category-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--fg-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  text-align: left;
}

.category-btn:hover {
  background: var(--card-hover);
  color: var(--fg);
}

.category-btn.active {
  background: var(--accent);
  color: var(--accent-contrast);
}

.category-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.count {
  font-size: 12px;
  opacity: 0.7;
}

.sites-content {
  flex: 1;
  min-width: 0;
}

.category-section {
  margin-bottom: 32px;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--fg-muted);
  margin: 0 0 16px 0;
  letter-spacing: 0.02em;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: var(--fg-muted);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state-text {
  font-size: 14px;
}

@media (max-width: 900px) {
  .sites-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (max-width: 700px) {
  .sites-view {
    flex-direction: column;
    gap: 16px;
  }

  .category-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
    position: static;
    max-height: none;
  }

  .category-btn {
    padding: 8px 10px;
    font-size: 12px;
  }

  .sites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>