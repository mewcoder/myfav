import { describe, expect, it } from 'vitest'
import { articleRoute, isSaveTimeDescending, noteRoute, searchRecords, validateContent } from './content'

const site = { title: 'Linear', url: 'https://linear.app', description: '项目管理', category: '工具', tags: [], saveTime: '2026-08-01' }
const repo = { name: 'owner/repo', url: 'https://github.com/owner/repo', description: '工具', category: '开发', tags: ['AI'], stars: 10, saveTime: '2026-08-01' }

describe('content contract', () => {
  it('validates all content collections', () => {
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
    expect(noteRoute({ path: 'notes/2026-08/reliable-agent.md' })).toBe('/notes/2026-08/reliable-agent')
  })

  it('validates month-scoped notes', () => {
    const note = {
      title: '可靠的 Agent', description: '实践要点', category: '开发', tags: ['Agent'],
      saveTime: '2026-08-31', path: 'notes/2026-08/reliable-agent.md',
    }
    expect(validateContent({ sites: [], repos: [], articles: [], notes: [note] })).toEqual([])
    expect(validateContent({ sites: [], repos: [], articles: [], notes: [{ ...note, path: 'notes/2026-07/reliable-agent.md' }] }))
      .toContain('notes.json[0] 路径月份无效')
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
