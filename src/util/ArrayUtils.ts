

/**
 *
 * 取数组的最多前N个
 * @param {[]} data
 * @param {number} n
 * @return {*}  {[]}
 */
function topN<T>(data: Array<T>, n: number): Array<T> {
  if (!data) {
    return data;
  }
  // 始终返回新数组(slice), 避免 n>=length 时回吐原数组引用、被调用方就地改动污染源数组;
  // 负数 n 钳为 0(否则 slice 的负索引会从尾部反向截取)
  return data.slice(0, Math.max(0, n));
}

function last<T>(data: Array<T>): T | undefined {
  if (!data || data.length === 0) {
    return undefined;
  }
  return data[data.length - 1];
}

export default {topN, last}