import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const sitesPath = new URL('../public/data/sites.json', import.meta.url)
const reposPath = new URL('../public/data/repos.json', import.meta.url)

const repoCategoryOverrides = new Map([
  ['iOfficeAI/AionUi', 'AI'],
  ['workany-ai/workany', 'AI'],
  ['InsForge/InsForge', 'AI'],
  ['yanhua1010/zero-to-ai-fullstack', '知识'],
  ['any4ai/AnyCrawl', '开发'],
  ['google-labs-code/design.md', '设计'],
  ['jgraph/drawio-mcp', '工具'],
])

const collectionCategories = new Set([
  'AI', '开发', '设计', '知识', '工具', '生活',
])

const siteCategoryMap = new Map([
  ['Claude Code', 'AI'],
  ['AI工具', 'AI'],
  ['AI服务', 'AI'],
  ['AI 编程', 'AI'],
  ['AI 工具', 'AI'],
  ['AI 服务', 'AI'],
  ['Agent Skills', 'AI'],
  ['设计', '设计'],
  ['前端与设计', '设计'],
  ['开发工具', '开发'],
  ['知识管理', '知识'],
  ['知识与学习', '知识'],
  ['阅读', '知识'],
  ['工具', '工具'],
  ['综合工具', '工具'],
  ['理财', '生活'],
  ['财务与消费', '生活'],
  ['Skill', 'AI'],
])

const repoCategoryMap = new Map([
  ['AI 编程', 'AI'],
  ['Agent 与框架', 'AI'],
  ['AI 工具', 'AI'],
  ['Agent Skills', 'AI'],
  ['知识与学习', '知识'],
  ['数据与检索', '开发'],
  ['安全与网络', '开发'],
  ['前端与设计', '设计'],
  ['内容与媒体', '设计'],
  ['开发工具', '工具'],
  ['自动化', '工具'],
  ['效率与生活', '生活'],
])

const detailTags = new Map([
  ['AI 编程', 'AI 编程'], ['AI 工具', 'AI 工具'], ['AI 服务', 'AI 服务'],
  ['Agent Skills', 'Agent Skill'], ['Agent 与框架', 'Agent'],
  ['数据与检索', '数据检索'], ['安全与网络', '安全'],
  ['前端与设计', '前端'], ['内容与媒体', '内容创作'],
  ['开发工具', '开发工具'], ['自动化', '自动化'],
  ['效率与生活', '效率'], ['阅读', '阅读'],
  ['综合工具', '实用工具'], ['财务与消费', '财务'],
])

const tagAliases = new Map([
  ['ai agent', 'Agent'], ['agent', 'Agent'], ['ai', 'AI'],
  ['claude code', 'Claude Code'], ['claude-code', 'Claude Code'],
  ['skill', 'Agent Skill'], ['skills', 'Agent Skill'],
  ['tool', '工具'], ['工具', '工具'], ['doc', '文档'],
  ['framework', '框架'], ['ui', 'UI'], ['llm', 'LLM'],
  ['rag', 'RAG'], ['mcp', 'MCP'], ['awesome', '资源合集'],
  ['typescript', 'TypeScript'], ['python', 'Python'], ['rust', 'Rust'],
  ['react', 'React'], ['macos', 'macOS'], ['cloudflare', 'Cloudflare'],
  ['claude code', 'Claude Code'], ['自动化', '自动化'], ['开发', '开发工具'],
  ['前端', '前端'], ['设计', '设计'], ['教程', '教程'], ['开源', '开源'],
  ['效率', '效率'], ['教学', '学习'], ['知识管理', '知识管理'],
  ['视频制作', '视频'], ['录屏工具', '录屏'], ['爬虫', '爬虫'],
  ['网络', '网络'], ['安全', '安全'], ['画图', '图表'], ['图谱', '知识图谱'],
  ['求职', '求职'], ['理财', '理财'], ['分析', '分析'], ['管理', '管理'],
  ['联网', '联网'], ['终端', '终端'], ['测试', '测试'], ['商业', '商业'],
  ['导航站', '导航'], ['中文资源', '中文资源'], ['ai编辑器', 'AI 编辑器'],
])

const keywordTags = [
  [/claude code/i, 'Claude Code'], [/_?codex/i, 'Codex'], [/(agent|智能体)/i, 'Agent'],
  [/(skill|技能)/i, 'Agent Skill'], [/(api|接口)/i, 'API'], [/(openai|gpt)/i, 'OpenAI'],
  [/(llm|大模型|模型)/i, 'LLM'], [/(mcp)/i, 'MCP'], [/(rag)/i, 'RAG'],
  [/(设计|design)/i, '设计'], [/(前端|next\.js|html|web组件|组件库)/i, '前端'],
  [/\bReact(?:\.js)?\b/, 'React'],
  [/(ui|shadcn)/i, 'UI'], [/(动画|animation|spinner)/i, '动画'],
  [/(部署|托管|自托管)/i, '部署'], [/(搜索|search engine|serp)/i, '搜索'],
  [/(阅读|书籍|书单|文章)/i, '阅读'], [/(教程|课程|学习|指南|handbook|wiki)/i, '学习'],
  [/(知识|记忆系统)/i, '知识管理'], [/(价格|比价|折扣|省钱)/i, '价格'],
  [/(安全|风险|纯净度|检测)/i, '安全'], [/(\bip\b|ip地址|ip检测|网络|隧道|vless|trojan)/i, '网络'],
  [/(ppt|slides|演示文稿)/i, '演示'], [/(markdown|编辑器)/i, '编辑器'],
  [/(网关|中转|路由代理)/i, 'API 网关'], [/(视频|字幕|录屏|提词器)/i, '视频'],
  [/(自动化|automation)/i, '自动化'], [/(爬虫|抓取|crawl|serp)/i, '数据采集'],
  [/(开源|open-source|open source)/i, '开源'], [/(终端|cli)/i, 'CLI'],
  [/(macos|mac os)/i, 'macOS'], [/(typescript)/i, 'TypeScript'], [/(python)/i, 'Python'],
  [/(rust)/i, 'Rust'], [/(go语言|golang|\bgo\b)/i, 'Go'], [/(cloudflare)/i, 'Cloudflare'],
  [/(求职|简历|找工作|career|\bjobs?\b)/i, '求职'], [/(理财|资产|基金|etf)/i, '理财'],
]

const normalizeTag = (tag) => {
  const value = String(tag).trim()
  return tagAliases.get(value.toLowerCase()) || value
}

function buildTags(record, category, detailTag, minimum = 2) {
  const text = [record.title, record.description].filter(Boolean).join(' ')
  const tags = [...(record.tags || []), detailTag].filter(Boolean).map(normalizeTag)
  for (const [pattern, tag] of keywordTags) {
    if (pattern.test(text)) tags.push(tag)
  }
  const unique = [...new Set(tags.filter((tag) => tag && !collectionCategories.has(tag)))]
  for (const fallback of [record.url.includes('github.com') ? '开源项目' : '网络资源']) {
    if (unique.length >= minimum) break
    if (!unique.includes(fallback)) unique.push(fallback)
  }
  return unique.slice(0, 6)
}

function repoCategory(repo) {
  const override = repoCategoryOverrides.get(repo.name)
  if (override) return override
  if (collectionCategories.has(repo.category)) return repo.category
  if (repoCategoryMap.has(repo.category)) return repoCategoryMap.get(repo.category)
  const original = String(repo.category || '').toLowerCase()
  const description = String(repo.description || '').toLowerCase()
  const tags = new Set((repo.tags || []).map((tag) => normalizeTag(tag).toLowerCase()))
  const hasTag = (...values) => values.some((value) => tags.has(value.toLowerCase()))
  const text = [description, ...tags].join(' ')
  if (original === 'skill') return 'AI'
  if (hasTag('视频', '录屏') || /(录屏|视频|字幕|提词器)/.test(description)) return '设计'
  if (hasTag('安全', '网络') || /(安全|网络|隧道|vless|trojan)/.test(description)) return '开发'
  if (hasTag('爬虫', 'RAG', '知识图谱') || /(爬虫|crawl|serp|数据研究|知识图谱)/.test(description)) return '开发'
  if (hasTag('文档', '教程', '学习', '知识管理') || /(教程|课程|指南|handbook|wiki|书籍|学习|知识管理)/.test(description)) return '知识'
  if (hasTag('求职', '理财') || /(求职|简历|理财|资产|八字|产品经理)/.test(description)) return '生活'
  if (hasTag('自动化') || /(自动化|automation|全自动)/.test(description)) return '工具'
  if (hasTag('前端', '设计', 'UI') || /(前端|设计|ui|组件|html|react|next\.js|shadcn|白板|幻灯片)/.test(description)) return '设计'
  if (/(claude code|claude-code|codex|cursor|copilot|vibecoding|harness)/.test(text)) return 'AI'
  if (hasTag('Agent', '框架', 'MCP', 'AI', 'LLM') || /(agent|智能体|框架|\bai\b|llm|ollama|模型)/.test(description)) return 'AI'
  return '工具'
}

const bySaveTimeDescending = (left, right) => right.saveTime.localeCompare(left.saveTime)
const fromHead = process.argv.includes('--from-head')
const readSource = async (path, gitPath) => fromHead
  ? execFileSync('git', ['show', `HEAD:${gitPath}`], { encoding: 'utf8' })
  : readFile(path, 'utf8')
const sites = JSON.parse(await readSource(sitesPath, 'public/data/sites.json'))
const repos = JSON.parse(await readSource(reposPath, 'public/data/repos.json'))

const enrichedSites = sites.map((site) => {
  const category = collectionCategories.has(site.category) ? site.category : siteCategoryMap.get(site.category) || '工具'
  return { ...site, category, tags: buildTags(site, category, detailTags.get(site.category)) }
}).sort(bySaveTimeDescending)

const enrichedRepos = repos.map((repo) => {
  const category = repoCategory(repo)
  return { ...repo, category, tags: buildTags(repo, category, detailTags.get(repo.category)) }
}).sort(bySaveTimeDescending)

if (enrichedSites.length !== sites.length || enrichedRepos.length !== repos.length) {
  throw new Error('Record count changed during enrichment')
}

await writeFile(sitesPath, `${JSON.stringify(enrichedSites, null, 2)}\n`)
await writeFile(reposPath, `${JSON.stringify(enrichedRepos, null, 2)}\n`)

console.log(`Enriched ${enrichedSites.length} sites and ${enrichedRepos.length} repos.`)
