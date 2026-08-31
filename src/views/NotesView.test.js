// @vitest-environment jsdom
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

const notes = ref([
  { title: '八月笔记', description: '八月内容', category: '知识', tags: [], saveTime: '2026-08-31', path: 'notes/2026-08/august.md' },
  { title: '八月第二条', description: '八月内容二', category: '开发', tags: [], saveTime: '2026-08-12', path: 'notes/2026-08/second.md' },
  { title: '七月笔记', description: '七月内容', category: '知识', tags: [], saveTime: '2026-07-30', path: 'notes/2026-07/july.md' },
])

vi.mock('../composables/useContent', () => ({
  useContent: () => ({ notes, loading: ref(false), error: ref(''), records: computed(() => notes.value) }),
}))

import NotesView from './NotesView.vue'

describe('notes view', () => {
  it('groups notes by month in descending order', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/notes', component: NotesView }, { path: '/notes/:month/:slug', component: { template: '<div />' } }],
    })
    await router.push('/notes')
    const wrapper = mount(NotesView, { global: { plugins: [router] } })

    expect(wrapper.findAll('.collection-month')).toHaveLength(2)
    expect(wrapper.findAll('.collection-month-heading h2').map((node) => node.text())).toEqual(['2026 年 8 月', '2026 年 7 月'])
    expect(wrapper.findAll('.collection-month')[0].findAll('.collection-row')).toHaveLength(2)
  })
})
