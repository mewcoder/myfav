import { cp, copyFile, mkdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const sourceArticles = resolve(root, 'articles')
const dist = resolve(root, 'dist')
const distArticles = resolve(dist, 'articles')

await mkdir(distArticles, { recursive: true })
if ((await stat(sourceArticles)).isDirectory()) {
  await cp(sourceArticles, distArticles, { recursive: true, force: true })
}
await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))

console.log('Copied root articles and created GitHub Pages history fallback.')
