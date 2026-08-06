import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { articleAssetUrl } from './url'

function slugify(value) {
  return value.toLocaleLowerCase('zh-CN').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section'
}

export function renderMarkdown(raw, articlePath, base) {
  const unsafe = marked.parse(raw, { gfm: true, breaks: false })
  const sanitized = DOMPurify.sanitize(unsafe, { USE_PROFILES: { html: true } })
  const template = document.createElement('template')
  template.innerHTML = sanitized
  const toc = []
  const used = new Map()

  template.content.querySelectorAll('h2, h3').forEach((heading) => {
    const baseSlug = slugify(heading.textContent || '')
    const count = used.get(baseSlug) || 0
    used.set(baseSlug, count + 1)
    heading.id = count ? `${baseSlug}-${count + 1}` : baseSlug
    toc.push({ id: heading.id, text: heading.textContent || '', level: Number(heading.tagName.slice(1)) })
  })

  template.content.querySelectorAll('img').forEach((image) => {
    image.src = articleAssetUrl(articlePath, image.getAttribute('src') || '', base)
    image.loading = 'lazy'
    image.decoding = 'async'
  })

  template.content.querySelectorAll('a').forEach((link) => {
    if (/^https?:/i.test(link.href)) {
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }
  })

  template.content.querySelectorAll('table').forEach((table) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'table-wrapper'
    table.parentNode.insertBefore(wrapper, table)
    wrapper.append(table)
  })

  return { html: template.innerHTML, toc }
}

export function markdownContext(raw) {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
