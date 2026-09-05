import { describe, expect, it } from 'vitest'
import { renderArticle, stripNoteMetadata } from '../../scripts/render-article.mjs'

describe('build-time article renderer', () => {
  it('renders GFM, sanitizes HTML, builds a TOC and rewrites local images', async () => {
    const result = await renderArticle(
      '## 标题\n\n<script>alert(1)</script>\n\n![图](./demo/01.png)\n\n- [x] 完成',
      'articles/2026-08/demo.md',
    )
    expect(result.html).not.toContain('<script')
    expect(result.html).toContain('/myfav/articles/2026-08/demo/01.png')
    expect(result.toc).toEqual([{ id: '标题', text: '标题', level: 2 }])
    expect(result.html).toContain('task-list-item')
  })

  it('highlights fenced code with Shiki', async () => {
    const result = await renderArticle('```js\nconst answer = 42\n```', 'articles/2026-08/code.md')
    expect(result.html).toContain('shiki')
  })

  it('treats a leading @ URL as note metadata', async () => {
    const markdown = '# 笔记标题\n\n@ https://x.com/example/status/1\n\n正文中的 @mention 保留'
    expect(stripNoteMetadata(markdown, 'notes/2026-09/demo.md')).toBe('# 笔记标题\n\n\n正文中的 @mention 保留')
    expect(stripNoteMetadata(markdown, 'articles/2026-09/demo.md')).toBe(markdown)
    const result = await renderArticle(markdown, 'notes/2026-09/demo.md')
    expect(result.html).not.toContain('x.com/example/status/1')
    expect(result.html).toContain('@mention')
  })
})
