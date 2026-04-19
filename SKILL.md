---
name: fav
description: 网站收藏助手。使用 /f 指令触发，自动获取网站信息，生成分类，保存到本地 JSON 文件，并自动提交到 GitHub 仓库。

---

# MyFav 收藏管理

触发命令: `/f <url>`

**仓库路径**: `~/.openclaw/workspace/skills/myfav`

## ⚠️ 重要注意事项

- **必须用 `node public/fav.js add` 命令追加** — 脚本会自动处理

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

**第0步：拉取最新代码**
```bash
git pull
```

**第1步：判断类型**
- URL 含 `github.com` → 仓库
- 否则 → 网站

**⚠️ 文章拦截规则**
如果 URL 是以下类型，**拒绝收藏并提示用户改用 `/a` 命令**：
- X/Twitter 推文：`x.com` 或 `twitter.com` 且包含 `/status/`
- 博客文章：`medium.com`、`substack.com`、`zhuanlan.zhihu.com` 等
- 论文：`arxiv.org` 等
- 新闻文章：明显是文章内容的 URL

提示语："这是文章，请用 `/a <链接>` 收藏到飞书多维表格"

**第2步：WebFetch 获取信息**
```
WebFetch url: "<url>" prompt: "提取标题和简短描述"
```

**第3步：生成分类/标签**
- 网站：获取现有分类 `node public/fav.js list-categories`，优先复用或生成新的
- 仓库：获取现有标签 `node public/fav.js list-tags`，优先复用或生成新的

**命名规范：**
- 分类/标签优先用中文（如：设计工具）
- 技术术语、框架名称保留英文（如：vue、react、typescript、skills）

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

操作成功后附上网站地址 https://mewcoder.github.io/myfav

## 命令

| 命令 | 用法 |
|------|------|
| add | `node public/fav.js add <url> [options]` |
| list-categories | `node public/fav.js list-categories` |
| list-tags | `node public/fav.js list-tags` |