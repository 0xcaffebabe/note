function formatDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

export default {
  fillTimeRange(data: [string, number][]){
    const map = new Map<string, number>(data);
    const range = [data[0][0], data[data.length - 1][0]];
    const start = new Date(range[0]).getTime();
    const end = new Date(range[1]).getTime();
    const dayTime = 3600 * 24 * 1000;
    const results: [string, number][] = [];
    for (let time = start; time < end; time += dayTime) {
      const date = formatDate(time);
      results.push([date, map.get(date) || 0]);
    }
    return results;
  },

  
  /**
   *
   * 封装服务次数区间数据
   * @param {number} maxValue
   * @param {boolean} [isDark=false]
   * @return {*} 
   */
  generatePieces(maxValue: number, isDark: boolean = false) {
    // 由空到密的品牌蓝单色梯度, 替换原 GitHub 绿, 与全站主色统一
    const colorBox = [
      isDark ? "#2a2d2e" : "#eef4fb",
      isDark ? "#16324f" : "#cfe5ff",
      isDark ? "#1d4f82" : "#93c0f7",
      isDark ? "#2f74c0" : "#5b97ee",
      isDark ? "#3f93e6" : "#2f74e0",
      isDark ? "#6bb1f5" : "#1b5bc0",
    ]
    const pieces: any[] = [];
    const quotient = Math.ceil(maxValue / 2);
    let temp:any = {};
    temp.lte = 0;
    temp.gte = 0;
    temp.label = "0";
    temp.color = colorBox[0];
    pieces.push(temp);

    for (let i = 1; i <= 5; i++) {
      temp = {};
      if (i == 1) {
        temp.gte = 1;
      } else {
        temp.gte = quotient * (i - 1);
      }
      temp.lte = quotient * i;
      temp.color = colorBox[i];
      // temp.label = '等级'+i;
      pieces.push(temp);
    }

    return pieces;
  },


}