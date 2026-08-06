<template>
  <div class="article-page">
    <RouterLink class="back-link" to="/articles">← 返回文章</RouterLink>
    <div v-if="loading" class="text-state">正在加载文章…</div>
    <div v-else-if="!article" class="text-state is-error">文章不存在或已移动。</div>
    <article v-else class="article-flow">
      <header class="article-header">
        <p class="eyebrow">{{ article.category }} · {{ article.published || article.saveTime }}</p>
        <h1>{{ article.title }}</h1>
        <p class="article-deck">{{ article.description }}</p>
        <p class="article-byline"><span v-if="article.author">{{ article.author }} · </span><a :href="article.url" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a></p>
        <p class="article-tags"><span v-for="tag in article.tags" :key="tag">{{ tag }}</span></p>
      </header>

      <aside v-if="rawMarkdown" class="article-side-rail">
        <div class="article-side-inner">
          <details v-if="toc.length >= 2" class="article-toc" open>
            <summary>本文目录</summary>
            <a v-for="entry in toc" :key="entry.id" :class="{ nested: entry.level === 3 }" :href="`#${entry.id}`">{{ entry.text }}</a>
          </details>
          <ArticleAssistant :markdown="rawMarkdown" :path="article.path" />
        </div>
      </aside>

      <div v-if="markdownError" class="text-state is-error">{{ markdownError }} <a :href="article.url" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a></div>
      <div v-else class="markdown-body" v-html="renderedHtml"></div>
      <UtterancesNotes :key="route.fullPath" :theme="theme" :pathname="route.path" />
    </article>
  </div>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContent } from '../composables/useContent'
import { articleRoute } from '../lib/content'
import { renderMarkdown } from '../lib/markdown'
import { withBase } from '../lib/url'
import ArticleAssistant from '../components/ArticleAssistant.vue'
import UtterancesNotes from '../components/UtterancesNotes.vue'

const route = useRoute()
const theme = inject('theme')
const { articles, loading: contentLoading } = useContent()
const rawMarkdown = ref('')
const renderedHtml = ref('')
const toc = ref([])
const markdownError = ref('')
const loadingMarkdown = ref(false)
const article = computed(() => articles.value.find((item) => articleRoute(item) === route.path))
const loading = computed(() => contentLoading.value || loadingMarkdown.value)

watch(article, async (nextArticle) => {
  rawMarkdown.value = ''
  renderedHtml.value = ''
  toc.value = []
  markdownError.value = ''
  if (!nextArticle) return
  loadingMarkdown.value = true
  try {
    const response = await fetch(withBase(nextArticle.path), { cache: 'no-cache' })
    if (!response.ok) throw new Error(`本地正文缺失（${response.status}）`)
    rawMarkdown.value = await response.text()
    const rendered = renderMarkdown(rawMarkdown.value, nextArticle.path, import.meta.env.BASE_URL)
    renderedHtml.value = rendered.html
    toc.value = rendered.toc
  } catch (error) {
    markdownError.value = error.message
  } finally {
    loadingMarkdown.value = false
  }
}, { immediate: true })
</script>
