// dsh-app-dock — Client half (browser)。
// 应用坞：成员应用以 npm 依赖本插件入伙，包 api 只一行（把自家的面板开关交给
// 坞）；坞在 dsh 底部给一个统一入口和一个面板，替代各家各自抢占
// sidebar.footer.action 槽位（那是按钮打架的根源）。
// 跨插件通道用 window 全局：所有 dsh 插件 client bundle 都注入同一个 web 页面
// （同一 realm），window.__dshAppDock__ 即共享注册表。此文件不含对其它插件的
// import，应用一侧也无需 import 本包，只管往全局注册一次。
const inject = ['slots', 'connection']
const React = require('react')
const h = React.createElement

const DOCK_KEY = 'dsh-app-dock'
const GLYPH = '▦'

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

// ---------- I18N ----------

const I18N = {
  zh: {
    dockName: '应用坞',
    dockHint: '成员应用以依赖本坞自动入伙；点下面的应用打开它。',
    emptyTitle: '还没有应用入伙',
    emptyHint: '安装并依赖 dsh-app-dock 的应用会出现在这里。',
    open: '打开应用坞', close: '收起应用坞',
    launch: '打开',
  },
  en: {
    dockName: 'Apps',
    dockHint: 'Apps that depend on this dock appear below; click to open.',
    emptyTitle: 'No apps yet',
    emptyHint: 'apps that install and depend on dsh-app-dock will land here.',
    open: 'Open app dock', close: 'Close app dock',
    launch: 'Open',
  },
}
let savedLang = 'zh'
try { savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('dock-lang') : null } catch { /* ignore */ }
const langStore = {
  val: savedLang === 'en' ? 'en' : 'zh',
  subs: new Set(),
  emit() { for (const f of this.subs) f() },
  set(v) { this.val = v === 'en' ? 'en' : 'zh'; try { localStorage.setItem('dock-lang', this.val) } catch { /* ignore */ } this.emit() },
  subscribe(f) { this.subs.add(f); return () => { this.subs.delete(f) } },
}
function t(key, vars) {
  let text = (I18N[langStore.val] && I18N[langStore.val][key]) || I18N.zh[key] || key
  if (vars) { for (const k of Object.keys(vars)) text = text.replace('{' + k + '}', String(vars[k])) }
  return text
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

  const panel = { open: false, subs: new Set() }
  panel.emit = () => { for (const fn of panel.subs) fn() }
  panel.toggle = () => { panel.open = !panel.open; panel.emit() }
  panel.close = () => { if (panel.open) { panel.open = false; panel.emit() } }
  panel.subscribe = (fn) => { panel.subs.add(fn); return () => { panel.subs.delete(fn) } }
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', (e) => {
      if (!panel.open) return
      const target = e.target
      if (target && typeof target.closest === 'function' && (target.closest('.dk-panel') || target.closest('.dk-footer-action'))) return
      panel.close()
    })
  }

  function usePanelOpen() {
    if (typeof React.useSyncExternalStore === 'function') return React.useSyncExternalStore(panel.subscribe.bind(panel), () => panel.open)
    const [v, setV] = React.useState(panel.open)
    React.useEffect(() => panel.subscribe(() => setV(panel.open)), [])
    return v
  }

  function useApps() {
    const [, force] = React.useState(0)
    React.useEffect(() => dock.subscribe(() => force((n) => n + 1)), [])
    return dock.list()
  }

  function DockButton() {
    const open = usePanelOpen()
    return h('div', {
      className: 'dk-footer-action' + (open ? ' on' : ''),
      role: 'button',
      tabIndex: 0,
      onClick: () => panel.toggle(),
      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panel.toggle() } },
      title: open ? t('close') : t('open'),
      'aria-expanded': open ? 'true' : 'false',
    }, h('span', { className: 'dk-glyph' }, GLYPH), t('dockName'))
  }

  function DockPanel() {
    const open = usePanelOpen()
    const apps = useApps()
    if (!open) return null
    const launch = (app) => {
      try { app.onToggle() } catch (e) { console.warn('[dock] 打开应用失败', app.id, e) }
      panel.close()
    }
    return h('div', { className: 'dk-overlay', onClick: () => panel.close() },
      h('div', { className: 'dk-panel', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'dk-panel-head' },
          h('span', { className: 'dk-panel-glyph' }, GLYPH), h('span', { className: 'dk-panel-title' }, t('dockName'))),
        h('p', { className: 'dk-panel-hint' }, t('dockHint')),
        apps.length === 0
          ? h('div', { className: 'dk-empty' }, h('p', { className: 'dk-empty-title' }, t('emptyTitle')), h('p', { className: 'dk-empty-hint' }, t('emptyHint')))
          : h('div', { className: 'dk-app-list' },
            apps.map((app) => h('button', { key: app.id, className: 'dk-app', onClick: () => launch(app) },
              h('span', { className: 'dk-app-icon' }, app.icon || '▪'),
              h('span', { className: 'dk-app-label' }, app.label),
              h('span', { className: 'dk-app-launch' }, t('launch')))))))
  }

  slots.inject('sidebar.footer.action', () => slots.register(
    { name: 'sidebar.footer.action', id: DOCK_KEY, order: 10, label: t('dockName') },
    () => h(DockButton, null),
  ))
  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: DOCK_KEY, order: 5, label: t('dockName') },
    () => h(DockPanel, null),
  ))
}

// ---------- 样式 ----------

const STYLE = `
.dk-root * { box-sizing: border-box }
.dk-footer-action { cursor: pointer; padding: 7px 12px; font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary, #1f2329); display: inline-flex; align-items: center; justify-content: center; gap: 7px; transition: background 150ms, color 150ms; border-radius: 8px; margin: 2px 8px; white-space: nowrap; background: var(--dsw-alias-button-floating-fill, #f5f5f5); }
.dk-footer-action:hover { background: var(--dsw-alias-button-floating-hover, #e9e9e9); }
.dk-footer-action.on { background: var(--dsw-alias-state-business-primary, #4176e6); color: var(--dsw-alias-brand-primary-invert, #fff); }
.dk-glyph { color: var(--dsw-alias-label-secondary, #555); font-size: 13px; line-height: 1; }
.dk-footer-action.on .dk-glyph { color: inherit; }

.dk-overlay { position: fixed; inset: 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 8vh; }
.dk-panel { width: min(460px, calc(100vw - 48px)); background: var(--dsw-alias-bg-overlay, #ffffff); border: 1px solid var(--dsw-alias-border-l2, #e8e8e8); border-radius: 16px; padding: 18px 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); }
.dk-panel-head { display: flex; align-items: center; gap: 8px; }
.dk-panel-glyph { font-size: 16px; }
.dk-panel-title { font-size: 18px; font-weight: 680; }
.dk-panel-hint { color: var(--dsw-alias-label-secondary, #666); font-size: 13px; margin: 6px 0 14px; }
.dk-app-list { display: flex; flex-direction: column; gap: 8px; }
.dk-app { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1, #f0f0f0); border-radius: 12px; background: var(--dsw-alias-bg-base, #fff); cursor: pointer; text-align: left; }
.dk-app:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.04)); }
.dk-app-icon { font-size: 16px; width: 24px; text-align: center; }
.dk-app-label { font-weight: 600; font-size: 15px; flex: 1; }
.dk-app-launch { color: var(--dsw-alias-label-caption, #999); font-size: 12.5px; }
.dk-empty { text-align: center; padding: 24px 8px; }
.dk-empty-title { font-weight: 650; }
.dk-empty-hint { color: var(--dsw-alias-label-secondary, #666); font-size: 13px; margin-top: 4px; }
`

// build.mjs 包装需要这两个具名导出
// （注释占位：实际 return 由 build.mjs 的 wrap 追加）