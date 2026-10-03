// L4a e2e：起真 dsh web host（hermetic 临时 DSH_HOME），坞从本 checkout 装载，
// 保持服务直到 Playwright 结束。无不真实 ~/.dsh。
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'


// 0.2.x 的兼容门会参考 registry 上"已发布"的插件元数据；本地 checkout 往往
// 已放宽 peers 但新版本尚未发布（如 dock@0.1.4 vs 本地 0.1.5）。add 被拒时
// 对该精确版本授 allow-version 再重试 —— 本地代码即真相，发布后走不进此分支。
function addPluginWithCompatRetry(env, spec, published) {
  const base = ['plugin', '--profile', 'web']
  const opts = { env, stdio: 'ignore' }
  const allowAll = () => {
    for (const p of published) {
      try { execFileSync('dsh', [...base, 'allow-version', p, '--dsh-version', process.env.DSH_VERSION, '--accept-risk'], opts) } catch { /* 忽略 */ }
    }
  }
  try {
    execFileSync('dsh', [...base, 'add', spec], opts)
    return
  } catch { /* 落入豁免重试 */ }
  for (let round = 0; round < 3; round += 1) {
    allowAll()
    try {
      execFileSync('dsh', [...base, 'add', spec], opts)
      return
    } catch { /* 再来一轮 */ }
  }
  // 最后一次把错误暴露出来
  execFileSync('dsh', [...base, 'add', spec], { env, stdio: 'inherit' })
}const PORT = Number(process.env.DOCK_E2E_PORT || 43125)
const DSH_HOME = mkdtempSync(join(tmpdir(), 'dock-e2e-dsh-'))
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

execFileSync('dsh', ['--profile', 'web', '--help'], { env: { ...process.env, DSH_HOME }, stdio: 'ignore' })
addPluginWithCompatRetry({ ...process.env, DSH_HOME }, ROOT, ['dsh-app-dock@0.1.4','dsh-app-dock@0.1.3','dsh-app-dock@0.1.2'])

// 0.2.x 起 web host 强制 token 鉴权：捕获带 token 的入口 URL 写盘，供 e2e/auth.ts 用。
const URL_FILE = join(ROOT, 'e2e', '.dsh-e2e-url')
let dshOut = ''
const dsh = spawn('dsh', ['--profile', 'web', '--no-open', '--port', String(PORT)], {
  env: { ...process.env, DSH_HOME },
  stdio: ['ignore', 'pipe', 'inherit'],
})
dsh.stdout.on('data', (chunk) => {
  dshOut += chunk
  process.stdout.write(chunk)
  const m = dshOut.match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9_-]+/)
  if (m) { try { writeFileSync(URL_FILE, m[0]) } catch { /* ignore */ } }
})

const log = (m) => console.log('[e2e server] ' + m)
async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(2000) })
      if (res.status < 500) { log('web host ready (status ' + res.status + ')'); return }
    } catch { /* 继续等 */ }
    await new Promise((r) => setTimeout(r, 1000))
  }
  log('FAIL: web host did not come up')
  dsh.kill()
  process.exit(1)
}
ready()

dsh.on('exit', (code) => { log('dsh exited ' + code); process.exit(code || 0) })
process.on('SIGTERM', () => dsh.kill())
process.on('SIGINT', () => dsh.kill())
process.on('exit', () => { try { rmSync(DSH_HOME, { recursive: true, force: true }) } catch { /* ignore */ } ; try { rmSync(URL_FILE, { force: true }) } catch { /* ignore */ } })

process.stdin.resume()