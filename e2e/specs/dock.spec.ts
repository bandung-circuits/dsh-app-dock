// L4a 确定性 e2e：真 dsh web 里坞按钮出现 → 面板列出自注册应用 → 点击触发 onToggle。
// 应用条目由 page.evaluate 经 window.__dshAppDock__ 确定性注入，不依赖真实 app。
// dsh web 空态引导层会压住鼠标点击，统一用程序化 click 绕开。
import { test, expect } from '@playwright/test'

const click = (page, selector) => page.$eval(selector, (el) => el.click())

test('应用坞：footer 按钮 → 面板列应用 → 点击触发 onToggle', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.waitForSelector('.dk-footer-action', { timeout: 60_000 })

  // 注入两个确定性应用条目并记录点击
  await page.evaluate(() => {
    const dock = window.__dshAppDock__
    if (!dock) throw new Error('window.__dshAppDock__ 未就绪')
    window.__dockedOpened = []
    dock.register({ id: 'app-a', label: 'App A', icon: 'A', order: 1, onToggle: () => window.__dockedOpened.push('app-a') })
    dock.register({ id: 'app-b', label: 'App B', icon: 'B', order: 2, onToggle: () => window.__dockedOpened.push('app-b') })
  })

  // 打开坞
  await click(page, '.dk-footer-action')
  await page.waitForSelector('.dk-panel', { timeout: 20_000 })

  // 面板列两个应用
  const labels = await page.$$eval('.dk-app-label', (els) => els.map((e) => e.textContent))
  expect(labels.some((l) => l && l.includes('App A'))).toBe(true)
  expect(labels.some((l) => l && l.includes('App B'))).toBe(true)

  // 点击 App B → onToggle 被调用，坞收起
  await click(page, '.dk-app:has-text("App B")')
  await expect(page.locator('.dk-panel')).toHaveCount(0, { timeout: 10_000 })
  const opened = await page.evaluate(() => window.__dockedOpened)
  expect(opened).toEqual(['app-b'])
})