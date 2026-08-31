<template>
  <div class="collection-page">
    <nav class="mobile-category-strip" aria-label="分类筛选">
      <button v-for="entry in categories" :key="entry.name" :aria-pressed="selectedCategory === entry.name" @click="selectedCategory = entry.name">
        {{ entry.name }} <span>{{ entry.count }}</span>
      </button>
    </nav>
    <div class="collection-layout">
      <aside class="category-rail" aria-label="分类和标签">
        <button v-for="entry in categories" :key="entry.name" :aria-pressed="selectedCategory === entry.name" @click="selectedCategory = entry.name">
          <span>{{ entry.name }}</span><span>{{ entry.count }}</span>
        </button>
        <div v-if="topTags.length" class="rail-tags">
          <p>常用标签</p>
          <button v-for="tag in topTags" :key="tag" :aria-pressed="selectedTag === tag" @click="selectedTag = selectedTag === tag ? '' : tag">{{ tag }}</button>
        </div>
      </aside>
      <section class="collection-main" :aria-labelledby="`${type}-context`">
        <header class="collection-context">
          <h1 :id="`${type}-context`">{{ title }}</h1>
          <span>{{ filtered.length }} / {{ items.length }}</span>
        </header>
        <div v-if="loading" class="text-state">正在读取 {{ fileName }}…</div>
        <div v-else-if="error" class="text-state is-error">{{ error }}</div>
        <div v-else-if="!filtered.length" class="text-state">{{ emptyText }}</div>
        <div v-else class="collection-list" :class="[`collection-list--${type}`, { 'collection-list--months': groupByMonth }]">
          <template v-if="groupByMonth">
            <section v-for="group in groupedByMonth" :key="group.month" class="collection-month">
              <header class="collection-month-heading"><h2>{{ monthLabel(group.month) }}</h2><span>{{ group.items.length }}</span></header>
              <CollectionRow v-for="item in group.items" :key="item.path || item.url || item.title" :item="{ ...item, type, label: type === 'repo' ? item.name : item.title }" />
            </section>
          </template>
          <template v-else>
            <CollectionRow v-for="item in filtered" :key="item.path || item.url || item.title" :item="{ ...item, type, label: type === 'repo' ? item.name : item.title }" />
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { countBy } from '../lib/content'
import CollectionRow from './CollectionRow.vue'

const props = defineProps({
  items: { type: Array, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  fileName: { type: String, required: true },
  loading: Boolean,
  error: { type: String, default: '' },
  emptyText: { type: String, required: true },
  groupByMonth: Boolean,
})

const selectedCategory = ref('全部')
const selectedTag = ref('')
const categories = computed(() => {
  const counts = countBy(props.items, 'category')
  return [{ name: '全部', count: props.items.length }, ...Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))]
})
const topTags = computed(() => {
  const counts = props.items.flatMap((item) => item.tags || []).reduce((all, tag) => ({ ...all, [tag]: (all[tag] || 0) + 1 }), {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([tag]) => tag)
})
const filtered = computed(() => props.items.filter((item) => {
  const categoryMatches = selectedCategory.value === '全部' || item.category === selectedCategory.value
  const tagMatches = !selectedTag.value || item.tags?.includes(selectedTag.value)
  return categoryMatches && tagMatches
}))
const groupedByMonth = computed(() => {
  const groups = []
  for (const item of filtered.value) {
    const month = item.saveTime?.slice(0, 7) || '未知月份'
    let group = groups.find((entry) => entry.month === month)
    if (!group) {
      group = { month, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
})
const monthLabel = (month) => {
  const [year, value] = month.split('-')
  return value ? `${year} 年 ${Number(value)} 月` : month
}

watch(() => props.type, () => {
  selectedCategory.value = '全部'
  selectedTag.value = ''
})
</script>
