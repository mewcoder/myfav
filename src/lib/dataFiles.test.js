import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { validateContent } from './content'

describe('repository data files', () => {
  it('retain all records and satisfy the production contract', async () => {
    const [sites, repos, articles] = await Promise.all(['sites', 'repos', 'articles'].map(async (name) => JSON.parse(await readFile(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'))))
    expect(sites).toHaveLength(82)
    expect(repos).toHaveLength(136)
    expect(articles).toEqual([])
    expect(validateContent({ sites, repos, articles })).toEqual([])
  })
})
