# Nafisah Riddle · 一座私人神龛

给 Tom Riddle 的私人告白站。中、英、法三种语言，八个静态页面，没有构建步骤。静态首屏不依赖外部资源；必要的外部链接（素材署名、来源）允许。

页面顶部的题献带和底部藏书票框写着同一句话：**Nafisah Riddle ♥ Tom Riddle**。

**线上地址：https://nafisah.xgzwlkj.com/** （EdgeOne Makers，源仓库为 CNB）

## 页面

| 页面 | 内容 |
| --- | --- |
| `index.html` | 首页。一卷记得你的日记、三扇门 |
| `about.html` | 那个男孩的记录与事实清单 |
| `quotes.html` | 五句原著台词 |
| `letters.html` | 三封写给他的信 |
| `gallery.html` | 十二张氛围图，每格带图注和来源 |
| `conversation.html` | 与他说话：站内原生对话面板（文件名避开 Agent 路由 `/chat`） |
| `disclaimer.html` | 避雷、声明、素材来源与站主身份 |
| `404.html` | 走失时的落脚处 |

## 本地预览

纯静态文件，随便起个静态服务器就行：

```bash
python -m http.server 8899
```

然后打开 `http://localhost:8899/`。直接双击 HTML 也能看，但某些浏览器会拦本地字体。

## 上线门禁

新上线前按阶段跑，全绿再推进：

```bash
npm run gate:local    # 提交前：类型/i18n/8页一致/版本串/P0/密钥零入库/两端同步
git push origin main  # CNB 部署源（GitHub 也要推）
npm run gate:deploy   # 推送后：查 CNB 构建状态 + EdgeOne 拉取（按时间戳，不盲等）
npm run gate:online   # 部署生效后：F2/F3/审核/SSE/源码泄漏全链路实测
npm run gate          # 全部一起跑
```

依赖只有 `node` / `git` / `curl` / `cnb` CLI。线上门禁会自建测试信并在结束时用审核端点清理；需要本地 `.env` 的 `MODERATION_TOKEN` 才能清理，缺失时该项标 SKIP。要测本地 dev 服务用 `GATE_SITE=http://127.0.0.1:8088 npm run gate:online`。

## 语言切换

页面右上角有 `中 / EN / FR` 三个按钮。语言状态同时存在 `localStorage` 和 URL 的 `?lang=` 参数里，所以可以直接分享 `gallery.html?lang=fr` 这样的链接。跨页跳转会自动带上当前语言。

三语文案都收在 `assets/js/i18n.js`。中文正文不低于 17px，中文标签有自己的字号规则。

## 目录结构

```
.
├── index.html / about.html / quotes.html / letters.html
├── gallery.html / conversation.html / disclaimer.html / 404.html
├── assets/
│   ├── css/style.css          所有样式，单文件
│   ├── js/heart.js            爱心点击计数 + 撒糖语录卡
│   ├── js/i18n.js             三语字典与语言状态机
│   ├── js/main.js             滚动显现、导航标记、语言按钮、阅读进度
│   ├── js/gallery.js          图库分组筛选 + 灯箱
│   ├── js/letters.js          写信表单 + 信墙（按语言筛选、翻页）
│   ├── js/chat.js             对话（复制回复、清空会话）
│   ├── js/entmesh.js          统计 SDK 接入（失败静默）
│   ├── js/pwa.js              Service Worker 注册（失败静默）
│   ├── img/*.webp             12 张氛围图
│   └── fonts/*.woff2          12 个拉丁 + 22 个中文分片
├── cloud-functions/api/hearts/ 爱心计数端点（GET 读 / POST +1，存 Blob）
├── manifest.webmanifest       PWA 清单
├── icon.svg                   PWA 图标（心形）
├── sw.js                      Service Worker（HTML 网络优先，资源缓存兜底）
├── edgeone.json               EdgeOne Makers 构建与缓存配置（CNB 源）
├── .cnb.yml                   CNB → EdgeOne 的 webhook 流水线
├── AGENTS.md                  给 AI agent 的工作规范
└── .learnings/
    ├── PITFALLS.md            按现象组织的踩坑清单
    └── session-logs/          按时间记录的开发日志
```

## 交互增强

三语页面顶部有阅读进度条。信墙可按语言筛选（全部／中／英／法）并翻页；图库可按主题分组浏览，点图打开灯箱（键盘左右切换、Esc 关闭）。对话页可复制每条回复、清空整段会话。这些按钮带 `data-entmesh-label`，统计脚本会记录点击但不采集正文。

页眉与页脚的爱心是可点击按钮：每次点亮计数加一，并轮换弹出一句本站原创撒糖语录，三语跟随界面语言。计数存服务端 Blob（`/api/hearts`，全站累计、写完即读），不再按浏览器各算各的；只在取数失败时退回本地兜底。HTML 里爱心仍是 `<span>`（八页逐字一致），由 `heart.js` 在运行时提升为可访问的 `<button>`。

点爱心默认静音；语录卡上的「开启声音」可打开一个 Web Audio 合成的轻响（无音频文件、无外部请求），开关状态存浏览器偏好。连续点击的写请求在前端串行排队，避免服务端读改写竞争丢计数。

页面注册了 Service Worker 做离线兜底：**HTML 走网络优先**（保证 `?v=` 版本串升级立即生效），图片字体缓存优先，其他静态资源网络优先、断网时回退缓存；`/api/`、`/chat`、`/stop` 等请求一律不缓存。PWA 注册与 SDK 加载都失败静默，不影响首屏。

## 实现上的几个选择

**静态层没有构建。** 无框架、无 CDN，HTML/CSS/字体/图片直接就是产物。F2 写信与 F3 对话依赖 `package.json` 里的两个服务端包（Blob SDK + TS），只在 Cloud Functions/Agents 侧安装，不影响静态首屏。

**字体全本地。** 英文用 Cinzel / Cormorant Infant / Newsreader / Spectral，中文用霞鹜文楷。中文字体官方拆成 97 个分片，这里只保留了本站实际用到的字符，所以能控制在 1.6M。全部遵循 SIL Open Font License。

**图片是 webp。** 12 张，总共 1.7M，每张都声明了真实宽高避免加载时抖动。

**心形是内联 SVG。** 站内字体里没有 `♥` 这个字形，用字符会掉到系统符号字体，所以改成描边路径。

## 部署

**单链路 EdgeOne Makers**（本轮已下线 ESA）：

| 源仓库 | 部署平台 | 线上地址 | 配置文件 |
| --- | --- | --- | --- |
| CNB `xgzwlkj/nafisah`（`origin`） | EdgeOne Makers | https://nafisah.xgzwlkj.com/ | `edgeone.json` + `.cnb.yml` |

往 `origin` push 触发部署。GitHub 远端 `github` 仅作代码备份，不再对应任何部署平台。

`edgeone.json` 的 `redirects` 把 `/tsconfig.json` 与 `/package.json` 302 到 `/404.html`，避免配置文件内容被线上直接读取；`gate:online` 会把这两项按「必须 302/404」校验，退化成 200 即判 FAIL。

### EdgeOne Makers（源：CNB）

CNB 不支持原生 webhook，所以根目录的 `.cnb.yml` 在 `main` push 时把事件转发给 `api.edgeone.ai/eo/pages/hook/cnb`。**这是正式链路，不要删。**

EdgeOne 侧建项目时按 `edgeone.json` 填：框架选「无框架 / Other」，构建和安装命令留空，输出目录为根目录。`edgeone.json` 的优先级高于控制台设置，两边取值保持一致最省事。

### 缓存

图片和字体设一年缓存 + `immutable`；CSS、JS、HTML 用 `no-cache`。原因是文件名不带内容哈希，长缓存会让用户永远拿到旧样式。

## 素材来源

图片来自 Wikimedia Commons 与博物馆开放馆藏，绝大多数是公有领域或 CC0。其中一张是：

- *Biblioteca Joanina* — Trishhhh，**CC BY 2.0**，经过裁切，署名在图注下方

字体全部为 SIL Open Font License。角色与设定版权归 J.K. Rowling 及 Warner Bros，本站为非商业同人创作。

## 维护提醒

改 `assets/css/style.css` 或 `assets/js/i18n.js` 时，记得同步升级七个页面里的 `?v=` 版本串，否则用户浏览器会继续用缓存里的旧文件。

更细的规则和踩过的坑见 [AGENTS.md](AGENTS.md) 与 [.learnings/PITFALLS.md](.learnings/PITFALLS.md)。
