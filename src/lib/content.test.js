import { describe, expect, it } from 'vitest'
import { aiDailyRoute, articleRoute, isSaveTimeDescending, searchRecords, validateContent } from './content'

const site = { title: 'Linear', url: 'https://linear.app', description: '项目管理', category: '工具', tags: [], saveTime: '2026-08-01' }
const repo = { name: 'owner/repo', url: 'https://github.com/owner/repo', description: '工具', category: '开发', tags: ['AI'], stars: 10, saveTime: '2026-08-01' }

describe('content contract', () => {
  it('validates all three arrays', () => {
    expect(validateContent({ sites: [site], repos: [repo], articles: [] })).toEqual([])
    expect(validateContent({ sites: [{ ...site, tags: undefined }], repos: [repo], articles: [] })).toContain('sites.json[0] 字段不完整')
  })

  it('rejects records that are not ordered by saveTime descending', () => {
    const older = { ...site, title: 'Older', url: 'https://older.example', saveTime: '2026-07-01' }
    expect(isSaveTimeDescending([site, older])).toBe(true)
    expect(validateContent({ sites: [older, site], repos: [repo], articles: [] })).toContain('sites.json 必须按 saveTime 倒序排列')
  })

  it('searches metadata without changing records', () => {
    const records = [{ ...site, type: 'site', label: site.title }, { ...repo, type: 'repo', label: repo.name }]
    expect(searchRecords(records, 'AI')).toHaveLength(1)
    expect(searchRecords(records, '', 'site')).toHaveLength(1)
  })

  it('derives stable article routes', () => {
    expect(articleRoute({ path: 'articles/2026-08/example.md' })).toBe('/articles/2026-08/example')
    expect(aiDailyRoute({ published: '2026-08-13' })).toBe('/ai-daily/2026-08-13')
  })

  it('validates the standalone AI daily collection', () => {
    const daily = {
      title: 'AI 日报 | 2026-08-13', url: 'https://example.com/ai-daily/2026-08-13',
      description: '日报', category: 'AI 日报', tags: [], saveTime: '2026-08-13',
      published: '2026-08-13', path: 'articles/2026-08/2026-08-13.md',
    }
    expect(validateContent({ sites: [], repos: [], articles: [], aiDaily: [daily] })).toEqual([])
    expect(validateContent({ sites: [], repos: [], articles: [], aiDaily: [{ ...daily, path: '' }] }))
      .toContain('ai-daily.json[0] 字段不完整')
  })

  it('accepts the conventional Chinese translation path and rejects other paths', () => {
    const article = {
      title: 'Guide', url: 'https://example.com/guide', description: '指南', category: '知识',
      tags: [], saveTime: '2026-08-01', path: 'articles/2026-08/guide.md',
      translationPath: 'articles/2026-08/guide_zh.md',
    }
    expect(validateContent({ sites: [], repos: [], articles: [article] })).toEqual([])
    expect(validateContent({ sites: [], repos: [], articles: [{ ...article, translationPath: 'articles/2026-08/zh.md' }] }))
      .toContain('articles.json[0] 中文译文路径无效')
  })
})
