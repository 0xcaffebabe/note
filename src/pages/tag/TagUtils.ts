function hashCode(str: string) {
  let hash = 0,
    i,
    chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const types = ["", "info", "warning", "success", "danger"];
const colors = ["#409EFF", "#909399", "#E6A23C", "#67C23A", "#F56C6C"]

function calcTagType(tag: string): string{
  const index = hashCode(tag) % 5;
  return types[index];
}

function calcTagColor(tag: string): string {
  return colors[hashCode(tag) % 5];
}

export default {calcTagType, calcTagColor}
