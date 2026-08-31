const requiredString = (value) => typeof value === 'string' && value.trim().length > 0
const validTags = (value) => Array.isArray(value) && value.every((tag) => requiredString(tag)) && new Set(value).size === value.length
export const isSaveTimeDescending = (records) => records.every((record, index) => index === 0 || records[index - 1].saveTime.localeCompare(record.saveTime) >= 0)

export function validateContent({ sites, repos, articles, notes = [] }) {
  const errors = []
  if (!Array.isArray(sites)) errors.push('sites.json 顶层必须是数组')
  if (!Array.isArray(repos)) errors.push('repos.json 顶层必须是数组')
  if (!Array.isArray(articles)) errors.push('articles.json 顶层必须是数组')
  if (!Array.isArray(notes)) errors.push('notes.json 顶层必须是数组')

  if (Array.isArray(sites)) {
    sites.forEach((site, index) => {
      if (![site.title, site.url, site.description, site.category, site.saveTime].every(requiredString) || !validTags(site.tags)) {
        errors.push(`sites.json[${index}] 字段不完整`)
      }
    })
    if (sites.every((site) => requiredString(site.saveTime)) && !isSaveTimeDescending(sites)) errors.push('sites.json 必须按 saveTime 倒序排列')
  }

  if (Array.isArray(repos)) {
    repos.forEach((repo, index) => {
      if (![repo.name, repo.url, repo.description, repo.category, repo.saveTime].every(requiredString) || !validTags(repo.tags) || typeof repo.stars !== 'number') {
        errors.push(`repos.json[${index}] 字段不完整`)
      }
    })
    if (repos.every((repo) => requiredString(repo.saveTime)) && !isSaveTimeDescending(repos)) errors.push('repos.json 必须按 saveTime 倒序排列')
  }

  if (Array.isArray(articles)) {
    articles.forEach((article, index) => {
      if (![article.title, article.url, article.description, article.category, article.saveTime, article.path].every(requiredString) || !validTags(article.tags)) {
        errors.push(`articles.json[${index}] 字段不完整`)
      }
      if (article.translationPath !== undefined && (
        !requiredString(article.translationPath) || article.translationPath !== article.path.replace(/\.md$/, '_zh.md')
      )) errors.push(`articles.json[${index}] 中文译文路径无效`)
    })
    if (articles.every((article) => requiredString(article.saveTime)) && !isSaveTimeDescending(articles)) errors.push('articles.json 必须按 saveTime 倒序排列')
  }

  if (Array.isArray(notes)) {
    notes.forEach((note, index) => {
      if (![note.title, note.description, note.category, note.saveTime, note.path].every(requiredString) || !validTags(note.tags)) {
        errors.push(`notes.json[${index}] 字段不完整`)
      }
      if (requiredString(note.saveTime) && requiredString(note.path)) {
        const month = note.path.match(/^notes\/(\d{4}-\d{2})\/[^/]+\.md$/)?.[1]
        if (!month || month !== note.saveTime.slice(0, 7)) errors.push(`notes.json[${index}] 路径月份无效`)
      }
    })
    if (notes.every((note) => requiredString(note.saveTime)) && !isSaveTimeDescending(notes)) errors.push('notes.json 必须按 saveTime 倒序排列')
  }

  return errors
}

export function toUnifiedRecords({ sites = [], repos = [], articles = [], notes = [] }) {
  return [
    ...sites.map((item) => ({ ...item, type: 'site', label: item.title })),
    ...repos.map((item) => ({ ...item, type: 'repo', label: item.name })),
    ...articles.map((item) => ({ ...item, type: 'article', label: item.title })),
    ...notes.map((item) => ({ ...item, type: 'note', label: item.title })),
  ].sort((a, b) => b.saveTime.localeCompare(a.saveTime))
}

export function searchRecords(records, query, type = 'all') {
  const needle = query.trim().toLocaleLowerCase('zh-CN')
  return records.filter((record) => {
    if (type !== 'all' && record.type !== type) return false
    if (!needle) return true
    const text = [record.label, record.description, record.category, record.author, ...(record.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-CN')
    return text.includes(needle)
  })
}

export function countBy(records, field) {
  return records.reduce((counts, record) => {
    const value = record[field]
    if (requiredString(value)) counts[value] = (counts[value] || 0) + 1
    return counts
  }, {})
}

export function articleRoute(article) {
  const match = article.path.match(/^articles\/(\d{4}-\d{2})\/(.+)\.md$/)
  return match ? `/articles/${match[1]}/${match[2]}` : null
}

export function noteRoute(note) {
  const match = note.path.match(/^notes\/(\d{4}-\d{2})\/(.+)\.md$/)
  return match ? `/notes/${match[1]}/${match[2]}` : null
}

export function contentRoute(record) {
  if (record.type === 'article') return articleRoute(record)
  if (record.type === 'note') return noteRoute(record)
  return null
}
