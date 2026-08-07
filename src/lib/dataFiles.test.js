import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { isSaveTimeDescending, validateContent } from './content'

describe('repository data files', () => {
  it('retain all records and satisfy the production contract', async () => {
    const [sites, repos, articles] = await Promise.all(['sites', 'repos', 'articles'].map(async (name) => JSON.parse(await readFile(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'))))
    expect(sites).toHaveLength(82)
    expect(repos).toHaveLength(136)
    expect(articles).toEqual([])
    expect(isSaveTimeDescending(sites)).toBe(true)
    expect(isSaveTimeDescending(repos)).toBe(true)
    expect(validateContent({ sites, repos, articles })).toEqual([])
  })

  it('uses the normalized category and tag taxonomy', async () => {
    const [sites, repos] = await Promise.all(['sites', 'repos'].map(async (name) => JSON.parse(await readFile(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'))))
    const siteCategories = new Set(['AI 编程', 'AI 工具', 'AI 服务', '前端与设计', '开发工具', '知识与学习', '综合工具', '财务与消费', 'Agent Skills', '阅读'])
    const repoCategories = new Set(['AI 编程', 'Agent 与框架', 'AI 工具', 'Agent Skills', '知识与学习', '数据与检索', '前端与设计', '开发工具', '自动化', '安全与网络', '内容与媒体', '效率与生活'])
    const legacyTags = new Set(['skill', 'skills', 'AI Agent', 'agent', 'tool', 'doc', 'framework', 'claude-code'])

    for (const item of sites) expect(siteCategories.has(item.category), `${item.title}: ${item.category}`).toBe(true)
    for (const item of repos) expect(repoCategories.has(item.category), `${item.name}: ${item.category}`).toBe(true)
    for (const item of [...sites, ...repos]) {
      expect(item.tags.length, `${item.title || item.name}: tag count`).toBeGreaterThanOrEqual(2)
      expect(item.tags.length, `${item.title || item.name}: tag count`).toBeLessThanOrEqual(5)
      expect(new Set(item.tags).size, `${item.title || item.name}: duplicate tags`).toBe(item.tags.length)
      expect(item.tags.some((tag) => legacyTags.has(tag)), `${item.title || item.name}: legacy tag`).toBe(false)
    }
  })
})
