// @vitest-environment jsdom
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('../lib/aiClient', () => ({ chatCompletion: vi.fn() }))

vi.mock('../composables/useAIConfig', async () => {
  const { computed, ref } = await import('vue')
  const config = ref({ baseUrl: 'https://api.example/v1', apiKey: '', model: 'model', rememberKey: false })
  const configured = computed(() => Boolean(config.value.baseUrl && config.value.apiKey && config.value.model))
  return {
    useAIConfig: () => ({
      config,
      configured,
      save: (next) => { config.value = { ...next } },
      clear: () => { config.value = { baseUrl: '', apiKey: '', model: '', rememberKey: false } },
    }),
  }
})

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

import { chatCompletion } from '../lib/aiClient'
import { useAIConfig } from '../composables/useAIConfig'
import AISettingsModal from './AISettingsModal.vue'
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
  const { config } = useAIConfig()
  config.value = { baseUrl: 'https://api.example/v1', apiKey: '', model: 'model', rememberKey: false }
})

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})

describe('AI settings dialog', () => {
  it('has an accessible name, focuses the first invalid field, locks fields while testing, and restores focus on Esc', async () => {
    let finishTest
    chatCompletion.mockImplementation(() => new Promise((resolve) => { finishTest = resolve }))
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(AISettingsModal, { props: { open: false }, attachTo: document.body })

    await wrapper.setProps({ open: true })
    await nextTick()
    expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe('ai-settings-title')
    expect(document.activeElement).toBe(wrapper.get('#api-key').element)

    await wrapper.get('#api-key').setValue('secret')
    await wrapper.get('.modal-actions button:nth-child(2)').trigger('click')
    expect(wrapper.get('#base-url').attributes('readonly')).toBeDefined()
    expect(wrapper.get('#api-key').attributes('readonly')).toBeDefined()
    expect(wrapper.get('#model').attributes('readonly')).toBeDefined()
    expect(wrapper.get('#remember-key').attributes('disabled')).toBeDefined()
    expect(chatCompletion).toHaveBeenCalledWith(expect.objectContaining({ stream: false, maxTokens: 1, messages: [{ role: 'user', content: 'OK' }] }))

    finishTest('OK')
    await flushPromises()
    expect(wrapper.text()).toContain('连接成功')
    expect(wrapper.get('#base-url').attributes('readonly')).toBeUndefined()

    wrapper.get('dialog').element.dispatchEvent(new Event('cancel', { cancelable: true }))
    await nextTick()
    expect(document.activeElement).toBe(trigger)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('search dialog', () => {
  it('debounces for 150ms and uses one grouped keyboard selection sequence', async () => {
    vi.useFakeTimers()
    const router = await routerAt('/')
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(SearchOverlay, { props: { open: false }, global: { plugins: [router], provide: { openAISettings: vi.fn() } }, attachTo: document.body })
    await wrapper.setProps({ open: true })
    await nextTick()
    const input = wrapper.get('input[type="search"]')
    expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe('global-search-title')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.text()).toContain('最近收藏')

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

  it('uses human-named AI scopes and clears answers before a cross-page reopen', async () => {
    const { config } = useAIConfig()
    config.value = { baseUrl: 'https://api.example/v1', apiKey: 'secret', model: 'model', rememberKey: false }
    const requests = []
    chatCompletion.mockImplementation((options) => {
      requests.push(options)
      const text = requests.length === 1 ? 'site answer' : 'repo answer'
      options.onDelta(text)
      return Promise.resolve(text)
    })
    const router = await routerAt('/sites')
    const wrapper = mount(SearchOverlay, { props: { open: false }, global: { plugins: [router], provide: { openAISettings: vi.fn() } }, attachTo: document.body })
    await wrapper.setProps({ open: true })
    await wrapper.findAll('.search-mode > button')[1].trigger('click')
    await wrapper.get('input[type="search"]').setValue('有哪些？')
    expect(wrapper.text()).toContain('问答范围网站GitHub文章')
    expect(wrapper.text()).toContain('基于“网站”中的 1 条收藏')
    await wrapper.get('.ai-scope-controls .primary-button').trigger('click')
    await flushPromises()
    expect(requests[0].messages[0].content).toContain('不要只做关键词筛选')
    expect(requests[0].messages[1].content).toContain('https://site.example')
    expect(requests[0].messages[1].content).not.toContain('https://github.com/owner/repo')
    expect(wrapper.text()).toContain('AI 回答 · 网站')
    expect(wrapper.text()).toContain('site answer')

    await wrapper.findAll('.ai-scope-controls > button:not(.primary-button)')[1].trigger('click')
    expect(wrapper.text()).toContain('基于“GitHub”中的 1 条收藏')
    await wrapper.get('.ai-scope-controls .primary-button').trigger('click')
    await flushPromises()
    expect(requests[1].messages[1].content).toContain('https://github.com/owner/repo')
    expect(requests[1].messages[1].content).not.toContain('https://site.example')
    expect(wrapper.text()).toContain('AI 回答 · GitHub')
    expect(wrapper.text()).toContain('repo answer')

    wrapper.get('dialog').element.close()
    await wrapper.setProps({ open: false })
    await router.push('/')
    await wrapper.setProps({ open: true })
    await wrapper.findAll('.search-mode > button')[1].trigger('click')
    expect(wrapper.text()).toContain('基于“文章”中的 1 条收藏')
    expect(wrapper.text()).not.toContain('repo answer')
    wrapper.unmount()
  })
})
