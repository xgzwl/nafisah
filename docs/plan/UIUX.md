# Nafisah Shrine 三功能 UI/UX 设计契约

> 版本：v1.0 | 设计师：颜好看（mvp-dev-expert-team-designer）| 日期：2026-11-26
> 依据：PRD 定稿 v2（PM）+ ARCHITECTURE v1.1.0（architect）+ SPEC.md + `.learnings/PITFALLS.md` + `assets/css/style.css` + `assets/js/i18n.js` + `main.js` + 8 页 HTML 实地读取
> 适用功能：① 撒糖语录区 ② 给主角写信（表单 + 信件墙）③ 与主角在线聊天
> 本文只定义设计与验收口径，**不含站点代码改动**；实现由前端按本契约执行。
> **修订记录 v1.2（2026-11-26 本轮调整）**：用户拍板四项变更已覆盖 v1.1——① **对话入口改为方案 A：新增 `chat.html` 第 8 页 + 全站 7→8 页 nav**（原 v1.1 推荐方案 B「嵌入 letters.html」作废，§5.1 权衡表保留作历史留痕，结论以本条为准）；② ESA 已下线，所有「能力探测降级 / `hidden` 默认 / `common.readonlyNotice`」条目作废，改为 EdgeOne 单链路；③ 零外链解除为「允许必要外链」，静态首屏仍不依赖外链；④ 文案已定稿并落地（PRD 附录 A/B 为真相源，三语各 144 键）。**v1.1 原有结论与本节冲突时，以本条为准。** 下游以 `ARCHITECTURE.md` v1.1.0 + `openapi.yaml` + `SPEC.md` 为真相源。

---

## 0. 设计前提判定（先判寄存器，再谈方案）

### 0.1 寄存器与平台轴

| 项 | 判定 | 理由与后果 |
|---|---|---|
| 设计寄存器 | **Brand 寄存器为主（站点外壳）+ Product 寄存器（三个新交互组件）** | 外壳是"设计即产品"的同人神龛：氛围、语域、羊皮纸质感本身就是内容；新组件（表单/聊天）则按 Product 寄存器走"赢得熟悉感"，克制、可预测、无装饰动效。**不要**给表单和聊天套营销页 Hero 或大色块 |
| 平台轴 | web（静态多页，8 页同源，无框架） | 所有组件用原生 HTML/CSS/原生 DOM API；前端不加载第三方 script、iframe、统计脚本（外链边界见 SPEC §3） |
| 对标 | 站点自身既有语言（Cinzel / Cormorant / 霞鹜文楷 + 深墨绿铜金） | 不引入 Linear / Vercel 等外部视觉语汇；目标是"看不出是新增的"，不是"看起来更高级" |

### 0.2 三轴设计刻度

| 参数 | 取值 | 说明 |
|---|---|---|
| DESIGN_VARIANCE | **3**（可预测） | 站点现有布局严格对称居中（题献带、3/2/1 列网格）。新增组件一律沿用对称栅格，不引入非对称 Hero、Bento、Masonry |
| MOTION_INTENSITY | **2**（近静态） | 只保留既有 `.reveal`（0.4s）、烛火 flicker、心形 9s glow。新组件仅加 150ms 颜色/边框过渡；流式输出用文本增量，不做打字机装饰 |
| VISUAL_DENSITY | **3**（日常应用偏疏） | 沿用 `.parchment` 大内距与 `clamp()` 间距；不做驾驶舱式密集面板 |

### 0.3 本次设计最重要的一条约束

**三项功能全部落在既有页面内，不新增页面、不改动 header/footer/nav。** 理由：

- 8 页 header/footer 逐字一致是本站最贵的硬红线；新增导航项要同步改 8 份文件 + 3 语字典 + `?v=` 版本串，任一遗漏即产生跨页漂移。**新建页必须与既有页同为 CRLF 换行，否则逐字 diff 假失败（本轮踩坑）。**
- 题献带（顶部）与藏书票框（底部）是全站 320px 余量最紧的两处（320 底部 Georgia 回退仅 **11.52px**）。新增一页 = 新增 2 个实例要重验；嵌入既有页则回归面为 0。
- 结论：撒糖语录 → `quotes.html`；写信表单 + 信件墙 + 聊天 → `letters.html`。聊天位置选择的完整权衡见 §5.1。

---

## 1. 设计 Token 延续表（逐变量，不新增令牌）

### 1.1 现有 Token 全量清单与新增组件的用法

> 来源：`style.css` `:root`（第 89–122 行）。**本站 Token 是 rem / clamp 制，不是通用规范里的 4px 网格制**；不要"顺手改成 4px 网格"。共 28 个变量，逐一列出用途与本次调用方式。

| Token | 现值 | 层级 | 既有用途 | 三个新组件的使用方式 |
|---|---|---|---|---|
| `--ink` | `#0e1a17` | A1 | 页面底、按钮前景 | 聊天"我方"气泡文字；成功态文字底衬 |
| `--ink-soft` | `#16241f` | A1/B | 次级深底 | **用户消息气泡背景**（比页面底亮一档，靠亮度递进表达层级，不靠阴影） |
| `--bronze` | `#b08d57` | A1 | 强调描边、分隔线色 | 输入控件 focus 边框、CTA 边框、错误边框 |
| `--bronze-light` | `#d6b47a` | A2 | 标签、来源、激活态 | 聊天角色名、语录来源、表单标签、字数提示 |
| `--parchment` | `#e8dcc0` | A1 | 主前景 | 所有新文案正文色 |
| `--parchment-dim` | `#c9bda4` | B-slot | 次级正文 | 输入提示、系统提示、空态、聊天气泡正文 |
| `--charcoal` | `#141412` | B-slot | 图库卡底 | **聊天面板内消息列表底**（比 parchment 卡片更沉，区分"会话区"） |
| `--candle` | `#f3d9a4` | A2 | 悬停/焦点文字 | 错误提示文字、focus ring、`aria-live` 状态文字 |
| `--line` | `rgba(176,141,87,.28)` | A1 | 全站唯一边框强度 | 所有新容器/气泡/输入框边框；**全站边框基准，不得用 `--bronze` 满饱和做边框** |
| `--shadow` | `0 18px 50px rgba(0,0,0,.45)` | A2 | `.parchment` 阴影 | 聊天面板沿用 `.parchment` 即自动继承；内部元素不再叠阴影（避免"幽灵卡片"） |
| `--fs-xs` | `clamp(.78rem,.76rem+.1vw,.84rem)` | A1 | 署名、最小标签 | 语录来源、署名行、CC BY 署名（沿用 `.gallery-credit`） |
| `--fs-sm` | `clamp(.82rem,.80rem+.15vw,.9rem)` | A1 | 次级文字、按钮 | 表单标签、按钮、聊天系统提示 |
| `--fs-base` | `clamp(1.06rem,1rem+.35vw,1.2rem)` | A1 | 中文正文 | 语录正文、信件正文、聊天消息正文、textarea 输入 |
| `--fs-md` | `clamp(1.3rem,1.15rem+.8vw,1.6rem)` | A1 | 引言、h3 | 语录卡首行（沿用 `.quote-text`）；表单区 h2 |
| `--fs-lg` | `clamp(1.8rem,1.4rem+2vw,2.6rem)` | A1 | h2 | 新增 section 标题（沿用 h2，不加新字号） |
| `--fs-xl` | `clamp(2.6rem,2rem+4vw,4.4rem)` | A1 | h1 / Hero | **本次不新增 h1**；不触发 Hero 回归 |
| `--font-display` | `"Cinzel", Georgia, serif` | A1 | 标题、标签 | 新 section 标题、表单标签（英文态） |
| `--font-deco` | `"Cinzel Decorative", ...` | A1 | 装饰字 | 本次不使用（避免装饰升级） |
| `--font-hero` | `"Cormorant Infant", ...` | A1 | Hero 斜体 | 本次不使用 |
| `--font-body` | `"Newsreader", "Cormorant Garamond", Georgia, serif` | A1 | 正文 | 表单/聊天/语录正文。中文由 `html[lang="zh-CN"]` 重映射为 `"Newsreader","LXGW WenKai",...` |
| `--font-fr` | `"Spectral", ...` | A1 | 法语正文 | 法语态自动继承 |
| `--font-zh` | `"LXGW WenKai", "Songti SC", serif` | A1 | 中文回退 | 中文正文经 `--font-body` 重映射拿到，不直接挂新元素 |
| `--space-1` | `.5rem` | A2 | 微间距 | 图标与文字间隙 |
| `--space-2` | `1rem` | A2 | 组内间距 | 表单字段间距、气泡内距基准 |
| `--space-3` | `1.75rem` | A2 | 模块间距 | 消息之间、字段组之间 |
| `--space-4` | `3rem` | A2 | 区块间距 | 新 section 之间（配合 `.divider`） |
| `--space-5` | `5rem` | A2 | 页级间距 | 本次不新增（不拉长页面） |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | A2 | 全站缓动 | 新组件所有 transition 复用，不另写 ease |

### 1.2 ADR：两个"很想加但决定不加"的令牌

| 编号 | 诱惑 | 决定 | ADR 级理由 |
|---|---|---|---|
| ADR-T1 | 给表单错误态加 `--danger: #dc2626` | **不加** | ① 本站是深墨绿 + 铜金单色系，红色会跳出语域；② 加一个语义色就要定义它在这套 `--line` 强度体系下的边框/文字/底色三档，等于引入第二套设计语言；③ 错误态不靠颜色单独表达——用 `aria-invalid` + 明示错误文案 + 锁定 SVG 警示图标三重信号，符合 WCAG 1.4.1。错误文字用 `var(--candle)`，边框用 `var(--bronze-light)`，均既有 |
| ADR-T2 | 给聊天气泡加 `--radius-bubble: 14px` | **不加** | ① 全站唯一圆角是 `.lang-switch button` 的 `2px`，羊皮纸卡片是 0 圆角；气泡做大圆角会立刻读成"通用 AI 模板"；② 用 `1px solid var(--line)` + `--charcoal` / `--ink-soft` 底色区分对话双方，靠位置（右/左）和背景亮度表达，不靠圆角 |

### 1.3 令牌纪律（写给前端的硬约束）

1. 新增 CSS 里**只允许 `var(--…)` 引用**，不得出现任何裸 hex；唯一例外是 `#fff` / `#000`（本次预计一次都用不到）。
2. 不新增 `@font-face`、不新增字号阶梯、不新增 `font-weight ≥ 500` 规则（详见 §8 回归红线 2）。
3. 不新增页面级 Hero、不新增渐变、不新增毛玻璃、不新增 `grid-column` 彩色左边框。
4. 不新增 `design-tokens.json` 文件——令牌零新增，既有 `:root` 即唯一真相源；附录 A 给出机器可读镜像供前端校验，不落盘为新文件。

---

## 2. 图标系统冻结（设计前先锁边界）

> **图标方案已由架构师锁定为 zero-library inline SVG，为终值裁决**（`ARCHITECTURE.md` 第 75 行 / `SPEC.md` 第 67 行 / `PRD.md` F3-AC1）。即：沿用站内现有内联 SVG 心形（`viewBox="0 0 24 22"`，path/stroke 一字不改）与既有 `&#9671;` 几何分隔字符；下表 5 枚手绘 path 是"同一套手绘内联 SVG"的白名单，不是引入图标库。前端不得另起图标库或提交替代清单。

### 2.1 锁定规范

| 项 | 规定 |
|---|---|
| 方案 | **zero-library inline SVG（已锁定终值）**：全部为本站自绘内联 SVG，`stroke="currentColor"`、`fill="none"`；不引入任何图标库 / 图标字体 / 外部 script；不用 emoji 作功能图标；不用新增字符符号充当功能图标（既有 `&#9671;` 延续原用途） |
| 坐标网格 | 心形沿用既有 `viewBox="0 0 24 22"`（`stroke-width="2"`、`stroke-linejoin="miter"`、`stroke-linecap="butt"`、`overflow: visible`）——**一字不改**，它是 320px 余量实测背书过的资产 |
| 新图标网格 | `viewBox="0 0 24 24"`，`stroke-width="2"`、`stroke-linecap="butt"`、`stroke-linejoin="miter"`、与心形同一笔画语言 |
| 尺寸 | 16px（行内）/ 20px（按钮内）/ 24px（独立），CSS 用 `width:1em;height:1em` 随字号缩放，不写死 px 属性 |
| 无障碍 | `focusable="false"`；紧邻文字标签时 `aria-hidden="true"`；无文字的图标按钮必须有 `data-i18n-aria` 提供的 `aria-label` |
| i18n 兼容 | `apply()` 用 `textContent` 覆盖 `[data-i18n]`。**图标必须是 `data-i18n` 节点的兄弟，不能是子节点**；文字单独包 `<span data-i18n="…">` |

### 2.2 手绘内联 SVG 白名单（5 枚，zero-library；已被 SPEC.md 第 67 行逐项锁定）

| 语义 | 用在哪 | 图形约定 |
|---|---|---|
| `send` | 聊天发送按钮 | 24 网格内的信封/纸飞机轮廓，闭合路径，不填充 |
| `stop` | 聊天停止生成 | 正方形轮廓（`stroke-width:2`），不做圆角 |
| `retry` | 表单/聊天重试 | 单圈开口环 + 箭头端点，不填充 |
| `alert` | 表单字段错误 | 三角形 + 感叹号，`stroke-width:2` |
| `pen` | "写一封信"入口（若需要） | 斜置笔身 + 笔尖，不填充 |
| `heart`（既有） | 题献带、藏书票框、**聊天角色头像** | 复用现有 path，20px，不改 viewBox |

> 禁止用任何 emoji 替代上述图标（典型越界字符落在 U+1F300–U+1F9FF、U+2600–U+26FF、U+2700–U+27BF 三个区段，含火箭 / 闪光 / 灯泡 / 红心 / 闪电 / 靶心 / 纸笔 / 对话气泡等符号）。emoji 仅允许出现在用户生成内容（UGC）正文里，且即使 UGC 也不得出现在 UI 功能位。本文件刻意不写出这些字符字面量，以免门禁正则误报。

### 2.3 关于既有 `&#9671;`

`letters.html` / `gallery.html` 的 `.divider` 内 `&#9671;`（U+25C7 空心菱形）是几何符号而非 emoji，且已全站落地；**本次不新增、不扩散**此类字符装饰，新区块分隔一律复用现有 `.divider`。

---

## 3. 组件 A：撒糖语录区（sweet quote wall）

### 3.1 落点与结构

- 页面：`quotes.html`，位于既有 5 条原著语录的 `.quote-grid` **之后**。
- 结构：`.divider` → `<section class="quote-sweet" aria-labelledby="sweet-title">` → 标题组（`.page-kicker` + `h2` + `.lead`）→ **独立的新 `.quote-grid` 容器** → 4 张 `.quote-card.parchment` → `.divider` → `.muted.small` 说明。
- 硬约束：**不得把新卡片塞进既有 `.quote-grid`**。既有 grid 的两条位置规则 `.quote-card:nth-child(3n+2){margin-top:2.2rem}` 与 `.quote-card:nth-child(5){grid-column:1/-1;max-width:46rem}` 是按子元素序号生效的，混排会同时改变原有卡片的错位节奏与通栏位置（PITFALLS 三·网格空洞坑的近亲）。独立容器让两套序号各自从 1 开始。

### 3.2 卡片数量与通栏规则

| 项 | 规格 |
|---|---|
| 数量 | **4 张**（偶数），原创甜蜜短句，不照搬原著台词 |
| 通栏 | **不设通栏卡**。4 张在桌面 2 列下正好 2×2 完整铺满；`nth-child(5)` 不会命中，零空洞 |
| 通栏通用判据（若将来加卡） | `.quote-grid` 为 2 列：通栏卡必须落在**行首**即奇数序号（1/3/5/7…）。偶数序号通栏会在上一行挖出空洞。这与 3 列图库的判据同理（见 §7.2） |
| 错位 | 沿用 `.quote-card:nth-child(3n+2){margin-top:2.2rem}`：第 2 张下沉，形成手稿错落感；`≤900px` 已被既有规则清零 |
| 响应式 | 完全复用既有 `@media`：≤900px 单列且 `margin-top:0`、`grid-column:auto`、`max-width:none`；无需新增媒体查询 |
| 首字下沉 | `.quote-text::first-letter` 会吞撇号（PITFALLS 二）。新文案**避免以 `I'`、`don't`、`l'` 开头**；若无法避免必须用 `data-i18n-html` 包 `<span>` 并加负 margin，本项目建议直接改写句子规避 |

### 3.3 文案风格与四句提案（原创，供 PM/owner 定稿）

语域：**梦女（Nafisah → Tom）私密日记口吻，克制、物件意象、不甜腻、无身体描写、无"Welcome to"式填充**。三语同一情绪，不逐字互译。

| # | en（亦为 HTML 兜底） | zh | fr | 来源标签（诗意署名，非原著书名） |
|---|---|---|---|---|
| sq1 | You never asked to be remembered gently. I do it anyway. | 你从未要求被温柔地记住。我还是这样做了。 | Vous n'avez jamais demandé à être doucement rappelé. Je le fais quand même. | en `a page kept for him` / zh `留给他的那一页` / fr `une page gardée pour lui` |
| sq2 | I left the lamp burning. Not for the room — in case you came back. | 我留着那盏灯。不为房间，只怕你回来。 | J'ai laissé la lampe allumée. Pas pour la pièce — au cas où vous reviendriez. | en `the margin of a diary` / zh `日记的页边` / fr `la marge d'un journal` |
| sq3 | If a name can be a home, then mine has your address on it. | 倘若一个名字可以成为家，我的这个写着你的地址。 | Si un nom pouvait être une maison, le mien porterait votre adresse. | en `a letter never posted` / zh `一封没有寄出的信` / fr `une lettre jamais envoyée` |
| sq4 | You taught the candle to wait. It has kept the habit. | 是你教会烛火等待。它至今还留着这个习惯。 | Vous avez appris à la bougie d'attendre. Elle a gardé l'habitude. | en `after midnight` / zh `午夜之后` / fr `après minuit` |

- 来源标签走 `.quote-source`（`text-transform: uppercase`、`letter-spacing:.1em`）：法语标签保持 ≤20 字符避免撑宽；中文沿用站点既有"≤900px/中文小标签"口径（`.quote-source` 已在 `style.css` 第 279 行的 1.0625rem 清单内，无需新增）。
- 双语说明：`sweet.note`。建议 en `Written for this shrine. Not lines from the books.` / zh `本站原创，非书中台词。` / fr `Écrit pour ce sanctuaire, pas tiré des livres.`
- 与既有 5 条原著语录的边界必须在视觉上可读：靠 `.divider` + 新 section 标题（`sweet.title` / `sweet.lead`）区分，**不靠颜色**（PITFALLS 二：11% 铜洗底对比度仅 1.16:1）。

### 3.4 组件状态

| 状态 | 表现 |
|---|---|
| Populated | 4 张静态卡片，`.reveal` 沿用既有 IntersectionObserver |
| Empty / Loading / Error | 静态内容不适用；无需为纯文本卡片造空态 |
| Edge | 法语长句（sq2）在 320px：`.quote-text` 用 `--fs-md`（clamp 1.3→1.6rem），须验 320 三语无横向溢出、首字下沉不吞撇号 |

---

## 4. 组件 B：给主角写信（表单 + 信件墙）

### 4.1 落点与结构

- 页面：`letters.html`，**不新增页面**。
- 页内顺序：既有 3 封原创短札 `.letter-stack` → `.divider` → **写信表单区**（`<section class="letter-compose" aria-labelledby="compose-title">`）→ `.divider` → **读者信件墙**（`<section class="letter-wall">`）→ 既有 `letters.note`。
- 表单与信件墙都放在 `.shell`（max 1120px）内；表单卡 `max-width: 58rem` 与 `.letter-stack` 对齐，形成一致的阅读栏宽。
- 语义：表单区与信件墙都是 `<section>` + `aria-labelledby`，不用 `<dialog>`（避免焦点陷阱与 320px 高度风险）。

### 4.2 表单字段规格

| 字段 | 控件 | 属性 | 标签 / i18n | 约束 |
|---|---|---|---|---|
| 署名（**可选**） | `<input type="text" maxlength="40">`（无 `required`） | `id="letter-name"` `autocomplete="name"` | `<label data-i18n="letter.form.name">` 挂在叶子 label | 40 字符上限（中文 40 字），**可留空**（PRD F2-AC1：署名可选；openapi `name` nullable）；不设 placeholder（避免新增 i18n 属性通道） |
| 正文 | `<textarea required minlength="20" maxlength="1000" rows="8">` | `id="letter-body"` `aria-describedby="letter-body-hint letter-count letter-privacy"` | `<label data-i18n="letter.form.body">` | **20–1000 字符**（`SPEC.md` / `openapi.yaml` 已钉死；SPEC T2-G1 测 19/20/1000/1001 边界）；`maxlength` 按 UTF-16 计，汉字 1 单位/emoji 2 单位，可接受；实时计数 `0 / 1000` 只显示数字，不含需翻译的词 |
| 蜜罐 | `<input type="text" name="website" class="sr-only" tabindex="-1" autocomplete="off" aria-hidden="true">` | 无 label，不进 i18n | — | 字段名 `website`（openapi 契约）；正常必须留空，非空则后端静默不入库、不给用户报错（SPEC T2-G1） |
| 公开同意 | 不设独立勾选框 | 提交时由前端附 `consent: true` | 由隐私提示文案承担告知 | openapi `consent` 必传且 `const:true`；PRD §9.2「提交即视为同意公开展示」 |
| 提交 | `<button type="submit" class="btn">` | 内含 `<span data-i18n="letter.form.submit">` + `send` SVG 兄弟节点 | — | ≤560px 自动全宽（既有 `.btn` 规则），不新增覆盖 |

- 提示文案：`letter.form.bodyHint`（如 "Between 20 and 1000 characters." / "20–1000 字。" / "Entre 20 et 1000 caractères."），叶子 `<p class="form-hint small muted">` 承载。
- 隐私提示（PRD F2-AC6 / §9.2）：正文输入框**首次聚焦**时显示 `letter.form.privacy`——"信件将公开展示；请勿填写真实姓名、联系方式、住址；提交即视为同意公开"。三语文案一次补齐，叶子 `[data-i18n]`；`disclaimer.html` 另补 UGC 条款（属 PM 文案范围，设计侧只给挂载位）。
- 新增 CSS 类仅允许使用既有 token：`.form-label`（`font-family:var(--font-display)`、`font-size:var(--fs-sm)`、`letter-spacing:.14em`、`color:var(--bronze-light)`）、`.form-control`（`background:var(--charcoal)`、`border:1px solid var(--line)`、`color:var(--parchment)`、`font-family:var(--font-body)`、`font-size:var(--fs-base)`、`padding:var(--space-2)`）、`.form-error`（`color:var(--candle)`、`font-size:var(--fs-sm)`）、`.form-hint`、`.form-count`。**不得出现裸颜色值**。
- 中文标签字距：`.form-label` 的 `.14em` 在 zh 下取 `.12em`（汉字等宽方块，沿用 PITFALLS 五的"中文标签不要大字距"精神；写作 `html[lang="zh-CN"] .form-label { letter-spacing:.12em }`，与题献 `.22em` 属同一刻意处理）。

### 4.3 表单 9 态矩阵

| 状态 | 视觉与语义 | 验收要点 |
|---|---|---|
| Default | 两个空控件、标签常显（不用 placeholder 当 label）、提交按钮可用 | 标签 `<label for>` 关联正确；键盘 Tab 顺序 name → body → submit |
| Hover | 按钮沿用 `.btn:hover`；控件边框 `--line` → `--bronze` | 150ms 过渡，复用 `--ease` |
| Focus | 全局 `:focus-visible{outline:2px solid var(--candle);outline-offset:3px}` 已覆盖；控件额外 `border-color:var(--bronze)` | 不移除 focus ring；320px 下 ring 不引起横向溢出 |
| Active | 按钮沿用现有态，无新增动效 | — |
| Disabled | 提交中按钮 `disabled` + `aria-busy="true"` 加在 `<form>` 上 | 按钮文字切 `letter.form.sending`；表单整体不透明降低（用 `opacity`，不造新 token） |
| Loading | 按钮文字改为"正在留下……"；可选 `currentColor` 旋转环（`border:2px solid currentColor;border-top-color:transparent`，reduced-motion 下停转） | 提交中重复点击无效 |
| Error（字段级） | `aria-invalid="true"` + `.form-error` 文案 + `alert` SVG；边框 `var(--bronze-light)` | 错误紧贴字段（`aria-describedby`）；**不只靠颜色** |
| Error（提交级） | 表单顶部 `.parchment` 错误块，文案按 `letter.form.error.network` / `.server` / `.rate` 分类 + `retry` SVG 按钮 | **失败不清空用户正文**（PITFALLS 八：刷新/失败丢数据是压力测试红旗）；不暴露后端原始报错 |
| Empty | 正文为空点提交 → 浏览器 `required` 校验 + 字段错误态 | 不用 toast，错误就近显示 |
| Error（字段级 `invalid`，非 banner） | HTTP 400 / code 40001（参数）/ 40002（超限）/ 40003（被过滤）→ 字段内联 `.form-error` + `alert` SVG，**不进 banner** | 架构师裁决：400 系列走字段内联，否则"正文太短"会被误报成"服务器错误"；复用现有 `.form-error` + `alert` 图标，**不新增图标、不新增颜色**（ARCHITECTURE §3.7） |
| Success | 表单替换为成功块：`alert` 位置改放既有心形 SVG + `letter.form.success` + `.btn.btn-ghost`（`letter.form.another`）；新信即时插到信件墙首条 | 焦点移到成功块（`tabindex="-1"` + `.focus()`）；`aria-live="polite"` 播报；不跳页 |
| **不可用（无脚本）** | 静态内容可读，表单区显示说明；不使用 `hidden` + 探测模式（ESA 已下线，单链路无需跨平台降级） | 见 ARCHITECTURE v1.1.0 §6「EdgeOne 单链路」；无 404、无 console error、无布局塌陷 |

- 字数计数：`input` 事件更新 `letter-count.textContent = len + " / 1000"`；不足 20 或到达上限时计数文字用 `var(--candle)` 提示（不新增色）。
- IME：中文输入过程中的 `isComposing` 若用于快捷键（本表单无快捷键，仅记录约束）不得误判；聊天框必须处理（见 §5.4）。

### 4.4 信件墙规格

- 容器：`.letter-stack`（既有 grid + `max-width:58rem`），复用 `.letter.parchment` / `.letter-date` / `.letter-body`，`.letter:nth-child(even){margin-left:min(6vw,4rem)}` 的错落自动生效；≤900px 被既有规则清零。
- 新卡结构（**每一处 i18n 只挂叶子**，动态生成时遵守）：

```html
<article class="letter parchment">
  <p class="letter-date">
    <time datetime="2026-11-26">2026.11.26</time>
    <span data-i18n="letter.wall.from">from</span>
    <span class="letter-signature">USER NAME — textContent only, NO data-i18n</span>
  </p>
  <p class="letter-body">USER BODY — textContent only, NO data-i18n</p>
</article>
```

- 日期用**语言中立数字格式 `YYYY.MM.DD`**（配 `<time datetime>`）：迎合档案感，且语言切换时 `apply()` 不会改它。既有 3 封文学式日期（"14 November"）与读者信数字日期形成"馆藏 vs 来访"的刻意区分，非 bug。
- UGC 渲染纪律：**署名与正文一律 `textContent` 写入，绝不 `innerHTML`，绝不挂 `data-i18n`**。`apply()` 用 `textContent` 覆盖会抹掉用户内容；`innerHTML` 会带来 XSS。
- 语言切换：静态叶子（`letter.wall.from`、空态、加载态）挂 `data-i18n`，由既有 `apply()` 自动覆盖；动态节点创建时先按 `ShrineI18n.dict[ShrineI18n.current()]` 直接写入文案，再挂 `data-i18n` 以便后续切换。
- 来信原文展示不翻译：说明文案 `letter.wall.note`（en `Letters appear as written, in their original language.` / zh `来信按原文展示，不翻译。` / fr `Les lettres sont affichées telles qu'écrites, dans leur langue d'origine.`）。

| 状态 | 表现 |
|---|---|
| Loading | 墙顶部一条 `.letter.parchment` 骨架（纯 CSS 背景 `var(--line)` 微光，reduced-motion 停），`aria-busy="true"` |
| Empty | 一张 `.letter.parchment`，`letter.wall.empty`："还没有信。第一页留给你。" + 锚点按钮跳到表单（复用 `.btn.btn-ghost`） |
| Error | 内联 `.form-error` + retry 按钮，不阻断表单使用 |
| Populated | 按提交时间倒序，新信插首条；超过 50 封时"显示更早"分页/追加按钮（`letter.wall.more`），不一次性渲染全部 |
| Edge | 超长正文 `overflow-wrap:break-word`（h1 已有同类修复）；姓名 40 字符上限防撑破；emoji 作为 UGC 允许出现在正文，但不得出现在 UI 标签位 |

---

## 5. 组件 C：与主角在线聊天（站内原生 UI）

### 5.1 位置权衡：新增第 8 页 vs 嵌入既有页

> **本轮结论**：用户已拍板 **方案 A**（独立 `chat.html` + 全站 nav），下表方案 B 已作废，保留作历史权衡留痕。

| 维度 | 方案 A：新增 `chat.html`（第 8 页）—— **已采用** | 方案 B：嵌入 `letters.html`（已作废） |
|---|---|---|
| header/footer 一致性 | 新增页要复制完整 header/footer 两块（含心形 SVG 逐字）；若要导航可达，还要改 **7 页** nav + 3 语 `nav.chat` | **零改动**；7 页 header/footer 保持逐字一致 |
| 320px 回归面 | 新增 2 个题献实例（顶带 + 藏书票），320/360 × 3 语全部要重验；底部 Georgia 回退 11.52px 是全场最紧 | 回归面 0；不触碰最紧的两处 |
| i18n 工作量 | `nav.chat` ×3 + `?v=` 7 页同步；漏一处即静默露出英文 | 无 nav 键；只加组件自身键 |
| 页面性能 | 聊天 JS 只在该页加载，其他 7 页零成本 | `letters.html` 多一个脚本；其余 6 页零成本 |
| 心智模型 | "和他说说话"是独立入口，语义清晰 | 与"给他写信"同页，同属"联系他"，语域一致；但需靠 section 标题与入口按钮保证可发现 |
| 布局自由度 | 可做全高面板、固定底栏输入 | 面板自带内部滚动（`max-height:clamp(18rem,52vh,34rem)`），不依赖 sticky，不干扰长页滚动 |
| 可撤销性 | 改动面大，回滚要动 7 页 | 单页增量，回滚只动 1 页 |

**本轮裁决：方案 A（独立 `chat.html`）**——用户明确要求「新增对话入口，确保主要页面可正常访问」。`chat.html` 已落地，8 页 nav 已加 Chat 项，CDP 真视口实测 320/390/1440 × en/zh/fr 零溢出、题献带单行、名字不断行；320px 下 nav 按 `flex-wrap` 换成两行属预期，不破版。

**可发现性兜底（不碰 header/footer）**：在 `letters.html` 页头 `.lead` 之后加一条 `.hero-actions` 样式的双按钮行（`.btn` 锚点到表单 + `.btn.btn-ghost` 锚点到聊天 section），用既有 `.hero-actions` 类但放在页内（不是 Hero，不触发千篇一律 Hero 红线）。若 owner 坚持要全站可达，安全升级顺序为：① 只改 `index.html` 的"三扇门"文案/卡片（内容层，1 页）→ ② 最后才考虑 nav 第 7 项，且必须用一次脚本化原子替换 7 页 header 并做逐字 diff。

**明确禁止**：不采用 AI-Chat-Assistant 模板的「外部 script + iframe 挂件」。虽然零外链约束已解除，但该方案仍违反 Token 纪律、i18n 叶子规则、320px 余量控制与站点语域四条红线，且失去站内原生 UI 的一致性。外链边界见 SPEC §3。

### 5.2 面板结构

```html
<section class="chat-panel parchment" id="chat" aria-labelledby="chat-title">
  <h2 id="chat-title" data-i18n="chat.title">Speak with him</h2>
  <p class="lead" data-i18n="chat.lead">The candle is lit. Say anything.</p>
  <p class="small muted" data-i18n="chat.disclaimer">A fictional character, not a real person. Do not treat replies as real-life advice.</p>

  <div class="chat-log" role="log" aria-live="polite" aria-relevant="additions text" aria-label="…data-i18n-aria">
    <!-- 空态 / 欢迎卡 / 消息序列 / 系统提示 -->
  </div>

  <form class="chat-compose">
    <label class="sr-only" for="chat-input" data-i18n="chat.placeholder">Message him</label>
    <textarea id="chat-input" rows="2" maxlength="500"></textarea>
    <button type="submit" class="btn" data-i18n-aria="chat.send"><span data-i18n="chat.send">Send</span><svg>send icon</svg></button>
    <button type="button" class="btn btn-ghost" hidden data-i18n-aria="chat.stop"><span data-i18n="chat.stop">Stop</span><svg>stop icon</svg></button>
  </form>
  <p id="chat-status" class="sr-only" aria-live="polite"></p>
</section>
```

- `.chat-panel` 直接用 `.parchment`（自动拿到边框、大内距、`var(--shadow)`、伪元素暖光）；内部 `.chat-log` 用 `border-top:1px solid var(--line)` 分隔，`background:var(--charcoal)`。
- `chat.disclaimer`（虚构角色、非真人、勿作现实建议）按 PRD F3-AC7 **常驻可见**——放在 `.lead` 之后、`.chat-log` 之前，用既有 `.small.muted`，不随对话状态隐藏；三语缺一不可。
- 面板不需要 sticky / fixed：消息列表自带 `overflow-y:auto`，compose 在正常流中跟随；避免与全站 `scroll-behavior:smooth` 打架（PITFALLS 六/八：滚动截图与 scrollIntoView 坑）。

### 5.3 消息气泡规格（反"圆角 + 紫粉渐变 + 头像圆圈"模板）

| 元素 | 规格 |
|---|---|
| 我方消息 | 右对齐；`background:var(--ink-soft)`；`border:1px solid var(--line)`；`color:var(--parchment)`；字号 `var(--fs-base)`；内距 `var(--space-2)`；**0 圆角**（ADR-T2）；`max-width:85%`；`overflow-wrap:break-word` |
| 角色消息 | 左对齐；20px 心形 SVG 头像（`aria-hidden="true"`，沿用锁定 heart path）；气泡 `background:var(--charcoal)`；`border:1px solid var(--line)`；角色名 `.chat-author` 用 `var(--bronze-light)` + `--fs-sm` + `.1em` 字距（zh `.06em`） |
| 系统提示 | 居中，`.small.muted`，`var(--parchment-dim)`；用于"已停止""内容被过滤""历史已折叠" |
| 消息间距 | `--space-3`（1.75rem）；同呼吸节奏，不做时间轴/竖线装饰 |
| 双方区分 | 位置 + 背景亮度（`#16241f` vs `#141412`）+ 头像；**不靠颜色单独编码**（WCAG 1.4.1） |

### 5.4 交互、流式与停止

| 环节 | 规格 |
|---|---|
| 打开 | 点击页内锚点滚动到 section（`scrollIntoView({behavior:'instant'})`，不用 smooth）；焦点落到 `#chat-input`；`prefers-reduced-motion` 下无过渡 |
| 发送 | Enter 发送、Shift+Enter 换行；**必须监听 `compositionstart/end` 用 `isComposing` 守卫**，中文输入法选字时按 Enter 不得误发（与 `lang.zh` 三语站强相关） |
| 提交中 | 发送按钮 `disabled` + `aria-busy`；停止按钮显示（`hidden` 移除）；输入清空但保留最后一次草稿副本直至成功 |
| 流式输出 | 增量文本写入**专用叶子 `<p>`（无 `data-i18n`）**；流式期间该节点 `aria-live="off"` 避免读屏逐字轰炸；完成时把完整文本写入 `#chat-status`（`aria-live="polite"`）播报一次 |
| 自动滚动 | 直接 `log.scrollTop = log.scrollHeight`，**不用 smooth**；用户手动上滚超过 60px 时暂停自动跟随，显示"回到最新"按钮（`chat.jumpLatest`，`.btn.btn-ghost`） |
| 停止 | 中止请求（架构师提供 abort 契约）；停止按钮回到隐藏、发送按钮恢复；系统提示 `chat.stopped`；焦点回 `#chat-input` |
| 空态 | 欢迎卡 `chat.intro` + 3 个建议提示按钮 `chat.prompt1..3`，点击填入输入框（不自动发送）；按钮用 `.btn.btn-ghost`，方角、全宽仅 ≤560px |
| 错误 | 分类文案 `chat.error.network` / `.rate` / `.safe` / `.server`，配 `retry` SVG + `.btn.btn-ghost`；**不暴露网关原始错误**；重试保留上下文 |
| Edge | 输入 `maxlength="500"`；历史最多 20 轮，超出折叠最早轮并给 `chat.edge.history` 提示；超长输出按后端截断策略显示 `chat.edge.truncated`；内容安全走温和 shrine 语域文案，不说教 |
| 移动端 | 单列；`.parchment` 内距由既有 `@media(max-width:560px)` 收到 `1.2rem`；气泡 `max-width:85%`；发送/停止按钮 ≥44×44px（对齐 `.lang-switch button` 先例）；≤560px 全宽按钮由既有 `.btn` 规则生效，不再写新规则 |
| **不可用（后端错误）** | 表单与聊天保持可见，显示分类错误文案（network/rate/server/invalid）+ 重试入口；不隐藏区块、不伪装成功 | ESA 已下线，无跨平台能力探测与四重校验；单链路下后端不可用属错误态，不是降级态。架构依据 ARCHITECTURE v1.1.0 §6 |
| **无脚本 / 离线** | 静态内容（题献带、三封日记、语录、图库）正常可读；表单与聊天因 `hidden` 默认不显示，旁边的静态说明可见 | 不出现空白页、不静默丢弃输入（PRD §8） |

### 5.5 无障碍专项

- 面板：`<section aria-labelledby="chat-title">`；消息列表 `role="log"` + `aria-live="polite"` + `aria-relevant="additions text"`；状态用独立 `#chat-status`。
- 焦点管理：打开 → 输入框；发送后 → 保持在输入框；停止 → 回输入框；错误重试 → 焦点到重试按钮；**不做焦点陷阱**（非模态）。
- 语言切换：`apply()` 重设 `html.lang` 与所有叶子标签；聊天历史原文不动；模型回复语言由前端把 `ShrineI18n.current()` 传给后端（**跨团队依赖，见 §6.4**）。
- reduced-motion：思考指示的透明度脉动只在 `@media (prefers-reduced-motion:no-preference)` 内；`reduce` 下无动画、无平滑滚动（既有第 762–766 行块必须保持为最后一段）。

### 5.6 CSS 落点（防覆盖陷阱）

- 新组件的**基础规则插到 `style.css` 第 702 行 `:focus-visible` 之后、`@media (max-width:900px)`（第 717 行）之前**。
- 响应式规则**写进既有的 717–760 行媒体块内**，不要新开媒体块。
- **绝对不要把新规则追加到文件末尾**：末尾是 `@media (prefers-reduced-motion:reduce)`（762–766 行），追加会把"无动画"兜底覆盖掉（PITFALLS 二：媒体查询不提高特异性，后写同特异性会赢）。

---

## 6. i18n 影响清单

### 6.1 键命名与三语一次补齐

> 所有新键必须在 `i18n.js` 的 `en` / `zh` / `fr` **三个字典对象里同批出现**；`en` 值与 HTML 兜底逐字一致。缺键时 `apply()` 静默保留英文兜底，无报错（PITFALLS 五）。

| 组 | 键 | 用途 | 挂载方式 |
|---|---|---|---|
| 撒糖 | `sweet.title` / `sweet.lead` / `sweet.note` | 新 section 标题、引言、声明 | 叶子 `[data-i18n]` |
| 撒糖 | `sq1.text` … `sq4.text` | 四句原创短句 | 叶子 `<p class="quote-text">` |
| 撒糖 | `sq1.src` … `sq4.src` | 诗意来源标签 | 叶子 `<span class="quote-source">` |
| 表单 | `letter.form.title` / `.lead` / `.name` / `.body` / `.bodyHint` / `.privacy` | 表单区标题、字段标签、字数提示、首次聚焦隐私提示（20–1000 字口径） | 叶子 `[data-i18n]` |
| 表单 | `letter.form.submit` / `.sending` / `.success` / `.another` | 按钮与成功态 | 叶子 `<span>`（按钮内 SVG 为兄弟） |
| 表单 | `letter.form.error.network` / `.server` / `.rate` | 提交级错误分类 | 叶子 `[data-i18n]` |
| 表单 | `letter.form.retry` | 重试按钮文字 | 叶子 `<span>` |
| 信件墙 | `letter.wall.title` / `.lead` / `.empty` / `.loading` / `.error` / `.from` / `.more` / `.note` | 墙标题与各状态 | 叶子 `[data-i18n]` |
| 聊天 | `chat.title` / `.lead` / `.open` / `.intro` / `.placeholder` / `.send` / `.stop` / `.retry` / `.stopped` / `.disclaimer` | 面板静态文案；`disclaimer` 为虚构角色常驻声明 | 叶子 `[data-i18n]`；图标按钮另配 `data-i18n-aria="chat.send"` 等 |
| 无脚本 | `common.noScript` | 无 JS 时静态内容可读、交互不可用的说明 | 叶子 `[data-i18n]`；本轮已下线 ESA，不再使用 `common.readonlyNotice` |
| 聊天 | `chat.prompt1` / `.prompt2` / `.prompt3` | 空态建议 | 叶子 `<span>` |
| 聊天 | `chat.typing` / `.jumpLatest` / `.error.network` / `.error.rate` / `.error.safe` / `.error.server` | 状态与错误 | 叶子 `[data-i18n]` |
| 聊天 | `chat.edge.history` / `.edge.truncated` | 边界提示 | 叶子 `[data-i18n]` |

### 6.2 硬规则

1. `data-i18n` **只能挂叶子节点**（无子元素）。`apply()` 对 `[data-i18n]` 执行 `textContent =`，挂容器会抹掉内联 SVG 和子 span（PITFALLS 五 + 第四轮题献框实测）。
2. 需要保留行内标记才用 `data-i18n-html`（如既有 `g8.cap` 的 `.ord`）；**新文案一律不写行内标记**，不用该通道。
3. 图片替代文本用 `data-i18n-alt`；无障碍名用 `data-i18n-aria`。
4. 动态 UGC（读者署名/正文、聊天消息）**不挂任何 `data-i18n`**，用 `textContent` 写入；切换语言时它们保持原样（来信不翻译，见 §4.4）。
5. 新增中文文案语域对齐既有用词：题献用「与」不用「和」（`devotion.and`）；声明用「避雷与声明」（`dis.title`）；语气克制，不出现"欢迎""立即体验""解锁"。
6. 中文小标签字号：若新增类在小字清单内，沿用 `html[lang="zh-CN"] … { font-size:1.0625rem }` 的既有写法，不写绝对 14px（PITFALLS 五：相对值随 root 缩放属预期）。
7. 兜底一致性校验脚本（`check_fallback.js`，session log 记录过 `dis.4` / `gallery.note` 漂移）必须扩展到全部新键：逐页比对 HTML 兜底文本与英文字典。

### 6.3 `?v=` 版本串

- 改造前：`style.css?v=20261125d`、`i18n.js?v=20261125d` 在 7 页同步；`main.js` 目前无版本串。
- 改动 `i18n.js` / `style.css` → **8 个页面**的对应 `?v=` 必须同步升级；否则用户端读缓存旧字典，新键静默缺失（PITFALLS 五 + 第七轮 `dis.bio` 事故）。
- 新增 `chat.js` / `letters.js`（建议独立文件，`defer` 且排在 `main.js` 之后）必须自带 `?v=`，并把该版本串纳入 8 页同步表。
- 版本号由 team-lead **已锁定为单一真相源 `20261126a`**（非建议值）；**8 页共 16 处**同步到此值，**本轮已实测一致**；前端不得自定版本串（PITFALLS 八：单向下发）。
- 缓存策略不改：`/assets/css/*`、`/assets/js/*`、HTML 用 `no-cache`；图片/字体保持长缓存 `immutable`（第六轮缓存事故结论）。

### 6.4 接口契约与跨团队依赖（架构师已锁定，无需再确认）

> 以下端点名以 `openapi.yaml` / `ARCHITECTURE.md` §3 为准，**逐字写死**；特别地，聊天**没有** `/api/chat`。

| 用途 | 方法 + 路径（锁定值） | 运行时 | UI 侧要点 |
|---|---|---|---|
| 列出信件 | `GET /api/letters?page=&limit=&locale=` | Cloud Functions | 前端 `limit=50` 逐页；新→旧 |
| 提交信件 | `POST /api/letters` | Cloud Functions | 201 + id；400/429/500 见下方映射 |
| 聊天（SSE） | `POST /chat` | Agents（`agents/chat/index.ts`） | **不是** `/api/chat`；必带 `makers-conversation-id` 头 |
| 停止生成 | `POST /stop` | Agents（`agents/stop/index.ts`） | body `conversation_id`；**不带** `makers-conversation-id` 头 |
| 埋点（P1，非 MVP） | `POST /api/events` | Cloud Functions | 失败静默丢弃，不阻塞主流程 |
| 单链路部署 | 仅 CNB `origin` 触发 EdgeOne；GitHub 仅代码备份 | ARCHITECTURE v1.1.0 §6 | ESA 已下线，无跨平台探测分支 |

- 模型回复语言：前端把 `ShrineI18n.current()` 作为 `locale` 参数传给 `POST /chat`，后端 system prompt 追加"用用户当前界面语言回复，并保持 shrine 的克制语气"。UI 侧不负责翻译。
- 网关：`https://ai-gateway.edgeone.link/v1`，模型 `@makers/deepseek-v4-flash`（服务端持有）。**前端只调上表同源端点**，不硬编码网关地址或密钥，不出现第三方域名请求（外链硬约束）。
- 错误码映射已锁定（后端 9 码不改）：`network`（fetch 抛错且非主动 abort）→ `letter.form.error.network` / `chat.error.network`；`rate` 42901 → `.rate`；`server` 40301/40401/50001/50002 → `.server`；`invalid` 40001/40002/40003 → 字段级 `.form-error` + `alert` 图标，**不进 banner**（400 系列走内联，避免"正文太短"被误报成服务器错误）；聊天 `error_message` 事件携带同一 `code`，`code` 缺失按 `server` 处理，一律不暴露网关原文。
- abort 契约已锁定：前端每轮新建 `AbortController`，传 `signal` 给 `POST /chat`；点停止立即 `controller.abort()` 并 fire-and-forget 调 `POST /stop`（body `{conversation_id}`，无会话头），避免客户端断开但服务端继续计费。主动 abort 的 `AbortError` **不显示"网络错误"重试提示**（PRD F3-AC3）。

---

## 7. 素材处理规范（恋爱日志 / 日记图片）

### 7.1 视觉筛选：指标只筛色调，目检定内容

> 以下全部来自 PITFALLS 四与 session log 第三轮的实测教训，**不得退回"看一眼觉得氛围对"**。

| 步骤 | 判据 |
|---|---|
| 1. 主题意象 | 手写信笺、摊开的日记、干花、烛台旁的本子、系带的纸、两只用过的杯子。**禁止角色肖像、禁止明确亲密行为画面、禁止亮奶油色摆拍**（站点硬规则：无角色肖像；暖调靠滤镜与强调色，不靠米白背景） |
| 2. 灰度直方图 | 先看中位 / P90 / >30 像素占比。历史反例：主图中位 1.0、P90 3.9、仅 1.8% >30 → 是"没有图像数据"，不是"氛围暗"；换图后均值 3.7 → 74.8 |
| 3. 暖偏指标 | 只作色调筛选：需与铜金色系相容（历史可用例 R 47.5 > B 34.9；反例中性灰 55/55/48 加滤镜仍不合） |
| 4. 目检（不可省） | **指标最像目标的图可能内容完全错**：暖偏 +35.8 的"壁龛墙角"实为粉刷墙面。必须看缩略图内容 |
| 5. Contact sheet | 批量检索把候选缩略图**拼成一张 sheet 一次目检**（历史：14 张拼 1200×930，一次排除外景/肖像/教堂/建筑图纸），不逐张下载原图试错 |
| 6. Commons 缩略图宽度 | 只用白名单宽度（1280 / 1920）；任意宽度返回 `400 Use thumbnail sizes listed` |
| 7. 下载韧性 | SSL 握手间歇失败，批量下载带重试；一次失败不判能力不足 |

### 7.2 许可与署名

- 许可优先级：**PD / CC0 / CC BY**（owner 已确认简单署名可接受）；**避免 CC BY-SA**——裁切即属修改，衍生图须继续以 SA 分发，有传染性。
- 署名落地：沿用 `.gallery-credit`（`--fs-xs`、`opacity:.62`、`margin-top:.45rem`、`--parchment-dim`），排在 caption 的 note 之后，作者名与许可名三语共用同一串（不翻译），**不产生任何外链**。
- 声明文案须同步三语 `gallery.note` 与 `dis.4`：新增素材若含 CC BY，需在声明里如实写明"其中一张/数张依 CC BY 使用，经裁切并在图注下方署名"。

### 7.3 工程规格

- 转 webp，单文件 ≤300KB（历史最大 235KB）。
- `<img>` 必须带**与 webp 实际像素逐一比对**的真实 `width` / `height`，防 CLS 与撑破布局（PITFALLS 四）。
- 首屏 LCP 图用 `fetchpriority="high"`，**不要** `loading="lazy"`；图库区一律 `loading="lazy"`（图库页 LCP 是 h1，不是图片）。
- `data-i18n-alt` 三语一次补齐，描述主体而非情绪。

### 7.4 图库扩写时的网格零空洞规则（最容易翻车）

现有 `gallery.html`：12 项 = 9 单格 + 3 通栏（位置 4 / 8 / 12），3 列下 18 格 = 6 行，零空洞。

- **3 列（>900px）**：维护"自上一个通栏以来的单格计数 `k`"。通栏只能在 `k ≡ 0 (mod 3)` 时放置（即落在该行第 1 列）。现有末项是通栏（第 12 位），故第 13 位是行首，可直接放通栏；但"通栏后再加 2 张单格再放通栏"会产生空洞。最稳妥：**以 3 张单格为一组追加，通栏只放在组与组之间**。
- **2 列（768–900px）**：`grid-auto-flow:row dense` 会回填，但既有 `.gallery-item:last-child{grid-column:auto}` + `aspect-ratio:4/5` 规则限定在该区间（PITFALLS 二/三：必须限定区间，不能只写上界）。**追加素材后若末项变成通栏，这条规则会把它在两列下强行降为单格**——要么保持末项为单格，要么把规则改为 `.gallery-item:last-child:not([data-ratio="wide"])` 并重跑断言。
- **≤767px**：单列，`data-ratio="wide"` 自动 `grid-column:auto`、`aspect-ratio:auto`；天然无空洞。
- **必须跑跨度打包断言**（session log 的 `verify_site.js`：模拟 3 列无 dense、2 列 dense + 末张单格），不靠肉眼数图。

---

## 8. 验收清单

### 8.1 视口 × 语言矩阵（必测 12 格 + 断点补充）

| 视口 \ 语言 | en | zh-CN | fr |
|---|---|---|---|
| 320 | 顶带单行 / 底部框单行 / 无横溢 / 名字不断行 | 同左 + 中文标签字距 | 同左 + `XIXe` 上标未回退 |
| 360 | 同 320 | 同 320 | 同 320 |
| 390 | 同 320 | 同 320 | 同 320 |
| 1440 | 顶带单行 / 底部框单行 / 栏宽对齐 | 同左 | 同左 |
| 补充 768 / 820 / 900 | 图库两列 + 末张规则 | 同左 | 同左 |

> 每格都要看**顶部题献带**与**底部藏书票框**两处，不只是页面主体。

### 8.2 判定算法（写进验收，消除实现歧义）

| 项 | 判据 |
|---|---|
| 「单行」 | **容器高度法**：`rect.height / lineHeight ≈ 1`；或成对元素 `Math.abs(rect1.top - rect2.top) < 2`。**禁止**用 `rect.top` 去重——心形有 `translateY(-.045em)`，亚像素会把单行判成多行 |
| 横向溢出 | `document.documentElement.scrollWidth === document.documentElement.clientWidth`（三语 × 四视口全为 0） |
| 名字不断行 | `.devotion-name` 计算样式 `white-space:nowrap`，且 `getClientRects().length === 1`；跨区域查询必须带 `.devotion--plate` / `.devotion--seal` 前缀（同名类 4 个实例，单数选择器只取第一个） |
| 字体宽度口径 | 定稿用 `getBoundingClientRect().width`（小数）；`clientWidth` 是整数。+0.41px 偏差只在 ≤560px 且 root=16px 时出现，属正常 |
| 浏览器视口 | 用 CDP `Emulation.setDeviceMetricsOverride`。**禁止** `--window-size=390`（headless Chrome on Windows 有约 526px 最小视口，会假报溢出）；**禁止**用 `--dump-dom` 测布局 |
| 截图 | `scrollIntoView({behavior:'instant'})` 后留 700ms；整页 >1600 CSS px 纵向分片再拼接；CDP 探针页去掉 `loading="lazy"`（不要在 CDP 里注入滚动循环） |
| 根字号 | 不新增 `html{font-size}` 覆写；root = 13/16/20/32px × 320px 下横溢均为 0（WCAG 1.4.4），题献框折行是合规行为不是缺陷 |

### 8.3 回归红线（改任一项即重验指定项）

1. **`≤359px` 细线 `display:none`** → 重验 320 顶部（本次不改，保持）。
2. **任何 `font-weight ≥ 500`** → 重验 320 底部（Georgia 回退余 11.52px）。**本契约的三个组件零新增 ≥500 规则**；若前端为按钮/标签私自加 500/600，必须当场打回并重测（假 600 与 400 的 woff2 MD5 相同，真加粗会吃约 10px 且不报错）。
3. **`padding-inline` 或字号下限** → 重验 320/360 底部（本次不改）。
4. **不得给 `html` 加 `font-size` 覆写**（拿用户字号偏好换账面余量，方向反了）。
5. **改 `assets/css/*` 或 `assets/js/*`** → 同步升 7 页 `?v=`（见 §6.3）。

### 8.4 功能与合规验收

- [ ] **i18n**：三语字典零缺键 × 7 页 × 所有 `data-i18n` / `-alt` / `-aria` 实测；HTML 兜底 === 英文字典；`?v=` 7 页同值。
- [ ] **UGC 安全**：读者署名/正文与聊天消息全站 `textContent` 写入；emoji 扫描正则 `[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]` 对新增源码扫描结果为 **0**（UGC 输入内容不计，但 UI 标签位必须 0）。
- [ ] **外链边界**：前端不加载第三方 script / iframe / 统计脚本（必要外链仅服务端网关、素材署名与来源链接）；静态首屏不依赖外链。
- [ ] **P0 视觉**：无紫→粉渐变；无裸 hex（除 #fff/#000）；无 Hero 模板；无空洞占位文案（"Welcome to"/"Lorem ipsum"/"Get started"）；无 emoji 功能图标。
- [ ] **图标**：全部来自 §2 锁定内联 SVG，尺寸 16/20/24；心形 path / viewBox 一字未改。
- [ ] **Token**：新增 CSS 零新增自定义属性；新增类仅引用 §1.1 的既有变量；ADR-T1/T2 未被推翻。
- [ ] **表单**：键盘可完成填写—提交—成功—再写一封全流程；错误就近显示且 `aria-invalid` + `aria-describedby` 就位；失败不清空正文；成功焦点转移 + `aria-live` 播报。
- [ ] **聊天**：Enter / Shift+Enter / IME 组合输入正确；流式期间读屏不逐字轰炸、完成播报一次；停止可用并回焦输入框（`AbortError` 不显示重试）；错误四分类（network/rate/server/invalid）文案可读；`chat.disclaimer` 三语常驻可见；reduced-motion 下无动画。
- [ ] **接口名**：全文件与实现无 `/api/chat`；聊天为 `POST /chat`、停止 `POST /stop`、信件 `POST|GET /api/letters`、埋点 `POST /api/events`；`/chat` 带 `makers-conversation-id` 头而 `/stop` 不带。
- [ ] **表单契约**：正文 20–1000（19/20/1000/1001 边界实测）；署名可空且 ≤40；蜜罐字段 `website` 非空静默丢弃；首次聚焦显示 `letter.form.privacy`；400 系列走字段内联不进 banner。
- [ ] **单链路**：无 ESA 能力探测分支；后端错误走分类文案 + 重试，不隐藏区块；无 console error、无布局塌陷。
- [ ] **图库（若扩写）**：跨度打包断言 PASS；`width`/`height` 与 webp 实际像素一致；单文件 ≤300KB；许可台账含作者 + 许可 + 裁切说明；署名行三语一致且无外链。
- [ ] **header/footer**：8 页 header/footer 逐字 diff 为 0（含 CRLF 一致）；本轮已实测 PASS。
- [ ] **截图留档**：320/360/390/1440 × en/zh/fr 四视口三语言的顶部带、底部框、三个新组件各一张，路径交 team-lead。

---

## 9. P0 自检（设计师自查，逐条通过）

| P0 | 检查 | 结论 |
|---|---|---|
| P0-1 emoji 作功能图标 | 全部图标为 §2 锁定的内联 SVG；文档与提案文案零 emoji | 通过 |
| P0-2 紫→粉渐变主视觉 | 无渐变；仅复用既有深墨绿/铜金 token | 通过 |
| P0-3 AI 模板味 | 无 Hero、无空洞占位；四句语录与提示语均为 shrine 语域原创具体文案；聊天气泡方角非圆角 | 通过 |
| 默认系统字体直出 | 复用 `--font-display/body/zh/fr` 既有本地字体栈，不新增字体 | 通过 |
| 硬编码颜色 | 新增 CSS 仅 `var()`；ADR-T1 拒绝引入 danger 色 | 通过 |
| 图标/字体先冻结 | §1 Token 表 + §2 图标白名单已冻结 | 通过 |
| 可访问交互 | focus-visible、键盘全流程、aria-live、reduced-motion、≥44px 触控 | 通过 |
| 完整 Design Token | 沿用既有 28 个 token，零新增；附录 A 给机器可读镜像 | 通过 |

---

## 附录 A：既有 Token 机器可读镜像（供前端校验，不落盘为新文件）

```json
{
  "color": {
    "ink":          { "value": "#0e1a17", "type": "color" },
    "ink-soft":     { "value": "#16241f", "type": "color" },
    "bronze":       { "value": "#b08d57", "type": "color" },
    "bronze-light": { "value": "#d6b47a", "type": "color" },
    "parchment":    { "value": "#e8dcc0", "type": "color" },
    "parchment-dim":{ "value": "#c9bda4", "type": "color" },
    "charcoal":     { "value": "#141412", "type": "color" },
    "candle":       { "value": "#f3d9a4", "type": "color" },
    "line":         { "value": "rgba(176,141,87,0.28)", "type": "color" },
    "shadow":       { "value": "0 18px 50px rgba(0,0,0,0.45)", "type": "boxShadow" }
  },
  "font": {
    "display": { "value": "Cinzel, Georgia, serif", "type": "fontFamily" },
    "deco":    { "value": "Cinzel Decorative, Cinzel, Georgia, serif", "type": "fontFamily" },
    "hero":    { "value": "Cormorant Infant, Cormorant Garamond, Georgia, serif", "type": "fontFamily" },
    "body":    { "value": "Newsreader, Cormorant Garamond, Georgia, serif", "type": "fontFamily" },
    "fr":      { "value": "Spectral, Newsreader, Georgia, serif", "type": "fontFamily" },
    "zh":      { "value": "LXGW WenKai, Songti SC, serif", "type": "fontFamily" }
  },
  "size": {
    "xs":   { "value": "clamp(0.78rem, 0.76rem + 0.1vw, 0.84rem)", "type": "dimension" },
    "sm":   { "value": "clamp(0.82rem, 0.80rem + 0.15vw, 0.9rem)", "type": "dimension" },
    "base": { "value": "clamp(1.06rem, 1rem + 0.35vw, 1.2rem)", "type": "dimension" },
    "md":   { "value": "clamp(1.3rem, 1.15rem + 0.8vw, 1.6rem)", "type": "dimension" },
    "lg":   { "value": "clamp(1.8rem, 1.4rem + 2vw, 2.6rem)", "type": "dimension" },
    "xl":   { "value": "clamp(2.6rem, 2rem + 4vw, 4.4rem)", "type": "dimension" }
  },
  "space": {
    "1": { "value": "0.5rem", "type": "dimension" },
    "2": { "value": "1rem", "type": "dimension" },
    "3": { "value": "1.75rem", "type": "dimension" },
    "4": { "value": "3rem", "type": "dimension" },
    "5": { "value": "5rem", "type": "dimension" }
  },
  "motion": {
    "ease": { "value": "cubic-bezier(0.22, 1, 0.36, 1)", "type": "cubicBezier" }
  }
}
```

---

## 附录 B：给前端的交接要点（顺序不可乱）

1. 先读本文件 §1 / §2，确认零新增 token、图标白名单；再动 CSS。
2. CSS 基础规则插在 `style.css` 第 702 行后、第 717 行前；响应式写进既有 717–760 媒体块；`prefers-reduced-motion:reduce` 块永远最后。
3. `features.js` 用 `defer` 排在 `main.js` 之后；DOMContentLoaded 里先判断目标节点存在再初始化；动态节点先按当前 dict 写文案再挂 `data-i18n`。
4. 语言切换只依赖既有 `apply()`；**不要**改 `main.js` 的焦点管理逻辑（`refreshLanguage` 已保护键盘焦点）。
5. 接口与错误码已锁定（见 §6.4）：聊天 `POST /chat`、停止 `POST /stop`、信件 `POST|GET /api/letters`、埋点 `POST /api/events`；**无 `/api/chat`**。UI 状态机按 network/rate/server 三类 banner + `invalid` 字段内联实现；abort 按 §6.4 契约（abort + fire-and-forget `/stop`），无需再与 architect 对齐。
6. 交付时附 §8.4 的所有断言输出与 12 格截图路径；任何"全绿"须标明测的是哪一份文件（PITFALLS 八：成员全绿可能是自拼版本）。

---

**文档结束。设计师裁决：pass（设计契约层面），无 blocking 项；advisory 见 §6.4 的三项跨团队依赖待 architect / PM 确认。**
