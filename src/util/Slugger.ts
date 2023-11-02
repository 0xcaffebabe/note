
export default class Slugger {

  private occur: Map<string, number> = new Map()

  public slug(value: string): string  {
    const seq = this.occur.get(value) || 0
    this.occur.set(value, seq + 1)
    if (seq === 0) {
      return value
    }
    return value + '-' + seq
  }
}