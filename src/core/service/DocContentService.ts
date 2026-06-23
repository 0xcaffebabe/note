import type { MarkdownPort, DomParserPort } from '../ports'
import SearchIndexSegment from '../domain/search/SearchIndexSegement'
import { KnowledgeLinkNode, KnowledgeNode } from '../domain/KnowledgeNode'
import DocFileInfo from '../domain/DocFileInfo'
import CommitInfo from '../domain/CommitInfo'
import DocUtils from '../util/DocUtils'
import ArrayUtils from '../util/ArrayUtils'
import Slugger from '../util/Slugger'
import { getMidString } from '../util/StringUtils'
import { QualityInputData } from '../util/DocQualityCalculator'

// 文档内容处理(平台无关): markdown -> 纯文本 / 搜索分段 / 知识链接 / frontmatter。
// 仅经注入的 MarkdownPort + DomParserPort 工作, 不碰 fs/git——任何运行时只要提供这两个
// 端口即可复用这套"markdown 转结构化数据"的核心逻辑。构建期由 build/DocService 用 node
// 适配器装配并委托(对外行为字节不变, 尤其 md2TextSegement 喂搜索索引)。
export class DocContentService {
  constructor(
    private readonly markdown: MarkdownPort,
    private readonly dom: DomParserPort,
  ) {}

  /**
   * 解析出markdown里的元数据(frontmatter)
   */
  resolveMetadata(content: string): string {
    if (!content.trim().startsWith("---")) {
      return "";
    }
    // 匹配开头的 metadata 块，使用多行模式 (m) 和单行匹配 (s)，确保只匹配开头的元数据部分
    const reg = new RegExp('^---[\\s\\S]+?^---', 'm');
    const result = content.match(reg);
    if (result != null && result.length != 0) {
      // 只剥离首尾围栏分隔符(锚定行边界), 避免贪婪 /---/g 误删 yaml 值内部的 ---
      return result[0].replace(/^---\r?\n/, '').replace(/\r?\n?---$/, '').trim();
    }
    return '';
  }

  /**
   * 构建期搜索文本清洗: 去 tab、去代码块标记行、去空行(语义独立于运行期 \p{L}\p{N} 版)。
   */
  cleanText(text: string): string {
    return text.replace(/\t/g, '')
              .split('\n') // 按行分割
              .filter(v => v.indexOf('```') == -1) // 去除代码块标记
              .filter(v => v.length != 0) // 去除空文本
              .join('\n')
  }

  stringify(html: string): string {
    return this.dom.parse(html).body.textContent || ''
  }

  md2text(md: string): string {
    const html = this.markdown.render(md)
    const text = this.dom.parse(html).body.textContent || ''
    return this.cleanText(text)
  }

  /**
   * 把 markdown 切成"按标题分段"的搜索索引片段(标题 id + 段内纯文本)。
   * 用 marked 默认渲染器(只覆写 heading 加锚点 id)抽干净文本, 喂 Algolia 索引。
   */
  md2TextSegement(md: string): SearchIndexSegment[] {
    md = md.replace(/^---$.*^---$/ms, '') // 去除markdown里的元数据
    const render = this.markdown.createRenderer();
    const slugger = new Slugger();
    render.heading = function(token) {
      const text = this.parser.parseInline(token.tokens);
      const level = token.depth + 1
      const raw = token.raw
      .toLowerCase()
      .trim()
      .replace(/<[!\/a-z].*?>/gi, '');
      const id = slugger.slug(raw);

      return `<h${level} id="${id}">${text}</h${level}>\n`;
    }
    const html = this.markdown.parse(md, {renderer: render})
    const elemts = this.dom.parse(html).body.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const segments: SearchIndexSegment[] = []
    for(let i = 0;i<elemts.length;i++){
      let text = '';
      const leftHeading = elemts[i].outerHTML
      if (i == elemts.length - 1) {
        text = html.substring(html.indexOf(leftHeading) + leftHeading.length)
      }else {
        const rightHeading = elemts[i+1].outerHTML
        text = getMidString(html, leftHeading, rightHeading)
      }
      text = this.cleanText(this.stringify(text))
      segments.push({
        id: elemts[i].getAttribute('id') || '',
        txt: text
      })
    }
    return segments
  }

  /**
   * 隐式知识链接: 在一篇文档正文里, 凡出现某已知知识节点 name 作为子串者, 即视为指向它。
   * 纯字符串包含匹配(不分词、不规整大小写), 与显式 extractKnowledgeLinks 互补。
   * 返回顺序 = nameMap 的迭代(插入)顺序, 下游据此塑形, 不可改成排序遍历。
   */
  matchPotentialLinks(content: string, nameMap: Map<string, KnowledgeLinkNode>): KnowledgeLinkNode[] {
    const links: KnowledgeLinkNode[] = []
    nameMap.forEach(e => {
      if (content.indexOf(e.name) != -1) {
        links.push(e)
      }
    })
    return links
  }

  /**
   * 从一篇 md 的显式手动链接里抽出知识链接(href 含 md 的 a 标签)。
   */
  extractKnowledgeLinks(md: string): KnowledgeLinkNode[] {
    const html = this.markdown.render(md);
    const linkElemetns = this.dom.parse(html).body.querySelectorAll('a');
    const links: KnowledgeLinkNode[] = []
    for(let i = 0;i<linkElemetns.length;i++){
      const a = linkElemetns[i]
      const uri = a.getAttribute('href')
      if (uri?.indexOf('md') != -1) {
        links.push({name: a.textContent || '', ...DocUtils.resloveDocUrl(uri!)})
      }
    }
    return links
  }

  /**
   * 由原始 md 文本 + 提交历史装配 DocFileInfo(纯塑形)。提取自 build/DocService.getFileInfo,
   * fs 读取与 git 取提交留驱动, 此处只做 frontmatter 剥离 + 字段拼装。
   * ⚠️ name 逐字保留 `path.split('/')[len-1].replace('.md','')`(非锚定替换, 与 docUrl2Id 的 /\.md$/i 不同口径);
   *    body 剥离正则 `^---[\s\S]+?^---\s*` 配合 resolveMetadata 真值门控(无 frontmatter 时原样返回)。
   */
  buildFileInfo(path: string, rawContent: string, commits: CommitInfo[]): DocFileInfo {
    const frontmatter = this.resolveMetadata(rawContent)
    const body = frontmatter
      ? rawContent.replace(/^---[\s\S]+?^---\s*/m, '')
      : rawContent
    return {
      name: path.split('/')[path.split('/').length - 1].replace('.md', ''),
      id: DocUtils.docUrl2Id(path),
      content: body,
      metadata: frontmatter || '',
      hasMoreCommit: commits.length > 10,
      totalCommits: commits.length,
      commitList: ArrayUtils.topN(commits, 10),
      createTime: ArrayUtils.last(commits)?.date || '',
    } as DocFileInfo
  }

  /**
   * 按文件清单装配文档质量计算器的输入(纯塑形)。提取自 build/DocService.generateDocQualityData,
   * fs/git 并行读取与链度统计留驱动, 此处按 docId 取已读内容/提交, 拼出 QualityInputData[]。
   * 用注入的 cleanText/resolveMetadata, 故 contentLength/metadata 与构建期口径一致。
   */
  buildQualityInputList(
    fileList: string[],
    fileContents: Map<string, string>,
    commitLists: Map<string, CommitInfo[]>,
    knowledgeNodes: KnowledgeNode[],
    inLinks: Map<string, number>,
    outLinks: Map<string, number>,
  ): QualityInputData[] {
    const inputDataList: QualityInputData[] = []
    for (const file of fileList) {
      const id = DocUtils.docUrl2Id(file)
      const content = fileContents.get(id) || ''
      const commitList = commitLists.get(id) || []
      inputDataList.push({
        contentLength: this.cleanText(content).length,
        outLinksCount: outLinks.get(id) || 0,
        inLinksCount: inLinks.get(id) || 0,
        commitList: commitList,
        metadata: this.resolveMetadata(content),
        knowledgeNodes: knowledgeNodes,
        docId: id,
      })
    }
    return inputDataList
  }
}
