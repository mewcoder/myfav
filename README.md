# MyFav

英文文章可同时保存同目录的 `*_zh.md` 中文译文；文章详情页在索引提供 `translationPath` 时显示“原文 / 中文”切换，并支持用 `?lang=zh` 直接打开中文版。

MyFav 是一个本地数据优先的个人收藏站。网站、GitHub 仓库和文章元信息使用 JSON 管理，文章正文与图片使用 Markdown 文件保存，站点由 Vue 3 + Vite 构建并发布到 GitHub Pages。

当前仓库保留 82 个网站、136 个 GitHub 仓库；文章索引暂时为空，文章页会展示真实的空状态。

## 数据结构

数据索引位于 `public/data/`：

- `sites.json`：网站收藏。
- `repos.json`：GitHub 仓库收藏。
- `articles.json`：文章导航与元信息。

三类内容共用 6 个固定分类：`AI`、`开发`、`设计`、`知识`、`工具`、`生活`。分类只表达稳定的大领域；技术、来源、形式和具体主题放入 tags，例如 `Claude Code`、`MCP`、`前端`、`微信公众号`。

网站记录：

```json
{
  "title": "名称",
  "url": "https://example.com",
  "description": "简介",
  "category": "分类",
  "tags": ["标签"],
  "saveTime": "2026-08-07"
}
```

GitHub 仓库记录：

```json
{
  "name": "owner/repo",
  "url": "https://github.com/owner/repo",
  "description": "简介",
  "category": "分类",
  "tags": ["标签"],
  "stars": 1000,
  "saveTime": "2026-08-07"
}
```

文章记录：

```json
{
  "title": "文章标题",
  "url": "原文链接",
  "description": "文章介绍",
  "category": "分类",
  "tags": ["标签"],
  "author": "作者（可选）",
  "published": "原文发布日期（可选）",
  "saveTime": "2026-08-07",
  "path": "articles/2026-08/article-slug.md"
}
```

文章正文放在仓库根目录的 `articles/YYYY-MM/`。正文文件无需重复填写 front matter，元信息以 `articles.json` 为准。正文图片建议与 Markdown 同名建目录，例如：

```text
articles/2026-08/example.md
articles/2026-08/example/01.png
```

Markdown 中使用相对路径 `![说明](./example/01.png)` 即可；开发服务器和 Pages 发布脚本都会保留该结构。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

单元测试：

```bash
npm test
```

已有收藏的分类和标签可按当前规则重新归一化：

```bash
npm run enrich-data
```

脚本只使用 JSON 中已有的标题、简介和标签，不访问外部网站；记录数量及收藏时间不会改变。

生产构建与 Pages 文件准备：

```bash
npm run build
npm run prepare-pages
```

`prepare-pages` 会把根目录 `articles/` 复制到 `dist/articles/`，并生成 `dist/404.html`，以支持 GitHub Pages history 路由回退。推送到 `main` 后，GitHub Actions 会自动执行相同步骤并发布。

- API Key 默认只保存在当前标签页的 `sessionStorage`。
- 勾选“记住配置”后才写入 `localStorage`。
- “清除配置”会同时清除两处存储及本地摘要缓存。
- API Key、提问和收藏内容会直接发送给所选 API 服务商，请按服务商的隐私政策使用。

文章笔记使用 Utterances，以文章 pathname 映射到 `mewcoder/myfav` 的 GitHub Issue；加载失败不会影响正文阅读。
