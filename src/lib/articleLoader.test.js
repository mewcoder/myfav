import { describe, expect, it, vi } from 'vitest'
import { createArticleLoader } from './articleLoader'

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function response(text) {
  return { ok: true, text: async () => text }
}

describe('article loader', () => {
  it('only returns the latest route request even when the older response finishes last', async () => {
    const requests = new Map()
    const fetchImpl = vi.fn((url) => {
      const pending = deferred()
      requests.set(url, pending)
      return pending.promise
    })
    const loader = createArticleLoader({ fetchImpl, base: '/myfav/' })
    const articleA = { path: 'articles/2026-08/a.md' }
    const articleB = { path: 'articles/2026-08/b.md' }

    const loadA = loader.load(articleA)
    const loadB = loader.load(articleB)

    const bUrls = [
      '/myfav/articles/2026-08/b.txt',
      '/myfav/articles/2026-08/b.html',
      '/myfav/articles/2026-08/b.toc.json',
    ]
    for (const [index, url] of bUrls.entries()) {
      requests.get(url).resolve(response(index === 1 ? '<p>B</p>' : index === 2 ? '[{"id":"x","text":"X","level":2}]' : 'B'))
    }
    await expect(loadB).resolves.toMatchObject({
      markdown: 'B',
      html: '<p>B</p>',
      toc: [{ id: 'x', text: 'X', level: 2 }],
      path: articleB.path,
    })

    const aUrls = [
      '/myfav/articles/2026-08/a.txt',
      '/myfav/articles/2026-08/a.html',
      '/myfav/articles/2026-08/a.toc.json',
    ]
    for (const [index, url] of aUrls.entries()) {
      requests.get(url).resolve(response(index === 1 ? '<p>A</p>' : index === 2 ? '[]' : 'A'))
    }
    await expect(loadA).resolves.toBeNull()
  })

  it('throws when the rendered page is missing', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404, text: async () => '' }))
    const loader = createArticleLoader({ fetchImpl, base: '/myfav/' })
    await expect(loader.load({ path: 'articles/2026-08/missing.md' })).rejects.toThrow('本地正文缺失')
  })

  it('loads an explicitly selected translation path', async () => {
    const fetchImpl = vi.fn(async (url) => response(String(url).endsWith('.toc.json') ? '[]' : '中文'))
    const loader = createArticleLoader({ fetchImpl, base: '/myfav/' })
    await expect(loader.load(
      { path: 'articles/2026-08/article.md' },
      'articles/2026-08/article_zh.md',
    )).resolves.toMatchObject({ path: 'articles/2026-08/article_zh.md', markdown: '中文' })
    expect(fetchImpl).toHaveBeenCalledWith(
      '/myfav/articles/2026-08/article_zh.html',
      expect.objectContaining({ cache: 'no-cache' }),
    )
  })
})
