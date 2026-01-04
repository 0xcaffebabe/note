import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// 获取命令行参数
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
const mappingStr = process.argv[3];

if (!targetDir || !mappingStr) {
  console.error('请提供要替换的目录路径和标签映射关系');
  console.error('用法: node replace_tags.js <目标目录> \'{ "oldTag": "newTag" }\'');
  process.exit(1);
}

// 解析标签映射关系
function parseTagMapping(mappingStr) {
  try {
    const mapping = JSON.parse(mappingStr);
    return mapping;
  } catch (error) {
    console.error('标签映射参数不是有效的JSON格式:', error.message);
    process.exit(1);
  }
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

// 替换 md 文件中的 tags
async function replaceTagsInFile(filePath, tagMapping) {
  const content = await fs.readFile(filePath, 'utf8');

  // 检查是否包含 front-matter
  const fmMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
  if (!fmMatch) return; // 如果没有 front-matter，直接返回

  let frontMatter = fmMatch[1];
  const originalFrontMatter = frontMatter;

  // 匹配 tags: [...] 格式
  const tagsMatch = frontMatter.match(/(tags\s*:\s*\[)([^\]]*)(\])/);
  if (!tagsMatch) return; // 如果没有 tags，直接返回

  let tagStr = tagsMatch[2];
  // 分割字符串并去除多余空格和引号
  let tags = tagStr.split(',')
    .map(t => t.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

  // 检查是否有需要替换的标签
  let hasChanges = false;
  const updatedTags = [];
  
  for (let tag of tags) {
    let replaced = false;
    for (const [oldTag, newTag] of Object.entries(tagMapping)) {
      if (tag === oldTag) {
        updatedTags.push(newTag);
        replaced = true;
        hasChanges = true;
        break;
      }
    }
    if (!replaced) {
      updatedTags.push(tag);
    }
  }

  // 如果没有变化，直接返回
  if (!hasChanges) return;

  // 去重并构建新标签字符串
  const uniqueTags = [...new Set(updatedTags)];
  const newTagStr = uniqueTags.map(tag => `'${tag}'`).join(', ');

  // 替换 front-matter 中的 tags
  const newFrontMatter = frontMatter.replace(
    /(tags\s*:\s*\[)([^\]]*)(\])/,
    `$1${newTagStr}$3`
  );

  // 构建新内容
  const newContent = content.replace(
    /^---\s*([\s\S]*?)\s*---/,
    `---\n${newFrontMatter}\n---`
  );

  // 写回文件
  await fs.writeFile(filePath, newContent);
  console.log(`已更新文件: ${filePath}`);
}

// 主逻辑
(async () => {
  const tagMapping = parseTagMapping(mappingStr);
  const mdFiles = await scanDir(targetDir);

  for (const file of mdFiles) {
    await replaceTagsInFile(file, tagMapping);
  }

  console.log('标签替换完成！');
})();