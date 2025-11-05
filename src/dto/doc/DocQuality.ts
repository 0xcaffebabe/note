export default class DocQuality {
  id: string = ''
  quality: number = 0
  
  // 新增质量指标
  contentQuality: number = 0      // 内容质量
  linkQuality: number = 0         // 链接质量
  updateActivity: number = 0      // 更新活跃度
  
  get totalQuality(): number {
    return this.quality
  }
}