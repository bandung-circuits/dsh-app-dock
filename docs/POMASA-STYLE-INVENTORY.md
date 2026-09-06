# POMASA 样式基准（集群同款元素的唯一参考）

> 本文件从 pomasa-studio 的 `src/client/styles.js` **逐条忠实转录**，是集群"同款元素同款样式"的权威来源。auctor / pictor / 后续新应用在实现某个元素时，先在这里查它对应的 `.ps-*` 规则，**复用数值，不另起炉灶**。所有颜色一律 `var(--dsw-alias-*)`（跟随明暗主题）。
>
> 维护：若改动 pomasa 本体的样式，这里同步更新；若你在某应用里发现与这里不一致，说明那处是"自创"，应改回基准。

## 0. 根与全局复位

```css
.ps-root {
  color: var(--dsw-alias-label-primary);
  font-size: 15px;          /* 基准字号 15px！应用自创 16px 会让同款样式整体偏大 */
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "cv02", "cv03", "cv04";
}
.ps-root * { box-sizing: border-box; }
.ps-root button, .ps-root input, .ps-root textarea, .ps-root select { font: inherit; color: inherit; }
.ps-root a { color: var(--dsw-alias-brand-primary); text-decoration: none; }
.ps-root a:hover { text-decoration: underline; }
```

## 1. 排版

| 用途 | 规则 |
|---|---|
| 页标题 `.ps-h1` | 24 / 650 / ls -0.02em / mb 4 |
| 部分标题 `.ps-h2` | 18 / 600 / ls -0.01em / mb 6 |
| 副标题 `.ps-sub` | dimmed / 14 / mb 24 |
| 弱化文本 `.ps-muted` | dimmed / 14 |
| 说明 `.ps-caption` | caption / 12.5 |

## 2. 按钮 `.ps-btn`（带变体）

```css
.ps-btn { border:1px solid border-l2; background: bg-layer-2; color: label-primary;
  border-radius:8px; padding:7px 14px; font-size:14px; font-weight:500; cursor:pointer;
  transition: background|border-color|color|box-shadow 140ms; user-select:none; white-space:nowrap; }
.ps-btn:hover(:not(:disabled)) { background: bg-layer-3|interactive-bg-hover; border-color: border-l3; }
.ps-btn:active { transform: translateY(0.5px); }
.ps-btn:focus-visible { outline:2px solid brand-primary; outline-offset:2px; }
.ps-btn.primary { background: button-primary-fill; border-color:transparent; color: label-primary-foreground; font-weight:550; box-shadow:0 1px 2px rgba(0,0,0,.12); }
.ps-btn.primary:hover { background: button-primary-hover; }
.ps-btn.ghost { background:transparent; border-color:transparent; color: label-dimmed; }
.ps-btn.ghost:hover { background: interactive-bg-hover; color: label-primary; }
.ps-btn-danger { color: state-error-primary !important; }
.ps-btn:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
```
派生：`.ps-rerun-fresh`/`.ps-rerun-confirm-btn` = state-error-primary 实心 + foreground 字 + shadow。

## 3. 表单

```css
.ps-field { margin-bottom:16px; }
.ps-field label { display:block; font-size:13.5px; font-weight:500; color:label-primary; margin-bottom:6px; }
.ps-field .hint { color:label-caption; font-size:12.5px; margin-top:5px; }

.ps-input, .ps-textarea, .ps-select { width:100%; border:1px solid border-l2; background:bg-layer-2;
  border-radius:8px; padding:8px 12px; font-size:14px; outline:none;
  transition: border-color 140ms, box-shadow 140ms; }
::placeholder { color: label-caption; }
:hover { border-color: border-l3; }
:focus { border-color: brand-primary; box-shadow: 0 0 0 3px color-mix(in srgb, brand-primary 18%, transparent); }
.ps-textarea { min-height:88px; resize:vertical; line-height:1.55; }
.ps-form-row { display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(min(100%,260px),1fr)); }
```

## 4. 卡片 / 产物卡

```css
.ps-card { background:bg-layer-1; border:1px solid border-l2; border-radius:12px; padding:18px 20px; }
.ps-card.clickable:hover { border-color:border-l3; box-shadow:0 2px 10px rgba(0,0,0,.06); }
.ps-card-title { 15 / 600 / ls -0.01em }
.ps-card-desc { dimmed / 13.5 / lh 1.55 / 2 行截断 }
.ps-artlist { grid gap 12, minmax(280px,1fr) }
.ps-art:hover { border-color:border-l3; box-shadow:0 2px 10px rgba(0,0,0,.06); }
.ps-art.on { border-color: brand-primary; }
.ps-art-title { 14.5 / 600 / ls -0.01em }  .ps-art-sub { dimmed / 13 }  .ps-art-meta { caption / 12 }
```

## 5. 侧栏导航

```css
.ps-nav { flex:0 0 264px; border-right:1px solid border-l2; background:bg-base; }
.ps-nav-head { padding:18px 16px 12px; border-bottom:1px solid border-l2; }
.ps-nav-title .name { 15 / 650 / ls -0.01em }
.ps-nav-scroll { flex:1; overflow-y:auto; padding:8px; }
.ps-nav-row { position:relative; display:block; width:100%; text-align:left;
  padding:8px 10px 8px 14px; border-radius:8px; background:transparent; border:none; margin-bottom:2px; }
.ps-nav-row:hover { background: interactive-bg-hover; }
.ps-nav-row.on { background: bg-layer-2; }
.ps-nav-row.on::before { content:''; position:absolute; left:4px; top:9px; bottom:9px; width:3px;
  border-radius:3px; background: state-business-primary; }   /* 选中左缘强调条 */
.ps-nav-name { 14 / 550 }
.ps-nav-meta { caption / 12 }
.ps-dot { 7px 圆点，currentColor；running=brand / generating=warn / failed=error / completed=success / idle=caption }
```

## 6. 阶段条（重要：是"轨 + 瓦片 + 顶部激活线"，不是药丸）

```css
.ps-stages { display:flex; gap:4px; overflow-x:auto; background:bg-layer-1;
  border:1px solid border-l2; border-radius:12px; padding:4px; }
.ps-stage { flex:1 1 0; min-width:116px; padding:10px 12px; cursor:pointer; border-radius:8px;
  transition:background 140ms; position:relative; }
.ps-stage:hover { background: interactive-bg-hover; }
.ps-stage.on { background: bg-layer-2; box-shadow: inset 0 0 0 1.5px state-business-primary; }
.ps-stage-on { position:absolute; top:0; left:8px; right:8px; height:2.5px;
  border-radius:0 0 4px 4px; background: state-business-primary; }   /* 激活顶部短线 */
.ps-stage-name { 13.5 / 600 }   .ps-stage-count { caption / 12 }
```

## 7. 空态 / Hero

```css
.ps-empty { flex column 居中; padding:56px 24px; gap:10px; color:dimmed; border:1px dashed border-l2;
  border-radius:14px; background:bg-layer-1; }              /* 内容区小空态：虚线框（仅此用虚线） */
.ps-empty-hero { flex:1; min-width:0; flex column 居中; gap:12px; padding:48px 28px; }  /* 主 hero：无框 */
.ps-empty-hero h2 { 20 / 650 / ls -0.01em }
.ps-empty-hero p { dimmed / 14.5 / lh 1.65 / max-width 440 }
.ps-meme { 200×200; object-fit:contain; mask: radial-gradient(ellipse closest-side, #000 52%, transparent 76%); }
```

## 8. Modal / 阅读视图（正文排印基准）

```css
.ps-modal-backdrop { bg-mask-2; 居中; z-index 60; padding 24 }
.ps-modal { background:bg-layer-1; border:1px solid border-l2; border-radius:14px; width min(760px,100%);
  max-height:82vh; flex column; box-shadow:0 16px 48px rgba(0,0,0,.22); }
.ps-modal-wide { width min(980px,100%); max-height:88vh }
.ps-modal-head { gap 12; padding 14px 18px; border-bottom:1px solid border-l2 }
.ps-modal-body { padding 20px 26px; overflow auto; font-size:14.5px; line-height:1.7 }
.ps-modal-body h1 { 21 } .ps-modal-body h2 { 18 } .ps-modal-body h3 { 15 }  lh 1.3, mb .45em
.ps-modal-body p { mb .85em }

.ps-viewer { border:1px solid border-l2; radius 12; bg layer-1 }
.ps-viewer-body { font-size:14.5px; lh 1.7; h1 22/h2 19/h3 16/h4 14.5 各 600 }
.ps-viewer-body blockquote { border-left:3px solid border-l3; color:dimmed; padding:4px 16px }
```

## 9. 徽记 / 状态

```css
.ps-badge { inline-flex 居中; radius 999; padding 2px 10px; font 12.5/500;
  border:1px solid border-l2; color:dimmed; background:bg-layer-2; }
.ps-badge .dot { 6px，currentColor }
.running=brand / generating=warn / completed+ok=success / failed+err=error / idle=dimmed
```

## 10. 面板 / 视窗

```css
.ps-shell-panel { flex:1; background:bg-base; border-left:1px solid border-l2; }
.ps-workbench { display:flex; height:100%; width:100%; overflow:hidden; }
.ps-main { flex:1; overflow-y:auto; }
.ps-main-inner { max-width:880px; margin:0 auto; padding:20px 28px 56px; }
.ps-viewer / .ps-log-panel / .ps-panel(两栏 grid) 见各自规则。
```

## 应用侧对齐自检（新增/修改共用元素时对照）

1. 根：`font-size: 15px`，否则一切偏大。
2. 颜色一律 alias token，禁硬编码。
3. 按钮用三段变体（base / primary / ghost），不要给次要动作加实底。
4. 阶段条是"轨+瓦片+顶线"，不是药丸堆。
5. 导航行选中用 `::before` 左缘条，不用边框。
6. 卡片/产物卡有边框（border-l2 + hover 光影），导航/目录条不带边框。
7. 空态：主 hero 无框，内容区小空态才用虚线框。