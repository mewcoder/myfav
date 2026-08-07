import { describe, expect, it } from 'vitest'
import { markdownContext } from './markdown'
import { renderArticle } from '../../scripts/render-article.mjs'

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
})

describe('AI context', () => {
  it('removes image URLs from AI context', () => {
    expect(markdownContext('正文\n\n![示意图](https://example.com/a.png)')).toBe('正文\n\n示意图')
  })
})
