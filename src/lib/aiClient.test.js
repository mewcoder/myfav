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

  it('streams CRLF events when every delimiter byte crosses a chunk boundary', () => {
    const output = []
    const parser = createSSEParser((delta) => output.push(delta))
    parser.push('data: {"choices":[{"delta":{"content":"A"}}]}\r')
    parser.push('\n\r')
    expect(output).toEqual([])
    parser.push('\n')
    expect(output).toEqual(['A'])
    parser.push('data: [DONE]\r\n\r\n')
    parser.finish()
    expect(output).toEqual(['A'])
  })

  it('joins multiple data lines before parsing an event', () => {
    const output = []
    const parser = createSSEParser((delta) => output.push(delta))
    parser.push('data: {"choices":\n')
    parser.push('data: [{"delta":{"content":"B"}}]}\n\n')
    parser.finish()
    expect(output).toEqual(['B'])
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

  it('sends a minimal non-streaming connection test when requested', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
    })
    await chatCompletion({
      config: { baseUrl: 'https://api.example/v1', apiKey: 'secret', model: 'model' },
      messages: [{ role: 'user', content: 'OK' }],
      fetchImpl,
      stream: false,
      maxTokens: 1,
    })
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
      model: 'model',
      messages: [{ role: 'user', content: 'OK' }],
      stream: false,
      max_tokens: 1,
    })
  })
})
