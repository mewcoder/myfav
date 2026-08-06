import { describe, expect, it } from 'vitest'
import { articleRoute, createJsonContext, isSaveTimeDescending, searchRecords, validateContent } from './content'

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

  it('builds exactly one complete JSON context', () => {
    const context = createJsonContext('sites', [site])
    expect(context.filename).toBe('sites.json')
    expect(JSON.parse(context.content)).toEqual([site])
    expect(() => createJsonContext('all', [site])).toThrow()
  })

  it('derives stable article routes', () => {
    expect(articleRoute({ path: 'articles/2026-08/example.md' })).toBe('/articles/2026-08/example')
  })
})
