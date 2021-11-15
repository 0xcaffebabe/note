

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
  if (data.length <= n) {
    return data;
  }
  const result: Array<T> = []
  for(let i = 0;i<n;i++){
    result.push(data[i]);
  }
  return result;
}

function last<T>(data: Array<T>): T | null{
  if (!data) {
    return null;
  }
  return data[data.length - 1];
}

export default {topN, last}