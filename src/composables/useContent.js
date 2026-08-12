import { computed, readonly, ref } from 'vue'
import { toUnifiedRecords, validateContent } from '../lib/content'
import { withBase } from '../lib/url'

const sites = ref([])
const repos = ref([])
const articles = ref([])
const aiDaily = ref([])
const loading = ref(false)
const loaded = ref(false)
const error = ref('')

async function readJson(name) {
  const response = await fetch(withBase(`data/${name}.json`), { cache: 'no-cache' })
  if (!response.ok) throw new Error(`${name}.json 加载失败（${response.status}）`)
  return response.json()
}

export function useContent() {
  async function loadContent() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = ''
    try {
      const [siteData, repoData, articleData, aiDailyData] = await Promise.all([readJson('sites'), readJson('repos'), readJson('articles'), readJson('ai-daily')])
      const validationErrors = validateContent({ sites: siteData, repos: repoData, articles: articleData, aiDaily: aiDailyData })
      if (validationErrors.length) throw new Error(validationErrors[0])
      sites.value = siteData
      repos.value = repoData
      articles.value = articleData
      aiDaily.value = aiDailyData
      loaded.value = true
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '收藏数据加载失败'
    } finally {
      loading.value = false
    }
  }

  const records = computed(() => toUnifiedRecords({ sites: sites.value, repos: repos.value, articles: articles.value, aiDaily: aiDaily.value }))

  return {
    sites: readonly(sites),
    repos: readonly(repos),
    articles: readonly(articles),
    aiDaily: readonly(aiDaily),
    records,
    loading: readonly(loading),
    loaded: readonly(loaded),
    error: readonly(error),
    loadContent,
  }
}
