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
    tags: [],
    saveTime: '2026-08-07',
    path: 'articles/2026-08/article.md',
    translationPath: 'articles/2026-08/article_zh.md',
  }])
  const notes = ref([{
    title: '可靠的 Agent',
    description: '记录实践要点',
    category: '开发',
    tags: ['Agent'],
    saveTime: '2026-08-31',
    path: 'notes/2026-08/reliable-agent.md',
  }, {
    title: '10 个最值得安装的 skills',
    description: '记录实践要点',
    category: '工具',
    tags: ['Skills'],
    saveTime: '2026-09-05',
    path: 'notes/2026-09/10-个最值得安装的-skills.md',
  }])
  return { useContent: () => ({ articles, notes, loading: ref(false) }) }
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
  it('renders a local note without an external source or Issue notes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/notes', component: { template: '<div />' } },
        { path: '/notes/:month/:slug', name: 'note', component: { template: '<div />' } },
      ],
    })
    await router.push('/notes/2026-08/reliable-agent')
    const wrapper = mount(ArticleView, {
      global: { plugins: [router], stubs: { UtterancesNotes: true } },
    })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('可靠的 Agent')
    expect(wrapper.get('.article-byline').text()).toContain('本地 Markdown')
    expect(wrapper.find('.article-notes').exists()).toBe(false)
    wrapper.unmount()
  })

  it('resolves a local note whose slug contains Chinese characters', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/notes', component: { template: '<div />' } },
        { path: '/notes/:month/:slug', name: 'note', component: { template: '<div />' } },
      ],
    })
    await router.push('/notes/2026-09/10-%E4%B8%AA%E6%9C%80%E5%80%BC%E5%BE%97%E5%AE%89%E8%A3%85%E7%9A%84-skills')
    const wrapper = mount(ArticleView, {
      global: { plugins: [router], stubs: { UtterancesNotes: true } },
    })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('10 个最值得安装的 skills')
    wrapper.unmount()
  })

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
      global: { plugins: [router], stubs: { UtterancesNotes: true } },
      attachTo: document.body,
    })
    await flushPromises()

    expect(wrapper.find('.article-reading-toolbar').exists()).toBe(true)
    expect(wrapper.find('.article-side-rail .article-toc').exists()).toBe(true)
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

  it('switches between the original and Chinese Markdown with a shareable query', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/articles', component: { template: '<div />' } },
        { path: '/articles/:month/:slug', component: { template: '<div />' } },
      ],
    })
    await router.push('/articles/2026-08/article')
    const wrapper = mount(ArticleView, {
      global: { plugins: [router], stubs: { UtterancesNotes: true } },
    })
    await flushPromises()

    const buttons = wrapper.findAll('.article-language-switch button')
    expect(buttons).toHaveLength(2)
    expect(wrapper.find('.article-meta-row .article-language-switch').exists()).toBe(true)
    expect(wrapper.find('.article-header > .article-language-switch').exists()).toBe(false)
    expect(buttons[0].attributes('aria-pressed')).toBe('true')
    await buttons[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.lang).toBe('zh')
    expect(wrapper.findAll('.article-language-switch button')[1].attributes('aria-pressed')).toBe('true')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('article_zh.rendered.html'),
      expect.objectContaining({ cache: 'no-cache' }),
    )
    wrapper.unmount()
  })
})
