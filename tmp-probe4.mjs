// 探针：auctor 关键元素的真实计算样式（背景/边框/文字），找出"黑框"成因。
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'

const PORT = 43135
const DSH = mkdtempSync(join(tmpdir(), 'probe4-dsh-'))
const AUC = mkdtempSync(join(tmpdir(), 'probe4-aux-'))
const BASE = '/Users/gigix/Projects/03.systems'
execFileSync('dsh', ['plugin', '--profile', 'web', 'add', join(BASE, 'dsh-app-dock')], { env: { ...process.env, DSH_HOME: DSH }, stdio: 'ignore' })
execFileSync('dsh', ['plugin', '--profile', 'web', 'add', join(BASE, 'auctor')], { env: { ...process.env, DSH_HOME: DSH, AUCTOR_HOME: AUC }, stdio: 'ignore' })
// 预置一个 fixture 项目（含研究角度 + 摘要）让界面有得渲染
;(() => {
  const id = '2026-09-05-001'
  const root = join(AUC, id)
  mkdirSync(join(root, '01.research', 'A-event-overview'), { recursive: true })
  mkdirSync(join(root, '02.summary'), { recursive: true })
  writeFileSync(join(root, '01.research', 'A-event-overview', 'excerpts.md'), '# Event Overview — Relevant Excerpts\n\n## [M-A-001] Fidel centennial\n\n**Source**: SRC-A-001\n\n> Excerpt.\n')
  writeFileSync(join(root, '01.research', 'index.json'), JSON.stringify([{ id: 'A-event-overview', title: 'Event Overview', file: 'A-event-overview/excerpts.md' }]))
  writeFileSync(join(root, '02.summary', 'initial-summary.md'), '# Initial Event Summary\n\n## News Lead\n\nCuba holiday.\n\n## Contradictions\n\n### Principal\n\nMemory vs material.\n')
  mkdirSync(join(root, 'input'), { recursive: true })
  writeFileSync(join(root, 'input', 'news-lead.md'), 'Cuba holds centennial')
  writeFileSync(join(AUC, 'index.json'), JSON.stringify({ projects: [{ id, title: 'Fidel centennial commentary', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] }, null, 2))
})()
const web = spawn('dsh', ['--profile', 'web', '--no-open', '--port', String(PORT)], { env: { ...process.env, DSH_HOME: DSH, AUCTOR_HOME: AUC }, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 1500))
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`)
await page.waitForSelector('.dk-app-btn', { timeout: 60000 }).catch(() => {})
await page.$eval('[data-dock-app="dsh-auctor"]', (el) => el.click())
await page.waitForSelector('.au-workbench', { timeout: 30000 })
await page.waitForSelector('.au-nav-item', { timeout: 30000 })
await page.$eval('.au-nav-item', (el) => el.click())
await page.waitForSelector('.au-stages', { timeout: 30000 })
await page.$eval('.au-stage:has-text("快速研究")', (el) => el.click())
await page.waitForSelector('.au-angle-card', { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(600)
const out = await page.evaluate(() => {
  const specs = {
    page: { key: '--dsw-alias-bg-base', v: getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-bg-base').trim() },
    dark: { key: 'dark?', v: getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-bg-layer-2').trim() },
  }
  const pick = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const cs = getComputedStyle(el)
    return { sel, bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, color: cs.color, radius: cs.borderRadius, font: cs.fontSize + '/' + cs.fontWeight }
  }
  return {
    shell: {
      rootBg: getComputedStyle(document.documentElement).backgroundColor,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      sysDark: matchMedia('(prefers-color-scheme: dark)').matches,
      hasDarkAttr: !!document.documentElement.getAttribute('data-ds-dark-theme'),
    },
    els: ['.au-btn.primary', '.au-btn.ghost', '.au-input', '.au-angle-card', '.au-plan', '.au-toc', '.au-pane-title', '.au-md'].map(pick),
  }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
web.kill()
rmSync(DSH, { recursive: true, force: true })
rmSync(AUC, { recursive: true, force: true })
process.exit(0)