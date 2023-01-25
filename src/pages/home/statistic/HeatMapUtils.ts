import dayjs from 'dayjs'

export default {
  fillTimeRange(data: [string, number][]){
    const map = new Map<string, number>(data);
    const range = [data[0][0], data[data.length - 1][0]];
    const start = +dayjs(range[0]);
    const end = +dayjs(range[1]);
    const dayTime = 3600 * 24 * 1000;
    const results: [string, number][] = [];
    for (let time = start; time < end; time += dayTime) {
      const date = dayjs(time).format("YYYY-MM-DD");
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
    const colorBox = [
      isDark ? "#323233" : "#fff",
      isDark ? "#00452b" : "#98E9A8",
      isDark ? "#006f37" : "#40C403",
      isDark ? "#00a84b" : "#30A14E",
      isDark ? "#007534" : "#216E39",
      isDark ? "#00d65f" : "#1A572D",
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