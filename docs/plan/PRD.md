# PRD · Nafisah Shrine 三项功能扩展

| 项 | 值 |
|---|---|
| 文档状态 | 定稿 v2 —— F3 升 P0 本轮必交付；移除 ESA 表述；外链边界改为「允许必要外链」；三语文案真相源见附录 A / B |
| 作者 | 许清楚（产品经理，MVP 开发专家团） |
| 日期 | 2026-11-26 |
| 项目工作区 | `C:/Users/xgzwl/WorkBuddy/spaces/2026_11_23_20-47-15` |
| 线上地址 | https://nafisah.xgzwlkj.com/ |
| 知识库基线 | `references/industries/content-platform.md`、`references/industries/ai-native.md`、`references/01-standards/spec-as-contract.md`、`references/01-standards/open-decisions-register.md` |
| 术语 | EARS = Easy Approach to Requirements Syntax，五类句式： ubiquitous（普适）/ event-driven（事件）/ state-driven（状态）/ unwanted（异常）/ optional（可选）；RICE = (Reach × Impact × Confidence) / Effort |

---

## 0. 已知事实与硬约束（直接采信，不再调研）

以下为 team-lead 已实地核实 + 仓库 `AGENTS.md` 事实源，作为本规格不可动摇的输入；执行者不得凭印象改写。

| 编号 | 事实 / 约束 | 来源 |
|---|---|---|
| A1 | 纯静态三语站（en/zh/fr），7 页：index/about/quotes/letters/gallery/disclaimer/404；无构建步骤、根目录无 package.json、无 CDN；前端不加载第三方脚本 / 字体 / 统计，仅允许「必要外链」（边界见 §0.1） | `AGENTS.md` + 本轮 team-lead 决策 |
| A2 | 7 页 header/footer 逐字一致，新增块字节数一致；改一处必须同步七处并逐字 diff | `AGENTS.md` |
| A3 | i18n 三件套：`i18n.js` 三语字典 + HTML 英文兜底 + 7 页 `?v=` 版本串（当前 `20261125d`）必须同步；缺 key 会静默保留英文，不报错 | `AGENTS.md` |
| A4 | `data-i18n` 只能挂叶子节点；容器挂 `textContent` 会抹掉内联 SVG 与子元素 | `AGENTS.md` |
| A5 | 心形为内联 SVG（`viewBox="0 0 24 22"`），字体子集不含 `♥/♡/❤`，不得替换为字符 | `AGENTS.md` |
| A6 | 图片必须带真实 webp 像素 `width`/`height`；素材许可仅 PD/CC0/CC BY，CC BY 一张（g10）署名不可删 | `AGENTS.md` / `gallery.html` |
| A7 | EdgeOne Makers 无托管数据库；官方口径「Blob IS your database」。结构化数据用 `setJSON` + key 前缀 `letters/<id>.json`，一文件一记录防并发覆盖；必须 `getStore({name, consistency:"strong"})` | EdgeOne Makers skill（team-lead 核实） |
| A8 | KV 仅 Edge Functions（V8）可用、≤25MB、全局变量，不适合持续增长的信件集合 → 排除 | 同上 |
| A9 | AI-Chat-Assistant 模板为 DeepAgents + 外部 `<script src="https://<project>.edgeone.app/embed.js">` iframe 挂件，与本站「自有设计系统 + 前端不加载第三方脚本」冲突 → 站内原生 UI 为设计原则 | 同上 |
| A10 | 模型网关 `https://ai-gateway.edgeone.link/v1`；候选模型 `@makers/deepseek-v4-flash`（模板默认 `@makers/deepseek-v3`）；API Key 在 Makers 控制台 Models → API Key 创建 | 同上 |
| A11 | 本地 EdgeOne CLI 1.6.41，skill 要求 ≥1.7.7 → F3 开工前置条件，开工前必须升级完成（见 §0.2） | 同上 |
| A12 | 现有内容：letters.html 3 封原创日记短笺（l1-l3）；quotes.html 5 条 HP 原著台词带出处；gallery.html 12 张氛围图 | 仓库文件 |
| A13 | 字体为按页面用字裁过的 34 个本地分片；新增字形必须先重裁子集，否则字不存在 | `AGENTS.md` |

### 0.1 必要外链边界（本轮口径：允许必要外链）

原「零外链」约束调整为「允许必要外链」。判定标准：外链是否为功能本身所必需、且不在用户浏览器端引入第三方资源或追踪。

| 允许（必要外链） | 边界说明 |
|---|---|
| 服务端同源函数对 AI 网关 `https://ai-gateway.edgeone.link/v1` 的调用 | F3 功能必需；仅发生在服务端，前端仍为同源请求，不引入第三方脚本 |
| 图片许可凭证与 CC BY 署名 / 许可版本的外链 | 版权合规必需；署名文字与许可链接用于图注下方，来源 URL 记录于策划表而非页面前端加载 |
| 免责声明中对 J.K. Rowling / Warner Bros 等版权方的文字指称 | 法律告知必需；为文字指称，不加载其资源 |

| 禁止（非必要外链） | 边界说明 |
|---|---|
| 前端加载外部脚本 / iframe / `embed.js` AI 挂件 / CDN / 第三方字体 / 第三方统计（如 PostHog） | 引入第三方执行环境或追踪，破坏自有设计系统与隐私边界 |
| 插屏广告、账号墙、订阅锁跳转 | 与 shrine 安静调性冲突，属竞品反面教材 |
| UGC 信件正文中的外链 | 防垃圾与钓鱼，F2-AC5 仍拒绝含外链提交 |

### 0.2 开工前置条件（P0 硬门槛，非延后项）

F3 已升为 P0 本轮必交付。下列三项为**开工前置条件**，必须在动手实现前完成，不再作为「未满足则延后到下一迭代」的触发条件：

| 前置条件 | 完成判据 |
|---|---|
| API Key 已创建并安全注入服务端配置 | Makers 控制台 Models → API Key；不进前端、不进仓库、不进 i18n 字典；端到端调通一次 |
| EdgeOne CLI 升级至 ≥1.7.7 | `edgeone --version` ≥ 1.7.7 |
| 提示词与安全策略评审通过 | 人设（温柔 / 克制 / 短句 / 日记通信错觉）、拒答类目（NSFW / 自伤 / 现实人物伤害 / 违法）评审通过并写入配置 |

---

## 1. 问题陈述

谁 / 什么场景 / 什么痛点 / 现状 / 为什么不行。

| 维度 | 描述 |
|---|---|
| 用户 | 熟悉 HP 原著、被 Tom Riddle 日记意象打动的同人读者（详见 §2） |
| 场景 | 读完现有语录与短笺后，情绪被点燃，想「继续待在这个氛围里」——想看到更甜的内容、想写下自己的话留给角色、想直接和角色对话 |
| 痛点 | 当前站点是**单向只读**：内容由站主写好，访客只能看。 emotional payoff 到此为止，没有参与感与回访动机 |
| 现状 | 靠静态 HTML 展示；无表单、无存储、无交互（AI 挂件也未接入） |
| 为什么不行 | 只读 shrine 的留存天花板低；同人受众的核心诉求是「投射与回应」，而非「阅读资料」。竞品（Character.AI / Riddle 日记）证明「可写信 + 可对话」才是此类产品的留存引擎（见 §4） |

**需求本质澄清（区分「说的功能」与「真问题」）**：用户说的是三个功能（扩图库 / 写信 / AI 聊天），真问题是**把单向纪念碑变成可投射、可得到回应的私密空间**。因此三项功能不是并列堆砌，而是一条参与深度阶梯：`看（撒糖内容）→ 写（留信）→ 对话（得到回应）`。三者共用同一个设计语言与同一套 i18n/布局纪律，不可各自为政。

---

## 2. 目标用户与场景

| 画像 | 属性 | 场景 | 技术水平 | 对应功能 |
|---|---|---|---|---|
| **主要：沉浸型同人读者** | 16-30 岁，HP 读者，女性偏多，熟悉原著情绪点，懂同人语境 | 深夜独处时打开 shrine，想要「被温柔回应」的感觉；愿意写短句、愿意尝试对话 | 普通网民，不用命令行 | F1 / F2 / F3 |
| **次要：路过型访客** | 从搜索或社交链接进来， HP 兴趣中等 | 快速浏览图库与语录，被氛围吸引后可能留下第一封信 | 低，容忍度低 | F1 为主，F2 漏斗入口 |
| **站主（维护者）** | 项目所有者 | 发布内容、处理违规信件、升级 CLI / API Key | 高 | 全部（运维侧） |

**核心用户故事**
- 作为沉浸型读者，我想看到更多「撒糖」内容，以便在 shrine 里获得更完整的甜蜜氛围。
- 作为沉浸型读者，我想写一封信留存下来，以便我的情绪被这个空间「接住」并被别人看到。
- 作为沉浸型读者，我想和主角对话并收到回复，以便获得即时的、专属的回应感。

---

## 3. 功能列表与 RICE 排序

### 3.1 RICE 评分表

评分口径：Reach = 每季度受影响用户占比（1-10）；Impact = 单个用户影响（0.25/0.5/1/2/3）；Confidence = 确信度（50/80/100%）；Effort = 人月（1-10）。Score = (R × I × C) / E。

| 排名 | 功能 | Reach | Impact | Confidence | Effort | **Score** | 优先级 | MVP |
|---|---|---|---|---|---|---|---|---|
| 1 | **F1** 扩展图库与撒糖语录 | 9 | 1 | 80% | 2 | **3.60** | P0 | 是 |
| 2 | **F2** 给主角写信（提交 + 持久保存） | 6 | 2 | 80% | 5 | **1.92** | P0 | 是 |
| 3 | **F3** 站内原生 AI 对话 | 7 | 3 | 50% | 9 | **1.17** | **P0** | **是（本轮必交付）** |

评分依据：
- F1 Reach 高（所有访客经过 quotes/gallery）、Effort 低（内容 + i18n + 版本串），但 Impact 仅 1（丰富氛围，不改变核心行为）——典型的「高性价比氛围层」。
- F2 Impact 2（引入 UGC 与回访动机），Effort 5（Cloud Function（Makers Functions）+ Blob + 表单 + 审核 + 三语文案 + 端到端验证），Confidence 80%（需求明确，但审核与存储策略需落地）。
- F3 Impact 3（体验质变），Confidence 50%（模型行为不确定、成本未知——API Key 与 CLI 已转为开工前置条件，不再计入延后风险），Effort 9（对话 UI + 流式 + 提示词工程 + 安全 + 存档 + 验证）——最高价值但最高投入。按 team-lead 本轮决策，F3 升为 **P0 本轮必交付**；RICE 分仅作投入产出参考，不作为砍需求依据。

### 3.2 功能定义

| 功能 | 一句话定义 | 交付物 |
|---|---|---|
| F1 | 在 `quotes.html` / `gallery.html` 增加「撒糖」主题原创文案与恋爱日记氛围图，沿用现有视觉与 i18n 纪律 | 新语录条目、新图片、三语字典 key、版本串升级 |
| F2 | 用户经 `letters.html` 表单提交信件，经 Cloud Function（Makers Functions）强一致写入 Blob（`letters/<id>.json`），并在信墙读取展示 | 表单 UI、Cloud Function（Makers Functions）、Blob 集合、审核/隐私提示、三语文案 |
| F3 | 用户经站内原生对话 UI 与主角聊天，消息经同源函数代理调用模型网关，返回角色化回复 | 对话 UI、代理同源函数、提示词、安全策略、三语文案 |

---

## 4. 竞品分析

### 4.1 直接竞品（3 个）

| 竞品 | 核心功能 | 优势 | 劣势（来自差评 / 观察） | 定价 |
|---|---|---|---|---|
| **Riddle**（github.com/MaximeRivest/Riddle，开源，约 1.4k star） | 用 AI 复刻会回信的 Tom Riddle 日记：手写→灰度 PNG→视觉模型→手写动画回信 | 「你不是在操作 AI 工具，你是在和一本日记通信」——氛围与错觉完整，正是本站的精神原型 | 依赖 reMarkable 硬件 + 电子墨水屏 + 视觉模型，门槛高；开源无 UGC 信墙；非网页站 | 开源免费 |
| **Character.AI**（角色陪伴聊天标杆） | 零代码自建角色（开场白 + 描述 + 示例对话）、长记忆、多角色房间、社区 feed | 打开到第一句话 < 2 分钟；示例对话数量直接决定人设风格精准度；每条聊天声明「非真人」；编辑消息可修复跑偏对话 | 高峰期「高负载」排队打断沉浸；免费版对话中插全屏广告破坏角色代入；Chat Memories / Imagine 锁订阅；18+ 年龄验证；未成年人监管争议 | Freemium，c.ai+ 约 $9.99/月 |
| **HiWaifu / SpicyChat 上的 Tom Riddle 角色**（aicharhub 收录，SpicyChat 单角色 4.5K 会话） | 角色卡 + 人设 prompt + 开场情景，用户与 Tom Riddle 角色扮演 | 「日记开场白」模板可直接借鉴（写名字→字迹浮出→「My name is Tom Riddle」）；短句、自信、以 `—` 开头等风格约束可复用 | 大量 NSFW / Dominant 标签与无过滤内容，与本站「温柔、克制」调性冲突；第三方平台账号体系与站外跳转，违反本站「自有设计系统、前端不加载第三方资源」原则（§0.1） | 免费 + 订阅 |

### 4.2 间接替代方案（2 个）

| 替代方案 | 用户现在怎么解决 | 可借鉴 | 不可照搬 |
|---|---|---|---|
| **HP 同人论坛信墙**（如 The Bookshelf「Your Letter」主题帖，以及 MuggleNet / The Leaky Cauldron 等老牌站） | 在论坛发「Dear Mr. Potter…」式角色信，或读别人写的信 | 信件体格式、低门槛参与、UGC 内容沉淀成长期价值 | 论坛账号体系、整篇同人文照搬、无审核的广场结构；与本站私密 shrine 调性不符 |
| **非官方 HP 指南站**（如 harrypottertvseries.com 隐私模式） | 只读资料 + 浏览器本地偏好（如学院颜色存 localStorage），无账号无表单 | 「无账号、无表单、最少数据收集、明确告知无可删除数据」的隐私透明做法，可直接写进 `disclaimer.html` | 其用 PostHog 第三方统计脚本，在用户浏览器端引入追踪，违反本站「前端不加载第三方脚本」边界（§0.1）；其「无表单」与本次写信需求相反 |

### 4.3 竞品结论 → 我们的差异化

1. **氛围护城河**：本站已有 12 张精选氛围图 + 3 封原创短笺 + 5 条带出处原著台词的「安静」基调，是 Riddle 的「日记错觉」的网页化、去硬件化版本。撒糖内容应延续「克制、纸墨、烛光」而非甜腻直白。
2. **写信 + 对话的阶梯**：竞品要么只有信墙（论坛），要么只有聊天（Character.AI / HiWaifu）。本站可三者串联——先看撒糖、再留信、再对话——形成独特参与路径。
3. **前端不加载第三方脚本 + 自有设计系统（允许必要外链）**：Character.AI 的插屏广告、AI 模板的 iframe 挂件、论坛的三方脚本都是反面教材。F3 必须是**站内原生 UI**，不引入 `embed.js`；服务端调用 AI 网关、许可署名链接属必要外链（§0.1），不在禁止之列。
4. **取长避短**：借鉴 Character.AI 的「示例对话塑造人设」「编辑消息修复走向」「非真人声明」；借鉴 Riddle 的「通信错觉」；**拒绝** NSFW 无过滤、账号墙、插屏广告、订阅锁记忆。
5. **隐私透明**：借鉴非官方指南站的「最少收集 + 明确告知」，在 `disclaimer.html` 增补 UGC 与 AI 对话条款。

---

## 5. 我们的差异化定位

> 一个不加载第三方脚本、自有设计语言、三语同心的私密同人 shrine：访客从「读」走到「写」再到「对话」，全程不被广告、账号墙或模板化工件打断；仅有功能所必需的外链（AI 网关服务端调用、许可署名）。

---

## 6. MVP 范围与优先级

### 6.1 本轮交付范围（Scope）

| 优先级 | 功能 | 交付策略 |
|---|---|---|
| **P0** | F1 扩展图库与撒糖语录 | 全量交付，随本轮上线 |
| **P0** | F2 给主角写信 | 全量交付，随本轮上线（审核策略见 §9.3） |
| **P0** | F3 站内原生 AI 对话 | **本轮必交付，无延后选项**：三项开工前置条件（API Key 已创建 + CLI ≥1.7.7 + 提示词与安全策略评审通过，见 §0.2）必须在动手实现前全部完成；不存在「本轮不发布、推到下一迭代」的分支 |

**MVP 定义**：F1 + F2 + F3 三项全部随本轮上线，形成完整价值闭环（看 → 撒糖 → 写 → 对话）。三项开工前置条件是启动 F3 的门槛，而非削减范围的理由；不做「仅 F1+F2 先上线、F3 下轮补」的拆分。

### 6.2 明确不做（Out-of-Scope）——每条带原因

| 不做项 | 原因 |
|---|---|
| 引入外部 `embed.js` / iframe AI 挂件 | 违反 A9「前端不加载第三方脚本 + 自有设计系统」，会破坏 7 页 header/footer 一致性与设计语言统一；服务端对 AI 网关的必要外链不在此列 |
| 用 EdgeOne KV 存信件 | 违反 A8：KV ≤25MB、全局变量、仅 Edge Functions 可用，不适合持续增长的信件集合 |
| 引入托管数据库 / 第三方 BaaS | 违反 A1「无外部请求」且 EdgeOne Makers 无托管数据库（A7），Blob 已是数据库 |
| 用户账号 / 登录 / 注册 | 无账号是本站隐私优势（竞品对比结论 4）；增加一个画像维度与合规负担，超出 MVP |
| 信件点赞 / 评论 / 楼中楼 / 公开访客计数 | 范围蔓延，把私密 shrine 变成广场；与「安静」调性冲突 |
| 多轮长期记忆 / 跨会话上下文持久化 | F3 的高成本项（本轮已升 P0，但此项仍不作为必交付内容）；Character.AI 将其锁订阅，说明成本高。本轮只做单会话上下文，靠提示词维持人设 |
| 人为加 delay 的「打字机视觉特效」与逐 token 读屏播报（效果层） | **SSE 流式传输（协议层）是首版必需，必须保留**：网关 `stream:true` 原生能力是停止按钮与 `X-Accel-Buffering: no` 的前提，ARCHITECTURE.md §3.5 与 UIUX.md §5.4 均按流式建模，不得退化为整段回复。此处排除的仅是效果层镀金——人为 delay 的打字机动效、逐 token 触发读屏播报（流式期间输出节点 `aria-live="off"`，完成时一次性播报） |
| 图片上传 / 用户自制素材 | 版权与审核不可控；本轮素材由站主精选（PD/CC0/CC BY） |
| NSFW / 无过滤对话 | 与本站温柔克制调性、未成年人保护、平台合规冲突；明确排除 |
| 语音 / 视频 / 图像生成对话 | 超出文本对话范围，成本与复杂度不可控 |
| 给 404 页也加内容功能 | 404 是错误页，保持极简，不纳入功能页 |
| 更换字体 / 心形 SVG / header/footer 结构 | 违反 A2/A5/A13，属破坏性改动，本轮禁止 |

---

## 7. 验收标准（EARS 格式）

> 每条标注 EARS 类型；`the system` 指本站（含新增 Cloud Functions / 同源函数）。中文书写，行为可观察、可验证。

### 7.1 F1 扩展图库与撒糖语录

| ID | EARS 类型 | 验收标准 |
|---|---|---|
| F1-AC1 | ubiquitous | The system 应在 `quotes.html` 展示新增撒糖语录，每条均带「原创」或原著出处标注，且 en/zh/fr 三语齐全。 |
| F1-AC2 | event-driven | When 用户切换语言，The system 应在不刷新页面的情况下显示对应语种的撒糖语录，且 HTML 英文兜底与英文字典逐字一致。 |
| F1-AC3 | ubiquitous | The system 应在 `gallery.html` 展示新增恋爱日记氛围图，每张 `<img>` 带真实 webp 像素的 `width`/`height`，首屏外图片带 `loading="lazy"`。 |
| F1-AC4 | state-driven | While 图片为 CC BY 许可，The system 应在图注下方持续显示署名，且署名在 7 页同步规则下不被误改。 |
| F1-AC5 | unwanted | If 某条新增文案的三语字典缺任一 key，Then The system 应静默保留 HTML 英文文案且不报错——因此验收必须逐键比对三语字典集合一致，不得只看页面。 |
| F1-AC6 | unwanted | If 新增文案含现有字体子集未覆盖的字形，Then 必须先重裁字体子集再上线，否则该字显示为缺字（A13）。 |
| F1-AC7 | ubiquitous | The system 应保持 7 页 header/footer 逐字一致，且 `style.css?v=` 与 `i18n.js?v=` 版本串在 7 页同步升级（当前 `20261125d` → 新值）。 |
| F1-AC8 | state-driven | While 视口为 320px，The system 应保持顶部带与底部框单行、`scrollWidth <= clientWidth`、名字内部不断行。 |

### 7.2 F2 给主角写信

| ID | EARS 类型 | 验收标准 |
|---|---|---|
| F2-AC1 | ubiquitous | The system 应在 `letters.html` 提供信件表单（署名可选、正文必填），且表单 UI 三语齐全、符合 A2-A6 纪律。 |
| F2-AC2 | event-driven | When 用户提交合法信件，The system 应经 Cloud Function（Makers Functions，Node.js + `@edgeone/pages-blob`）以 `getStore({name:<store>, consistency:"strong"})` 写入单一 `letters/<id>.json`，并回显「已留存」状态。 |
| F2-AC3 | state-driven | While 信件已写入 Blob，The system 应在 `letters.html` 信墙按时间倒序读取并展示该信件，且刷新后仍存在。 |
| F2-AC4 | unwanted | If 两名用户并发提交，Then The system 应生成两个独立 `letters/<id>.json`，任一不覆盖另一（一文件一记录，A7）。 |
| F2-AC5 | unwanted | If 提交内容为空、超长、含外链、含脚本标签或命中敏感词，Then The system 应拒绝写入并返回明确原因，不产生空记录。 |
| F2-AC6 | event-driven | When 用户首次聚焦正文输入框，The system 应显示隐私提示：信件将公开展示、请勿填写真实姓名/联系方式/住址。 |
| F2-AC7 | ubiquitous | The system 应在 `disclaimer.html` 增补 UGC 条款：信件公开展示、匿名提交、删除请求渠道、不收集个人信息。 |
| F2-AC8 | unwanted | If Blob 写入失败，Then The system 应展示错误信息并允许重试，不得显示成功或丢失用户输入。 |
| F2-AC9 | optional | Where 站主执行删除操作，The system 应能按 `letters/<id>.json` 定位并移除指定信件。 |

### 7.3 F3 站内原生 AI 对话

| ID | EARS 类型 | 验收标准 |
|---|---|---|
| F3-AC1 | ubiquitous | The system 应在站内以自有设计系统提供对话 UI（输入框 + 消息列表 + 状态提示），不加载任何外部 script 或 iframe；图标沿用站内现有内联 SVG（架构师已锁定 zero-library inline SVG：心形 `viewBox="0 0 24 22"` + 既有几何分隔字符，不新增图标库）。 |
| F3-AC2 | event-driven | When 用户发送消息，The system 应经同源函数代理调用 `https://ai-gateway.edgeone.link/v1`，使用 `@makers/deepseek-v4-flash`，并展示角色化回复。 |
| F3-AC3 | state-driven | While SSE 流尚未以 `[DONE]` 收尾，The system 应展示思考中状态与可用的中止入口，禁用重复提交；用户中止时中止底层请求且不得显示「网络错误」重试提示。 |
| F3-AC4 | unwanted | If API Key 缺失、网关不可达或返回错误，Then The system 应展示可读错误与重试入口，不得伪造角色回复、不得静默失败。 |
| F3-AC5 | state-driven | While 单会话进行中，The system 应在上下文窗口内保持人设与前文；超出窗口时按可预期策略截断并提示，不报错。 |
| F3-AC6 | unwanted | If 用户输入或模型输出触及 NSFW / 自伤 / 现实人物伤害等禁区，Then The system 应按安全策略拒答或安全改写，并记录异常事件用于复盘。 |
| F3-AC7 | ubiquitous | The system 应在对话区持续展示「虚构角色，非真人，请勿作为现实建议」声明，且在三语下均可见。 |
| F3-AC8 | event-driven | When 用户切换语言，The system 应翻译对话 UI 文案；模型回复语言跟随输入语言，不承诺三语同等质量（见 §11 决策登记）。 |
| F3-AC9 | optional | Where 配置多个候选模型，The system 应支持在配置层切换默认模型，而 UI 不暴露模型选择给普通用户。 |
| F3-AC10 | ubiquitous | The system 应以 SSE（`text/event-stream`）承载 `POST /chat`：逐条 `ai_response` 增量渲染、`data: [DONE]\n\n` 收尾、每 5s `ping`、响应头含 `X-Accel-Buffering: no`（与 ARCHITECTURE.md §3.5 一致）；The system 不得为追求「打字机观感」人为加 delay，也不得逐 token 触发读屏播报——流式期间输出节点 `aria-live="off"`，收尾后完整文本一次性播报（与 UIUX.md §5.4 一致）。 |

---

## 8. 边界条件

| 类别 | 要求 |
|---|---|
| 空状态 | 信墙 0 封时展示引导文案（首封由站主预置 l1-l3 之外或明确「等待第一封」）；对话首次进入展示示例问题，不留白屏 |
| 加载状态 | 信件读取 / 对话等待均需明确指示，按钮防重复提交 |
| 错误状态 | Blob 失败、网关失败、校验失败分开提示，不混用「网络错误」笼统文案 |
| 边界值 | 正文长度上下限、单用户提交频率上限、单会话轮次上限、上下文窗口上限（阈值由架构师按基线校准后在规格中钉死，不用估值当验收阈值） |
| 并发 | 信件并发提交靠独立 key 防覆盖（F2-AC4）；对话并发会话隔离 |
| 离线 | 纯静态页面离线可读；表单 / 对话在离线时明确提示不可用，不静默丢弃输入 |
| 权限拒绝 | 浏览器禁用 JS 时：静态内容可读；表单与对话不可用并给出说明；不得出现空白页 |
| 断点 | 320/360/390/1440 四档，顶部带与底部框单行、无横向溢出 |

---

## 9. 版权与内容合规约束

### 9.1 内容边界表

| 内容类型 | 来源 | 风险 | 约束 |
|---|---|---|---|
| 原著台词 | HP canon | 版权 | 保留现有 5 条带出处短句；新增撒糖**不以堆砌原著台词为主**；单条保持短句并带书名出处，不做长段引用 |
| 原创撒糖文案 | 本站原创 | 低 | 明确标注「原创，非 canon」；不得复制任何在世作者同人文原句；不得模仿特定在世作者风格；围绕本站 OC「Nafisah × Tom」关系，避免绑定 canon 情侣 |
| 图库图片 | PD / CC0 / CC BY | 许可 | 仅 A6 三类许可；CC BY 必须署名；禁止角色肖像 / 影视剧照 / 商标元素；来源优先 Wikimedia Commons 与博物馆开放馆藏 |
| UGC 信件 | 用户生成 | 内容 + 隐私 | 见 §9.2 / §9.3 |
| AI 回复 | 模型生成 | 内容 + 合规 | 见 §9.4 |

### 9.2 UGC 信件隐私提示（必须实现）

- 表单附近与 `disclaimer.html` 双处告知：信件将**公开展示**；请勿填写真实姓名、联系方式、住址等个人信息；提交即视为同意公开展示。
- 不收集 email / IP 到 Blob；IP 仅存在于 EdgeOne 平台日志，不进入业务存储。
- 匿名优先：署名可留空；不引入账号。
- 提供删除请求渠道（`disclaimer.html` 说明联系方式），站主按 `letters/<id>.json` 删除。

### 9.3 UGC 审核策略（MVP 轻量版）

| 环节 | 措施 | 优先级 |
|---|---|---|
| 提交前 | 客户端必填 / 长度 / 外链 / 脚本标签校验 + 隐私提示 | P0 |
| 提交时 | Cloud Function（Makers Functions）服务端二次校验 + 敏感词过滤 + 频率限制 | P0 |
| 发布 | 自动发布（小站信任模型）+ 站主可按 id 删除 | P0 |
| 举报入口 | 「举报此信」链接到 `disclaimer.html` 说明的渠道 | P1 |
| 先审后发队列 | 若出现滥用再启用，需额外管理界面 | Backlog |

### 9.4 AI 对话安全与合规

- 人设约束写进提示词：温柔、克制、短句、贴近日记通信错觉；不冒充真人；不提供现实建议。
- 拒答类目：NSFW、自伤、现实人物伤害、违法内容；命中即安全改写或拒答（F3-AC6）。
- 持续展示「虚构角色，非真人」声明（F3-AC7），对齐 Character.AI 的免责声明实践与未成年人保护要求。
- API Key 只存服务端配置，不进前端、不进仓库、不进 i18n 字典。

---

## 10. 素材需求清单（恋爱日志 / 日记类图）

| 项 | 要求 |
|---|---|
| 数量 | 建议新增 4-6 张（与 4-6 条撒糖文案一一呼应），不追求堆量 |
| 风格 | 烛光暖调、旧纸/羊皮纸、手写痕迹、干花/玫瑰、墨水瓶、信笺、安静亲密的午后或深夜氛围；延续现有「绿金画框 + 克制」基调 |
| 禁止 | 角色肖像、影视剧照、现代场景、商业logo、**紫色→粉色渐变**、甜腻高饱和、emoji 元素 |
| 许可 | 仅 PD / CC0 / CC BY；来源优先 Wikimedia Commons、博物馆开放馆藏；CC BY 需记录作者与许可版本并在图注下署名 |
| 技术规格 | WebP；真实像素写入 `width`/`height`；首屏外 `loading="lazy"`；本地存放 `assets/img/`，前端不加载第三方资源（许可署名链接属必要外链，见 §0.1） |
| 文案配套 | 每张需 en/zh/fr 三语 `alt` + caption key（如 `g13.alt` / `g13.cap` / `g13.note`），叶子节点挂 `data-i18n` / `data-i18n-alt` |
| 验收 | 逐张核对许可凭证（来源 URL 记录在策划表，不进页面外链）、尺寸吻合、三语字典集合一致、320px 不溢出 |

---

## 11. 悬而未决登记册（Open Decisions，来自 `open-decisions-register.md`）

> 沿用三类固定 slug；只追加、就地关闭；开工时复现未决项并逐条判断能否关闭。

| Date | Source | Category | Open item | Status | Resolution / Current leaning | Blocked by | Resolves when |
|---|---|---|---|---|---|---|---|
| 2026-11-26 | team-lead 需求 | `waiting-on-external-condition` | F3 的 API Key 尚未创建 | OPEN（开工前置） | 服务端配置，不进前端；已列入 §0.2 开工前置条件 | Makers 控制台 Models → API Key | Key 创建并安全注入配置，端到端调通一次 |
| 2026-11-26 | team-lead 需求 | `waiting-on-external-condition` | 本地 CLI 1.6.41，skill 要求 ≥1.7.7 | OPEN（开工前置） | 开工前升级 EdgeOne CLI；已列入 §0.2 开工前置条件 | 升级操作 | `edgeone --version` ≥ 1.7.7 |
| 2026-11-26 | F3 RICE | `design-decision-to-evaluate` | F3 是否纳入本轮 MVP | **RESOLVED** | **Resolution：本轮必交付，F3 升 P0，无延后分支；三项条件改为 §0.2 开工前置条件，不再作为砍范围依据。** | 已解除 | 2026-11-26 team-lead 范围调整决策下达即关闭 |
| 2026-11-26 | team-lead 本轮指派 | `design-decision-to-evaluate` | 撒糖文案定稿（4 句 + 诗意来源标签，三语） | **RESOLVED** | **Resolution：4 句原创撒糖文案 + 4 个诗意来源标签已定稿，en/zh/fr 三语齐全，中文经字体子集覆盖校验（零缺字、无需重裁）；真相源见附录 A。** | 已解除 | 文案落盘附录 A 即关闭 |
| 2026-11-26 | team-lead 本轮指派 | `design-decision-to-evaluate` | 聊天提示语定稿（3 条提示 + intro/disclaimer/placeholder，三语） | **RESOLVED** | **Resolution：3 条填入式提示语 + 欢迎语 / 虚构声明 / 输入框标签三语已定稿，均 ≤30 中文字、非自动发送、无 NSFW；真相源见附录 B。** | 已解除 | 文案落盘附录 B 即关闭 |
| 2026-11-26 | F3-AC8 | `design-decision-to-evaluate` | 用户用 fr 输入时模型回复质量未验证 | OPEN | 回复跟随输入语言，不承诺三语同等质量，UI 文案全三语 | 实测模型多语能力 | 完成 fr 输入抽样评测 |
| 2026-11-26 | F2 §9.3 | `existing-design-boundary` | 自动发布 + 删信的轻量审核，无先审后发队列 | OPEN | 小站信任模型先跑，出现滥用再加队列 | 上线后观察 | 出现滥用事件或站主要求时升格为先审后发 |

---

## 12. 依赖与版本锚定（`spec-as-contract.md`）

| 依赖 | 版本 / 值 | 动作 |
|---|---|---|
| EdgeOne CLI | 当前 1.6.41 → **目标 ≥1.7.7** | 开工前升级，作为 F3 前置 |
| 静态站构建 | 无构建步骤 | 保持无构建步骤；是否新增 package.json 由架构师按 Blob SDK 依赖裁决——AGENTS.md「无 package.json」是对现状的描述，不是禁止新增的硬约束 |
| 函数运行时（关键差异） | Blob 属 Cloud Functions / Makers Functions（Node.js + npm SDK `@edgeone/pages-blob`）；Edge Functions 是 V8 运行时，只能配 KV（全局变量、≤25MB） | 写 / 读 Blob 的函数一律放 Cloud Functions；不得放进 Edge Functions（放错运行时直接踩坑）；KV 仅用于 Edge Functions 且不承载信件集合 |
| 接口命名（与 ARCHITECTURE.md / openapi.yaml 统一） | 聊天为平台原生 `agents/chat/index.ts → POST /chat`、停止 `POST /stop`（**不是 `/api/chat`**）；写信 `POST /api/letters`（cloud-functions 路由支持 `/api` 前缀）；埋点 `POST /api/events` | PRD / UIUX 中出现的接口名一律按此写死，不得臆造 `/api/chat` |
| 模型网关 | `https://ai-gateway.edgeone.link/v1` | 固定 |
| 默认模型 | `@makers/deepseek-v4-flash`（模板默认 `@makers/deepseek-v3`） | 采用 flash；可在配置层切换 |
| Blob store | `getStore({name:<store>, consistency:"strong"})` + `setJSON` + key 前缀 `letters/<id>.json` | 固定 |
| 版本串 | `20261125d` → 新值（7 页 CSS/JS 同步） | F1/F2/F3 任一改文案都必须升级 |
| 图标方案 | 架构师锁定 **zero-library inline SVG**：不新增图标库，沿用站内现有内联 SVG（心形 `viewBox="0 0 24 22"`）与几何分隔字符 | 禁止 emoji 作功能图标；禁止紫→粉渐变；理由：前端不加载第三方资源（§0.1）+ 字体子集不含图标字形 + 7 页一致性 |

---

## 13. 内嵌已知坑（执行者事前规避，来自 `AGENTS.md`）

1. 7 页 header/footer 逐字一致，新增块字节数一致，改一处同步七处 + 逐字 diff。
2. i18n 三件套（三语字典 / HTML 英文兜底 / `?v=`）缺一不可；缺 key 静默回退英文，必须逐键比对。
3. `data-i18n` 只挂叶子节点；容器挂会抹掉 SVG 与子元素；读屏 DOM 顺序 `name → sr-only(and) → heart → name`。
4. 心形是内联 SVG，任何断点不得 `display:none`；`viewBox`/`stroke-width` 不得改。
5. 新增中文文案先查字体子集覆盖，缺字先重裁。
6. 图片真实 `width`/`height`；首屏 `fetchpriority="high"`，其余 `loading="lazy"`。
7. 外链边界（§0.1）：前端不加载第三方 URL / 字体 / 脚本 / SVG / 统计；AI 网关调用只发生在服务端同源函数，前端仍是同源；许可署名链接属必要外链，允许。
8. 320px 红线：不改根字号；改用容器高度法测细线；`getBoundingClientRect().width` 量余量。

---

## 14. 非功能需求

| 类别 | 要求 | 优先级 |
|---|---|---|
| 性能 | 静态首屏 < 3s；同源函数 p95 < 500ms；对话首字延迟可接受范围由基线校准 | P0 |
| 可用性 | 核心静态内容无单点故障；Blob / 网关失败有降级与明确提示，不影响只读浏览 | P1 |
| 安全 | 同源代理（无前端直连网关）；API Key 服务端持有；输入校验 + 频率限制 + 敏感词；HTTPS（EdgeOne 默认） | P0 |
| 兼容性 | Chrome/Safari/Firefox 最新 2 版；iOS/Android 微信最新版；320/360/390/1440 视口 | P0 |
| 可访问性 | WCAG 2.1 AA 基本合规（键盘可达 + 对比度 + 读屏顺序），继承 A4/A5 的 DOM 纪律 | P2 |
| 国际化 | en/zh/fr 三语字典 + HTML 兜底 + 版本串三件套；对话 UI 全三语 | P0 |
| 数据埋点 | 核心流程事件埋点（见 §15） | P1 |
| 合规 | 版权边界（§9.1）、隐私提示（§9.2）、AI 安全（§9.4） | P0 |

---

## 15. 数据埋点方案

> 前端不加载第三方脚本的约束下（§0.1），埋点走自建 `trackEvent()` 封装 → `POST /api/events`（P1，见 openapi.yaml），不引入第三方 SDK。服务端一事件一 key：`events/<invertedTs>-<rand>.json`，store `nafisah-events`（避免日聚合文件的并发覆盖）。**不上报 IP、信件正文、对话原文**；埋点失败静默，不阻塞主流程。此契约与架构师裁决一致，符合 §15 意图。

| 事件类别 | 必埋事件 | 说明 |
|---|---|---|
| 获客 | `page_view` | 页面与语言维度，不含 IP |
| 激活 | `letter_submit_success` / `chat_first_message` | 用户完成第一个核心操作 |
| 转化 | `letter_submit_click` → `letter_submit_success` 漏斗 | 写信转化 |
| 留存 | `session_start` / `session_duration` | 回访频次（匿名会话标识） |
| 异常 | `error_occurred` | 前端 / API 错误分类，不含原文 |

实现要求：事件命名 `{对象}_{动作}`；属性含 `user_id`（匿名）/ `timestamp` / `device` / `version`；不采集隐私数据；不采集信件正文与对话原文。

---

## 16. 端到端验证步骤（`spec-as-contract.md` 收尾）

1. **静态基线**：起本地服务 `python -m http.server 8899 --bind 127.0.0.1`；7 页 header/footer 逐字 diff；三语字典键集合一致；HTML 兜底 = 英文字典；`?v=` 7 页一致且已升级。
2. **F1 走查**：三语 × 320/360/390/1440 看 quotes/gallery 顶部带与底部框；逐张核对图片尺寸、懒加载、CC BY 署名；新增字形不缺字。
3. **F2 成功流**：确认写 Blob 的函数部署在 Cloud Functions（Makers Functions）而非 Edge Functions → 填表提交 → Blob 出现 `letters/<id>.json` → 信墙显示 → 刷新仍在 → 切三语文案正确。
4. **F2 错误流**：空提交 / 超长 / 含外链 / 含脚本被拒且无空记录；并发两封互不覆盖；模拟 Blob 写失败有错误提示。
5. **F3 成功流（前置条件完成后）**：先确认 §0.2 三项开工前置条件已满足 → 确认 `POST /chat` 返回 `text/event-stream` 且四响应头齐全 → 发消息 → `ai_response` 逐条增量渲染 → `data: [DONE]` 收尾 → 观察 5s `ping` → 思考中状态与中止入口正常 → 切换语言 UI 正确；流式期间无人为 delay、读屏不逐字播报，收尾后完整文本播报一次。
6. **F3 错误流**：移除 API Key → 明确报错且无伪造回复；NSFW 输入 → 安全拒答。
7. **截图确认**：UI 改动用 CDP 截图；>1600px 分片拼接；`captureBeyondViewport` 不触发懒加载需去掉 `loading="lazy"` 的探针页。
8. **完成定义**：以上全通过 + 验收标准满足 + 零回归，才判本轮交付完成；暴露的新坑写回 `AGENTS.md` / `.learnings/PITFALLS.md`。

---

## 17. RoleVerdict（角色裁决）

**verdict: pass**

**evidence**：
- 三项功能均有可观察的验收标准（§7，EARS 五类句式齐备），满足 `spec-as-contract.md`「可验收」要求。
- 范围明确且本轮完整：§6.1 三项功能（F1/F2/F3）全部 P0 本轮必交付、无延后分支；§6.2 逐条给出 Out-of-Scope 及原因；§11 已关闭「撒糖文案 / 聊天提示语 / F3 是否纳入」三项并写明 Resolution，余 4 项保留 `Resolves when`；§12 钉死版本与依赖（CLI ≥1.7.7、网关、模型、Blob 强一致）。
- 本轮范围调整已落定：F3 升 P0（§3.1/§6.1）；ESA 相关表述全部移除（§8）；外链边界改为「允许必要外链」并明确允许 / 禁止清单（§0.1）；三语文案真相源落盘附录 A / B。
- 已知坑内嵌（§13），端到端验证收尾（§16），满足活规格与完成定义。
- 版权与合规（§9）、隐私（§9.2）、素材清单（§10）齐备，符合团队 P0 禁令：全文无 emoji 功能图标（图标用文字语义描述，架构师已锁定 zero-library inline SVG、不新增图标库）、无紫粉渐变、无空洞占位文案。

**遗留执行门槛（非范围条件）**：F3 开工前须满足 §0.2 三项前置条件（API Key 已创建、CLI ≥1.7.7、提示词/安全评审通过）——这是启动门槛，不构成「本轮不做 F3」的理由；F1/F2 的阈值（正文长度、频率、超时）须由架构师按基线校准后在规格中钉死，不得用估值当验收阈值。

---

## 附录 A：撒糖文案（内容真相源）

> **本附录为内容真相源**，前端落地须逐字复制，不得改写。4 句均为本站原创、非 canon，围绕 OC「Nafisah × Tom」关系；「来源标签」是诗意短签（虚构出处），**不是原著书名**，不得替换为书名。落地纪律：`data-i18n` 挂叶子节点（A4）；`quotes.html` 英文 HTML 兜底须与下表 en 列逐字一致（A3 / F1-AC2）；`?v=` 版本串 7 页同步升级（A3）。

| i18n key | en | zh | fr |
|---|---|---|---|
| `sq1.text` | I wrote your name in the margin, and the page kept it warm. | 我把你的名字写在页边，纸页替我暖着它。 | J'ai écrit votre nom dans la marge, et la page l'a gardé au chaud. |
| `sq1.src` | from a letter never sent | 一封未曾寄出的信 | d'une lettre jamais envoyée |
| `sq2.text` | Your answer waits in the space between two lines. | 你在两行之间那点空白里回我。 | Votre réponse attend dans l'espace entre deux lignes. |
| `sq2.src` | from the margin of a diary | 一本日记的页边 | de la marge d'un journal |
| `sq3.text` | I leave my words where only your eyes will find them. | 我把话留在只有你的眼睛会找到的地方。 | Je laisse mes mots là où seuls vos yeux les trouveront. |
| `sq3.src` | from a note tucked into the last page | 夹在最后一页里的便条 | d'un billet glissé dans la dernière page |
| `sq4.text` | This part of the story has no reader but you. | 这段故事除了你，没有别的读者。 | Cette part de l'histoire n'a que vous pour lecteur. |
| `sq4.src` | from a page meant for two | 只写给两个人看的一页 | d'une page destinée à deux |

**字体校验结论**：以上全部中文字符（含标点）已逐字比对 `assets/css/fonts-zh.css` 现有 34 个分片的 `unicode-range` 覆盖集合，**零缺字，无需重裁字体**（对应 F1-AC6 通过）。中文主语统一用「与」不用「和」的语域在文案中体现为并列处避用「和」，整体与 `dis.title`「避雷与声明」等现有文案同源。

---

## 附录 B：聊天提示语（内容真相源）

> **本附录为内容真相源**，前端落地须逐字复制。3 条 `chat.prompt*` 是**用户可点击填入输入框的短提示，点击后不自动发送**；用户可编辑后再发送。界面文案均为系统对访客说话，法文统一用敬称 `vous`（与站内 `dis.bio` / 原著台词法译一致）。虚构角色声明与 F3-AC7 对齐，落地时须在对话区持续可见。

| i18n key | en | zh | fr |
|---|---|---|---|
| `chat.prompt1` | I kept the candle lit for you tonight. | 今晚的烛火，是为你留的。 | J'ai gardé la bougie allumée pour vous ce soir. |
| `chat.prompt2` | Are you still waiting in that diary? | 你还在那本日记里等我吗？ | Attendez-vous toujours dans ce journal ? |
| `chat.prompt3` | Let me tell you about tonight. | 我想把今晚的事讲给你听。 | Laissez-moi vous raconter cette soirée. |
| `chat.intro` | This is where you write to him. He answers in the quiet between the lines. | 在这里给他写信吧。他会在字里行间的安静里回你。 | C'est ici que vous lui écrivez. Il répond dans le silence entre les lignes. |
| `chat.disclaimer` | A fictional character, not a real person. Please do not take this as real-life advice. | 虚构角色，并非真人。请勿当作现实建议。 | Un personnage fictif, pas une personne réelle. Ne le prenez pas pour un conseil dans la vie réelle. |
| `chat.placeholder` | Write to him… | 写给他…… | Écrivez-lui… |

**约束核对**：3 条提示语中文均 ≤30 字（分别 12 / 12 / 12 字）；无 NSFW、无现实建议、无外部链接；中文字符同样经字体子集覆盖校验，零缺字。图标语义一律用文字描述、沿用站内零库内联 SVG（团队 P0：禁止 emoji 作功能图标、禁止紫粉渐变）。

---

*本 PRD 为活规格：实现中与现实冲突时先改本文档再改代码；决策留痕见 §11。*

***

*（供 team-lead 回传用的结构化摘要见随附 SendMessage。）*
