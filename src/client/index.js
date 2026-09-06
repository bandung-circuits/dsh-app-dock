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
  // 语言：所有 Bandung apps 共享的全局设置（key: bandung-lang）。
  let langVal = (() => { try { return localStorage.getItem('bandung-lang') === 'en' ? 'en' : 'zh' } catch { return 'zh' } })()
  const langSubs = new Set()
  ;(window.__dshAppDock__).lang = {
    get() { return langVal },
    set(v) { langVal = v === 'en' ? 'en' : 'zh'; try { localStorage.setItem('bandung-lang', langVal) } catch { /* ignore */ } for (const f of langSubs) f() },
    subscribe(fn) { langSubs.add(fn); return () => langSubs.delete(fn) },
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

  // footer 槽位里排"组标题 + 图标×名称"网格：按钮带图标和名字，一眼知道每个
  // app 是干嘛的；每行两个、多了加行，点一下即开/关。
  function useDockLang() {
    const [, force] = React.useState(0)
    React.useEffect(() => dock.lang.subscribe(() => force((n) => n + 1)), [])
    return dock.lang.get()
  }

  function DockFooter() {
    const apps = useApps()
    const lang = useDockLang()
    const launch = (app) => {
      try { app.onToggle() } catch (e) { console.warn('[dock] 打开应用失败', app.id, e) }
    }
    const langOpt = (code, label) => h('button', {
      className: 'dk-lang-opt' + (lang === code ? ' on' : ''),
      'data-bandung-lang': code,
      onClick: () => dock.lang.set(code),
    }, label)
    return h('div', { className: 'dk-block' },
      h('div', { className: 'dk-group' }, 'Bandung Apps'),
      h('div', { className: 'dk-grid' },
        apps && apps.length ? apps.map((app) => h('button', {
          key: app.id,
          className: 'dk-app-btn',
          'data-dock-app': app.id,
          title: app.label,
          onClick: () => launch(app),
        }, h('span', { className: 'dk-app-glyph' }, app.icon || '▪'), h('span', { className: 'dk-app-name' }, app.label))) : null),
      h('div', { className: 'dk-lang' },
        h('span', { className: 'dk-lang-label' }, lang === 'en' ? 'Language' : '语言'),
        h('div', { className: 'dk-lang-opts' }, langOpt('zh', '中文'), langOpt('en', 'English'))))
  }

  slots.inject('sidebar.footer.action', () => slots.register(
    { name: 'sidebar.footer.action', id: 'dsh-app-dock', order: 10, label: 'Application dock' },
    () => h(DockFooter, null),
  ))
}

// ---------- 样式 ----------

const STYLE = `
.dk-block { padding: 4px 8px; }
.dk-group { font-size: 10.5px; font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-caption, #999); padding: 1px 2px 5px; white-space: nowrap; }
.dk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }
.dk-app-btn { display: inline-flex; align-items: center; gap: 5px; min-width: 0; padding: 5px 9px; border: 1px solid var(--dsw-alias-border-l2, #e8e8e8); border-radius: 8px; background: var(--dsw-alias-button-floating-fill, #f5f5f5); color: var(--dsw-alias-label-primary, #1f2329); cursor: pointer; white-space: nowrap; overflow: hidden; }
.dk-app-btn:hover { background: var(--dsw-alias-button-floating-hover, #e9e9e9); }
.dk-app-glyph { font-size: 13px; line-height: 1; flex: none; }
.dk-app-name { font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.dk-lang { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.dk-lang-label { font-size: 12px; color: var(--dsw-alias-label-caption, #999); }
.dk-lang-opts { display: flex; gap: 2px; }
.dk-lang-opt { border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-caption, #999); border-radius: 6px; padding: 2px 8px; font-size: 12px; cursor: pointer; transition: background 140ms ease, color 140ms ease; }
.dk-lang-opt:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05)); color: var(--dsw-alias-label-primary, #1f2329); }
.dk-lang-opt.on { background: var(--dsw-alias-bg-layer-2, #f2f2f2); border-color: var(--dsw-alias-border-l2, #e8e8e8); color: var(--dsw-alias-label-primary, #1f2329); font-weight: 550; }
`

// build.mjs 包装需要这两个具名导出
// （注释占位：实际 return 由 build.mjs 的 wrap 追加）