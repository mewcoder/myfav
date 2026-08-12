import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { isSaveTimeDescending, validateContent } from './content'

describe('repository data files', () => {
  it('retain all records and satisfy the production contract', async () => {
    const [sites, repos, articles, aiDaily] = await Promise.all(['sites', 'repos', 'articles', 'ai-daily'].map(async (name) => JSON.parse(await readFile(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'))))
    expect(sites).toHaveLength(83)
    expect(repos).toHaveLength(135)
    expect(articles.length).toBeGreaterThan(0)
    expect(aiDaily).toHaveLength(1)
    expect(isSaveTimeDescending(sites)).toBe(true)
    expect(isSaveTimeDescending(repos)).toBe(true)
    expect(validateContent({ sites, repos, articles, aiDaily })).toEqual([])
  })

  it('uses the normalized category and tag taxonomy', async () => {
    const [sites, repos] = await Promise.all(['sites', 'repos'].map(async (name) => JSON.parse(await readFile(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'))))
    const categories = new Set(['AI', '开发', '设计', '知识', '工具', '生活'])
    const legacyTags = new Set(['skill', 'skills', 'AI Agent', 'agent', 'tool', 'doc', 'framework', 'claude-code'])

    for (const item of [...sites, ...repos]) {
      expect(categories.has(item.category), `${item.title || item.name}: ${item.category}`).toBe(true)
      expect(item.tags.length, `${item.title || item.name}: tag count`).toBeGreaterThanOrEqual(2)
      expect(item.tags.length, `${item.title || item.name}: tag count`).toBeLessThanOrEqual(6)
      expect(new Set(item.tags).size, `${item.title || item.name}: duplicate tags`).toBe(item.tags.length)
      expect(item.tags.some((tag) => categories.has(tag)), `${item.title || item.name}: category used as tag`).toBe(false)
      expect(item.tags.some((tag) => legacyTags.has(tag)), `${item.title || item.name}: legacy tag`).toBe(false)
    }
  })
})
