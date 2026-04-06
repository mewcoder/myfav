<template>
  <div class="repos-view">
    <div class="tag-bar">
      <button
        class="tag-btn"
        :class="{ active: selectedTag === '' }"
        @click="onTagSelect('')"
      >
        全部
        <span class="count">{{ repos.length }}</span>
      </button>
      <button
        v-for="tag in allTags"
        :key="tag"
        class="tag-btn"
        :class="{ active: selectedTag === tag }"
        @click="onTagSelect(tag)"
      >
        {{ tag }}
        <span class="count">{{ getTagCount(tag) }}</span>
      </button>
    </div>

    <div v-if="filteredRepos.length === 0" class="empty-state">
      <div class="empty-state-icon">📭</div>
      <div class="empty-state-text">暂无收藏的仓库</div>
    </div>

    <div v-else class="repos-grid">
      <RepoCard v-for="repo in filteredRepos" :key="repo.url" :repo="repo" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRepos } from '../composables/useRepos'
import { useGlobalSearch } from '../composables/useGlobalSearch'
import RepoCard from '../components/RepoCard.vue'

const { repos, loadRepos, allTags } = useRepos()
const { searchQuery } = useGlobalSearch()
const selectedTag = ref('')

onMounted(() => {
  loadRepos()
})

const filteredRepos = computed(() => {
  let result = repos.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(repo =>
      repo.name.toLowerCase().includes(query) ||
      repo.description.toLowerCase().includes(query) ||
      repo.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 标签过滤
  if (selectedTag.value) {
    result = result.filter(repo => repo.tags.includes(selectedTag.value))
  }

  return result
})

function onTagSelect(tag) {
  selectedTag.value = tag
}

function getTagCount(tag) {
  return repos.value.filter(repo => repo.tags.includes(tag)).length
}
</script>

<style scoped>
.repos-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  overflow-x: hidden;
}

.tag-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--fg-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.tag-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tag-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.tag-btn.active {
  background: var(--accent);
  color: var(--accent-contrast);
  border-color: var(--accent);
}

.count {
  font-size: 12px;
  opacity: 0.7;
}

.repos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
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

@media (max-width: 700px) {
  .tag-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .repos-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>