
interface Book {
  name: string
  chapters: string[]
}

export interface DocMetadata {

  /**
   *
   * 文档的标签
   * @type {string[]}
   * @memberof DocMetadata
   */
  tags: string[],

  /**
   *
   * 文档相关的书籍
   * @type {Book[]}
   * @memberof DocMetadata
   */
  books: Book[]

  /**
   *
   * 文档名称
   * @type {string}
   * @memberof DocMetadata
   */
  name: string
  
  /**
   *
   * 国际标准名称 一般是英文
   * @type {string}
   * @memberof DocMetadata
   */
  standardName: string


  /**
   *
   * 文档的别名 可能是缩写 或者翻译
   * @type {string[]}
   * @memberof DocMetadata
   */
  alias: string[]
}

export const EMPTY_DOC_METADATA = {
  tags:[],
  books:[],
  name: '',
  standardName: '',
  alias: []
} as DocMetadata