<template>
  <article class="collection-row">
    <div class="row-main">
      <p v-if="showType && !compact" class="row-type">{{ typeLabel }} · {{ item.saveTime }}</p>
      <component
        :is="isArticle ? 'RouterLink' : 'a'"
        class="row-link"
        v-bind="linkProps"
      >
        <strong>{{ label }}</strong>
      </component>
      <p v-if="!compact" class="row-description">{{ item.description }}</p>
      <p class="row-meta">
        <template v-if="compact">
          <span>{{ item.category }}</span><span>{{ item.saveTime }}</span>
        </template>
        <template v-else>
          <span>{{ item.category }}</span><span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
        </template>
      </p>
    </div>
    <span v-if="item.type === 'repo' && !compact" class="row-stars">{{ formatStars(item.stars) }} ★</span>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { contentRoute } from '../lib/content'

const props = defineProps({ item: { type: Object, required: true }, showType: Boolean, compact: Boolean })
const isArticle = computed(() => props.item.type === 'article' || props.item.type === 'ai-daily')
const label = computed(() => props.item.label || props.item.title || props.item.name)
const typeLabel = computed(() => ({ site: '网站', repo: 'GitHub', article: '文章', 'ai-daily': 'AI 日报' })[props.item.type])
const linkProps = computed(() => isArticle.value
  ? { to: contentRoute(props.item) || (props.item.type === 'ai-daily' ? '/ai-daily' : '/articles') }
  : { href: props.item.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `打开 ${label.value}（新窗口）` })

function formatStars(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value
}
</script>
