# AGENTS.md · Nafisah Shrine

给接手本项目的 AI agent 的工作规范。面向执行，不写背景故事。

## 开工前必读

1. **`.learnings/PITFALLS.md`** —— 62 条坑，按现象组织。动手前扫一遍相关章节。
2. **`.learnings/session-logs/2026-11-25.md`** —— 按时间记录了每个判断是怎么得出的、后来哪里判断错了。

这两份是仓库里的事实源，优先级高于任何口头约定。

## 项目性质

三语（en / zh / fr）同人站，8 个页面。静态展示层无构建步骤；F1–F3 功能层按需新增 `package.json` 与 EdgeOne Functions，仍无框架、无 CDN。**必要的外部链接允许**（见硬约束 7），但静态首屏不依赖外部资源。

- 页面：`index` / `about` / `quotes` / `letters` / `gallery` / `conversation` / `disclaimer` / `404`（对话页文件名是 `conversation.html`，不是 `chat.html`——后者会遮蔽同名 Agent 路由 `/chat`）
- 样式：`assets/css/style.css`（单文件）
- 逻辑：`assets/js/i18n.js`（三语字典 + 状态机）、`assets/js/main.js`（reveal、导航、语言按钮）
- 素材：`assets/img/*.webp`（12 张）、`assets/fonts/*.woff2`（34 个本地字体分片）
- 部署声明：`edgeone.json` / `.cnb.yml`（单链路 EdgeOne Makers）

## 硬约束（改了就破，逐条有实测背书）

### 1. 八个页面的 header / footer 必须逐字一致

每页 `.site-header` 与 `.site-footer` 整段与 `index.html` 完全相同，各页新增块字节数一致。改一处必须同步八处，改完做逐字 diff。新增对话页后基线从 7 页变为 8 页（文件名 `conversation.html`，见上）。

### 2. i18n 三件套必须一起动

改任何文案时：

1. **三语字典同时补齐** —— `apply()` 的逻辑是「dict 有 key 才覆盖」，缺 key 会**静默保留 HTML 里的英文**，不报错
2. **HTML 无脚本兜底同步更新**，且必须与英文字典逐字一致
3. **`?v=` 版本串升级** —— 7 个页面的 `style.css?v=` 与 `i18n.js?v=` 都要升。不改版本串，浏览器会用缓存里的旧字典，新 key 在用户端等于不存在

当前版本串：`20261126a`（本轮新增 chat 页与文案后升级）。

### 3. `data-i18n` 只能挂叶子节点

`apply()` 用 `node.textContent = value` 覆盖。挂到容器上会把内联 SVG 和子元素整段抹掉。需要保留标签时用 `data-i18n-html`（走 `innerHTML`），目前仅 `gallery.html` 的 `g8.cap` 一处使用。

读屏连接词的 DOM 顺序必须是 **`name → sr-only(and) → heart → name`**。顺序错了读屏念成「Nafisah Riddle Tom Riddle and」，框选复制粘连成 `Riddleand`。

### 4. 心形是内联 SVG，不要换成字符

34 个字体子集全部不含 `♥` / `♡` / `❤`。实测几何：`viewBox="0 0 24 22"`、`stroke-width="2"`、`stroke-linejoin="miter"`、`fill="none"`、`stroke="currentColor"`、`translateY(-0.045em)`。

- `stroke-width` 改成 1.25 会在 14px 字号下变成 0.73px，被亚像素抗锯齿糊掉
- `viewBox` 用 24×21 会切掉 miter 尖端（伸到 y≈21.43）
- 心形任何断点都不许 `display: none`

### 5. 字体不要随便加

现有 12 个拉丁 + 22 个中文分片是按页面实际用字裁过的。新增字形需要先重裁子集，否则文件里根本没有。`--font-display`（Cinzel）的兜底链里没有 CJK，中文标签不能放在 display 字体元素内。

Cinzel 把小写字母渲染成大写形态——看到「明明写小写却显示大写」时，先查 `getComputedStyle().textTransform`，若为 `none` 就是字体设计，不是 CSS 问题。

### 6. 图片必须带真实尺寸

`<img>` 的 `width`/`height` 与 webp 实际像素逐一对应。首屏图用 `fetchpriority="high"`，其余用 `loading="lazy"`。

### 7. 必要外链允许（原「零外链」已解除）

用户已解除零外链约束。允许的外链：CC BY 署名链接、素材来源链接、模型网关服务端调用、确实需要的外部脚本/字体/资源。仍需守住的底线：

- 静态首屏不依赖外链才能显示（心形仍内联、字体仍本地、图片仍本地）——这是加载可靠性，不是禁令
- API Key 永不落前端，网关调用只在服务端
- 素材许可范围 PD / CC0 / CC BY；CC BY 那张的署名在图注下方，不要删
- 外部脚本若破坏 8 页 header/footer 一致性或 i18n 叶子规则，仍须退回

## 断点与布局红线

改以下任一项，必须按指定方式重验：

| 改动 | 必须重验 |
| --- | --- |
| `≤359px` 细线的 `display: none` | 320px 顶部带。**用容器高度法**，不能用子元素 `rect.top` 去重（心形的 `translateY` 会产生亚像素假象）。旧版没有这条时 320px 内容 324.42 vs 可用 297.59，细线被挤成孤儿占整行 |
| 任何 `font-weight ≥ 500` | 320px 底部。`cinzel-400` 与 `600` 是同一份字形，现在改了看不出差别；一旦将来补真加粗，宽度 +4%，余量从 11.52 掉到约 1.7px，**且不报错** |
| `padding-inline` 或字号下限 | 320 / 360 底部 |
| 给 `html` 加 `font-size` | **禁止**。锁根字号等于抹掉用户的字号偏好，是拿无障碍换账面余量 |

量余量一律用 `getBoundingClientRect().width`。`clientWidth` 在 ≤560px 且 root=16px 时因 `1.4rem = 22.4px` 非整数会取整，恒定多 0.41px。

## 验收方式

没有入库的测试框架。用以下手段证明改动有效，不要只说「看起来没问题」：

- **起本地服务**：`python -m http.server 8899 --bind 127.0.0.1`
- **真实视口**：headless Chrome 在 Windows 有约 526px 最小视口，`--window-size=390` 是假象。用 CDP `Emulation.setDeviceMetricsOverride`
- **三语 × 320/360/390/1440** 至少各看一次顶部带与底部框，判据是「单行 + `scrollWidth <= clientWidth` + 名字内部不断行」
- **切换语言**：验证 `devotion.and` / `devotion.label` 正确且心形仍在，专门检查 `data-i18n` 没挂错层级
- **一致性**：7 页 header/footer 逐字 diff；三语字典键集合一致；兜底与英文字典一致
- **实拍**：UI 改动必须截图确认。用 CDP 截图时，`captureBeyondViewport` 不触发懒加载（探针页去掉 `loading="lazy"`）；超过约 1600px 要分片再拼

更细的判据和踩过的测量坑都在 `PITFALLS.md`。

## 部署

**单链路 EdgeOne Makers**（本轮已下线 ESA）：

| 源仓库 | 部署平台 | 线上地址 | 配置文件 |
| --- | --- | --- | --- |
| CNB `origin` | EdgeOne Makers | https://nafisah.xgzwlkj.com/ | `edgeone.json` + `.cnb.yml` |

- **EdgeOne Makers**：源是 CNB。`edgeone.json` 声明纯静态构建（`buildCommand` / `installCommand` 为空，`outputDirectory: "."`）与缓存策略，优先级高于控制台设置。CNB 不支持原生 webhook，`.cnb.yml` 在 main push 时向 EdgeOne 发 POST——**这是正式部署链路的桥接件，必须保留**
- **ESA 已下线**：`esa.jsonc` 已删除，GitHub 远端仅作代码备份、不再作为部署源。不要重建 ESA 配置或在文档中恢复双链路表述。

缓存策略已按资源类型拆开：图片与字体一年 + `immutable`，CSS / JS / HTML 用 `no-cache`。这是为了修「一年缓存 + 无 hash 文件名导致用户永远拿到旧 CSS」的事故，不要改回去。

## Git 流程

- 远端两个：`origin` = `https://cnb.cool/xgzwlkj/nafisah.git`（部署源），`github` = `https://github.com/xgzwl/nafisah.git`（代码备份，非部署源）
- 主干是 `main`；改动走分支 + PR，合并后两个远端都要推（代码同步），但只有 `origin` 触发部署
- 不要 amend 已推送的 commit，新起一个
- `cnb pulls merge-pull` 的 `--commit-title` 必填
- **`.workbuddy/` 不入库**，不要 add、不要加进 `.gitignore`（那是本机工作区记忆）

## 写代码的习惯

- 规格要一次性给完整，不要拆成多条 delta 让别人拼
- 转述别人算出的数值前自己代一遍，或者明确标注「按转述待验」
- 别人的「全绿」要核对是不是测的同一份文件/同一个 commit
- 估算值不要设成验收阈值，阈值要先拿基线校准
- 发现坑就写进 `.learnings/PITFALLS.md`，写现象和判据，不要只写结论
