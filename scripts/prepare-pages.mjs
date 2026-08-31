import { cp, copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join, posix, relative, resolve, sep } from 'node:path'
import { renderArticle } from './render-article.mjs'

const root = process.cwd()
const dist = resolve(root, 'dist')
const notesData = resolve(root, 'public', 'data', 'notes.json')
await rm(resolve(dist, 'ai-daily'), { recursive: true, force: true })
const contentRoots = ['articles', 'notes'].map((name) => ({
  name,
  source: resolve(root, name),
  dist: resolve(dist, name),
}))

for (const contentRoot of contentRoots) {
  await mkdir(contentRoot.dist, { recursive: true })
  const sourceInfo = await stat(contentRoot.source).catch(() => undefined)
  if (sourceInfo?.isDirectory()) {
    await cp(contentRoot.source, contentRoot.dist, { recursive: true, force: true })
  }
}

const mdFiles = []
async function walk(dir, contentRoot) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, contentRoot)
    else if (entry.name.endsWith('.md')) mdFiles.push({ file: full, contentRoot })
  }
}
for (const contentRoot of contentRoots) await walk(contentRoot.dist, contentRoot)

let rendered = 0
for (const { file: mdFile, contentRoot } of mdFiles) {
  const markdown = await readFile(mdFile, 'utf8')
  const articlePath = posix.join(contentRoot.name, relative(contentRoot.dist, mdFile).split(sep).join('/'))
  const { html, toc } = await renderArticle(markdown, articlePath)
  await writeFile(mdFile.replace(/\.md$/, '.rendered.html'), html)
  await writeFile(mdFile.replace(/\.md$/, '.toc.json'), JSON.stringify(toc))
  // Do not publish .md at the route path: GitHub Pages turns extensionless
  // URLs for Markdown files into pretty-printed source pages before the Vue
  // router can handle ?lang=zh. Keep the source available under .txt for the
  // copy-original feature instead.
  await copyFile(mdFile, mdFile.replace(/\.md$/, '.txt'))
  await rm(mdFile)
  rendered += 1
}

await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))
// GitHub Pages otherwise treats root Markdown files as pretty URLs. That
// bypasses the Vue router for /articles/... links, so ?lang=zh never reaches
// ArticleView and the original Markdown is served instead of the translation.
await writeFile(resolve(dist, '.nojekyll'), '')

const noteRecords = JSON.parse(await readFile(notesData, 'utf8'))
const noteRoutes = [resolve(dist, 'notes'), ...noteRecords.map((entry) => resolve(dist, entry.path.replace(/\.md$/, '')))]
for (const routeDir of noteRoutes) {
  await mkdir(routeDir, { recursive: true })
  await copyFile(resolve(dist, 'index.html'), resolve(routeDir, 'index.html'))
}

console.log(`Copied root content, rendered ${rendered} Markdown page(s), created ${noteRoutes.length} note route(s) and GitHub Pages history fallback.`)
