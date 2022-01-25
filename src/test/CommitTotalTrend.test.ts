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
  // const data = await GitService.gitShowUseHash("1fdb2124651cb796a587fd8fc3f238f96e29cb6c")
  // console.log(data)
  // data.forEach((v,k) => {
  //   console.log(`${k}: ${v[0].insertions.length} ${v[0].deletions.length}`)
  //   if (v[0].deletions.length > 1000) {
  //     // console.log(v[0].deletions.join("\n"))
  //   }
  // })
}
