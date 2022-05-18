export default class DocQuality {
  id: string = ''
  quality: number = 0
  segementQuality: number[] = []
  get totalQuality(): number {
    return this.quality + this.segementQuality.reduce((a, b) => a+b, 0)
  }
}