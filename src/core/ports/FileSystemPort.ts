// 文件系统端口: 构建期(node)读取目录/文件的最小抽象。
// 仅暴露 build 实际用到的能力, 且用结构化类型(FileStats/FileBytes)不泄漏 node 'fs' 的
// Buffer/Stats 具体类型, 保持 core 可脱平台编译。
export interface FileStats {
  isDirectory(): boolean
  size: number
}

// 文件字节内容: 消费方只调用 .toString() 取文本, 故只暴露该方法(Buffer 满足之)。
export interface FileBytes {
  toString(encoding?: string): string
}

export interface FileSystemPort {
  readdirSync(path: string): string[]
  lstatSync(path: string): FileStats
  readFile(path: string): Promise<FileBytes>
  stat(path: string): Promise<FileStats>
  existsSync(path: string): boolean
  mkdirSync(path: string): void
}
