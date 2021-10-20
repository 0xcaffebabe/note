

/**
 *
 * 书签项
 * @export
 * @interface BookMarkItem
 */
export default interface BookMarkItem {

  /**
   *
   * 文档ID
   * @type {string}
   * @memberof BookMarkItem
   */
  docId: string

  /**
   *
   * 标签名称
   * @type {string}
   * @memberof BookMarkItem
   */
  markName: string

  /**
   *
   * 标签位置
   * @type {number}
   * @memberof BookMarkItem
   */
  position: number
}