import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// 获取命令行参数
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : null;

if (!targetDir) {
  console.error('请提供要扫描的目录路径');
  process.exit(1);
}

// 递归扫描目录下所有 md 文件
async function scanDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await scanDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

// 提取 md 文件中的 tags
async function extractTags(filePath) {
  const content = await fs.readFile(filePath, 'utf8');

  // 匹配 front-matter
  const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!fmMatch) return [];

  const frontMatter = fmMatch[1];

  // 匹配 tags: [...] 格式
  const tagsMatch = frontMatter.match(/tags\s*:\s*\[([^\]]*)\]/);
  if (!tagsMatch) return [];

  const tagStr = tagsMatch[1];

  // 分割字符串并去除多余空格和引号
  return tagStr.split(',')
    .map(t => t.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

// 主逻辑
(async () => {
  const mdFiles = await scanDir(targetDir);
  const allTags = new Set();

  for (const file of mdFiles) {
    const tags = await extractTags(file);
    tags.forEach(tag => allTags.add(tag));
  }

  // 输出去重标签，逗号分隔
  console.log([...allTags].join(','));
})();
