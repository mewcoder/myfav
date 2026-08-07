// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('../composables/useContent', async () => {
  const { ref } = await import('vue')
  const articles = ref([{
    title: 'Article',
    url: 'https://article.example',
    description: 'Description',
    category: '阅读',
    tags: ['AI'],
    saveTime: '2026-08-07',
    path: 'articles/2026-08/article.md',
  }])
  return { useContent: () => ({ articles, loading: ref(false) }) }
})

let ArticleView

function installBrowserPolyfills() {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })))
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  } })
}

beforeAll(async () => {
  installBrowserPolyfills()
  ArticleView = (await import('./ArticleView.vue')).default
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url) => {
    const href = String(url)
    let body = '## 第一节\n\n正文\n\n## 第二节\n\n正文'
    if (href.endsWith('.toc.json')) body = '[{"id":"a","text":"第一节","level":2},{"id":"b","text":"第二节","level":2}]'
    if (href.endsWith('.html')) body = '<h2 id="a">第一节</h2><h2 id="b">第二节</h2>'
    return Promise.resolve({ ok: true, text: async () => body })
  }))
})

describe('article responsive reading controls', () => {
  it('provides a reading toolbar and TOC drawer that moves and restores focus', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/articles', component: { template: '<div />' } },
        { path: '/articles/:month/:slug', component: { template: '<div />' } },
      ],
    })
    await router.push('/articles/2026-08/article')
    const wrapper = mount(ArticleView, {
      global: { plugins: [router], stubs: { ArticleAssistant: true, UtterancesNotes: true } },
      attachTo: document.body,
    })
    await flushPromises()

    expect(wrapper.find('.article-reading-toolbar').exists()).toBe(true)
    expect(wrapper.find('.article-side-rail article-assistant-stub').exists()).toBe(true)
    const drawer = wrapper.get('.toc-drawer')
    expect(drawer.attributes('aria-labelledby')).toBe('toc-drawer-title')
    const trigger = wrapper.get('.article-reading-toolbar button')
    await trigger.trigger('click')
    await flushPromises()
    expect(drawer.element.open).toBe(true)
    expect(document.activeElement).toBe(drawer.find('a').element)

    drawer.element.dispatchEvent(new Event('cancel', { cancelable: true }))
    await flushPromises()
    expect(drawer.element.open).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    wrapper.unmount()
  })
})
