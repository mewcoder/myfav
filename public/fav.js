#!/usr/bin/env node
/**
 * MyFav 数据管理脚本
 * 脚本路径: scripts/fav.js
 *
 * 命令:
 *   add <url> [options]    添加收藏
 *   list-categories        获取所有分类
 *   list-tags              获取所有标签
 */

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
const SITES_FILE = path.join(DATA_DIR, 'sites.json')
const REPOS_FILE = path.join(DATA_DIR, 'repos.json')

function readJSON(file) {
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function isGitHubRepo(url) {
  return url.includes('github.com')
}

function parseGitHubName(url) {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/)
  return match ? match[1] : null
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

async function add(url, options = {}) {
  const isRepo = isGitHubRepo(url)
  const file = isRepo ? REPOS_FILE : SITES_FILE
  const data = readJSON(file)

  if (data.find(item => item.url === url)) {
    console.log(JSON.stringify({ error: '已存在', url }))
    return
  }

  if (isRepo) {
    const name = options.name || parseGitHubName(url) || url
    const item = {
      name,
      url,
      description: options.description || name,
      tags: options.tags ? options.tags.split(',') : [],
      stars: parseInt(options.stars) || 0,
      saveTime: getToday()
    }
    data.unshift(item)
    writeJSON(file, data)
    console.log(JSON.stringify({ success: true, type: 'repo', item }))
  } else {
    const title = options.title || url
    const item = {
      title,
      url,
      description: options.description || title,
      category: options.category || '其他',
      saveTime: getToday()
    }
    data.unshift(item)
    writeJSON(file, data)
    console.log(JSON.stringify({ success: true, type: 'site', item }))
  }
}

function listCategories() {
  const sites = readJSON(SITES_FILE)
  const categories = [...new Set(sites.map(s => s.category))].sort()
  const counts = {}
  for (const cat of categories) counts[cat] = sites.filter(s => s.category === cat).length
  console.log(JSON.stringify({ categories, counts }))
}

function listTags() {
  const repos = readJSON(REPOS_FILE)
  const tags = [...new Set(repos.flatMap(r => r.tags))].sort()
  const counts = {}
  for (const tag of tags) counts[tag] = repos.filter(r => r.tags.includes(tag)).length
  console.log(JSON.stringify({ tags, counts }))
}

const [command, ...args] = process.argv.slice(2)

function parseOptions(args) {
  const options = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const value = args[i + 1]
      if (value && !value.startsWith('--')) {
        options[key] = value
        i++
      }
    }
  }
  return options
}

async function main() {
  switch (command) {
    case 'add':
      const url = args.find(a => !a.startsWith('--'))
      if (!url) { console.log(JSON.stringify({ error: '缺少 URL' })); return }
      await add(url, parseOptions(args))
      break
    case 'list-categories':
      listCategories()
      break
    case 'list-tags':
      listTags()
      break
    default:
      console.log(JSON.stringify({ error: '未知命令', commands: ['add', 'list-categories', 'list-tags'] }))
  }
}

main()