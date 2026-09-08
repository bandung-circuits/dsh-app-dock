# 应用坞"更新提醒"功能设计（草案）

- 状态：未立项，供决策参考（2026-09-08）
- 研究出处：`research/` 目录（01 官方与社区调研、02 同类生态与安全模型、03 结论与建议、04 功能草图），全文材料在 `research/material/`

## 1. 功能目标与边界

用户定调（原话）：用别人做好的机制来做我们自己 app 的自管理，并且能提醒用户安装并重启就足够了。

目标：
- 检查 dock 所托管的 Bandung 应用（POMASA Studio / Auctor / Pictor / 应用坞自身）是否有新版本。
- 用户主动确认后执行更新，走官方路径（`pnpm update`）。
- 更新成功后提示用户重启 dsh 使生效。

明确不做：
- 不做通用插件市场或通用更新器（社区已 10+ 团队在做，拥挤且非官方背书）。
- 不做任何静默自动更新。
- 不解决"更新后立即生效"（官方 HMR 未成熟，社区所有方案止步于"装完请重启"）。
- 不接受 dist-tag 跳变带来的意外大版本（版本源策略见 §7）。

## 2. 关键事实（调研结论）

1. `dsh plugin update <pkg>` 是官方设计内的既定行为：插件管理是 pnpm 透传，reconcile 按"已安装状态"决定 bundle 层，源码注释明写"更新到新版本、装了 dsh.bundle 声明的包会自动进 bundle 层"（apps/cli/src/plugin.ts）。
2. 官方没有桌面端；所有 profile（无论叫 desktop 还是 web）都是同一个 pnpm 项目，更新只有一条路径：在该 profile 目录里 `pnpm update`。
3. 硬墙：已加载插件的更新无法立即生效，必须整体重启（vendor/hmr/src/index.ts:41 将 node_modules 排除在 HMR 之外；#3056）。
4. 官方 CLI 自身无自更新机制（#2535，无维护者回复）；维护者在 #2717 表态将把 Cordis HMR 用得更深，但安全重启接口、更新来源、权限模型等四个问题"还没想好"。
5. 安全：更新通道是插件系统最强的攻击面（Wiz 2025 披露 VS Code/OpenVSX 发布 token 泄漏可向 15 万安装推恶意更新）；行业收敛做法是"检查可自动、应用须显式 + 新版本冷却期 + 可回滚"。

> 修订说明：初版调研曾误含一份"官方 Electron 桌面端"论断，经逐一核验不成立（master 无 apps/desktop、npm 无此包），已从 research/01、03、04 撤回。本设计不依赖该论断，更新路径只有一条。

## 3. 核心机制

### 3.1 已装版本（版本基线）

dock host 读取当前 profile 的 `package.json` 里 `dependencies` 对应包的已装版本。读不涉及写盘，任何 profile 都可读。

一份"应用 id → npm 包名"的映射表是关键数据（放哪见 §7）：id 是 dock `register()` 时应用自报的 id，包名是 `dependencies` 里的键。

```
id: 'dsh-pictor',        pkg: 'dsh-pictor'
id: 'dsh-auctor',        pkg: 'dsh-auctor'
id: 'dsh-pomasa',        pkg: 'pomasa-studio'
id: 'dsh-app-dock',      pkg: 'dsh-app-dock'
```

### 3.2 最新版本

对每个托管应用，`GET https://registry.npmjs.org/<pkg>/latest` 取 `dist-tags.latest`。若将来引入 curated 清单，优先提示清单版本而非裸 latest（理由见 §6 的 dist-tag 坑）。

### 3.3 更新执行（单一路径）

用户点"更新"后，dock host 在当前 profile 目录 spawn `pnpm update <pkg>`，与官方 `dsh plugin update <pkg>` 完全等效（pnpm 透传 + bundle reconcile 是官方行为）。

- 失败：已装版本不动，展示 pnpm 输出摘要与手动命令，不留下半套状态。
- 成功：置"待重启生效"标记。

### 3.4 生效与重启

不自动重启（不冒充官方重启契约，官方也还没定）。更新成功后提示"重启 dsh 后生效"，并把待重启状态记入会话内标记，下次会话前可见。

### 3.5 检查时机（何时识别新版本）

三层，全部静默、不阻塞、不打扰：

1. dsh 会话启动时：dock host `apply` 完成后异步查一次各应用 npm latest（一次 HTTP，失败静默，不拖启动）。
2. dock 面板打开时：若距上次检查超过 TTL（默认 1 小时）则补查，否则用会话内缓存，避免开一次面板打一次 registry。
3. 手动"检查更新"按钮：随时强制刷新。

有新版才显示徽标；registry 不可达不报错，保留上次结果等下次检查机会。

## 4. UI 形态

遵循 DESIGN-LANGUAGE.md 的克制基调（发丝线、低饱和、圆角、明暗主题 token）：

- dock 面板应用条目：版本行"当前 vX.Y.Z"，有新版时变为"vA.B.C 可用"徽标 + 一个更新按钮。
- 更新进行中：按钮置灰，显示"更新中"。
- 更新完成：徽标变为"已更新，重启后生效"，下次会话清除。
- 更新失败：简短报错 + 可复制的 `dsh plugin --profile <profile> update <pkg>` 手动命令。
- 面板顶部或底部：手动"检查更新"按钮 + 最近检查时间。

## 5. 安全设计

- 更新只在用户显式点击后执行，无任何静默写盘。
- 不做签名强制（npm provenance 签名可作为可选增强项，推动自管应用以 `--provenance` 发布）。
- 可选开关：新版本冷却期（如发布 24 小时内不提示），默认值待定（§7）。
- 回滚路径：更新前记录旧版本号，失败时指引 `dsh plugin update <pkg>@<旧版本>` 手动回滚。
- 已知哪些应用是"我们"的由映射表限定，更新动作绝不作用于映射表之外的包。

## 6. 已知坑（落地必看）

- bundle reconcile 双通道：更新前后比对 `dsh.profile.bundles` 与 `cordis.patch.yml` 两套装载记录，按 resolved entry id 去重，否则复刻官方 5 个 reconcile bug 家族（#1404/#2889/#1610/#2854/#1377）。这是"合格更新器"与"社区平均水平"的分野。
- pnpm store 漂移（#3545）：不同 pnpm 版本/配置可致 ERR_PNPM_UNEXPECTED_STORE，落地时用与官方一致的 pnpm 版本并锁 pnpm 版本。
- allowBuilds（pnpm ≥10）：git 依赖的 prepare 脚本默认被禁，更新前需检查 profile 的 pnpm-workspace.yaml。
- dist-tag 地雷：npm `latest` 可能指向坏 rc（dshbase 踩坑），这是 curated 清单的主要动机。
- 并发：不与用户手动 pnpm 操作互斥会竞争（社区 dsh-plugin-market 用串行队列 + 互斥锁，可参考）。

## 7. 待定决策

1. 更新执行：dock 直接 spawn `pnpm update`，还是仅"提醒 + 显示命令"？（倾向前者，同一路径不分环境）
2. 版本源：先纯 npm latest，还是顺带做 curated 清单？（倾向先 npm latest，清单留口子）
3. 映射表放哪：dock 内置静态映射，还是远程可更新清单（如挂在 bandung-circuits.github.io）？（倾向先内置）
4. TTL 默认值：1 小时是否合适。
5. 是否提供"更新全部"，还是逐应用更新。
6. 冷却期开关是否默认开启。

## 8. 参考与出处

- research/01-dsh官方与社区调研.md（含 2026-09-08 修订记录）
- research/02-同类生态与安全模型调研.md
- research/03-结论与建议.md
- research/04-功能草图.md
- research/material/ 各全文存档