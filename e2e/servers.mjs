// L4a e2e：起真 dsh web host（hermetic 临时 DSH_HOME），坞从本 checkout 装载，
// 保持服务直到 Playwright 结束。无不真实 ~/.dsh。
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.DOCK_E2E_PORT || 43125)
const DSH_HOME = mkdtempSync(join(tmpdir(), 'dock-e2e-dsh-'))
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

execFileSync('dsh', ['--profile', 'web', '--help'], { env: { ...process.env, DSH_HOME }, stdio: 'ignore' })
execFileSync('dsh', ['plugin', '--profile', 'web', 'add', ROOT], { env: { ...process.env, DSH_HOME }, stdio: 'ignore' })

const dsh = spawn('dsh', ['--profile', 'web', '--no-open', '--port', String(PORT)], {
  env: { ...process.env, DSH_HOME },
  stdio: ['ignore', 'inherit', 'inherit'],
})

const log = (m) => console.log('[e2e server] ' + m)
async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) { log('web host ready'); return }
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
process.on('exit', () => { try { rmSync(DSH_HOME, { recursive: true, force: true }) } catch { /* ignore */ } })

process.stdin.resume()