import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * 按构建器的插入顺序写入资源，确保所有不可变对象就绪后才发布最后的 manifest。
 * 写入失败会中止当前发布并向 Vite 传播错误，不继续切换到不完整的知识快照。
 */
export async function publishKnowledgeAssets(
  outputRoot: string,
  assets: ReadonlyMap<string, string>,
): Promise<void> {
  for (const [url, body] of assets) {
    const filename = path.join(outputRoot, url.slice(1))
    await fs.mkdir(path.dirname(filename), { recursive: true })
    await fs.writeFile(filename, body)
  }
}
