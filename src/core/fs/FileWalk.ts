import type { FileSystemPort } from '../ports/FileSystemPort'

// 目录遍历(平台无关): 经 FileSystemPort 的 readdirSync/lstatSync 递归列文件, 按"路径段"剪枝忽略目录。
// 提取自 build/BaseService(逐字), 任何运行时只要提供 FileSystemPort 即可复用同一套枚举口径。

export const DEFAULT_IGNORE_PREFIXES = ['.git', 'node_modules', 'dist', 'doc/.agents', 'QWEN', 'test-results', 'playwright-report']

/** 递归列出 path 下所有文件; 命中 ignorePrefixs(按路径段滑窗匹配)的目录整棵跳过。 */
export function listAllFile(fs: FileSystemPort, path: string, ignorePrefixs: string[] = DEFAULT_IGNORE_PREFIXES): string[] {
  // 按「路径段」剪枝: 把路径拆成段后做滑窗匹配, 这样无论传入相对名(node_modules)
  // 还是绝对根(/.../node_modules)都能命中忽略目录; 用 / 与 \ 同时切分以兼容跨平台。
  const segments = path.split(/[\\/]+/).filter(Boolean)
  for (let i of ignorePrefixs) {
    const prefixSegments = i.split('/').filter(Boolean)
    for (let s = 0; s + prefixSegments.length <= segments.length; s++) {
      if (prefixSegments.every((seg, j) => seg === segments[s + j])) {
        return []
      }
    }
  }
  const result: string[] = []
  for (let item of fs.readdirSync(path)) {
    if (!path.startsWith('./')) {
      item = path + "/" + item
    }
    if (fs.lstatSync(item).isDirectory()) {
      result.push(...listAllFile(fs, item, ignorePrefixs))
    } else {
      result.push(item)
    }
  }
  return result
}

/** 列出 path 下某后缀(大小写不敏感)的文件。 */
export function listFilesBySuffix(fs: FileSystemPort, suffix: string, path: string = './', ignorePrefixs: string[] = DEFAULT_IGNORE_PREFIXES): string[] {
  const target = '.' + suffix.toLowerCase()
  return listAllFile(fs, path, ignorePrefixs).filter(v => v.toLowerCase().endsWith(target))
}

/** 列出整库 .md 文件。 */
export function listAllMdFile(fs: FileSystemPort): string[] {
  return listFilesBySuffix(fs, 'md')
}
