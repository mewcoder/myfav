// 批量更新 repos.json 中所有仓库的 stars
const fs = require('fs');
const path = require('path');
const https = require('https');

const reposPath = path.join(__dirname, '../public/data/repos.json');
const repos = JSON.parse(fs.readFileSync(reposPath, 'utf8'));

// 从 URL 提取 owner/repo
function extractRepo(url) {
  const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  return match ? match[1] : null;
}

// 调用 GitHub API 获取 stars
function getStars(ownerRepo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${ownerRepo}`,
      headers: {
        'User-Agent': 'MyFav-Updater',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json.stargazers_count || 0);
          } catch (e) {
            resolve(0);
          }
        } else {
          resolve(0);
        }
      });
    }).on('error', () => resolve(0));
  });
}

async function updateAllStars() {
  console.log(`正在更新 ${repos.length} 个仓库的 stars...\n`);
  
  let updated = 0;
  
  // 每次处理 10 个，避免 rate limit
  for (let i = 0; i < repos.length; i += 10) {
    const batch = repos.slice(i, i + 10);
    const promises = batch.map(async (repo) => {
      const ownerRepo = extractRepo(repo.url);
      if (!ownerRepo) return repo;
      
      const newStars = await getStars(ownerRepo);
      if (newStars !== repo.stars) {
        repo.stars = newStars;
        updated++;
        console.log(`${repo.name}: ${repo.stars} → ${newStars}`);
      }
      return repo;
    });
    
    await Promise.all(promises);
    
    // 等待 500ms 避免 rate limit
    if (i + 10 < repos.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // 写回文件
  fs.writeFileSync(reposPath, JSON.stringify(repos, null, 2));
  console.log(`\n完成！更新了 ${updated} 个仓库`);
}

updateAllStars();