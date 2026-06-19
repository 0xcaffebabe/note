import fs from 'fs'
import path from 'path'

const ignorePrefixs = ['.git', 'node_modules', 'dist', 'doc/.agents', 'QWEN']

export default class BaseService {

  static listAllFile(path: string): string[] {
    // 按「路径段」剪枝: 把路径拆成段后做滑窗匹配, 这样无论传入相对名(node_modules)
    // 还是绝对根(/.../node_modules)都能命中忽略目录; 用 / 与 \ 同时切分以兼容跨平台。
    const segments = path.split(/[\\/]+/).filter(Boolean)
    for(let i of ignorePrefixs) {
      const prefixSegments = i.split('/').filter(Boolean)
      for (let s = 0; s + prefixSegments.length <= segments.length; s++) {
        if (prefixSegments.every((seg, j) => seg === segments[s + j])) {
          return []
        }
      }
    }
    const result = []
    for(let item of fs.readdirSync(path)){
      if (!path.startsWith('./')) {
        item = path + "/" + item
      }
      if (fs.lstatSync(item).isDirectory()){
        result.push(...BaseService.listAllFile(item))
      }else{
        result.push(item)
      }
    }
    return result
  }


  /**
   *
   * 列出某个路径下的某个后缀的文件
   * @static
   * @param {string} suffix
   * @param {string} [path='./']
   * @return {*}  {string[]}
   * @memberof BaseService
   */
  static listFilesBySuffix(suffix: string, path: string = './'): string[] {
    // 真正大小写不敏感: 把文件名与后缀都归一为小写再比较, 这样 .md/.MD/.Md/.mD 与
    // 任意大小写的 suffix 都能正确互相命中。
    const target = '.' + suffix.toLowerCase()
    return BaseService.listAllFile(path)
                      .filter(v => v.toLowerCase().endsWith(target))
  }

  static listAllMdFile(): string[] {
    return BaseService.listFilesBySuffix('md')
  }

}