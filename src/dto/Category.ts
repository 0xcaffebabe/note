export default class Category {
  name: string = ''
  link: string = ''
  chidren: Category[] = []
  // 父目录（值引用）
  parent?: Category

  public static childrenSize(value: Category): number {
    if (value.chidren.length == 0) {
      return 0;
    }
    let size: number = value.chidren.length;
    for (let i of value.chidren) {
      size += this.childrenSize(i);
    }
    return size;
  }
}