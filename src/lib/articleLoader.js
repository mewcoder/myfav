import { renderMarkdown } from './markdown'
import { withBase } from './url'

export function createArticleLoader({ fetchImpl = fetch, render = renderMarkdown, base = import.meta.env.BASE_URL } = {}) {
  let requestId = 0
  let controller = null

  async function load(article) {
    const currentId = ++requestId
    controller?.abort()
    const currentController = new AbortController()
    controller = currentController

    try {
      const response = await fetchImpl(withBase(article.path, base), { cache: 'no-cache', signal: currentController.signal })
      if (!response.ok) throw new Error(`本地正文缺失（${response.status}）`)
      const markdown = await response.text()
      const rendered = render(markdown, article.path, base)
      if (currentId !== requestId) return null
      return { markdown, html: rendered.html, toc: rendered.toc, path: article.path }
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
