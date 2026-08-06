<template>
  <div class="article-page">
    <nav class="article-reading-toolbar" aria-label="文章阅读工具">
      <RouterLink to="/articles">← 文章</RouterLink>
      <div>
        <button ref="tocTrigger" type="button" :disabled="toc.length < 2" aria-haspopup="dialog" @click="openTocDrawer">目录</button>
        <button type="button" :aria-label="theme === 'dark' ? '切换至浅色主题' : '切换至深色主题'" @click="toggleTheme">{{ theme === 'dark' ? '☀' : '◐' }}</button>
      </div>
    </nav>
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

    <dialog ref="tocDrawer" class="toc-drawer" aria-labelledby="toc-drawer-title" @cancel.prevent="closeTocDrawer" @close="restoreTocFocus">
      <header><h2 id="toc-drawer-title">本文目录</h2><button type="button" aria-label="关闭目录" @click="closeTocDrawer">×</button></header>
      <nav aria-label="文章目录">
        <a v-for="entry in toc" :key="entry.id" :class="{ nested: entry.level === 3 }" :href="`#${entry.id}`" @click="closeTocDrawer">{{ entry.text }}</a>
      </nav>
    </dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContent } from '../composables/useContent'
import { articleRoute } from '../lib/content'
import { createArticleLoader } from '../lib/articleLoader'
import { useTheme } from '../composables/useTheme'
import ArticleAssistant from '../components/ArticleAssistant.vue'
import UtterancesNotes from '../components/UtterancesNotes.vue'

const route = useRoute()
const { theme, toggleTheme } = useTheme()
const { articles, loading: contentLoading } = useContent()
const rawMarkdown = ref('')
const renderedHtml = ref('')
const toc = ref([])
const markdownError = ref('')
const loadingMarkdown = ref(false)
const tocDrawer = ref(null)
const tocTrigger = ref(null)
const articleLoader = createArticleLoader()
const article = computed(() => articles.value.find((item) => articleRoute(item) === route.path))
const loading = computed(() => contentLoading.value || loadingMarkdown.value)

watch(article, async (nextArticle) => {
  articleLoader.cancel()
  closeTocDrawer()
  rawMarkdown.value = ''
  renderedHtml.value = ''
  toc.value = []
  markdownError.value = ''
  if (!nextArticle) {
    loadingMarkdown.value = false
    return
  }
  const expectedPath = nextArticle.path
  loadingMarkdown.value = true
  try {
    const result = await articleLoader.load(nextArticle)
    if (!result || article.value?.path !== expectedPath) return
    rawMarkdown.value = result.markdown
    renderedHtml.value = result.html
    toc.value = result.toc
  } catch (error) {
    if (article.value?.path === expectedPath) markdownError.value = error.message
  } finally {
    if (article.value?.path === expectedPath) loadingMarkdown.value = false
  }
}, { immediate: true })

async function openTocDrawer() {
  if (toc.value.length < 2 || tocDrawer.value?.open) return
  tocDrawer.value.showModal()
  await nextTick()
  tocDrawer.value.querySelector('a')?.focus()
}

function closeTocDrawer() {
  if (tocDrawer.value?.open) tocDrawer.value.close()
}

function restoreTocFocus() {
  tocTrigger.value?.focus()
}

onBeforeUnmount(() => {
  articleLoader.cancel()
  if (tocDrawer.value?.open) tocDrawer.value.close()
})
</script>
