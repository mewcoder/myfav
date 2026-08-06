// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { markdownContext, renderMarkdown } from './markdown'

describe('Markdown rendering', () => {
  it('sanitizes HTML, builds a TOC and rewrites local images', () => {
    const result = renderMarkdown('## 标题\n\n<script>alert(1)</script>\n\n![图](./demo/01.png)', 'articles/2026-08/demo.md', '/myfav/')
    expect(result.html).not.toContain('<script')
    expect(result.html).toContain('/myfav/articles/2026-08/demo/01.png')
    expect(result.toc).toEqual([{ id: '标题', text: '标题', level: 2 }])
  })

  it('removes image URLs from AI context', () => {
    expect(markdownContext('正文\n\n![示意图](https://example.com/a.png)')).toBe('正文\n\n示意图')
  })
})
