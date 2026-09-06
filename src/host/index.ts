// dsh-app-dock host：应用坞的宿主侧没有确定性动作——成员发现与渲染全在 client
// （共享 realm 的 window 注册表 + 坞面板）。此文件只保证 cordis 半插件装载契约：
// 装上本插件，client bundle 才会被 dsh web 加载，window.__dshAppDock__ 才存在。
export const name = 'dsh-app-dock'
export const inject: string[] = []

export function apply(_ctx: unknown, _config: unknown = {}) {
  return {}
}

export const _test = {
  // 注册表的两个纯逻辑：排序与去重（L1 可测，实现在 client 的同构函数里）。
  sortByOrder<T extends { id: string; order?: number }>(apps: T[]): T[] {
    return [...apps].sort((a, b) => (a.order || 0) - (b.order || 0) || (a.id < b.id ? -1 : 1))
  },
  validate(app: unknown): string | null {
    if (!app || typeof app !== 'object') return 'app 必须是对象'
    const a = app as Record<string, unknown>
    if (!a.id || typeof a.id !== 'string') return '缺少 id'
    if (!a.label) return '缺少 label'
    if (typeof a.onToggle !== 'function') return '缺少 onToggle'
    return null
  },
}