<template>
  <div class="app" :class="{ 'is-article': route.name === 'article' }">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink class="brand" to="/" aria-label="MyFav 首页">MyFav<span>.</span></RouterLink>
        <nav class="desktop-nav" aria-label="主导航"><RouterLink to="/">首页</RouterLink><RouterLink to="/sites">网站</RouterLink><RouterLink to="/repos">GitHub</RouterLink><RouterLink to="/articles">文章</RouterLink></nav>
        <div class="header-actions">
          <button class="header-search" type="button" aria-haspopup="dialog" @click="searchOpen = true"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg><span>搜索收藏或问 AI…</span><kbd>⌘K</kbd></button>
          <button class="icon-button ai-trigger" type="button" aria-haspopup="dialog" :aria-label="configured ? 'AI 设置（已配置）' : 'AI 设置（未配置）'" @click="openAISettings()"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/></svg><span v-if="configured" class="status-dot" aria-hidden="true"></span></button>
          <button class="icon-button" type="button" :aria-label="theme === 'dark' ? '切换至浅色主题' : '切换至深色主题'" @click="toggleTheme"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/></svg></button>
          <a class="source-link" href="https://github.com/mewcoder/myfav" target="_blank" rel="noopener noreferrer">源码 ↗</a>
        </div>
      </div>
    </header>

    <main id="main-content" class="page-shell"><RouterView /></main>
    <nav class="mobile-nav" aria-label="移动端主导航"><RouterLink to="/">首页</RouterLink><RouterLink to="/sites">网站</RouterLink><RouterLink to="/repos">GitHub</RouterLink><RouterLink to="/articles">文章</RouterLink></nav>
    <SearchOverlay :open="searchOpen" @close="searchOpen = false" />
    <AISettingsModal :open="settingsOpen" @close="settingsClosed" @saved="settingsSaved" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import AISettingsModal from './components/AISettingsModal.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import { useAIConfig } from './composables/useAIConfig'
import { useContent } from './composables/useContent'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const searchOpen = ref(false)
const settingsOpen = ref(false)
const resumeAfterSettings = ref(null)
const reopenSearchAfterSettings = ref(false)
const { loadContent } = useContent()
const { configured } = useAIConfig()
const { theme, toggleTheme } = useTheme()
provide('theme', theme)
provide('openAISettings', openAISettings)

function openAISettings(resume) {
  reopenSearchAfterSettings.value = searchOpen.value
  searchOpen.value = false
  resumeAfterSettings.value = typeof resume === 'function' ? resume : null
  settingsOpen.value = true
}

function settingsSaved() {
  settingsOpen.value = false
  const resume = resumeAfterSettings.value
  const reopenSearch = reopenSearchAfterSettings.value
  resumeAfterSettings.value = null
  reopenSearchAfterSettings.value = false
  window.setTimeout(() => {
    if (reopenSearch) searchOpen.value = true
    if (resume) resume()
  }, 0)
}

function settingsClosed() {
  settingsOpen.value = false
  const reopenSearch = reopenSearchAfterSettings.value
  reopenSearchAfterSettings.value = false
  resumeAfterSettings.value = null
  if (reopenSearch) window.setTimeout(() => { searchOpen.value = true }, 0)
}

function globalShortcut(event) {
  const typing = event.target.matches('input, textarea, [contenteditable="true"]')
  if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !typing)) {
    event.preventDefault()
    searchOpen.value = true
  }
}

loadContent()
onMounted(() => window.addEventListener('keydown', globalShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', globalShortcut))
</script>
