import { withBase } from './url'

export function createArticleLoader({ fetchImpl = fetch, base = import.meta.env.BASE_URL } = {}) {
  let requestId = 0
  let controller = null

  async function load(article, path = article.path) {
    const currentId = ++requestId
    controller?.abort()
    const currentController = new AbortController()
    controller = currentController

    const sourcePath = path.replace(/\.md$/, '.txt')
    const htmlPath = path.replace(/\.md$/, '.html')
    const tocPath = path.replace(/\.md$/, '.toc.json')
    const urls = [sourcePath, htmlPath, tocPath].map((itemPath) => withBase(itemPath, base))

    try {
      const responses = await Promise.all(
        urls.map((url) => fetchImpl(url, { cache: 'no-cache', signal: currentController.signal })),
      )
      if (currentId !== requestId) return null
      const [markdown, html, tocRaw] = await Promise.all(
        responses.map((response) => (response.ok ? response.text() : Promise.resolve(''))),
      )
      let toc = []
      try {
        toc = JSON.parse(tocRaw || '[]')
      } catch {
        toc = []
      }
      if (currentId !== requestId) return null
      if (!html) throw new Error(`本地正文缺失（${responses[1].status}）`)
      return { markdown, html, toc, path }
    } catch (error) {
      if (currentId !== requestId || error?.name === 'AbortError') return null
      throw error
    } finally {
      if (controller === currentController) controller = null
    }
  }

  function cancel() {
    requestId += 1
    controller?.abort()
    controller = null
  }

  return { load, cancel }
}
