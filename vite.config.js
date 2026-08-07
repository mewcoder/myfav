import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const base = '/myfav/'
const articlesRoot = resolve(process.cwd(), 'articles')

function rootArticlesPlugin() {
  return {
    name: 'myfav-root-articles',
    configureServer(server) {
      const prefix = `${base}articles/`
      server.middlewares.use(async (request, response, next) => {
        const pathname = decodeURIComponent((request.url || '').split('?')[0])
        if (!pathname.startsWith(prefix)) return next()
        const relative = pathname.slice(prefix.length)
        const isOutside = (file) => file !== articlesRoot && !file.startsWith(`${articlesRoot}${sep}`)

        // Rendered pages and TOC metadata are generated on demand in dev so
        // development matches the build-time output of scripts/prepare-pages.mjs.
        if (relative.endsWith('.html') || relative.endsWith('.toc.json')) {
          try {
            const { renderArticle } = await import('./scripts/render-article.mjs')
            const mdRelative = relative.replace(/\.toc\.json$/, '.md').replace(/\.html$/, '.md')
            const mdFile = resolve(articlesRoot, mdRelative)
            if (isOutside(mdFile)) return next()
            const markdown = await readFile(mdFile, 'utf8')
            const articlePath = `articles/${mdRelative.split(sep).join('/')}`
            const { html, toc } = await renderArticle(markdown, articlePath)
            const isHtml = relative.endsWith('.html')
            response.statusCode = 200
            response.setHeader('Content-Type', isHtml ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8')
            response.end(isHtml ? html : JSON.stringify(toc))
          } catch {
            next()
          }
          return
        }

        const file = resolve(articlesRoot, relative)
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
