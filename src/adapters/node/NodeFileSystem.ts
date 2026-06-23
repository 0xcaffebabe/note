// FileSystemPort 的 node 实现: 直通 node 'fs'。构建期文件读取唯一接触 fs 的位置。
import type { FileSystemPort, FileStats, FileBytes } from '../../core/ports/FileSystemPort'
import fs from 'fs'

export class NodeFileSystem implements FileSystemPort {
  readdirSync(path: string): string[] {
    return fs.readdirSync(path)
  }
  lstatSync(path: string): FileStats {
    return fs.lstatSync(path)
  }
  readFile(path: string): Promise<FileBytes> {
    return fs.promises.readFile(path)
  }
  stat(path: string): Promise<FileStats> {
    return fs.promises.stat(path)
  }
  existsSync(path: string): boolean {
    return fs.existsSync(path)
  }
  mkdirSync(path: string): void {
    fs.mkdirSync(path)
  }
}

export const nodeFileSystem = new NodeFileSystem()
