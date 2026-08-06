import { readFile, writeFile } from 'node:fs/promises'

const sitesPath = new URL('../public/data/sites.json', import.meta.url)
const reposPath = new URL('../public/data/repos.json', import.meta.url)

const sites = JSON.parse(await readFile(sitesPath, 'utf8'))
const repos = JSON.parse(await readFile(reposPath, 'utf8'))

const normalizeTags = (tags) => [...new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag).trim()).filter(Boolean))]
const bySaveTimeDescending = (left, right) => right.saveTime.localeCompare(left.saveTime)

const migratedSites = sites.map((site) => ({
  ...site,
  tags: normalizeTags(site.tags),
})).sort(bySaveTimeDescending)

const migratedRepos = repos.map((repo) => {
  const tags = normalizeTags(repo.tags)
  return {
    ...repo,
    category: String(repo.category || tags[0] || '其他').trim(),
    tags,
  }
}).sort(bySaveTimeDescending)

await writeFile(sitesPath, `${JSON.stringify(migratedSites, null, 2)}\n`)
await writeFile(reposPath, `${JSON.stringify(migratedRepos, null, 2)}\n`)

console.log(`Migrated ${migratedSites.length} sites and ${migratedRepos.length} repos.`)
