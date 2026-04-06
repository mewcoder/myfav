<template>
  <div class="app" :class="{ dark: isDark }">
    <header class="header">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <span class="logo-text">MyFav</span>
        </router-link>
        <a
          class="github-link"
          href="https://github.com/mewcoder/myfav"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub 仓库"
          title="GitHub 仓库"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
      <div class="nav-right">
        <div class="search-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="currentTab === 'repos' ? '搜索仓库...' : '搜索网站...'"
            class="search-input"
            :aria-label="currentTab === 'repos' ? '搜索仓库' : '搜索网站'"
          />
        </div>
        <nav class="nav-pills" role="navigation">
          <router-link to="/sites" class="nav-pill" custom v-slot="{ navigate, isActive }">
            <button @click="navigate" :class="{ active: isActive }">网站</button>
          </router-link>
          <router-link to="/repos" class="nav-pill" custom v-slot="{ navigate, isActive }">
            <button @click="navigate" :class="{ active: isActive }">仓库</button>
          </router-link>
        </nav>
        <button
          class="theme-toggle"
          @click="toggleTheme"
          :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
          :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
        >
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalSearch } from './composables/useGlobalSearch'

const route = useRoute()
const { searchQuery, clearSearch } = useGlobalSearch()
const isDark = ref(false)

const currentTab = computed(() => {
  if (route.path.startsWith('/repos')) return 'repos'
  return 'sites'
})

// Clear search when switching tabs
const prevTab = ref(currentTab.value)
watch(currentTab, (newTab) => {
  if (newTab !== prevTab.value) {
    clearSearch()
    prevTab.value = newTab
  }
})

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600&display=swap&font-display=swap');

*, *::before, *::after {
  box-sizing: border-box;
}

:root {
  --bg: #faf5ef;
  --bg-secondary: #f5f0eb;
  --bg-card-start: #ffffff;
  --bg-card-end: #faf5ef;
  --fg: #3d3528;
  --fg-secondary: #6b5a48;
  --fg-muted: #8b7355;
  --border: #e5dfd5;
  --border-weak: #e5dfd5;
  --accent: #7c5c42;
  --accent-contrast: #ffffff;
  --card-hover: #f5f0eb;
  --tag-bg: transparent;
  --tag-text: #7c5c42;
  --tag-border: #7c5c42;
  --shadow: 0 1px 3px rgba(61, 53, 40, 0.06);
  --shadow-hover: 0 4px 12px rgba(61, 53, 40, 0.08);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-pill: 7px;
  --focus-ring: 0 0 0 2px var(--accent);
  --nav-bg: rgba(250, 245, 239, 0.85);
  --nav-border: #e5dfd5;
  --nav-pill-bg: rgba(235, 229, 219, 0.8);
}

.dark {
  --bg: #18181b;
  --bg-secondary: #1f1f23;
  --bg-card-start: #27272a;
  --bg-card-end: #1f1f23;
  --fg: #fafafa;
  --fg-secondary: #a1a1aa;
  --fg-muted: #71717a;
  --border: #3f3f46;
  --border-weak: #27272a;
  --accent: #d4a574;
  --accent-contrast: #18181b;
  --card-hover: #27272a;
  --tag-bg: transparent;
  --tag-text: #d4a574;
  --tag-border: #d4a574;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.3);
  --nav-bg: rgba(24, 24, 27, 0.85);
  --nav-border: #27272a;
  --nav-pill-bg: rgba(31, 31, 35, 0.8);
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  font-family: 'DM Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
  transition: background 0.3s ease, color 0.3s ease;
}

/* Focus visible for keyboard navigation */
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

.app {
  min-height: 100vh;
  transition: background 0.3s ease;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--nav-bg);
  background-color: var(--bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--nav-border);
}

.logo {
  text-decoration: none;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
  letter-spacing: -0.3px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--border-weak);
  border-radius: var(--radius-sm);
  background: var(--nav-pill-bg);
}

.search-icon {
  color: var(--fg-muted);
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  color: var(--fg);
  font-size: 13px;
  width: 120px;
  outline: none;
}

.search-input::placeholder {
  color: var(--fg-muted);
}

.nav-pills {
  display: flex;
  gap: 3px;
  background: var(--nav-pill-bg);
  padding: 4px;
  border-radius: var(--radius-pill);
}

.nav-pills button {
  padding: 10px 14px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--fg-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-pills button:hover {
  color: var(--fg);
}

.nav-pills button.active {
  background: var(--accent);
  color: var(--accent-contrast);
}

.nav-pills button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--fg-muted);
  transition: background 0.15s ease, color 0.15s ease;
}

.github-link:hover {
  background: var(--card-hover);
  color: var(--fg);
}

.github-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.theme-toggle:hover {
  background: var(--card-hover);
  color: var(--fg);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--fg-muted);
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 14px;
}

@media (max-width: 640px) {
  .header {
    padding: 10px 16px;
  }

  .logo-text {
    font-size: 16px;
  }

  .search-wrapper {
    padding: 5px 8px;
  }

  .search-input {
    font-size: 12px;
    width: 80px;
  }

  .nav-pills {
    gap: 2px;
    padding: 3px;
  }

  .nav-pills button {
    padding: 6px 10px;
    font-size: 12px;
  }

  .github-link {
    width: 24px;
    height: 24px;
  }

  .github-link svg {
    width: 14px;
    height: 14px;
  }

  .theme-toggle {
    width: 32px;
    height: 32px;
  }

  .main {
    padding: 20px 16px;
  }
}
</style>