export function withBase(path, base = import.meta.env.BASE_URL) {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${String(path).replace(/^\/+/, '')}`
}

export function articleAssetUrl(articlePath, relativePath, base = import.meta.env.BASE_URL) {
  if (/^(https?:|data:|blob:|#)/i.test(relativePath)) return relativePath
  const directory = articlePath.split('/').slice(0, -1).join('/')
  const resolved = new URL(relativePath, `https://myfav.invalid/${directory}/`).pathname.replace(/^\//, '')
  return withBase(resolved, base)
}
