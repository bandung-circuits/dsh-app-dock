// dsh-app-dock — Client half (browser)。
// 应用坞：成员应用以 npm 依赖本插件入伙，包 api 只一行（把自家的面板开关交给
// 坞）；坞在 dsh 左下角 footer 直接排 app 图标，每行两个、多了加行，点一下就
// 打开应用，不引入中间层（不加"坞面板"那一步点击）。超过 8 个 app（4 行）
// 之前不做更复杂的界面逻辑。
// 跨插件通道用 window 全局：所有 dsh 插件 client bundle 注入同一个 web 页面
// （同一 realm），window.__dshAppDock__ 即共享注册表。
const inject = ['slots']
const React = require('react')
const h = React.createElement

// ---------- 注册表（window 共享通道） ----------

function ensureDockGlobal() {
  if (typeof window === 'undefined') return null
  if (window.__dshAppDock__) return window.__dshAppDock__
  const apps = new Map()
  const subs = new Set()
  const notify = () => { for (const f of subs) f() }
  window.__dshAppDock__ = {
    register(app) {
      if (!app || !app.id || !app.label || typeof app.onToggle !== 'function') return false
      apps.set(app.id, {
        id: String(app.id),
        label: String(app.label),
        icon: String(app.icon || '▪'),
        order: Number(app.order || 0),
        onToggle: app.onToggle,
      })
      notify()
      return true
    },
    unregister(id) {
      const ok = apps.delete(id)
      if (ok) notify()
      return ok
    },
    list() {
      return [...apps.values()].sort((a, b) => (a.order - b.order) || (a.id < b.id ? -1 : 1))
    },
    get(id) {
      return apps.get(id) || null
    },
    subscribe(fn) {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
  // 注册表就位后派发 ready 事件：晚于坞加载的应用（如 bundles 顺序倒置）监听它
  // 做延迟注册，先到先得、谁先谁后都能入坞。
  try { setTimeout(() => { window.dispatchEvent(new Event('dsh-app-dock:ready')) }, 0) } catch { /* ignore */ }
  return window.__dshAppDock__
}

// ---------- 装配 ----------

function apply(ctx) {
  if (typeof document !== 'undefined') {
    const styleId = 'dsh-app-dock-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = STYLE
      document.head.appendChild(style)
    }
  }
  const slots = ctx.slots || (ctx.get && ctx.get('slots'))
  if (!slots) return
  const dock = ensureDockGlobal()
  if (!dock) return

  function useApps() {
    const [, force] = React.useState(0)
    React.useEffect(() => dock.subscribe(() => force((n) => n + 1)), [])
    return dock.list()
  }

  // footer 槽位里直接排图标网格：每个图标 = 一个应用，点一下即开/关。
  function DockFooter() {
    const apps = useApps()
    if (!apps.length) return null
    const launch = (app) => {
      try { app.onToggle() } catch (e) { console.warn('[dock] 打开应用失败', app.id, e) }
    }
    return h('div', { className: 'dk-grid' },
      apps.map((app) => h('button', {
        key: app.id,
        className: 'dk-app-icon',
        'data-dock-app': app.id,
        title: app.label,
        onClick: () => launch(app),
      }, h('span', { className: 'dk-app-glyph' }, app.icon || '▪'))))
  }

  slots.inject('sidebar.footer.action', () => slots.register(
    { name: 'sidebar.footer.action', id: 'dsh-app-dock', order: 10, label: 'Application dock' },
    () => h(DockFooter, null),
  ))
}

// ---------- 样式 ----------

const STYLE = `
.dk-grid { display: grid; grid-template-columns: repeat(2, 30px); gap: 5px; padding: 4px 8px; }
.dk-app-icon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--dsw-alias-border-l2, #e8e8e8); border-radius: 8px; background: var(--dsw-alias-button-floating-fill, #f5f5f5); color: var(--dsw-alias-label-primary, #1f2329); cursor: pointer; padding: 0; }
.dk-app-icon:hover { background: var(--dsw-alias-button-floating-hover, #e9e9e9); }
.dk-app-glyph { font-size: 15px; line-height: 1; }
`

// build.mjs 包装需要这两个具名导出
// （注释占位：实际 return 由 build.mjs 的 wrap 追加）