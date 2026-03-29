---
name: fav
description: Use when user runs /fav command to add a bookmark. Triggered by "/fav <url>" - fetches site info, generates category/tags, then adds via script.
---

# MyFav 收藏管理

触发命令: `/fav <url>`

## 数据结构

**网站 (sites.json)**
| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 网站名称 |
| url | string | 网址 (唯一标识) |
| description | string | 描述 (≤10字) |
| category | string | 分类 |
| saveTime | string | 收藏日期 |

**仓库 (repos.json)**
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | owner/repo |
| url | string | 网址 (唯一标识) |
| description | string | 描述 (≤10字) |
| tags | string[] | 标签 (≤3个) |
| stars | number | Star 数量 |
| saveTime | string | 收藏日期 |

## 流程

**第1步：判断类型**
- URL 含 `github.com` → 仓库
- 否则 → 网站

**第2步：WebFetch 获取信息**
```
WebFetch url: "<url>" prompt: "提取标题和简短描述"
```

**第3步：生成分类/标签**
- 网站：获取现有分类 `node public/fav.js list-categories`，优先复用或生成新的
- 仓库：获取现有标签 `node public/fav.js list-tags`，优先复用或生成新的

**命名规范：**
- 分类/标签优先用中文（如：设计工具）
- 技术术语、框架名称保留英文（如：vue、react、typescript）

**限制：**
- 描述 ≤ 20 字
- 标签 ≤ 3 个

**第4步：执行脚本添加**
```bash
# 网站
node public/fav.js add <url> --title "名称" --description "描述" --category "分类"

# 仓库
node public/fav.js add <url> --name "owner/repo" --description "描述" --tags "标签1,标签2" --stars 数量
```

**第5步：自动提交推送**
```bash
git add public/data/ && git commit -m "feat: add <名称>" && git push
```

## 命令

| 命令 | 用法 |
|------|------|
| add | `node public/fav.js add <url> [options]` |
| list-categories | `node public/fav.js list-categories` |
| list-tags | `node public/fav.js list-tags` |