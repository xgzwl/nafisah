# Nafisah Riddle · 一座私人神龛

给 Tom Riddle 的私人告白站。中、英、法三种语言，七个静态页面，没有构建步骤，也不请求任何外部资源。

页面顶部的题献带和底部藏书票框写着同一句话：**Nafisah Riddle ♥ Tom Riddle**。

## 页面

| 页面 | 内容 |
| --- | --- |
| `index.html` | 首页。一卷记得你的日记、三扇门 |
| `about.html` | 那个男孩的记录与事实清单 |
| `quotes.html` | 五句原著台词 |
| `letters.html` | 三封写给他的信 |
| `gallery.html` | 十二张氛围图，每格带图注和来源 |
| `disclaimer.html` | 避雷、声明、素材来源与站主身份 |
| `404.html` | 走失时的落脚处 |

## 本地预览

纯静态文件，随便起个静态服务器就行：

```bash
python -m http.server 8899
```

然后打开 `http://localhost:8899/`。直接双击 HTML 也能看，但某些浏览器会拦本地字体。

## 语言切换

页面右上角有 `中 / EN / FR` 三个按钮。语言状态同时存在 `localStorage` 和 URL 的 `?lang=` 参数里，所以可以直接分享 `gallery.html?lang=fr` 这样的链接。跨页跳转会自动带上当前语言。

三语文案都收在 `assets/js/i18n.js`。中文正文不低于 17px，中文标签有自己的字号规则。

## 目录结构

```
.
├── index.html / about.html / quotes.html / letters.html
├── gallery.html / disclaimer.html / 404.html
├── assets/
│   ├── css/style.css          所有样式，单文件
│   ├── js/i18n.js             三语字典与语言状态机
│   ├── js/main.js             滚动显现、导航标记、语言按钮
│   ├── img/*.webp             12 张氛围图
│   └── fonts/*.woff2          12 个拉丁 + 22 个中文分片
├── edgeone.json               EdgeOne Makers 构建与缓存配置（CNB 源）
├── esa.jsonc                  阿里云 ESA 部署配置（GitHub 源）
├── .cnb.yml                   CNB → EdgeOne 的 webhook 流水线
├── AGENTS.md                  给 AI agent 的工作规范
└── .learnings/
    ├── PITFALLS.md            按现象组织的踩坑清单
    └── session-logs/          按时间记录的开发日志
```

## 实现上的几个选择

**没有构建。** 没有 `package.json`，没有框架，没有 CDN。不需要 `npm install`，也不会有依赖过期的问题。

**字体全本地。** 英文用 Cinzel / Cormorant Infant / Newsreader / Spectral，中文用霞鹜文楷。中文字体官方拆成 97 个分片，这里只保留了本站实际用到的字符，所以能控制在 1.6M。全部遵循 SIL Open Font License。

**图片是 webp。** 12 张，总共 1.7M，每张都声明了真实宽高避免加载时抖动。

**心形是内联 SVG。** 站内字体里没有 `♥` 这个字形，用字符会掉到系统符号字体，所以改成描边路径。

## 部署

两个远端各自对应一个平台，**不是镜像关系，也不能互换**：

| 源仓库 | 部署平台 | 配置文件 |
| --- | --- | --- |
| CNB `xgzwlkj/nafisah`（`origin`） | EdgeOne Makers | `edgeone.json` + `.cnb.yml` |
| GitHub `xgzwl/nafisah`（`github`） | 阿里云 ESA | `esa.jsonc` |

往 CNB push 只触发 EdgeOne，往 GitHub push 只触发 ESA。两边都要推，各管各的线上环境。

### EdgeOne Makers（源：CNB）

CNB 不支持原生 webhook，所以根目录的 `.cnb.yml` 在 `main` push 时把事件转发给 `api.edgeone.ai/eo/pages/hook/cnb`。**这是正式链路，不要删。**

EdgeOne 侧建项目时按 `edgeone.json` 填：框架选「无框架 / Other」，构建和安装命令留空，输出目录为根目录。`edgeone.json` 的优先级高于控制台设置，两边取值保持一致最省事。

### 阿里云 ESA（源：GitHub）

`esa.jsonc` 是 ESA 的配置，构建命令与安装命令留空，资源目录为根目录，404 走站内页面。部署源是 GitHub 仓库。

### 缓存

图片和字体设一年缓存 + `immutable`；CSS、JS、HTML 用 `no-cache`。原因是文件名不带内容哈希，长缓存会让用户永远拿到旧样式。

## 素材来源

图片来自 Wikimedia Commons 与博物馆开放馆藏，绝大多数是公有领域或 CC0。其中一张是：

- *Biblioteca Joanina* — Trishhhh，**CC BY 2.0**，经过裁切，署名在图注下方

字体全部为 SIL Open Font License。角色与设定版权归 J.K. Rowling 及 Warner Bros，本站为非商业同人创作。

## 维护提醒

改 `assets/css/style.css` 或 `assets/js/i18n.js` 时，记得同步升级七个页面里的 `?v=` 版本串，否则用户浏览器会继续用缓存里的旧文件。

更细的规则和踩过的坑见 [AGENTS.md](AGENTS.md) 与 [.learnings/PITFALLS.md](.learnings/PITFALLS.md)。
