# Bandung 应用集群 设计语言（dsh-app-dock）

> 本文件是 bandung 应用集群（Auctor / Pictor / POMASA Studio / 应用坞…）的界面设计语言档案。**边改边记**：任何形态调整落地后，往文末「变更记录」追加一条。新增成员应用按本文档实现外观，不再各写各的数字。

## 1. 原则

1. **低成本优先**：交互保持极简，不引入中间层（坞无"打开坞面板"一步）、不增加切换点击成本。复杂度只在被需要时生长（应用超过 8 个、4 行时才考虑更复杂的坞界面）。
2. **dsh 生态对齐**：颜色一律用 dsh 主题 token `--dsw-alias-*`（带 fallback），明暗主题自动跟随；正文级字体优先 dsh `--dsw-font-*` 阶梯。
3. **dsh 不给、我们自定**：dsh 的 token 只覆盖颜色与字体阶梯，**间距、圆角、尺寸没有先例**，由本集群自定（见 §3-§5），并在所有仓库保持一致。
4. **归属清晰**：app 的按钮、名称、语言都由 app 自注册/自读；坞只提供壳与排布（见 README 契约）。语言是全局的（`bandung-lang`），应用不自带开关。
5. **克制**：不堆视觉。发丝线、微妙投影、低调选中态即可，不加动画花活。

## 2. 坞布局（dsh 左下角 footer 的 Bandung Apps 区块）

```
BANDUNG APPS                       ← 组标题：小号大写、caption 色
[◈ Pictor]  [✒ Auctor]            ← 应用按钮网格：每行两个、多了加行
[◫ POMASA]
────────── 发丝线 ─────────         ← 与设置区分隔
语言      中文 | English           ← 全局语言开关
```

- 组标题 `Bandung Apps`：`10.5px` / 650 / `uppercase` / 字距 `.06em` / `--dsw-alias-label-caption`，下边距 7px。
- 应用按钮网格：`grid` 2 列 `minmax(0,1fr)`，行间距 `7px`。
  - 按钮：图标（14px）+ 名称（13px/600），内边距 `7px 12px`，圆角 `9px`，白底描边（`--dsw-alias-button-floating-fill` + `border-l2`），hover 用 `--dsw-alias-button-floating-hover`。
  - 这是**入口按钮**，不是主按钮；主按钮（执行动作）见 §6。
- 语言区：与按钮区隔 `12px` 上边距，发丝线（`border-l1`）分隔，内边 `9px` 上。标签 12px caption，与开关间距 `10px`；开关为分段式（pomasa 风）：透明底、`padding 2px 8px`、圆角 6px、12px；**选中态** = `--dsw-alias-bg-layer-2` 底 + `border-l2` 描边 + 主文字 + 字重 550。

## 3. 间距尺度（自定 token）

dsh 无间距 token，本集群用以下尺度（数值即"token"，改一处先改这里）：

| Token | 值 | 用途 |
|---|---|---|
| `--bc-space-2` | 2px | 分段开关之间的间隙 |
| `--bc-space-5/6` | 5–6px | 小间隔（dock 块内边距、开关内距） |
| `--bc-space-7` | 7px | 按钮网格行间距、按钮内 padding |
| `--bc-space-8` | 8px | 通用（区块左右内边距） |
| `--bc-space-10` | 10px | 语言标签与开关之间、卡片内距 |
| `--bc-space-12` | 12px | 区块间分隔（按钮区→语言区） |

## 4. 圆角

| 用途 | 值 |
|---|---|
| 极小组件（分段开关、小 chip） | 6px |
| 按钮（通用） | 8px |
| 坞应用入口按钮 | 9px |
| 卡片 / 大按钮 / 面板 | 12–16px（app 内沿用） |

## 5. 字号阶梯（插件级小元素）

正文及以上优先 `--dsw-font-*`（base-16 / m-18 / l-20…）；dsh 尺度覆盖不到的小字号自定：

| 用途 | 值 |
|---|---|
| 组标题（Bandung Apps） | 10.5px / 650 / uppercase |
| 导航栏标题（app 名） | 15px / 650 / 字距 -0.15px |
| 说明、meta、caption | 12px |
| 按钮标签 | 13–13.5px |
| 应用入口按钮名称 | 13px / 600 |

## 6. 主按钮（新建 / New）

三个 app 的「新建」入口统一为 pomasa 基准的紧凑主按钮：

- 底：`--dsw-alias-button-primary-fill`（hover `--dsw-alias-button-primary-hover`）
- 文字：`--dsw-alias-label-primary-foreground`，字重 550
- 尺度：内边距 `5px 12px`、font `13.5px`、圆角 `8px`、`box-shadow: 0 1px 2px rgba(0,0,0,.12)`
- 文案：中文 **新建** / 英文 **New**

## 6.5 表单与输入（输入框/按钮/字段标签）

pomasa 基准（ps-input/ps-btn/ps-field 提取），三家已对齐：

- **输入框/文本域/选择框**：`1px solid border-l2`、底 `bg-layer-2`、圆角 `8px`、内边距 `8px 12px`、字号 `14px`、`outline:none`、过渡 140ms；placeholder `label-caption`；hover `border-l3`；**聚焦** `border-color: brand-primary` + 光环 `box-shadow: 0 0 0 3px color-mix(in srgb, brand-primary 18%, transparent)`（颜色一律走 `--dsw-alias-*`，不硬编码）。
- **按钮**：底 `border-l2` + `bg-layer-2`、圆角 `8px`、内边距 `7px 14px`、字号 `14px/500`；hover `bg-layer-3`+`border-l3`；active `translateY(.5px)`；`focus-visible` 2px brand 描边；`disabled` 0.45。
  - primary：`button-primary-fill` 底 + `label-primary-foreground` 字、550、`box-shadow 0 1px 2px`、hover `button-primary-hover`。
  - ghost：透明底、`label-dimmed`，hover 变 interactive 底 + 主文字。
  - danger：`state-error-primary`。
  - **选择器必须双类/前缀类**（防全局 button reset 覆盖，见变更记录）。
- **字段标签**：`13.5px/500`、主文字、下边距 6–8px；字段块间距 14–16px。

## 7. 颜色

一律 `var(--dsw-alias-*, fallback)`，不在 CSS 里硬编码色值。常用映射：

| 语义 | 变量 |
|---|---|
| 页面/面板底 | `bg-base` / `bg-layer-1` / `bg-layer-2` / `bg-overlay` |
| 文字 | `label-primary` / `label-secondary` / `label-caption` |
| 描边 | `border-l1`（细）/ `border-l2`（粗） |
| 按钮 | `button-primary-fill` / `button-primary-hover` / `button-floating-fill` / `button-floating-hover` |
| 交互底色 | `interactive-bg-hover` |
| 状态 | `state-business-primary` / `state-error-primary` / `state-success-primary` / `state-warn-primary` |

## 8. 语言（全局）

- 键 `bandung-lang`（localStorage），经 `window.__dshAppDock__.lang.get() / set() / subscribe()` 读写。
- 开关只存在于坞上（§2 语言区），**应用不自带开关**：`langStore` 初始读全局，register 时订阅 `dock.lang.subscribe()` 联动重渲染（记得 `.lang` 存在守卫；依赖 dock `^0.1.2`）。
- 新增成员应用照此接入。

## 9. 文案约定

- 坞组标题固定 **Bandung Apps**（不翻译）。
- 「新建」按钮：中文 **新建** / 英文 **New**（统一，不写"新建项目/新建 MAS"；对话框标题等正文可保留全称）。
- 应用自注册的按钮名（icon + label）由各 app 自己定，别与其它应用撞图标。

---

## 变更记录

- **2026-09-06**（初版定稿）
  - 坞从"应用坞按钮+面板"收敛为 footer 直排：组标题 + 应用按钮网格（2 列、多行），点按钮直达应用，无中间层。
  - 按钮从纯图标改为「图标 + 名称」（不然看不出是干嘛的）；上方组标题 **Bandung Apps**。
  - 语言全局化：坞提供 `bandung-lang` 开关（pomasa 风分段式），三个 app 删除自带开关、改为读全局并按 `dock.lang.subscribe` 联动。
  - 间距微调：应用按钮加大加高（7×12/13px、radius 9）、按钮区与语言区分隔（12px + 发丝线）、语言标签与开关间距 10px。
  - 「新建」按钮统一为 pomasa 基准紧凑主按钮，文案 中文"新建"/英文"New"。
  - 修复选择器优先级：主按钮必须用 **双类/前缀类**（`.au-root .au-btn-new`、`.pt-root .pt-nav-new`、`.ps-btn.primary`），否则会被各 app 的全局 `button { font:inherit; background:none }` reset（0,1,1）盖过 → 出现"透明底黑字无字重"的裸按钮。这是本集群按钮样式的第一个坑，后续主按钮一律按此写。
  - 发现：dsh 主题 token 只覆盖颜色与字体阶梯，无间距/圆角 token → 本集群自定尺度（§3-§5）。
  - 标题尺度统一：导航栏标题 15px / 650 / 字距 -0.15px（pomasa 基准），另两家原先 18px/700，已对齐。
  - 表单基线：输入框/按钮/字段标签按 pomasa 基准统一到三家（§6.5），pictor/auctor 原 12px 圆角/accent 聚焦已对齐为 8px/brand 光环。
  - 空态梗图惯例：各 app 的空白页展示自家梗图时，图放仓库 assets/、宿主注册 HTTP 路由吐图、客户端 `<img>` 直引（DSH WebView 拦 data: URI；pomasa=/pomasa/meme.jpg、pictor=/pictor/asset/empty-state.png、auctor=/auctor/asset/meme.jpg）。发布包 files 须含 assets。