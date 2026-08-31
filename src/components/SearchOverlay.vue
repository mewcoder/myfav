<template>
  <dialog ref="dialog" class="modal search-modal" aria-labelledby="global-search-title" @cancel.prevent="close" @close="dialogClosed">
    <section class="search-dialog">
      <h2 id="global-search-title" class="sr-only">搜索收藏</h2>
      <header class="search-toolbar"><button class="search-close" aria-label="关闭搜索" @click="close"><span class="mobile-close">关闭</span><kbd>Esc</kbd></button></header>
      <label class="dialog-search"><span class="sr-only">搜索收藏</span><input ref="queryInput" v-model="query" type="search" placeholder="输入关键词…" :aria-activedescendant="activeIndex >= 0 ? `search-result-${activeIndex}` : undefined" @keydown="onQueryKeydown" /></label>
      <nav class="search-types" aria-label="搜索类型"><button v-for="option in keywordTypes" :key="option.value" :aria-pressed="keywordType === option.value" @click="keywordType = option.value">{{ option.label }}</button></nav>
      <div class="search-results" role="listbox" aria-label="搜索结果" aria-live="polite">
        <p v-if="debouncedQuery" class="search-result-state">“{{ debouncedQuery }}”的搜索结果</p>
        <p v-if="!visibleResults.length" class="text-state">没有匹配的收藏</p>
        <section v-for="group in groupedResults" :key="group.type" class="search-result-group" role="group" :aria-labelledby="`search-group-${group.type}`">
          <h3 :id="`search-group-${group.type}`">{{ group.label }}</h3>
          <div v-for="entry in group.items" :id="`search-result-${entry.index}`" :key="`${entry.record.type}:${entry.record.path || entry.record.url || entry.record.title}`" class="search-result-option" :class="{ selected: activeIndex === entry.index }" role="option" :aria-selected="activeIndex === entry.index" @mouseenter="activeIndex = entry.index" @focusin="activeIndex = entry.index">
            <CollectionRow :item="entry.record" compact @click="close" />
          </div>
        </section>
      </div>
    </section>
  </dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contentRoute, searchRecords } from '../lib/content'
import { useContent } from '../composables/useContent'
import CollectionRow from './CollectionRow.vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const dialog = ref(null)
const queryInput = ref(null)
const query = ref('')
const debouncedQuery = ref('')
const keywordType = ref('all')
const activeIndex = ref(-1)
const router = useRouter()
const { records } = useContent()
const keywordTypes = [{ value: 'all', label: '全部' }, { value: 'site', label: '网站' }, { value: 'repo', label: 'GitHub' }, { value: 'article', label: '文章' }, { value: 'note', label: '笔记' }]
const matchedResults = computed(() => searchRecords(records.value, debouncedQuery.value, keywordType.value).slice(0, 30))
const groupedResults = computed(() => {
  const labels = { article: '文章', note: '笔记', repo: 'GitHub', site: '网站' }
  const order = keywordType.value === 'all' ? ['note', 'article', 'repo', 'site'] : [keywordType.value]
  let index = 0
  return order.map((type) => ({
    type,
    label: labels[type],
    items: matchedResults.value.filter((record) => record.type === type).map((record) => ({ record, index: index++ })),
  })).filter((group) => group.items.length)
})
const visibleResults = computed(() => groupedResults.value.flatMap((group) => group.items.map((entry) => entry.record)))
let debounceTimer
let returnFocus = null

watch(query, (value) => {
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => { debouncedQuery.value = value.trim() }, 150)
})

watch([debouncedQuery, keywordType], () => { activeIndex.value = -1 })

watch(() => props.open, async (open) => {
  if (open && !dialog.value?.open) {
    resetOverlay()
    returnFocus = document.activeElement
    dialog.value.showModal()
    await nextTick()
    queryInput.value?.focus()
  } else if (!open && dialog.value?.open) dialog.value.close()
})

function resetOverlay() {
  window.clearTimeout(debounceTimer)
  query.value = ''
  debouncedQuery.value = ''
  keywordType.value = 'all'
  activeIndex.value = -1
}

function moveSelection(direction) {
  const length = visibleResults.value.length
  if (!length) return
  activeIndex.value = activeIndex.value < 0
    ? (direction > 0 ? 0 : length - 1)
    : (activeIndex.value + direction + length) % length
  nextTick(() => document.getElementById(`search-result-${activeIndex.value}`)?.scrollIntoView({ block: 'nearest' }))
}

function openSelectedResult() {
  const record = visibleResults.value[activeIndex.value < 0 ? 0 : activeIndex.value]
  if (!record) return
  if (record.type === 'article' || record.type === 'note') router.push(contentRoute(record))
  else window.open(record.url, '_blank', 'noopener,noreferrer')
  close()
}

function onQueryKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveSelection(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveSelection(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    openSelectedResult()
  }
}

function close() {
  if (dialog.value?.open) dialog.value.close()
}

function dialogClosed() {
  resetOverlay()
  returnFocus?.focus()
  returnFocus = null
  emit('close')
}

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer)
})
</script>
