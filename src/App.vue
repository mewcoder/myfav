<template>
  <div class="app" :class="{ 'is-article': route.name === 'article' || route.name === 'note' }">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink class="brand" to="/" aria-label="MyFav 首页">MyFav<span>.</span></RouterLink>
        <nav class="desktop-nav" aria-label="主导航"><RouterLink to="/">首页</RouterLink><RouterLink to="/sites">网站</RouterLink><RouterLink to="/repos">GitHub</RouterLink><RouterLink to="/articles">文章</RouterLink><RouterLink to="/notes">笔记</RouterLink></nav>
        <div class="header-actions">
          <button class="header-search" type="button" aria-haspopup="dialog" @click="searchOpen = true"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg><span>搜索</span><kbd>⌘K</kbd></button>
          <button class="icon-button" type="button" :aria-label="theme === 'dark' ? '切换至浅色主题' : '切换至深色主题'" @click="toggleTheme"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/></svg></button>
          <a class="source-link" href="https://github.com/mewcoder/myfav" target="_blank" rel="noopener noreferrer" aria-label="打开 GitHub 源码"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2.2a9.8 9.8 0 0 0-3.1 19.1c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.4-2.2-.2-4.5-1.1-4.5-4.8 0-1.1.4-2 1-2.7-.1-.2-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.8 9.8 0 0 1 5.1 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.5.1 2.7.6.7 1 1.6 1 2.7 0 3.7-2.3 4.6-4.5 4.8.4.3.7 1 .7 1.9v2.8c0 .3.2.6.7.5A9.8 9.8 0 0 0 12 2.2Z"/></svg></a>
        </div>
      </div>
    </header>

    <main id="main-content" class="page-shell"><RouterView /></main>
    <nav class="mobile-nav" aria-label="移动端主导航"><RouterLink to="/">首页</RouterLink><RouterLink to="/sites">网站</RouterLink><RouterLink to="/repos">GitHub</RouterLink><RouterLink to="/articles">文章</RouterLink><RouterLink to="/notes">笔记</RouterLink></nav>
    <SearchOverlay :open="searchOpen" @close="searchOpen = false" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import SearchOverlay from './components/SearchOverlay.vue'
import { useContent } from './composables/useContent'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const searchOpen = ref(false)
const { loadContent } = useContent()
const { theme, toggleTheme } = useTheme()
provide('theme', theme)

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
