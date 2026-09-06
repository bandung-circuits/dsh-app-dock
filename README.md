# dsh-app-dock — Bandung Circuits 应用坞

DeepSeek Harness（dsh）插件"应用集群"的宿主。给 bandung-circuits 下的 dsh 应用（Auctor、Pictor、POMASA Studio…）一个统一的坞入口，替代各插件各自抢占 `sidebar.footer.action` 槽位的做法。

## 为什么有它

dsh 的 `sidebar.footer.action` 槽位本身支持多个条目（渲染进侧栏底部 flex 行），但两个现实问题让它不可靠：

1. 插件若自我绝对定位（`position: fixed`），会把别的按钮盖住；
2. 文字按钮一多，250px 宽的侧栏排不下，末位的被挤出视口。

应用坞把"一个应用一个 footer 槽位"收敛成"一个坞入口 + 一个面板"。

## 安装

```bash
dsh plugin --profile <profile> add dsh-app-dock
```

## 应用如何入坞（依赖即入伙）

成员应用**以 npm 依赖本插件**表达入伙；自己的代码只需一行：在 client 的 `apply` 里把面板开关交给坞。

```js
// dsh-app-dock 与所有 dsh 插件 client bundle 注入同一个 web 页面（同一 realm），
// window.__dshAppDock__ 是共享注册表。坞先于依赖它的应用装载，apply 时必已存在。
const dock = typeof window !== 'undefined' ? window.__dshAppDock__ : null
if (dock) {
  dock.register({
    id: 'dsh-auctor',   // 唯一 id
    label: 'Auctor',    // 显示名
    icon: '✒',          // 图标，别与其它应用撞
    order: 30,          // 排序权重（越小越靠前）
    onToggle: () => panel.toggle(),   // 打开/关闭该应用的 shell.overlay 面板
  })
}
```

- `register(app)` 返回布尔；同 id 重复注册以最后一次为准。
- `unregister(id)`、`list()`（按 order 排序）、`get(id)`、`subscribe(fn)` 可查可用。
- 应用**不再自己注册 `sidebar.footer.action`**；没装坞就没有入口（依赖坞即保证它会装上）。

## 开发与验证

参考同门插件（pictor/auctor）的四层冒烟约定：

```bash
npm run build              # esbuild host + client bundle
npm run verify             # L1 注册契约纯逻辑 + L2 装配契约
npm run verify:integration # 真 dsh web，client bundle 装载 + 注册表注入
npm run test:pack          # tarball 完整性
npm run test:install       # README 安装路径（dsh plugin add）→ 启动
npm run test:e2e           # 真 dsh web + 浏览器：按钮→面板→点击触发
```

## 仓库

- 源码：github.com/bandung-circuits/dsh-app-dock
- npm：`dsh-app-dock`

## License

MIT。