export default class Category {
  name: string = ''
  link: string = ''
  chidren: Category[] = []
  // 父目录（值引用）
  parent?: Category
}