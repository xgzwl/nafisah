# 坑总表 · Nafisah / Tom Riddle 三语站

跨轮次汇总，按**类型**而非时间组织。每条给「现象 → 根因 / 判据」。
过程与判断依据见 `session-logs/`。

最后更新：2026-11-26（追加：三项功能规划 → 本轮调整：ESA 下线 / TS 6.0.3 / 第 8 页 chat / 外链解禁 / 文案定稿）

---

## 一、字体与字形

| 现象 | 根因 / 判据 |
| --- | --- |
| 心形/符号显示成方框或掉到奇怪字体 | **34 个字体子集（12 拉丁 + 22 中文分片）全部不含 U+2665 ♥ / U+2661 ♡ / U+2764 ❤**。核心语义符号一律用内联 SVG，不用字符。判据：`fontTools` 读 cmap，不要凭「应该支持」猜 |
| 上标 e（XIXᵉ）写不出来 | **U+1D49 `ᵉ` 在全部拉丁子集里缺失**；U+00AA/00BA 是 a/o 的序数符，不是 e。解法：该字符换 `--font-body`（有真小写）+ `font-size: .68em` + `vertical-align: .42em` |
| 明明写的是小写，显示却全大写 | **Cinzel 基于罗马碑刻，所有字母以大写形态呈现**——不是 CSS 干的。判据：先 `getComputedStyle(el).textTransform`，若为 `none` 就怀疑字体本身 |
| 改了 `font-weight: 600` 但粗细没变 | `cinzel-400.woff2` 与 `cinzel-600.woff2` **MD5 相同**（`bd488f36…`）；`cormorant-garamond-400/500/600` 三者亦然。假 600 渲染即 400。若将来补真加粗，宽度 +4%，会击穿窄屏预算——所以给关键元素显式锁 `font-weight: 400` |
| 中文掉到系统宋体，拿不到霞鹜文楷 | **`--font-display` 的兜底链 `"Cinzel", Georgia, serif` 里没有 CJK**。中文不能放在 display 字体元素内 |
| Google Fonts 下回来是 TTF 不是 woff2 | 旧 UA 触发降级。必须显式带现代 Chrome UA |
| 中文字体包太大 | LXGW WenKai 官方拆 97 个分片。按页面实际汉字反查 `unicode-range` 只取命中分片（本项目 22 个） |
| 字体引用与文件对不上 | 必须**双向比对**：引用→文件查缺失，文件→引用查死重量。本项目 34 ↔ 34 |

---

## 二、排版与 CSS

| 现象 | 根因 / 判据 |
| --- | --- |
| 首字下沉把 `Lucky` 显示成 `L ucky`、`I've` 显示成 `I' ve` | **`::first-letter` 会吞掉紧邻的撇号**（`I'` 整体被当作首字母放大变色）；且字号放大 2.5 倍后字形右边距同比放大。解法：`padding-right: 0` + `margin-right: -0.08em` |
| 媒体查询里的规则被别处覆盖 | **`@media` 不提高特异性**。`≤359` 的 `.devotion-heart{font-size:.9em}`（0,1,0）输给基底的 `.devotion--seal .devotion-heart{.94em}`（0,2,0），所以只对顶部生效、底部无效（差 0.56px） |
| 给 `:last-child` 写的窄屏规则污染了更窄的断点 | **特异性穿透媒体查询**：`.gallery-item:last-child img`（0,2,1）压过 `max-width:767px` 里的 `.gallery-item img`（0,1,1）。断点覆盖类改动必须限定区间（`min-width:768px and max-width:900px`），不能只写上界 |
| 边框看着像"奖状/请柬" | 外框用 `--bronze`（满饱和）会越级。全站边框强度基准是 `--line`（`rgba(176,141,87,.28)`） |
| 结构边界看不出来 | **不能只靠颜色**：11% 铜色洗底叠在 `--ink` 上合成约 `#20271E`，对比度仅 1.16:1。要配实线（`--line` 约 1.55:1） |
| 模板字符串报 `SyntaxError: Unexpected identifier` | 在 `const expr = \`…\`` 内部的注释里写了反引号，提前闭合了字符串 |

---

## 三、布局与响应式

| 现象 | 根因 / 判据 |
| --- | --- |
| 网格出现空洞格 | 通栏卡（`grid-column: 1/-1`）必须落在**行首**。3 列下 9 单 + 3 通栏 = 18 格 = 6 行，通栏须在第 4/8/12 位；落在第 2 位会在首行挤掉 2 格 |
| 两列时必有 1 个空洞 | 12 项含 3 通栏 = 15 格（奇数），铺不满。让**末张回归单格**变 14 格 = 整 7 行。该规则要限定在 `768–900px`，否则会覆盖手机端"随图自然高度" |
| 「单行」实际换行了却测不出来 | **孤儿细线**：伪元素被挤到第二行时，真实子元素 `top` 全相同。判定必须用**容器高度法**（`rect.height / lineHeight`）或成对元素 `top` 差 < 2px |
| 量宽度得出负数 | **`align-items:center` 的 column 容器里，子项 shrink-to-fit**，`rect.width` 恒等于内容宽。必须用容器内容盒（`宽 − 横向 padding − 横向 border`）当分母 |
| 滚动后截图还是顶部 | `html { scroll-behavior: smooth }` 让 `scrollIntoView` 变动画。要 `behavior: 'instant'`，并留 700ms 再截 |
| 窄屏顶栏被挤出孤儿元素 | 细线是 flex item，吃的是硬宽度预算。320px 下必须 `display: none` 并补 `border-bottom` 承担结构信号 |

---

## 四、图片与素材

| 现象 | 根因 / 判据 |
| --- | --- |
| 首屏图几乎是黑的，但"觉得是氛围暗" | **看灰度直方图，不看感觉**。本项目主图中位 1.0、P90 3.9、仅 1.8% 像素 > 30 → 这是「没有图像数据」，不是「氛围」。换图后均值 3.7 → 74.8 |
| 靠指标选图选错了 | **暖偏/亮度只能筛色调，不能替代看内容**。误选过一张暖偏 +35.8 的"壁龛墙角"（墙面粉刷是暖米色），指标最像目标色系但完全不是主题 |
| 从 Commons 分类批量取图混进大量无关文件 | `Category:Biblioteca Joanina` 前三个命中是墙面壁龛、建筑外立面配橘树苗圃、教堂台阶。**分类名不可信，必须缩略图目检** |
| 逐张下载试错太慢 | 批量检索时把 14 张缩略图**拼成 contact sheet 一次目检**，一张图排除外景/肖像/教堂/建筑图纸 |
| 缩略图下载 400 | Commons 只接受白名单宽度（1280 / 1920 等），任意宽度返回 `400 Use thumbnail sizes listed` |
| 署名义务踩坑 | **CC BY-SA 有传染性**：裁切即属修改，衍生图须继续以 SA 分发。优先选无 SA 的 CC BY |
| 图片撑破布局 / CLS | `<img>` 必须带真实 `width`/`height`（与 webp 实际像素逐一比对），首屏 LCP 图用 `fetchpriority="high"` 而非 `loading="lazy"` |

---

## 五、i18n 与文案

| 现象 | 根因 / 判据 |
| --- | --- |
| 切换语言后内联 SVG / 子元素被抹掉 | **`apply()` 对 `[data-i18n]` 用 `textContent =` 覆盖**。`data-i18n` 绝不能挂容器，只能挂叶子节点；需要保留标签时改用 `[data-i18n-html]`（走 `innerHTML`） |
| 某语言露出一条英文 | **dict 缺 key 时 `apply()` 静默保留 HTML 兜底**，无报错无警告。三语键必须一次补齐 |
| 无脚本用户看到的文案是旧的 | 兜底与字典会漂移（本项目查出过 `dis.4` 仍列已删除字体、`gallery.note` 缺一段来源）。需脚本逐页比对兜底 vs 英文字典 |
| 新增的 i18n 键在用户端"不存在" | **改了 `i18n.js` 必须升 `?v=` 版本串**。否则浏览器用缓存里的旧字典，新增键缺失 → 静默显示英文 |
| 中文读起来不像同一个人写的 | 语域要跟站内既有用词对齐：`dis.title` 是「避雷**与**声明」，题献框就该用「与」不用「和」 |
| 中文标签字距过大 | 汉字是等宽方块，`.28em` 会让「题献」两字裂开约 4.8px。中文用 `.22em`，并在 CSS 就地注释「与 `.page-kicker` 的 `.28em` 不一致属刻意，勿修正」 |
| 字号下限写成绝对值 | **`0.875rem` 是相对值**，root=16px 时才等于 14px，root=13px 时是 11.375px。写成"不得低于 14px"会让非默认字号的复验全部误判失败 |

---

## 六、测量与验证（最容易错的一类）

| 现象 | 根因 / 判据 |
| --- | --- |
| 余量差 0.41px，怀疑是布局差异 | **`clientWidth` 按 CSSOM 返回整数，`rect.width` 返回小数**。差 +0.41 **只在 ≤560px 且 root=16px 时存在**（`.shell` 用 `100% - 1.4rem`，1.4rem=22.4px 非整数 → 小数恒为 .6 → 1/64px 对齐成 .59375 → 取整）；>560px 用 `2.5rem=40px` 整数，两 API 相等。**定稿一律用 `rect.width`** |
| 同名类取到了错误实例 | `.devotion-name` 全页 4 个（顶部 2 个 14→14.4px、底部 2 个按断点 14/15/16/19.2px），**公式完全不同**。`querySelector` 只返回第一个，`querySelectorAll` 索引易串位——两种写法都会静默拿到错值且看起来正常。**必须带 `.devotion--plate` / `.devotion--seal` 前缀** |
| 估算余量与实测差十几 px | 别用「0.6x em × 字数」。**Cinzel 两个名字的整串 advance 差 6%**：`NAFISAH RIDDLE` = 8.450em、`TOM RIDDLE` = 6.405em。统一系数会把差异互相抵消 |
| 以为字体回退会宽 11% | **复合假象**：字宽 +9% × 文字只占内容 83% = 有效 +1.8%。实测 Georgia 只比 Cinzel 宽 2.1%（0.6225 vs 0.6096） |
| 响应式测出"横向溢出"，但站点没问题 | **headless Chrome 在 Windows 有约 526px 最小视口**，`--window-size=390` 实际按 526 布局再裁图。必须用 CDP `Emulation.setDeviceMetricsOverride` |
| `--dump-dom` 与 `--screenshot` 布局不一致 | 两者视口不同源，**不能用 `--dump-dom` 测布局** |
| CDP 整页截图下方全是空的 | 视口只有 900 高时 **`captureBeyondViewport` 不触发 `loading="lazy"`**。在探针页里去掉 `loading="lazy"`，不要在 CDP 里注入滚动循环（Promise 会因页面高度动态增长而挂住） |
| 整页截图超时 / 爆内存 | 超过约 1600 CSS px 必须**纵向分片**再拼接 |
| 数据里混进别的页面/语言 | **导航竞态**：`href` + `readyState` + 元素存在三条件在旧文档上全满足。必须加**关键文本断言**（`h1.textContent`）+ `html.lang` 才能挡住同语言跨页面串页 |
| 用户说坏了，我这边一切正常 | **无头浏览器每次全新 profile、零缓存**，永远看不到用户的缓存状态。先怀疑「我的观测环境和用户的不一样」 |
| 验证样式时看到"没生效" | 预览脚本把元素 `cloneNode` 搬到独立容器，**后代选择器不再匹配**。验证结构相关样式时元素必须留在原祖先链里 |
| 给估算值设的验收阈值永远不达标 | 阈值必须**先校准基线**。曾把 `header ≤180px` 写进验收，而 HEAD 基线（无新功能）本身就有 201.6px。改用可归因判据：新元素贡献 ≤40px + 不改变 nav 行数 + 不与 main 重叠 |

---

## 七、平台与部署

| 现象 | 根因 / 判据 |
| --- | --- |
| 误以为两个远端是镜像、想删掉 `.cnb.yml` 改走 GitHub | **CNB 是 EdgeOne Makers 的部署源，GitHub 是阿里云 ESA 的部署源，两条独立链路并存**。`.cnb.yml` 是 EdgeOne 正式链路的桥接件，不能删。CNB push 只触发 EdgeOne，GitHub push 只触发 ESA |
| CNB 上配了 webhook 却没触发部署 | **CNB 不支持原生 Webhook**，需 `.cnb.yml` 桥接；GitHub / GitLab / Bitbucket / Gitee 是原生集成，但本项目 GitHub 源对应的是 ESA，不是 EdgeOne |
| 纯静态站部署后空白 / 构建失败 | `edgeone.json` 优先级**高于**控制台。纯静态多页站必须写死 `{ "buildCommand": "", "installCommand": "", "outputDirectory": "." }` |
| 更新部署了但用户看到的还是旧样式 | **长缓存不能配无 hash 文件名**。`/assets/*` 一年缓存 + `style.css` 无 hash = 更新必然失效。按类型拆：图片/字体可 `immutable` 长缓存，CSS/JS/HTML 用 `no-cache` |
| `cnb.cool/<repo>/-/raw/main/README.md` 取不到内容 | **被 SPA 兜底**：任意路径返回同一份 index.html（三个不同文件名只差 2B）。公开仓库直接 `git clone --depth 1` |
| CNB OpenAPI 返回 401，但 CLI 明明登录了 | CLI 用自己的 token，不走匿名 API。`401 "The task will not run because the user is not logged in"` 不代表仓库不可访问 |
| `cnb pulls merge-pull` 报 `参数 commit_title 是必填的` | `--commit-title` 必填。重复合并返回 `409 合并请求已经合入目标分支`——**这是「已成功」的信号，不是失败** |
| 空仓库无法建 PR | CNB 空仓库无默认分支，需先推一个 commit 建立 main 基线 |

---

## 八、协作与流程（本项目最贵的几条）

| 问题 | 后果 / 做法 |
| --- | --- |
| **把最终规格拆成多条增量 delta 发给执行者** | 执行者要自己从六条消息里拼出终值，结果结构/语义/i18n 全对，唯独媒体查询收口反复出错。**正确做法：一次给不可分割的完整配置块** |
| **转述第三方算出的数值前没自己代一遍** | 把别人算的 4.8px 直接转述并加了「临界档」的定性，实际按终值表是 18.03px，害得对方按错误红线调参、随后又撤回 |
| **别人给的余量数值直接采信** | 凭一句「只剩 1.5px」就下了调参指令，自己手里有测量脚本却没跑。实际是 29.84px。**要么自己复现，要么在决策里标注「按转述待验」** |
| 成员的「全绿」直接当交付依据 | 它测的可能是**自己拼的那版**，不是批准的版本。要核对「测的是不是同一份文件」 |
| 用肉眼数行数/数图判断 | 交给断言：网格用「跨度打包」模拟、行数用容器高度法、字号用 `getComputedStyle` |
| 恒定偏差被当成"正常的系统偏移" | 两条测量线恒定差 0.41px 看起来合理，所以连查三轮没人查。**恒定偏差比偶发偏差更危险** |
| 一个人算错，三个人都信 | 同一组参数在三方转述中各自取到不同版本。**唯一解是单一真相源（终值表）+ 单向下发** |

---

## 九、仍然有效的回归红线

改以下任一项，必须重验指定项：

1. `≤359px` 的细线 `display: none` → 重验 320px 顶部，**必须用容器高度法**（旧版无此规则时 320px 内容 324.42 vs 可用 297.59，姓名被压成孤儿占整行）
2. 任何 `font-weight ≥ 500` → 重验 320px 底部（真加粗会吃掉约 10px，余量从 11.52 掉到约 1.7px，**且不报任何错**）
3. `padding-inline` 或字号下限 → 重验 320/360 底部
4. **不得为稳住余量给 `html` 加 `font-size` 覆写**——那是拿用户的字号偏好换账面数字
5. 改 `assets/css/*` 或 `assets/js/*` → 必须同步升 **8 个页面**（新增 `chat.html` 后）的 `?v=` 版本串

---

## 十、当前已知偏差（不修，如实留档）

1. `≤359px` 的 `.devotion-heart{font-size:.9em}` 因特异性只作用于顶部，底部仍被 `.devotion--seal .devotion-heart{.94em}` 覆盖，实测 12.59 vs 13.16，差 0.56px。为 0.56px 再加更高特异性规则是把文档问题换成两个代码分支，已就地注释。
2. 320px 底部在 Georgia 回退态余 **11.52px**，为全场最紧处。有 `flex-wrap` 兜底，最坏是换行而非破版，不处理。
3. 用户放大根字号（root ≠ 16px）时题献框会折行——**这不是缺陷**，`scrollWidth` 恒等于 `clientWidth`，符合 WCAG 1.4.4（实测 root 13–32px 七组横溢均为 0）。

---

## 十一、本轮新增（2026-11-26 三项功能规划 + 调整）

| 现象 | 根因 / 判据 |
| --- | --- |
| 新建 `chat.html` 后逐字 diff 报 header/footer DIFF，但内容肉眼完全相同 | **换行符不同**：既有 7 页是 CRLF，Write 工具新建文件默认 LF。首个差异字节在第 28 字符（`\r\n` vs `\n`）。判据：新建页必须转 CRLF 后再做逐字 diff，否则是假失败 |
| CDP 真视口验证报「failures: (none)」，但截图全是同一张「无法连接」页 | **静态服务器被 shell 回收**：用 `(python -m http.server &)` 启动的进程随 subshell 退出被杀，连接失败页恰好也满足「无溢出 → 全绿」。判据：① 服务器用后台任务启动并 `curl` 确认 200；② 断言必须含「页面真实加载」的正向 marker（如 `.devotion--plate .devotion-line` 存在 + 名字数=2），不能只测否定条件；③ 截图文件大小若多张完全相同 = 假绿信号 |
| 本地无 `ws` 模块，CDP 脚本无法连接 | 不新增 npm 依赖（项目纪律）。解法：写最小 WebSocket 客户端（net + crypto 掩码帧）即可跑 CDP；同时 Chrome 的 `--user-data-dir` 必须用 Windows 原生绝对路径（`C:/Users/.../Temp/...`），Git Bash 的 `/tmp/...` 会被解析到别处导致 CDP 端口不监听 |
| 成员回传「已完成」但文件里没有产物 | PM 连续三轮把未决项标 RESOLVED、指向「附录 A/B」，但附录正文不存在；其中一次标题用「附录 A · xxx」而非约定的「附录 A：xxx」导致 grep 未命中。**判据：只读文件终态，不信 SendMessage 的完成声明；grep 用宽松正则（`附录 A`），别用精确冒号形式** |
| 成员把内部 TaskOutput 误判为用户空消息，回「请问有什么可以帮您」 | 唤醒成员时指令必须写「直接产出终稿并回传原文，不要回复确认类语句」；连续两次只改状态不改正文即判定阻塞、由 team-lead 补位并如实标注 |
| 新增文案后浏览器看到英文兜底而非新译文 | 三语字典缺 key 时 `apply()` 静默保留 HTML 英文（老坑），本轮又新增 `data-i18n-placeholder` 属性而 `apply()` 原本不处理 → 输入框 placeholder 永远不翻译。**判据：加新 i18n 属性前先确认 `apply()` 有对应分支；用脚本逐页比对 HTML 兜底 === en 字典（本轮抓出 6 处占位不一致）** |
| 撒糖 4 张卡出现错位缩进 | 既有 `.quote-card:nth-child(3n+2){margin-top:2.2rem}` 与 `:nth-child(5){grid-column:1/-1}` 会污染独立新 grid。判据：新区块用独立 class `.quote-grid--sweet` 并显式清零 `margin-top/grid-column/max-width`；不要复用旧 grid 容器 |
| 计划文档前后端依据冲突 | 架构文档已改口径（ESA 下线 / TS 6.0.3 / 外链解禁），总纲 SPEC 与 UIUX 仍留旧表述。**判据：每次范围调整后 grep 全部文档的关键字（旧版本号、已下线平台、已解除的约束），变更记录可留历史描述，正文与门禁表必须清零** |
| npm `latest` tag 与用户指定版本线不一致 | `npm view typescript dist-tags` 的 `latest`=7.0.2，但用户明确要 6.x。6.x 线最新稳定版是 **6.0.3**（`npm view typescript versions --json` 实测）。判据：按用户指定版本线取该线最新稳定版，不盲跟 `latest` |
| `tsc` 报 21 处 `Cannot find name 'Response'/fetch/ReadableStream/AbortSignal/console/setInterval` | TS 6.0.3 + `lib:["ES2022"]` 不含服务端运行时全局类型；**不是 DOM 缺失**。判据：装 `@types/node@22` + tsconfig `"types":["node"]`，一处声明解决全部，且 `lib` 保持 ES2022 不引 DOM。实测 `npm run typecheck` 从 21 错→0 |
| `module:nodenext` 下相对导入编译报错 TS2835 | 必须带编译产物扩展名：`./service.js`（虽源码是 `.ts`）。实测 7 个 TS 端点全量 typecheck 零错误后确认，非推测 |
| `edgeone makers dev` 热重载时 API 突然 ECONNREFUSED | 文件变更触发重建，旧端口被占则 fallback（实测 9000→9003→9004），旧端口失效。判据：看 dev server 日志的 `port occupied, fallback to`；不要以为代码坏了。最终验证前 `TaskStop` 旧实例、确认所有端口 000 后重启干净实例 |
| dev server 实际端口与文档不一致 | 本机 `edgeone makers dev` 静态/函数入口在 **9000**、agent 端点在 **9002**、总入口 8088 会 502（与 skill 文档「8088 打开」不符）。判据：以日志 `Running at` 与逐端口 curl 实测为准，不照抄文档端口 |
| 服务端 HTML 转义串被前端 `textContent` 原样显示为 `&lt;script&gt;` | 转义与解码的契约必须单边持有。若两端各自实现 decode = 双重解码，`&amp;lt;` 被误解成 `<`。裁决：服务端 `toPublic` 单遍解码回原文（顺序 `&#39;`→`&quot;`→`&gt;`→`&lt;`→`&amp;`，`&amp;` 最后），前端只认「原文 + textContent」，零解码逻辑。判据：往返用例 + `&amp;lt;` 边界用例都必须实测 |
| 前后端对同一缺陷给出互斥修复方案且并行实施 | 后端提议服务端解码、前端同时实现客户端解码，两端同时上线必双重解码。判据：team-lead 必须**单点裁决并双向下发同一方案**，不能只回一端；下发后 grep 两端确认另一端已撤回 |
| 全局密钥配置后 `env ls` 输出含掩码碎片 | 平台 `env ls` 会显示部分字符。判据：只 grep 变量名确认存在，不回读值；产出物（代码/文档/记忆）零密钥值，密钥只在平台加密存储。**轮换策略以 owner 决定为准**——本项目 owner 明确不轮换（权限最小化 + 平台泄露检测自动吊销），不要套用「出现密钥即提示轮换」的默认规则 |
| `POST /stop` 按文档「不带 conversation-id 头」调用却 400 | 错误 `AGENT_CONVERSATION_ID_REQUIRED` 不是 handler 报的，是 **EdgeOne agent 运行时在进 handler 前强制拦截**——skill/架构文档口径被实测推翻。判据：不带头实测 400、带头实测 200 `{stopped:true}`；前端 fetch 必须带该头（值与 body.conversation_id 同）。**文档说「禁止带」时若实测报缺头，信实测不信文档** |
| 前后端对同一缺陷并行给出互斥修复且都实施了 | 后端在 service.ts 解码、前端同时在 JS 解码 → 双重解码，`&amp;lt;` 会被误变成 `<`。判据：team-lead 必须单点裁决**并双向下发同一方案**，下发后分别 grep 两端确认另一端已撤回，不能只回一端就以为收口 |
| SSE 响应头门禁按精确等值断言会假红 | **本地 dev**（`edgeone makers dev`）的 wire 上出现双份头：handler 设的 `x-accel-buffering: no` + dev 平台追加的 `X-Accel-Buffering: no, no`（content-type / cache-control / connection 同样双份）。判据：门禁用「包含目标值」而非「精确等于」，否则本地真绿被判假红。**但线上生产不同**：handler 虽然设置了 4 个头（`agents/_shared.ts:150-158`），线上 wire 只到达 3 个（content-type / cache-control / connection），`X-Accel-Buffering` 被 EdgeOne 生产运行时剥离——实测 3 种请求形态均无该头。这是平台行为差异，不是代码缺陷；SSE 增量与 `[DONE]` 在线上正常，门禁把 accel 记为 advisory。另：短回复 <5s 跑完时 ping=0 正常，验证 ping 必须用长回复 |

| 部署验证用 sleep 盲等而不查状态 | CNB 部署状态有权威查询：`cnb build get-build-logs --repo <org/repo> --targetRef main --createTime YYYY-MM-DD` 看每条 push 的 status/success；EdgeOne 侧用线上静态资源的 `Last-Modified` 对照构建时间判断产物是否生效（注意 hash 差异多为 CRLF 归一化，ETag/Last-Modified 才是准据）。判据：先查构建状态和时间戳，命中即停，禁止 `sleep 60/100` 反复试探——本轮为此浪费多轮且得出错误结论。另：CNB 构建 success 只代表 webhook 发送成功，EdgeOne 拉取是独立异步过程，需分别验证 |
| 静态页面与 Agent 路由同名冲突 | `chat.html` 会遮蔽同名 Agent 路由 `/chat`（POST /chat 返回 HTML 而非 SSE，与 /chat.html 内容 hash 一致）；`/stop` 因无同名静态文件正常。本地 dev 用独立端口跑 agents 不会暴露此冲突，必须线上实测。修法需改路由名或页面名（公开 API/导航一致性，属高危改动须先确认）；`rewrites` 只支持 source→destination，无法按 HTTP 方法分流 |
| Cloud Functions 运行时不暴露 Web Crypto subtle | `globalThis.crypto.subtle` 在本地 Node 22 可用、EdgeOne Cloud Functions 运行时不保证，HMAC 签名抛错被 failFromError 兜底成 50001 storage unavailable。判据：服务端限流/IP 哈希用 `node:crypto` 的 `createHmac`（同步、无 subtle 依赖），不用 Web Crypto |
| 环境变量按项目隔离且需正确 env 作用域 | `edgeone makers env set` 作用在当前 link 的项目；CNB 源项目与直传项目是不同 ProjectId，密钥设错项目则线上读不到。`env set` 默认可能落到非 production，须显式 `-e production`；核验用 SHA256 指纹比对平台值/本地值，不回显明文。平台 env 更新对已热启动实例不一定立即生效 |

| EdgeOne Cloud Functions 的 context.request.headers 是标准 Headers 对象，不是普通对象 | 官方 skill 写「headers 是普通对象，用 headers['x-name']」，但线上实测 `headersType=object, hasGetFn=true, inOperatorAuth=false, plainKeys=[]`——自有可枚举属性为空，`headers['authorization']` 恒 undefined。后果：鉴权恒 40301；clientIpFromHeaders 恒返回空串，导致所有投稿共用一个限流桶。判据：用指纹探针（只回长度/指纹/布尔，不回明文）区分——`headers.get('authorization')` 取到 55 字符、`headers['authorization']` 取到 0 字符即命中。修法：headerValue 优先走 `headers.get(name)`（大小写不敏感），再回退普通对象下标与大小写遍历；本地 Node/agents 运行时仍走普通对象分支，两边兼容。禁止绕过校验或硬编码 token |
| 团队成员只推部署源远端，漏推代码备份远端 | CNB 是部署源、GitHub 是代码备份，要求每次都推两端。实测成员修复后 CNB main=fb6dba0 但 GitHub main 仍=845f591。判据：总监验收必须查 `git ls-remote origin/github refs/heads/main` 与本地三者 commit+tree 全一致，缺一即补推后再收口 |

| publishable key 前端接入不该写死在静态 JS 里 | `pk_` 开头的 Browser Key 虽是 publishable（可公开），但写进静态 JS 会入库、进构建产物、换 key 要改代码发版。正解：存 EdgeOne 平台 env，用一个轻量 Cloud Function（如 `/api/analytics-config`）在运行时读 `context.env` 返回给前端，前端 fetch 后动态加载 UMD 并 init。纯静态站并非无法用平台 env——有 Cloud Functions 就能做运行时注入（此前误判「技术上不可行」已纠正）。判据：grep 入库文件无 key 值、端点返回 key 前缀正确但不回显值。换 key 只需平台 env set + 重新部署，不动代码 |
| 第三方分析 SDK 的隐私默认是全采集，与「不收个人信息」承诺冲突 | EntMesh UMD 实测：默认 `consent:"grant"` + `fingerprint:true` + `autocapture:true`，`capture()` 固定带 locale / timezone / screen 尺寸 / url / title / referrer，深度指纹采 canvas/WebGL/hardwareConcurrency/deviceMemory/cookie 等。URL 清洗 `Jt()` 只保留 utm_* 与 queryAllowlist，会剥掉 `?lang=`（好）。autocapture 只采元素标签名与 data-entmesh-label，不采文本正文（信件/聊天内容不泄漏）。接入前必须读 UMD 源码确认采集面，同步更新 disclaimer 披露；本次 owner 明确选「默认全开」档位，披露文案据此写明技术信息采集范围 |
