// @vitest-environment jsdom
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('../composables/useContent', async () => {
  const { computed, ref } = await import('vue')
  const sites = ref([{ title: 'Site', label: 'Site', type: 'site', url: 'https://site.example', description: 'site item', category: '工具', tags: [], saveTime: '2026-08-03' }])
  const repos = ref([{ name: 'owner/repo', label: 'owner/repo', type: 'repo', url: 'https://github.com/owner/repo', description: 'repo item', category: '开发', tags: ['AI'], stars: 1, saveTime: '2026-08-02' }])
  const articles = ref([{ title: 'Article', label: 'Article', type: 'article', url: 'https://article.example', description: 'article item', category: '知识', tags: [], saveTime: '2026-08-04', path: 'articles/2026-08/article.md' }])
  return {
    useContent: () => ({
      sites,
      repos,
      articles,
      records: computed(() => [...articles.value, ...sites.value, ...repos.value]),
    }),
  }
})

import SearchOverlay from './SearchOverlay.vue'

function installDialogPolyfill() {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  } })
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value() {} })
}

function routerAt(path = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/sites', component: { template: '<div />' } },
      { path: '/repos', component: { template: '<div />' } },
      { path: '/articles/:month/:slug', component: { template: '<div />' } },
    ],
  })
  return router.push(path).then(() => router)
}

beforeEach(() => {
  installDialogPolyfill()
  vi.clearAllMocks()
})

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})

describe('search dialog', () => {
  it('debounces for 150ms and uses one grouped keyboard selection sequence', async () => {
    vi.useFakeTimers()
    const router = await routerAt('/')
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(SearchOverlay, { props: { open: false }, global: { plugins: [router] }, attachTo: document.body })
    await wrapper.setProps({ open: true })
    await nextTick()
    const input = wrapper.get('input[type="search"]')
    expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe('global-search-title')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.text()).not.toContain('最近收藏')

    await input.setValue('repo')
    vi.advanceTimersByTime(149)
    await nextTick()
    expect(wrapper.findAll('.search-result-option')).toHaveLength(3)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.findAll('.search-result-option')).toHaveLength(1)

    await input.setValue('')
    vi.advanceTimersByTime(150)
    await nextTick()
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('search-result-0')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('search-result-1')
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.attributes('aria-activedescendant')).toBe('search-result-0')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/articles/2026-08/article')
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

})
