import BookMarkItem from "@/dto/BookMarkItem"

/**
 * 书签管理服务
 *
 * @class BookMarkService
 */
class BookMarkService {
  private static instance: BookMarkService
  readonly STORAGE_KEY = "book-mark-service::list"

  private constructor(){}

  public static getInstance(): BookMarkService {
    if (!this.instance) {
      this.instance = new BookMarkService()
    }
    return this.instance
  }



  /**
   *
   * 新增一条书签
   * @param {BookMarkItem} bookMark
   * @memberof BookMarkService
   */
  public add(bookMark: BookMarkItem) {
    const map = this.getBookMarkMap()
    if (!map.has(bookMark.docId)) {
      map.set(bookMark.docId, [])
    }
    map.get(bookMark.docId)!.push(bookMark)
    this.writeBookMarkList(map)
  }

  public remove(bookMark: BookMarkItem) {
    const map = this.getBookMarkMap()
    if (!map.has(bookMark.docId)) {
      map.set(bookMark.docId, [])
    }
    map.set(bookMark.docId, map.get(bookMark.docId)!.filter(v => v == bookMark))
    this.writeBookMarkList(map)
  }

  public getBookMarkMap(): Map<string, BookMarkItem[]> {
    const raw = localStorage.getItem(this.STORAGE_KEY)
    if (!raw) {
      return new Map()
    }
    return new Map(Array.from(JSON.parse(raw)))
  }

  private writeBookMarkList(map: Map<string, BookMarkItem[]>) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(map)))
  }

}

export default BookMarkService.getInstance()