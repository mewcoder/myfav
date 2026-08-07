import { cp, copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, posix, relative, resolve, sep } from 'node:path'
import { renderArticle } from './render-article.mjs'

const root = process.cwd()
const sourceArticles = resolve(root, 'articles')
const dist = resolve(root, 'dist')
const distArticles = resolve(dist, 'articles')

await mkdir(distArticles, { recursive: true })
if ((await stat(sourceArticles)).isDirectory()) {
  await cp(sourceArticles, distArticles, { recursive: true, force: true })
}

const mdFiles = []
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walk(full)
    else if (entry.name.endsWith('.md')) mdFiles.push(full)
  }
}
await walk(distArticles)

let rendered = 0
for (const mdFile of mdFiles) {
  const markdown = await readFile(mdFile, 'utf8')
  const articlePath = posix.join('articles', relative(distArticles, mdFile).split(sep).join('/'))
  const { html, toc } = await renderArticle(markdown, articlePath)
  await writeFile(mdFile.replace(/\.md$/, '.html'), html)
  await writeFile(mdFile.replace(/\.md$/, '.toc.json'), JSON.stringify(toc))
  rendered += 1
}

await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))

console.log(`Copied root articles, rendered ${rendered} article page(s), created GitHub Pages history fallback.`)
