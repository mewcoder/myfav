import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import taskLists from 'markdown-it-task-lists'
import footnote from 'markdown-it-footnote'
import { createHighlighter, bundledLanguages } from 'shiki'

// Must match the Vite `base` used by the site (see vite.config.js).
export const SITE_BASE = '/myfav/'

const THEMES = { light: 'github-light', dark: 'github-dark' }

function slugify(value) {
  return value
    .toLocaleLowerCase('zh-CN')
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '') || 'section'
}

let highlighterPromise = null
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEMES.light, THEMES.dark],
      langs: Object.keys(bundledLanguages),
    })
  }
  return highlighterPromise
}

let markdownIt = null
function getMarkdownIt(highlighter) {
  if (markdownIt) return markdownIt
  const instance = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: false,
    highlight(code, lang) {
      const raw = String(lang || '').trim()
      const safeLang = /^[a-zA-Z_][a-zA-Z0-9_+-]*$/.test(raw) ? raw : 'text'
      try {
        return highlighter.codeToHtml(code, { lang: safeLang, themes: THEMES, defaultColor: false })
      } catch {
        // markdown-it falls back to escaped plain text for unknown languages.
        return ''
      }
    },
  })
  instance.use(anchor, { slugify, tabIndex: false })
  instance.use(taskLists)
  instance.use(footnote)
  markdownIt = instance
  return markdownIt
}

function rewriteImageSrc(src, articleDir) {
  if (/^(https?:|data:|blob:|#)/i.test(src)) return src
  const resolved = new URL(src, `https://myfav.invalid/${articleDir}/`).pathname.replace(/^\//, '')
  return `${SITE_BASE}${resolved}`
}

export function stripNoteMetadata(markdown, articlePath) {
  if (!articlePath.startsWith('notes/')) return markdown

  const lines = String(markdown).split(/\r?\n/)
  let index = 0
  while (index < lines.length && !lines[index].trim()) index += 1
  if (!/^#\s+\S/.test(lines[index] || '')) return markdown

  index += 1
  while (index < lines.length && !lines[index].trim()) index += 1
  if (!/^@\s*https?:\/\/\S+$/i.test(lines[index] || '')) return markdown

  lines.splice(index, 1)
  return lines.join('\n')
}

export async function renderArticle(markdown, articlePath) {
  const highlighter = await getHighlighter()
  const md = getMarkdownIt(highlighter)
  const rawHtml = md.render(stripNoteMetadata(markdown, articlePath))

  const purify = DOMPurify(new JSDOM('').window)
  const sanitized = purify.sanitize(rawHtml, { USE_PROFILES: { html: true }, ADD_ATTR: ['style'] })

  const dom = new JSDOM(sanitized)
  const doc = dom.window.document
  const articleDir = articlePath.split('/').slice(0, -1).join('/')
  const toc = []
  const used = new Map()

  doc.querySelectorAll('h2, h3').forEach((heading) => {
    const text = heading.textContent || ''
    const baseSlug = heading.id || slugify(text)
    const count = used.get(baseSlug) || 0
    used.set(baseSlug, count + 1)
    heading.id = count ? `${baseSlug}-${count + 1}` : baseSlug
    toc.push({ id: heading.id, text, level: Number(heading.tagName.slice(1)) })
  })

  doc.querySelectorAll('img').forEach((image) => {
    image.setAttribute('src', rewriteImageSrc(image.getAttribute('src') || '', articleDir))
    image.setAttribute('loading', 'lazy')
    image.setAttribute('decoding', 'async')
  })

  doc.querySelectorAll('a').forEach((link) => {
    if (/^https?:/i.test(link.getAttribute('href') || '')) {
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
    }
  })

  doc.querySelectorAll('table').forEach((table) => {
    const wrapper = doc.createElement('div')
    wrapper.className = 'table-wrapper'
    table.parentNode.insertBefore(wrapper, table)
    wrapper.append(table)
  })

  return { html: doc.body.innerHTML, toc }
}
