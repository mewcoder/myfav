<template>
  <article class="collection-row">
    <div class="row-main">
      <p v-if="showType" class="row-type">{{ typeLabel }} · {{ item.saveTime }}</p>
      <component
        :is="isArticle ? 'RouterLink' : 'a'"
        class="row-link"
        v-bind="linkProps"
      >
        <strong>{{ label }}</strong><span aria-hidden="true">{{ isArticle ? '→' : '↗' }}</span>
      </component>
      <p class="row-description">{{ item.description }}</p>
      <p class="row-meta">
        <span>{{ item.category }}</span>
        <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
      </p>
    </div>
    <span v-if="item.type === 'repo'" class="row-stars">{{ formatStars(item.stars) }} ★</span>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { articleRoute } from '../lib/content'

const props = defineProps({ item: { type: Object, required: true }, showType: Boolean })
const isArticle = computed(() => props.item.type === 'article')
const label = computed(() => props.item.label || props.item.title || props.item.name)
const typeLabel = computed(() => ({ site: '网站', repo: 'GitHub', article: '文章' })[props.item.type])
const linkProps = computed(() => isArticle.value
  ? { to: articleRoute(props.item) || '/articles' }
  : { href: props.item.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `打开 ${label.value}（新窗口）` })

function formatStars(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value
}
</script>
