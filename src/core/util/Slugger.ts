
// 将标题原文转为合法且稳定的锚点id: 去除md/HTML标记 空白转连字符 保留中文
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/^#+\s*/, '')
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'heading'
}

export default class Slugger {

  private occur: Map<string, number> = new Map()

  public slug(value: string): string  {
    const base = slugify(value)
    const seq = this.occur.get(base) || 0
    this.occur.set(base, seq + 1)
    if (seq === 0) {
      return base
    }
    return base + '-' + seq
  }
}
