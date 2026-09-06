# dsh-app-dock — Bandung Circuits 应用坞

DHask Harness（dsh）插件"应用集群"的宿主：给 bandung-circuits 下的一组 dsh 应用（Auctor、Pictor、POMASA Studio…）提供一个统一的入口坞，替代各插件各自抢占 `sidebar.footer.action` 槽位的做法。

## 背景

dsh 的 `sidebar.footer.action` 其实是一个有序的多条目槽（渲染进侧栏底部 flex 行），但实测效果：

- 插件的按钮若自行绝对定位（`position: fixed`），会把其他插件的按钮**盖住**；
- 文字按钮多了以后，250px 宽的侧栏一行**排不下**，末位的按钮被挤出视口。

这就是"应用集群"要解决的排布问题。

## 契约（v0 草案）

所有成员应用无论是否装了本坞，都应可独立使用。检测到坞存在先向坞注册，否则回退直注册自家 footer 槽：

```js
dock.register({
  id: 'dsh-auctor',
  label: 'Auctor',
  icon: '✒',
  order: 30,
  open: false,
  onToggle(open) { /* 打开/关闭该应用的 shell.overlay 面板 */ },
})
```

## 成员（bandung-circuits 组织）

| 应用 | 仓库 | npm |
|---|---|---|
| Auctor | github.com/bandung-circuits/auctor | dsh-auctor |
| Pictor | github.com/bandung-circuits/pictor | dsh-pictor |
| POMASA Studio | github.com/bandung-circuits/pomasa-studio | pomasa-studio |

## 状态

规划中：契约、坞 UI（少则横排图标钮，多则竖列表/宫格弹层）、迁移回退策略待实现。
