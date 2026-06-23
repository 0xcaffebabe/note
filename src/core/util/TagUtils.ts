import { hashCode } from './StringUtils'

const types = ["primary", "info", "warning", "success", "danger"];
const colors = ["#409EFF", "#909399", "#E6A23C", "#67C23A", "#F56C6C"]

function calcTagType(tag: string): string{
  const index = Math.abs(hashCode(tag) % 5);
  return types[index];
}

function calcTagColor(tag: string): string {
  return colors[Math.abs(hashCode(tag) % 5)];
}

export default {calcTagType, calcTagColor}
