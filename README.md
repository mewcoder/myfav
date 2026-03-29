# MyFav

个人收藏导航，支持网站和 GitHub 仓库管理。

## 特色
- 🤖 AI 辅助：使用openclaw + SKILL，进行智能添加后，在GitHub Pages上展示

## 数据格式

**sites.json**
```json
{ "title": "名称", "url": "链接", "description": "简介", "category": "分类", "saveTime": "2026-03-01" }
```

**repos.json**
```json
{ "name": "owner/repo", "url": "链接", "description": "简介", "tags": ["标签"], "stars": 1000, "saveTime": "2026-03-01" }
```

## 开发

```bash
npm install
npm run dev
npm run build
```

Vue 3 + Vite，支持亮色/暗色主题。