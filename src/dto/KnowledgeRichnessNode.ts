
export default class KnowledgeRichnessNode {
  name: string = ''
  link: string = ''
  size: number = 0
  chidren: KnowledgeRichnessNode[] = []

  public static childrenSize(value: KnowledgeRichnessNode): number {
    if (value.chidren.length == 0) {
      return value.size;
    }
    let size0: number = value.size;
    for (const i of value.chidren) {
      size0 += this.childrenSize(i);
    }
    return size0;
  }
}