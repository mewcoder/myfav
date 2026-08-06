const KEYS = {
  baseUrl: 'myfav.ai.baseUrl',
  model: 'myfav.ai.model',
  rememberKey: 'myfav.ai.rememberKey',
  apiKey: 'myfav.ai.apiKey',
  summaryPrefix: 'myfav.ai.summary.',
}

export function loadAIConfig(local = window.localStorage, session = window.sessionStorage) {
  const rememberKey = local.getItem(KEYS.rememberKey) === 'true'
  return {
    baseUrl: local.getItem(KEYS.baseUrl) || '',
    model: local.getItem(KEYS.model) || '',
    rememberKey,
    apiKey: (rememberKey ? local : session).getItem(KEYS.apiKey) || '',
  }
}

export function isAllowedAIBaseUrl(value) {
  try {
    const endpoint = new URL(String(value || '').trim())
    return endpoint.protocol === 'https:' || (endpoint.protocol === 'http:' && endpoint.hostname === 'localhost')
  } catch {
    return false
  }
}

export function normalizeAIConfig(config) {
  const clean = {
    baseUrl: String(config.baseUrl || '').trim().replace(/\/+$/, ''),
    apiKey: String(config.apiKey || '').trim(),
    model: String(config.model || '').trim(),
    rememberKey: Boolean(config.rememberKey),
  }
  if (!clean.baseUrl || !clean.apiKey || !clean.model) throw new Error('Base URL、API Key 和 Model 均为必填项')
  if (!isAllowedAIBaseUrl(clean.baseUrl)) {
    throw new Error('Base URL 必须使用 HTTPS；本地开发仅允许 http://localhost')
  }
  return clean
}

export function saveAIConfig(config, local = window.localStorage, session = window.sessionStorage) {
  const clean = normalizeAIConfig(config)
  local.setItem(KEYS.baseUrl, clean.baseUrl)
  local.setItem(KEYS.model, clean.model)
  local.setItem(KEYS.rememberKey, String(clean.rememberKey))
  if (clean.rememberKey) {
    local.setItem(KEYS.apiKey, clean.apiKey)
    session.removeItem(KEYS.apiKey)
  } else {
    session.setItem(KEYS.apiKey, clean.apiKey)
    local.removeItem(KEYS.apiKey)
  }
  return clean
}

export function clearAIConfig(local = window.localStorage, session = window.sessionStorage) {
  for (const storage of [local, session]) {
    Object.values(KEYS).filter((key) => key !== KEYS.summaryPrefix).forEach((key) => storage.removeItem(key))
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)
      if (key?.startsWith(KEYS.summaryPrefix)) storage.removeItem(key)
    }
  }
}

export function hasAIConfig(config) {
  return Boolean(config?.baseUrl && config?.apiKey && config?.model)
}

export { KEYS as AI_STORAGE_KEYS }
