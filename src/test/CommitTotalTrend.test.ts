import GitService from "../build/GitService";
import StatisticService from "../build/StatisticService";


main()

async function main() {
  const st = new Date().getTime()
  const data = await StatisticService.generateCommitTotalTrend()
  console.log(data)
  console.log(`耗时 ${new Date().getTime() - st}`)
  // const resp = await GitService.gitShowUseHash("97c4b45a914e7232b5309695fe9e124366f32e10")
  // console.log("结果", resp)
}
