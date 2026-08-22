<template>
  <div class="article-page">
    <nav class="article-reading-toolbar" aria-label="文章阅读工具">
      <RouterLink :to="backPath">← {{ backLabel }}</RouterLink>
      <div>
        <button ref="tocTrigger" type="button" :disabled="toc.length < 2" aria-haspopup="dialog" @click="openTocDrawer">目录</button>
        <button type="button" :aria-label="theme === 'dark' ? '切换至浅色主题' : '切换至深色主题'" @click="toggleTheme">{{ theme === 'dark' ? '☀' : '◐' }}</button>
      </div>
    </nav>
    <RouterLink class="back-link" :to="backPath">← 返回{{ backLabel }}</RouterLink>
    <div v-if="loading" class="text-state">正在加载文章…</div>
    <div v-else-if="!article" class="text-state is-error">文章不存在或已移动。</div>
    <article v-else class="article-flow">
      <header class="article-header">
        <p class="eyebrow">{{ article.category }} · {{ article.published || article.saveTime }}</p>
        <h1>{{ article.title }}</h1>
        <p class="article-deck">{{ article.description }}</p>
        <div class="article-meta-row">
          <p class="article-byline"><span v-if="article.author">{{ article.author }} · </span><a :href="article.url" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a><button class="article-copy" type="button" :disabled="!rawMarkdown" @click="copyArticle">{{ copyStatus || '复制全文' }}</button></p>
          <div v-if="article.translationPath" class="article-language-switch" role="group" aria-label="正文语言">
            <button type="button" :aria-pressed="language === 'original'" @click="setLanguage('original')">原文</button>
            <button type="button" :aria-pressed="language === 'zh'" @click="setLanguage('zh')">中文</button>
          </div>
        </div>
        <p class="article-tags"><span v-for="tag in article.tags" :key="tag">{{ tag }}</span></p>
      </header>

      <aside v-if="toc.length >= 2" class="article-side-rail">
        <div class="article-side-inner">
          <details class="article-toc" open>
            <summary>本文目录</summary>
            <a v-for="entry in toc" :key="entry.id" :class="{ nested: entry.level === 3 }" :href="`#${entry.id}`">{{ entry.text }}</a>
          </details>
        </div>
      </aside>

      <div v-if="markdownError" class="text-state is-error">{{ markdownError }} <a :href="article.url" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a></div>
      <div v-else class="markdown-body" v-html="renderedHtml"></div>
      <UtterancesNotes :key="route.path" :theme="theme" :pathname="route.path" />
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
import { useRoute, useRouter } from 'vue-router'
import { useContent } from '../composables/useContent'
import { articleRoute } from '../lib/content'
import { createArticleLoader } from '../lib/articleLoader'
import { useTheme } from '../composables/useTheme'
import UtterancesNotes from '../components/UtterancesNotes.vue'

const route = useRoute()
const router = useRouter()
const { theme, toggleTheme } = useTheme()
const { articles, aiDaily, loading: contentLoading } = useContent()
const rawMarkdown = ref('')
const renderedHtml = ref('')
const toc = ref([])
const markdownError = ref('')
const loadingMarkdown = ref(false)
const tocDrawer = ref(null)
const tocTrigger = ref(null)
const copyStatus = ref('')
const articleLoader = createArticleLoader()
const isDaily = computed(() => route.name === 'ai-daily-entry')
const collection = computed(() => isDaily.value ? aiDaily.value : articles.value)
const article = computed(() => collection.value.find((item) => isDaily.value ? item.published === route.params.date : articleRoute(item) === route.path))
const backPath = computed(() => isDaily.value ? '/ai-daily' : '/articles')
const backLabel = computed(() => isDaily.value ? 'AI 日报' : '文章')
const language = computed(() => route.query.lang === 'zh' && article.value?.translationPath ? 'zh' : 'original')
const activeArticlePath = computed(() => language.value === 'zh' ? article.value?.translationPath : article.value?.path)
const loading = computed(() => contentLoading.value || loadingMarkdown.value)
let copyStatusTimer

watch([article, activeArticlePath], async ([nextArticle, nextPath]) => {
  articleLoader.cancel()
  closeTocDrawer()
  rawMarkdown.value = ''
  renderedHtml.value = ''
  toc.value = []
  markdownError.value = ''
  copyStatus.value = ''
  if (!nextArticle || !nextPath) {
    loadingMarkdown.value = false
    return
  }
  const expectedPath = nextPath
  loadingMarkdown.value = true
  try {
    const result = await articleLoader.load(nextArticle, expectedPath)
    if (!result || activeArticlePath.value !== expectedPath) return
    rawMarkdown.value = result.markdown
    renderedHtml.value = result.html
    toc.value = result.toc
  } catch (error) {
    if (activeArticlePath.value === expectedPath) markdownError.value = error.message
  } finally {
    if (activeArticlePath.value === expectedPath) loadingMarkdown.value = false
  }
}, { immediate: true })

function setLanguage(nextLanguage) {
  const query = { ...route.query }
  if (nextLanguage === 'zh') query.lang = 'zh'
  else delete query.lang
  router.replace({ path: route.path, query })
}

async function copyArticle() {
  if (!rawMarkdown.value) return
  window.clearTimeout(copyStatusTimer)
  try {
    await navigator.clipboard.writeText(rawMarkdown.value)
    copyStatus.value = '已复制'
  } catch {
    copyStatus.value = '复制失败'
  }
  copyStatusTimer = window.setTimeout(() => { copyStatus.value = '' }, 2400)
}

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
  window.clearTimeout(copyStatusTimer)
  articleLoader.cancel()
  if (tocDrawer.value?.open) tocDrawer.value.close()
})
</script>
