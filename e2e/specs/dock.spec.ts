// L4a 确定性 e2e：真 dsh web 里坞在 footer 直接排应用图标网格（每行两个），
// 点击图标即触发 onToggle（无中间面板）。应用条目由 page.evaluate 经
// window.__dshAppDock__ 确定性注入。dsh web 空态引导层压住鼠标点击，统一
// 程序化 click。
import { test, expect } from '@playwright/test'

const click = (page, selector) => page.$eval(selector, (el) => el.click())

test('应用坞：footer 直接排图标网格，点击图标触发 onToggle', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')

  // 注入两个确定性应用并记录点击
  await page.evaluate(() => {
    const dock = window.__dshAppDock__
    if (!dock) throw new Error('window.__dshAppDock__ 未就绪')
    window.__dockedOpened = []
    dock.register({ id: 'app-a', label: 'App A', icon: 'A', order: 1, onToggle: () => window.__dockedOpened.push('app-a') })
    dock.register({ id: 'app-b', label: 'App B', icon: 'B', order: 2, onToggle: () => window.__dockedOpened.push('app-b') })
  })

  // 图标直接出现在 footer（无中间面板）
  await page.waitForSelector('[data-dock-app="app-a"]', { timeout: 30_000 })
  await page.waitForSelector('[data-dock-app="app-b"]', { timeout: 10_000 })
  const icons = await page.$$('.dk-app-icon')
  expect(icons.length).toBe(2)

  // 点击 App B → onToggle 触发
  await click(page, '[data-dock-app="app-b"]')
  const opened = await page.evaluate(() => window.__dockedOpened)
  expect(opened).toEqual(['app-b'])
})