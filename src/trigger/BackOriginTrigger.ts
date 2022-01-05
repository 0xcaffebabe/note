// 回源触发器
import PathUtils from "../util/PathUtils";
import puppeteer from "puppeteer"
import DatasourceConst from "../const/DatasourceConst";
import UrlUtils from "../util/UrlUtils";
import UrlConst from "../const/UrlConst";
import axios from 'axios';
import DatasourceItem from "../dto/DatasourceItem";


const origins = ['https://note.ismy.wang', 'https://noteg.ismy.wang', 'https://notev.ismy.wang', 'https://noten.ismy.wang']
const urls = ['/', '/#/doc/README', '/#/tag']
const storagePath = 'back_origin_snapshot'

async function screenHost(url: string, name: string, counter: number) {
  const startTime = new Date().getTime();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  if (url.indexOf('README') != -1) {
    await page.setViewport({ height: 1080, width: 1920 })
  } else {
    await page.setViewport({ height: 3240, width: 1920 })
  }
  await page.goto(url, {
    waitUntil: 'networkidle0'
  });
  const path = storagePath + '/' + name + counter + '.png';
  PathUtils.ensureDirectoryExistence(path);
  if (url.indexOf('README') != -1) {
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
      } catch (err: any) {
        console.error('\x1b[31m',`${origin + url} 页面回源失败 ${err.message}`, '\x1b[0m')
      }
    }
  }
  process.exit()
}

main()