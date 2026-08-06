import { describe, expect, it, vi } from 'vitest'
import { chatCompletion, createSSEParser, mapAIError } from './aiClient'

describe('SSE parser', () => {
  it('parses deltas across chunk boundaries', () => {
    const output = []
    const parser = createSSEParser((delta) => output.push(delta))
    parser.push('data: {"choices":[{"delta":{"content":"你"}}]}\n')
    parser.push('\ndata: {"choices":[{"delta":{"content":"好"}}]}\n\n')
    parser.finish()
    expect(output.join('')).toBe('你好')
  })
})

describe('AI errors', () => {
  it('maps provider status codes', () => {
    expect(mapAIError(401).message).toContain('API Key')
    expect(mapAIError(404).message).toContain('Base URL')
    expect(mapAIError(429).message).toContain('额度')
  })

  it('maps browser failures without leaking request details', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('failed'))
    await expect(chatCompletion({
      config: { baseUrl: 'https://api.example/v1', apiKey: 'secret', model: 'model' },
      messages: [],
      fetchImpl,
      timeout: 50,
    })).rejects.toMatchObject({ code: 'network' })
  })
})
