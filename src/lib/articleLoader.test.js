import { describe, expect, it, vi } from 'vitest'
import { createArticleLoader } from './articleLoader'

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

describe('article loader', () => {
  it('only returns the latest route request even when the older response finishes last', async () => {
    const requests = new Map()
    const fetchImpl = vi.fn((url) => {
      const pending = deferred()
      requests.set(url, pending)
      return pending.promise
    })
    const loader = createArticleLoader({ fetchImpl, base: '/myfav/', render: (markdown, path) => ({ html: `${path}:${markdown}`, toc: [] }) })
    const articleA = { path: 'articles/2026-08/a.md' }
    const articleB = { path: 'articles/2026-08/b.md' }

    const loadA = loader.load(articleA)
    const loadB = loader.load(articleB)
    requests.get('/myfav/articles/2026-08/b.md').resolve({ ok: true, text: async () => 'B' })
    await expect(loadB).resolves.toMatchObject({ markdown: 'B', path: articleB.path })
    requests.get('/myfav/articles/2026-08/a.md').resolve({ ok: true, text: async () => 'A' })
    await expect(loadA).resolves.toBeNull()
  })
})
