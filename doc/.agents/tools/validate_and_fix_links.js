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

// 检查文件是否存在
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// 解析并验证链接
async function validateAndFixLinksInFile(filePath, allMdFiles) {
  let content = await fs.readFile(filePath, 'utf8');
  const originalContent = content;

  // 正则表达式匹配 [text](link) 格式的 Markdown 链接
  // 这个正则表达式支持相对路径、绝对路径以及锚点链接
  const linkRegex = /\[([^\]]+)\]\(([^)]+\.(md|MD))\)/g;

  let updatedContent = content;
  let match;
  let fixedCount = 0;
  const fixedLinks = [];

  // 暂存匹配结果，避免在循环中修改正在遍历的内容
  const matches = [];
  while ((match = linkRegex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      linkText: match[1],
      linkPath: match[2]
    });
  }

  // 处理所有匹配项
  for (const match of matches) {
    const { fullMatch, linkText, linkPath } = match;

    // 处理相对路径
    let absolutePath;
    if (linkPath.startsWith('/')) {
      // 绝对路径，相对于目标目录
      absolutePath = path.join(targetDir, linkPath.substring(1));
    } else {
      // 相对路径，相对于当前文件所在目录
      absolutePath = path.resolve(path.dirname(filePath), linkPath);
    }

    // 检查文件是否存在
    const exists = await fileExists(absolutePath);

    if (!exists) {
      // 文件不存在，需要移除链接，保留文本
      const replacement = linkText;
      updatedContent = updatedContent.replace(fullMatch, replacement);
      fixedCount++;
      fixedLinks.push({
        original: fullMatch,
        replacement: replacement,
        path: linkPath
      });
    }
  }

  // 如果内容有变化，写回文件
  if (updatedContent !== originalContent) {
    await fs.writeFile(filePath, updatedContent);
    console.log(`已修复文件: ${filePath}，移除了 ${fixedCount} 个失效链接`);
    for (const link of fixedLinks) {
      console.log(`  - ${link.original} -> ${link.replacement}`);
    }
  } else if (fixedCount === 0) {
    console.log(`文件 ${filePath} 无需修复`);
  }

  return {
    file: filePath,
    fixedCount,
    fixedLinks
  };
}

// 主逻辑
(async () => {
  console.log(`开始扫描目录: ${targetDir}`);
  
  // 获取所有MD文件路径
  const mdFiles = new Set((await scanDir(targetDir)).map(p => path.resolve(p)));
  
  console.log(`发现 ${mdFiles.size} 个 MD 文件`);

  let totalFixedCount = 0;
  let processedFiles = 0;
  
  // 遍历每个MD文件，验证并修复链接
  for (const file of mdFiles) {
    try {
      const result = await validateAndFixLinksInFile(file, mdFiles);
      totalFixedCount += result.fixedCount;
      if (result.fixedCount > 0) {
        processedFiles++;
      }
    } catch (error) {
      console.error(`处理文件时出错 ${file}:`, error.message);
    }
  }

  console.log('\n修复完成！');
  console.log(`总共处理了 ${processedFiles} 个文件`);
  console.log(`总共移除了 ${totalFixedCount} 个失效链接`);
})();