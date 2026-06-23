import { nodeFileSystem } from '../../../adapters/node/NodeFileSystem'
import { listAllFile, listFilesBySuffix, listAllMdFile } from '../../../core/fs/FileWalk'

// 目录遍历逻辑(递归 + ignorePrefixs 段剪枝)已下沉 core/fs/FileWalk(经 FileSystemPort,
// 忽略列表 = DEFAULT_IGNORE_PREFIXES)。本基类为各 build 服务保留同名静态入口, 用 node
// 文件系统适配器装配后委托——行为逐字不变。
export default class BaseService {

  static listAllFile(path: string): string[] {
    return listAllFile(nodeFileSystem, path)
  }

  static listFilesBySuffix(suffix: string, path: string = './'): string[] {
    return listFilesBySuffix(nodeFileSystem, suffix, path)
  }

  static listAllMdFile(): string[] {
    return listAllMdFile(nodeFileSystem)
  }

}