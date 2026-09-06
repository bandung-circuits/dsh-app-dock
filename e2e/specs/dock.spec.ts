// L4a 确定性 e2e：坞在 footer 排"组标题 + 图标×名称"网格；点击按钮即触发
// onToggle（无中间面板）。应用条目由 page.evaluate 经 window.__dshAppDock__
// 确定性注入。dsh web 空态引导层压住鼠标点击，统一程序化 click。
import { test, expect } from '@playwright/test'

const click = (page, selector) => page.$eval(selector, (el) => el.click())

test('应用坞：Bandung Apps 组标题 + 图标×名称按钮，点击触发 onToggle', async ({ page }) => {
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

  // 组标题在图标上方
  await page.waitForSelector('.dk-group', { timeout: 30_000 })
  const group = await page.textContent('.dk-group')
  expect(group.trim()).toBe('Bandung Apps')

  // 按钮带图标与名称（2 列网格）
  await page.waitForSelector('.dk-app-btn', { timeout: 10_000 })
  const btns = await page.$$('.dk-app-btn')
  expect(btns.length).toBe(2)
  await expect(page.locator('[data-dock-app="app-a"]')).toContainText('App A')
  await expect(page.locator('[data-dock-app="app-b"]')).toContainText('App B')

  // 点击 App B → onToggle 触发
  await click(page, '[data-dock-app="app-b"]')
  const opened = await page.evaluate(() => window.__dockedOpened)
  expect(opened).toEqual(['app-b'])
})