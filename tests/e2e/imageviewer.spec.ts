import { test, expect, goto, docWithImage } from './fixtures'

const documentWithImage = docWithImage()

test('正文图片可打开、用 Escape 关闭、重新打开并用关闭按钮退出', async ({ page }) => {
  test.skip(!documentWithImage, '构建产物无含图片的文档')
  await goto(page, documentWithImage!)
  const image = page.locator('.markdown-section .img-wrapper').first()
  const viewer = page.locator('.el-image-viewer__wrapper')
  const background = page.locator('body')

  await image.click()
  await expect(viewer).toBeVisible()
  await expect(viewer.locator('.el-image-viewer__img')).toBeVisible({ timeout: 20_000 })
  await expect(background).toHaveCSS('overflow-y', 'hidden')

  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
  await expect(background).not.toHaveCSS('overflow-y', 'hidden')

  await image.click()
  await expect(viewer).toBeVisible()
  await viewer.locator('.el-image-viewer__close').click()
  await expect(viewer).toBeHidden()
  await expect(background).not.toHaveCSS('overflow-y', 'hidden')
})
