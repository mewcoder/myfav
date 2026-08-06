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
        const file = resolve(articlesRoot, pathname.slice(prefix.length))
        if (file !== articlesRoot && !file.startsWith(`${articlesRoot}${sep}`)) return next()
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
