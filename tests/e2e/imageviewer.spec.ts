import { test, expect, goto, docWithImage } from './fixtures'

// 图片灯箱(lightbox)：DocPageEventManager.registerImageClick 给正文里每个 .img-wrapper
// 绑定 onclick -> ImageViewer.vue.show(srcList, i)，内部 <el-image-viewer> 弹出全屏遮罩
// 并给 <body> 加上 image-viewer-stop-scroll 锁滚动类；@close 时移除该类并卸载遮罩。
// 真实选择器(已对源码核实)：
//   - 正文图片包裹器: figure.img-wrapper(DocRender.ts 输出，内含 <img>)
//   - element-plus 遮罩根: .el-image-viewer__wrapper(teleport 到 body)
//   - 遮罩点击层: .el-image-viewer__mask(hide-on-click-modal=true，点它关闭)
//   - 关闭按钮: .el-image-viewer__close
//   - body 锁滚动类: image-viewer-stop-scroll(ImageViewer.vue 显式 add/remove)

const d = docWithImage()

test.describe('文档图片灯箱', () => {
  test.skip(!d, '构建产物无含图片的文档')

  test('点击正文图片弹出 el-image-viewer 遮罩并给 body 加锁滚动类', async ({ page }) => {
    await goto(page, d!)
    // 正文异步水合：等稳定标题信号，再等图片包裹器出现(.img-wrapper 由客户端 DocRender 生成)
    await page.waitForSelector('.markdown-section h2')
    const wrapper = page.locator('.markdown-section .img-wrapper').first()
    await wrapper.waitFor({ state: 'visible', timeout: 20000 })

    // 灯箱初始未出现，body 也无锁滚动类
    await expect(page.locator('.el-image-viewer__wrapper')).toHaveCount(0)
    await expect(page.locator('body.image-viewer-stop-scroll')).toHaveCount(0)

    await wrapper.click()

    // el-image-viewer 遮罩(teleport 到 body)出现，且展示了图片
    const overlay = page.locator('.el-image-viewer__wrapper')
    await expect(overlay).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.el-image-viewer__img')).toBeVisible({ timeout: 20000 })
    // body 被加上锁滚动类
    await expect(page.locator('body.image-viewer-stop-scroll')).toHaveCount(1)
  })

  test('按 Escape 关闭灯箱：遮罩卸载且 body 锁滚动类被移除', async ({ page }) => {
    await goto(page, d!)
    await page.waitForSelector('.markdown-section h2')
    const wrapper = page.locator('.markdown-section .img-wrapper').first()
    await wrapper.waitFor({ state: 'visible', timeout: 20000 })

    await wrapper.click()
    await expect(page.locator('.el-image-viewer__wrapper')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('body.image-viewer-stop-scroll')).toHaveCount(1)

    await page.keyboard.press('Escape')

    // 遮罩从 DOM 卸载(v-if=showImageViewer)，body 类被 close() 移除
    await expect(page.locator('.el-image-viewer__wrapper')).toHaveCount(0, { timeout: 20000 })
    await expect(page.locator('body.image-viewer-stop-scroll')).toHaveCount(0)
  })

  test('点击关闭按钮(.el-image-viewer__close)同样关闭灯箱并解锁滚动', async ({ page }) => {
    await goto(page, d!)
    await page.waitForSelector('.markdown-section h2')
    const wrapper = page.locator('.markdown-section .img-wrapper').first()
    await wrapper.waitFor({ state: 'visible', timeout: 20000 })

    await wrapper.click()
    const close = page.locator('.el-image-viewer__close')
    await expect(close).toBeVisible({ timeout: 20000 })

    await close.click()

    await expect(page.locator('.el-image-viewer__wrapper')).toHaveCount(0, { timeout: 20000 })
    await expect(page.locator('body.image-viewer-stop-scroll')).toHaveCount(0)
  })
})
