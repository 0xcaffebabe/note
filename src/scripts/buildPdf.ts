import PathUtils from '../util/PathUtils'
import fs from 'fs'
import path from 'path'
import BookService from '../build/BookService'
import PDFMerger  from 'pdf-merger-js'

main()

async function main(){
  const fileList = BookService.listFilesBySuffix('md', 'doc')
  let outList: string[] = []
  for(let filename of fileList) {
    await fs.promises.readFile(filename)
      .then(data => BookService.md2pdf(data.toString()))
      .then(pdf => {
        const outFilename = "book/" + filename.replace('.md', '.pdf')
        PathUtils.ensureDirectoryExistence(outFilename)
        fs.writeFileSync(outFilename, pdf.content)
        outList.push(outFilename)
        console.log('build-pdf ' + outFilename + ' 生成完毕')
      })
      .catch(err => {
        console.error(filename + '转pdf异常', err)
      })
  }
  console.log('build-pdf 所有任务完成 准备合并')
  const merger = new PDFMerger();
  for(let file of outList) {
    merger.add(file)
  }
  await merger.save('book/out.pdf')
  console.log('build-pdf 合并完成')
  process.exit()
}