<template>
  <div class="sites-view">
    <aside class="category-sidebar">
      <button
        v-for="cat in categories"
        :key="cat"
        class="category-btn"
        :class="{ active: activeCategory === cat }"
        @click="scrollToCategory(cat)"
      >
        {{ cat }}
        <span class="count">{{ getCategoryCount(cat) }}</span>
      </button>
    </aside>

    <div class="sites-content" ref="contentRef">
      <div v-if="categories.length === 0" class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">暂无收藏的网站</div>
      </div>

      <div
        v-for="cat in categories"
        :key="cat"
        class="category-section"
        :id="'category-' + cat"
        ref="sectionRefs"
      >
        <h2 class="category-title">{{ cat }}</h2>
        <div class="sites-grid">
          <SiteCard v-for="site in groupedByCategory[cat]" :key="site.url" :site="site" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSites } from '../composables/useSites'
import SiteCard from '../components/SiteCard.vue'

const { loadSites, groupedByCategory } = useSites()
const activeCategory = ref('')
const contentRef = ref(null)
const sectionRefs = ref([])

onMounted(() => {
  loadSites()
  // Set initial active category to first one
  if (categories.value.length > 0) {
    activeCategory.value = categories.value[0]
  }
})

const categories = computed(() => {
  return Object.keys(groupedByCategory.value).sort()
})

function getCategoryCount(cat) {
  return groupedByCategory.value[cat]?.length || 0
}

function scrollToCategory(cat) {
  activeCategory.value = cat
  const section = document.getElementById('category-' + cat)
  if (section && contentRef.value) {
    const offsetTop = section.offsetTop - contentRef.value.offsetTop - 16
    contentRef.value.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    })
  }
}

// Update active category on scroll
watch([contentRef, categories], () => {
  if (!contentRef.value) return

  const handleScroll = () => {
    const scrollTop = contentRef.value.scrollTop + 100
    for (const cat of categories.value) {
      const section = document.getElementById('category-' + cat)
      if (section) {
        const offsetTop = section.offsetTop - contentRef.value.offsetTop
        const nextSection = categories.value.indexOf(cat) < categories.value.length - 1
          ? document.getElementById('category-' + categories.value[categories.value.indexOf(cat) + 1])
          : null
        const nextOffsetTop = nextSection ? nextSection.offsetTop - contentRef.value.offsetTop : Infinity

        if (scrollTop >= offsetTop && scrollTop < nextOffsetTop) {
          activeCategory.value = cat
          break
        }
      }
    }
  }

  contentRef.value.addEventListener('scroll', handleScroll)
}, { immediate: true })
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
  top: 0;
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
    height: auto;
  }

  .category-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
    position: static;
  }

  .category-btn {
    padding: 8px 10px;
    font-size: 12px;
  }

  .sites-content {
    overflow-y: visible;
    padding-right: 0;
  }

  .sites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>