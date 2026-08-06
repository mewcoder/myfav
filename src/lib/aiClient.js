export class AIRequestError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'AIRequestError'
    this.code = code
  }
}

export function mapAIError(status) {
  if (status === 401 || status === 403) return new AIRequestError('auth', 'API Key 无效或无权限')
  if (status === 404) return new AIRequestError('not-found', 'Base URL 或模型不正确')
  if (status === 429) return new AIRequestError('rate-limit', '请求过多或额度不足')
  return new AIRequestError('http', `AI 接口返回错误（${status}）`)
}

export function createSSEParser(onDelta) {
  let buffer = ''
  const consume = (event) => {
    for (const line of event.split('\n')) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      const parsed = JSON.parse(data)
      const delta = parsed.choices?.[0]?.delta?.content
      if (typeof delta === 'string') onDelta(delta)
    }
  }
  return {
    push(chunk) {
      buffer += chunk.replaceAll('\r\n', '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        consume(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
    },
    finish() {
      if (buffer.trim()) consume(buffer)
      buffer = ''
    },
  }
}

export async function chatCompletion({ config, messages, onDelta = () => {}, signal, timeout = 20_000, fetchImpl = fetch }) {
  const controller = new AbortController()
  let didTimeout = false
  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  const timer = setTimeout(() => {
    didTimeout = true
    controller.abort()
  }, timeout)

  try {
    const response = await fetchImpl(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: config.model, messages, stream: true }),
      signal: controller.signal,
    })
    if (!response.ok) throw mapAIError(response.status)

    if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
      const json = await response.json()
      const content = json.choices?.[0]?.message?.content
      if (typeof content !== 'string') throw new AIRequestError('response', 'AI 返回格式无法识别')
      onDelta(content)
      return content
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let result = ''
    const parser = createSSEParser((delta) => {
      result += delta
      onDelta(delta)
    })
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      parser.push(decoder.decode(value, { stream: true }))
    }
    parser.push(decoder.decode())
    parser.finish()
    return result
  } catch (error) {
    if (error instanceof AIRequestError) throw error
    if (error?.name === 'AbortError') {
      if (didTimeout) throw new AIRequestError('timeout', '请求超时，请重试')
      throw new AIRequestError('aborted', '请求已停止')
    }
    throw new AIRequestError('network', '浏览器无法访问该接口，请检查 CORS 或网络')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}
