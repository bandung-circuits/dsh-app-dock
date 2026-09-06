// dsh-app-dock 离线冒烟：L1 纯逻辑（宿主 _test）+ L2 装配契约。
// 应用坞无 RPC、无数据根：验证重点在注册契约、client bundle 注入了共享全局，
// 以及宿主装载形状。真实交互由 e2e 覆盖。
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { apply, _test } from './lib/index.js'

const ERRORS = []
async function check(name, fn) {
  try { await fn(); console.log('  ✓', name) } catch (e) { ERRORS.push({ name, e }); console.error('  ✗', name, '—', (e && e.stack) || e) }
}

// ---------- L1 纯逻辑 ----------
{
  console.log('L1 · host pure helpers')
  await check('validate 拒绝缺 id', () => {
    const err = _test.validate({ label: 'x', onToggle: () => {} })
    if (!err || !/id/.test(err)) throw new Error('expected id error, got ' + err)
  })
  await check('validate 拒绝缺 onToggle', () => {
    const err = _test.validate({ id: 'x', label: 'x' })
    if (!err || !/onToggle/.test(err)) throw new Error('expected onToggle error')
  })
  await check('validate 通过完整 app', () => {
    if (_test.validate({ id: 'x', label: 'x', onToggle: () => {} }) !== null) throw new Error('should pass')
  })
  await check('sortByOrder 按 order 再按 id', () => {
    const in0 = [{ id: 'b', order: 2 }, { id: 'a', order: 1 }, { id: 'c' }]
    const out = _test.sortByOrder(in0)
    if (out.map((x) => x.id).join(',') !== 'c,a,b') throw new Error(out.map((x) => x.id).join(','))
  })
}

// ---------- L2 装配契约 ----------
{
  console.log('L2 · assembly contract')
  await check('host apply 可装载（空 ctx）', async () => {
    const r = await apply({}, {})
    if (typeof r !== 'object' || r === null) throw new Error('apply 应返回对象')
  })
  await check('lib/client.js 注入共享注册表与组网格装配', () => {
    const body = readFileSync(join(process.cwd(), 'lib', 'client.js'), 'utf8')
    for (const needle of ['window.__dshAppDock__', 'sidebar.footer.action', 'data-dock-app', 'dk-app-btn', 'Bandung Apps', 'data-bandung-lang', 'bandung-lang']) {
      if (!body.includes(needle)) throw new Error('bundle 缺片段: ' + needle)
    }
  })
  await check('打包文件在 files 白名单内存在', () => {
    for (const f of ['lib/index.js', 'cordis.patch.yml']) {
      if (!existsSync(join(process.cwd(), f))) throw new Error('缺 ' + f)
    }
  })
}

if (ERRORS.length) {
  console.error(`\nverify FAILED: ${ERRORS.length} check(s)`)
  process.exit(1)
}
console.log('\nverify OK')