import SearchService from '../build/SearchService'

main()

async function main(){
  const appId = process.env.ALGOLIA_APPID
  if (!appId) {
    console.error('ALOGLIAD_APPID 为空')
    return;
  }
  const secret = process.env.ALGOLIA_SECRET
  if (!secret) {
    console.error('ALOGLIAD_SECRET 为空')
    return
  }
  const indexData = await SearchService.generateIndex()
  if (indexData.length == 0) {
    console.error('生成的索引数据为空 不进行更新')
    return;
  }
  console.log('准备进行索引更新')
  try {
    await SearchService.totalAmountUpdateIndex(appId, secret,'note', indexData)
    console.log(`索引更新完成 索引数量${indexData.length}`)
  }catch(err:any) {
    console.log('全量更新索引发生异常', err)
  }
}
