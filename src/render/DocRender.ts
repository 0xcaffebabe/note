

import TagSumItem from '@/dto/tag/TagSumItem'
import TagUtils from '@/pages/tag/TagUtils'
import { KnowledgeLinkNode } from '@/dto/KnowledgeNode'
import IdGenUtils from '@/util/IdGenUtils'
import KatexExtension from './KatexExtension'
import Slugger from '@/util/Slugger'
import { marked } from 'marked'
import DocUtils from '@/util/DocUtils'
import prism from 'prismjs'
import DatasourceService from '@/service/DatasourceService'

const baseUrl = () => {
  return DatasourceService.getCurrentDatasource().url
}

function localImageProxy(url: string | null): string | null{
  if (!url) {
    return url;
  }
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }
  if (url.startsWith('/')) {
    url = url.replace('/', '');
  }else {
    url = url.replace('./', '');
  }
  return baseUrl() + url;
}

function buildDocLink(id: string, headingId: string): string {
  if (!id) {
    return ""
  }
  let url = "/#/doc/" + id;
  if (headingId) {
    url += "?headingId=" + headingId
  }
  return url;
}

export default class DocRender {

  mdContent: string

  docId: string

  tagList: TagSumItem[]

  knowledgeLinkList: KnowledgeLinkNode[]

  constructor(mdContent: string, 
              docId: string,
              tagList: TagSumItem[],
              knowledgeLinkList: KnowledgeLinkNode[]
            ) {
    this.mdContent = mdContent
    this.docId = docId
    this.tagList = tagList
    this.knowledgeLinkList = knowledgeLinkList
  }

  public render(): string {
    marked.use(KatexExtension({}))
    const render = new marked.Renderer();

    // 自定义url渲染
    render.link = (token): string => {
      const href = token.href
      let text = token.text
      if (!href?.startsWith('http')) {
        const { id, headingId } = DocUtils.resloveDocUrl(href!)
        // 当text为html的情况下 排除掉dom中sup节点 文本化
        text = Array.from(new DOMParser().parseFromString(text!, 'text/html').body.childNodes)
          .filter(n => (n as HTMLElement).tagName != 'SUP')
          .map(n => n.textContent)
          .join('');
        return `<a href='${buildDocLink(id, headingId!)}' origin-link='${href}'>${text}</a>`
      } else {
        return `<a href='${href}' target="_blank">${text}</a>`
      }
    }
    // 自定义代码块渲染
    render.code = (token): string => {
      const language = token.lang
      const code = token.text
      // 如果语言是mermaid 特殊处理 转为mermaid
      if (language == 'mermaid') {
        return `
          <div class="mermaid-wrapper" data-raw='${code}'>
            <div class="fullscreen">
              <button>全屏</button>
            </div>
            <div id='mermaid-${IdGenUtils.uuid()}'>${code}</div>
          </div>
        `
      }
      return `<pre><code class="language-${language}">${this.hightlightCode(code, language)}</code></pre>`
    }
    // 自定义图片渲染
    render.image = (token): string => {
      let href = token.href
      const text = token.text
      if (href?.startsWith('/')) {
        href = baseUrl() + href.replace('/', '')
      }
      return `<p class="img-wrapper"><img loading="lazy" src='${localImageProxy(href)}' width="480" height="240" crossorigin="anonymous"/><p class="img-title">${text}</p></p>`
    }
    //const reg = new RegExp(this.knowledgeLinkList.map(v => v.name).join('|'))

    // 自定义文本渲染
    //const oriTextRender = render.text;
    // render.text = (token): string => {
    //   let text = token.text
    //   // 自定义文本渲染 若发现关键字包含标签 则插入标记
    //   for (const i of this.tagList) {
    //     if (text.indexOf(i.tag) != -1) {
    //       text = text.replace(i.tag, (str: string) => `<u class="doc-tag-main" tag="${i.tag}">${str}</u><sup class="doc-tag" tag="${i.tag}" style="background-color: ${TagUtils.calcTagColor(i.tag)}">${i.count}</sup>`);
    //     }
    //   }
    //   // 自定义文本渲染 若发现关键字包含已存在的知识网络连接 则转为链接
    //   text = text.replace(reg, (str: string) => {
    //     const i = this.knowledgeLinkList.filter(v => v.name == str)[0];
    //     if (!i) {
    //       return str;
    //     }
    //     // 如果被插入的链接为当前渲染的文档 跳过
    //     if (i.id == this.docId) {
    //       return str;
    //     }
    //     // 如果被替换的关键字是标签 跳过
    //     if (this.tagList.some(v => v.tag == str)) {
    //       return str;
    //     }
    //     return `<a href='${buildDocLink(i.id, i.headingId!)}' class="potential-link" origin-link="${DocUtils.docId2Url(i.id)}">${str}</a>`
    //   })
    //   // 自动发现RFC
    //   text = text.replace(/\[RFC\d+\]/gi, (str: string) => {
    //     return `<a href='https://www.rfc-editor.org/rfc/${str.toLowerCase().replace('[', '').replace(']', '')}'>${str}</a>`
    //   })
    //   if (token.tokens) {
    //     return oriTextRender.apply(render, [token])
    //   }
    //   return text
    // }
    const slugger = new Slugger();
    const oriTableRender = render.table
    render.table = function (token) {
      const tableRenderText = oriTableRender.call(render, token)
      return `<div class="table-wrapper">${tableRenderText}</div>`
    }
    render.heading = function (token) {
      const text = this.parser.parseInline(token.tokens);
      const level = token.depth + 1
      const raw = token.raw
        .toLowerCase()
        .trim()
        .replace(/<[!\/a-z].*?>/gi, '');
      const id = slugger.slug(raw);

      return `<h${level} id="${id}">${text}</h${level}>\n`;
    }
    return marked.parse(this.mdContent, { renderer: render }) as string
  }

  private hightlightCode(code: string, lang: string | undefined): string {
    if (!lang) {
      lang = 'clike';
    }
    if (!prism.languages[lang]) {
      lang = 'clike';
    }
    return prism.highlight(code, prism.languages[lang], lang)
  }
}