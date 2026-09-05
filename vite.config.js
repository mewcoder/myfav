import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const base = '/myfav/'
const contentRoots = [
  { name: 'articles', root: resolve(process.cwd(), 'articles') },
  { name: 'notes', root: resolve(process.cwd(), 'notes') },
]

function rootArticlesPlugin() {
  return {
    name: 'myfav-root-articles',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = decodeURIComponent((request.url || '').split('?')[0])
        const contentRoot = contentRoots.find(({ name }) => pathname.startsWith(`${base}${name}/`))
        if (!contentRoot) return next()
        const prefix = `${base}${contentRoot.name}/`
        const relative = pathname.slice(prefix.length)
        const isOutside = (file) => file !== contentRoot.root && !file.startsWith(`${contentRoot.root}${sep}`)

        // Source, rendered pages, and TOC metadata are generated or served on
        // demand in dev so development matches the build-time output of
        // scripts/prepare-pages.mjs. The build uses .txt, .rendered.html, and
        // .toc.json siblings for each Markdown file.
        const isSource = relative.endsWith('.txt')
        const isRenderedHtml = relative.endsWith('.rendered.html')
        const isToc = relative.endsWith('.toc.json')
        if (isSource || isRenderedHtml || isToc) {
          try {
            const mdRelative = relative
              .replace(/\.rendered\.html$/, '.md')
              .replace(/\.toc\.json$/, '.md')
              .replace(/\.txt$/, '.md')
            const mdFile = resolve(contentRoot.root, mdRelative)
            if (isOutside(mdFile)) return next()
            const markdown = await readFile(mdFile, 'utf8')
            if (isSource) {
              response.statusCode = 200
              response.setHeader('Content-Type', 'text/markdown; charset=utf-8')
              response.end(markdown)
              return
            }
            const { renderArticle } = await import('./scripts/render-article.mjs')
            const articlePath = `${contentRoot.name}/${mdRelative.split(sep).join('/')}`
            const { html, toc } = await renderArticle(markdown, articlePath)
            response.statusCode = 200
            response.setHeader('Content-Type', isRenderedHtml ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8')
            response.end(isRenderedHtml ? html : JSON.stringify(toc))
          } catch {
            next()
          }
          return
        }

        const file = resolve(contentRoot.root, relative)
        if (isOutside(file)) return next()
        try {
          const content = await readFile(file)
          response.statusCode = 200
          response.setHeader('Content-Type', extname(file) === '.md' ? 'text/markdown; charset=utf-8' : 'application/octet-stream')
          response.end(content)
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), rootArticlesPlugin()],
  base,
  build: {
    outDir: 'dist'
  },
  test: {
    environment: 'node',
  },
})
