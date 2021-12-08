// 回源触发器
import PathUtils from "../util/PathUtils";
import puppeteer from "puppeteer"
const origins = ['https://note.ismy.wang', 'http://noteg.ismy.wang', 'https://notev.ismy.wang']
const urls = ['/', '/#/doc/README', '/#/tag']
const storagePath = 'back_origin_snapshot'

async function screenHost(url: string, name: string, counter: number) {
  const startTime = new Date().getTime();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({height : 3240, width: 1920})
  await page.goto(url, {
    waitUntil: 'networkidle0'
  });
  const path = storagePath + '/' + name + counter + '.png';
  PathUtils.ensureDirectoryExistence(path)
  await page.screenshot({ path});

  await browser.close();
  console.log(`url : ${url} 耗时: ${new Date().getTime() - startTime}ms`)
}

async function main(){
  for(let origin of origins) {
    let counter = 0
    for(let url of urls) {
      try {
        await screenHost(origin + url, origin.replace('http://', '').replace('https://', ''), counter++)
      }catch(err) {
        console.error(err)
      }
    }
  }
  process.exit()
}

main()