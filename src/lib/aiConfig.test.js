import { describe, expect, it } from 'vitest'
import { clearAIConfig, isAllowedAIBaseUrl, loadAIConfig, saveAIConfig } from './aiConfig'

class MemoryStorage {
  data = new Map()
  get length() { return this.data.size }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.data.set(key, String(value)) }
  removeItem(key) { this.data.delete(key) }
  key(index) { return [...this.data.keys()][index] ?? null }
}

describe('AI config storage', () => {
  it('accepts HTTPS and localhost HTTP base URLs only', () => {
    expect(isAllowedAIBaseUrl('https://api.example/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('http://localhost:8080/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('http://api.example/v1')).toBe(false)
  })
  it('stores the key in session by default', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    saveAIConfig({ baseUrl: 'https://api.example/v1/', apiKey: 'secret', model: 'model', rememberKey: false }, local, session)
    expect(local.getItem('myfav.ai.apiKey')).toBeNull()
    expect(session.getItem('myfav.ai.apiKey')).toBe('secret')
    expect(loadAIConfig(local, session).baseUrl).toBe('https://api.example/v1')
  })

  it('persists only after explicit opt-in and clears both stores', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    saveAIConfig({ baseUrl: 'https://api.example/v1', apiKey: 'secret', model: 'model', rememberKey: true }, local, session)
    expect(local.getItem('myfav.ai.apiKey')).toBe('secret')
    session.setItem('myfav.ai.summary.demo', 'cached')
    clearAIConfig(local, session)
    expect(local.length).toBe(0)
    expect(session.length).toBe(0)
  })
})
