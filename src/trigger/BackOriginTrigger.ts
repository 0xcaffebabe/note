// 回源触发器
import PathUtils from "../util/PathUtils";
import puppeteer from "puppeteer"
import DatasourceConst from "../const/DatasourceConst";
import UrlUtils from "../util/UrlUtils";
import UrlConst from "../const/UrlConst";
import axios from 'axios';

const origins = ['https://note.ismy.wang', 'https://notev.ismy.wang', 'https://notec.ismy.wang', 'https://b.ismy.wang']
const urls = ['/#/home', '/#/doc/README', '/#/tag']
const storagePath = 'back_origin_snapshot'

const tabletUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36 Edg/101.0.1210.47'
const phoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/101.0.4951.64'

async function screenHost(url: string, name: string, counter: number, ua: 'tablet' | 'phone' = 'tablet') {
  const startTime = new Date().getTime();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  if (ua == 'tablet') {
    page.setUserAgent(tabletUa)
  }else {
    page.setUserAgent(phoneUa)
  }
  let width = ua == 'tablet' ? 1920: 390
  let height = ua == 'tablet' ? 1080: 844
  await page.setViewport({ height, width })
  await page.goto(url, {
    waitUntil: 'networkidle0'
  });
  const path = storagePath + '/' + name +"-" + ua +"-" + counter + '.png';
  PathUtils.ensureDirectoryExistence(path);
  if (url.indexOf('README') != -1 && ua == 'tablet') {
    page.keyboard.press('Alt');
    page.keyboard.press('k');
    page.keyboard.up('Alt');
    page.keyboard.up('k');
    // 触发显式知识网络渲染
    await page.waitForSelector('.el-drawer__body')
    await page.screenshot({ path: storagePath + '/' + name + '-with-knoledge-network-' + counter + '.png' });
    // 触发隐式知识网络渲染
    await page.click('.el-drawer__body .el-switch__core')
    await page.waitForNetworkIdle({ idleTime: 5000 })
    await page.screenshot({ path: storagePath + '/' + name + '-with-potential-knoledge-network-' + counter + '.png' });
  } else {
    await page.screenshot({ path });
  }

  await browser.close();
  console.log(`页面回源  ${url} 耗时: ${new Date().getTime() - startTime}ms`)
}

async function requestUrl(url: string) {
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }
  const st = new Date().getTime()
  try {
    const resp = await axios.get(url)
    if (resp.status == 200) {
      console.log(`${url} 接口回源触发成功 耗时${new Date().getTime() - st}ms`)
    } else {
      console.log(`${url} 接口回源触发失败 ${resp.status} 耗时${new Date().getTime() - st}ms`)
    }
  }catch(err :any) {
    console.error('\x1b[31m',`${url} 接口回源触发失败 ${err.message} 耗时${new Date().getTime() - st}ms`, '\x1b[0m')
  }
}

async function main() {
  // 接口回源触发
  for (let datasource of DatasourceConst) {
    if (datasource.id == 'local') {
      continue;
    }
    Object.getOwnPropertyNames(UrlConst).forEach(async key => {
      await requestUrl(UrlUtils.concatUrl(datasource.url, (UrlConst as any)[key as any]))
    })
  }
  // 页面回源触发
  for (let origin of origins) {
    let counter = 0
    for (let url of urls) {
      try {
        await screenHost(origin + url, origin.replace('http://', '').replace('https://', ''), counter++)
        await screenHost(origin + url, origin.replace('http://', '').replace('https://', ''), counter++, 'phone')
      } catch (err: any) {
        console.error('\x1b[31m',`${origin + url} 页面回源失败 ${err.message}`, '\x1b[0m')
      }
    }
  }
  process.exit()
}

main()