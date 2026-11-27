# Spec · Nafisah Shrine 三项功能扩展（实施计划总纲 · 单一真相源）

> 生成日期：2026-11-26
> 基于：PRD 定稿 v2 + ARCHITECTURE v1.1.0 + UIUX v1.1，三份均经 team-lead 交叉验证通过
> 状态：**已定稿，本轮调整已落地**（F3 升 P0 / ESA 下线 / TS 6.0.3 / 外链解禁 / 文案定稿 / 新增 chat 页）
> 下游唯一依据：本文件与 `openapi.yaml` / 6 份 ADR（ADR-001..006）/ 三份分文档；禁止执行者自行拼装终值

---

## 0. 参考 Skill 接入状态（已完成）

| 项 | 值 |
|---|---|
| 仓库 | `TencentEdgeOne/edgeone-makers-tools`（GitHub） |
| 安装位置 | `C:\Users\xgzwl\.workbuddy\skills\edgeone-makers-tools\`（用户级） |
| 结构 | `SKILL.md` 路由 + 11 个 capability 参考（agents / deploy / edge-functions / cloud-functions / storage / middleware / cli / recipes / migration / frameworks / env-adaption） |
| 中国站入口 | CLI `edgeone login --site china`；模型网关 `https://ai-gateway.edgeone.link/v1`；API Key 在 Makers 控制台 Models → API Key 创建 |
| 版本缺口 | 本机 CLI **1.6.41** → skill 要求 **≥1.7.7**，开工前必须升级（已列为 P0 前置） |

---

## 1. 产品定义与范围

**一句话**：把单向只读的三语同人 shrine，升级为「看撒糖 → 写信留存 → 与主角对话」的参与阶梯，自有设计语言，允许必要外链但静态首屏不依赖外链。

| 优先级 | 功能 | RICE | 本轮策略 |
|---|---|---|---|
| P0 | F1 扩展图库与撒糖语录 | 3.60 | 全量交付 |
| P0 | F2 给主角写信（提交 + 持久保存） | 1.92 | 全量交付 |
| P0 | F3 站内原生 AI 对话 | 1.17 | **本轮必交付**（用户已拍板升 P0） |

**交付闭环**：三项全量交付（看 → 写 → 对话）。F3 的三项开工前置（API Key / CLI ≥1.7.7 / 提示词安全评审）是**启动 gate**，不是延期理由。

---

## 2. 任务拆分（WBS，按依赖顺序）

| 阶段 | 任务 | 产物 | 依赖 | 门禁 |
|---|---|---|---|---|
| T0 | 升级 CLI 至 1.7.7、创建模型 API Key、安装 npm 依赖并提交锁文件 | `package.json` / `package-lock.json` | 用户授权（CLI 全局升级） | `edgeone -v` = 1.7.7 |
| T1 | F1 内容扩写：4 句撒糖文案 + 4–6 张日记图 + 三语字典 + 版本串 | `quotes.html` / `gallery.html` / `i18n.js` / `assets/img/*.webp` / 8 页 `?v=` | 素材目检 + 许可核验；中文文案查字体子集 | T1-G1 |
| T2 | F2 后端：`cloud-functions/api/letters/` 四个文件 + Blob store + 限流 + 审核端点 | `index.ts` / `service.ts` / `repo.ts` / `schema.ts` | T0 + T0 校准回填 | T2-G1 |
| T3 | F2 前端：`letters.html` 表单 + 信墙 + `assets/js/letters.js` | 同上 | T2 | T3-G1 |
| T4 | F3 后端：`agents/chat/` + `agents/stop/` + `_shared.ts` / `_model.ts` | SSE 端点 + 提示词 | T0 + API Key + 安全评审 | T4-G1 |
| T5 | F3 前端：`chat.html` 独立页 + `assets/js/chat.js` 流式读取 / 停止 / 错误态 | 8 页 nav 加 Chat 项 | T4 | T5-G1 |
| T6 | EdgeOne 单链路回归 + 源泄漏验证 + 上线 | 仅 `origin` 触发部署 | T1–T5 | T6-G1 |

> 三语字典按组一次补齐（PITFALLS 五：缺 key 静默保留英文，不报错）；版本串单一真相源 **`20261126a`**，8 页共 16 处同步。
> **本轮已落地的静态层**（T1/T5 的前端可见部分）：`chat.html` 独立页 + 8 页 nav + 4 句撒糖文案 + 3 条聊天提示语 + 三语字典（各 144 键）+ CSS chat 组件；静态层已通过 CDP 真视口验证。后端 Functions 仍待 T2/T4 实现。

---

## 3. 依赖项清单（版本锚定）

| 依赖 | 版本 / 值 | 动作 |
|---|---|---|
| EdgeOne CLI | 本机 1.6.41 → **1.7.7** | `npm install -g edgeone@1.7.7`，需 owner 同意 |
| `@edgeone/pages-blob` | `^0.0.14` | 写入 `package.json` dependencies；旧版有已知 bug |
| Node.js | v22.22.2 | 本机已装，保持 |
| TypeScript | **6.0.3** | npm 实测 6.x 最新稳定版；devDependencies 仅本地 `tsc --noEmit` 检查。tsconfig：`target ES2022` / `module`+`moduleResolution: nodenext` / `strict true` / `noEmit true` / 不设 `types` / 不设 `ignoreDeprecations`（官方 6.0 发布说明逐条核对，本项目未用弃用项） |
| 模型网关 | `https://ai-gateway.edgeone.link/v1` | 服务端专用 |
| 默认模型 | `@makers/deepseek-v4-flash` | 配置层可切，UI 不暴露 |
| Blob store | `nafisah-letters` / `nafisah-ratelimit` / `nafisah-events`（P1 埋点）/ 预留 `nafisah-chats` | `getStore({name, consistency:"strong"})` |
| `installCommand` | 空 → `npm ci --no-audit --no-fund` | 首次先本地 `npm install` 生成锁文件并提交 |
| `buildCommand` | 保持空 | 填 `npm run build` 会破坏 `outputDirectory: "."` |
| `agents.framework` | **不设置** | 无框架直连网关路径无需配置 |
| 接口命名 | 写信 `/api/letters`、审核 `/api/letters/{id}`、聊天 `/chat`、停止 `/stop`、埋点 `/api/events` | 平台原生路由；**不得臆造 `/api/chat`**（agent 子目录映射未经官方保证） |
| 图标方案 | 锁定方案名 **`inline-svg-currentColor-24grid`**：现有心形（`viewBox="0 0 24 22"` 一字不改）+ UIUX §2.2 白名单 5 枚手绘 path（`viewBox="0 0 24 24"`、stroke 2、`butt`+`miter`、16/20/24px、CSS `width:1em;height:1em`） | 零依赖、只用 currentColor；不引外部库/字体/mask、不用 emoji、不用字符符号充当功能图标；图标须为 `[data-i18n]` 节点的**兄弟**而非子节点 |

**不引入**：React / Vue / Next.js / Tailwind / Prisma / sqlite / pg / DOMPurify / zod / dotenv / 第三方字体 / 插屏广告 / 统计脚本 / iframe 挂件。
**外链边界**（原「零外链」已解除）：允许服务端网关调用、CC BY 署名与素材来源链接、版权方文字指称；静态首屏仍不依赖外链（心形内联、字体本地、图片本地）；API Key 永不落前端。前端第三方 script / iframe / CDN / 字体 / 统计脚本仍禁止。详见 ARCHITECTURE §1.4 与 PRD §0.1。

---

## 4. 页面与数据结构影响

### 4.1 页面（8 页，新增 chat.html）

| 页面 | 变更 | 本轮状态 |
|---|---|---|
| `quotes.html` | 既有 5 条后新增独立 `.quote-grid--sweet` 容器放 4 张撒糖卡（不塞进旧 grid，避开 `nth-child(5)` 通栏规则；2×2 零空洞） | **已落地**，三语文案 + 兜底已实测一致 |
| `gallery.html` | 追加 4–6 张氛围图，按「3 张单格一组、通栏只放组间」规则；2 列断点末项须为单格 | 待 T1 素材定稿 |
| `letters.html` | 既有 3 封后加表单 + 信墙；显式公开同意勾选框（team-lead 裁决） | 待 T3 实现 |
| `chat.html` | **新增第 8 页**：站内原生对话面板，含虚构角色声明、3 条提示按钮、输入框、发送/停止 | **骨架已落地**（CSS + i18n + HTML），JS 逻辑待 T5 |
| `disclaimer.html` | 增补 UGC 条款（公开展示 / 匿名 / 删除请求 / 不收集个人信息）与 AI 免责声明 | 待补 |
| 全部 8 页 | nav 加第 7 项 Chat；header/footer 逐字一致；`?v=20261126a` 共 16 处 | **已落地并实测 PASS**（含 CRLF 一致性） |

### 4.2 数据结构

信件记录（`letters/<invertedTs>-<rand6>.json`，一信一 key，字典序即时间序）：

```ts
interface LetterRecord {
  id: string;          // 倒排时间戳 + 随机后缀，全局唯一
  createdAt: string;   // ISO 8601 UTC，服务端生成，不信客户端
  locale: 'en'|'zh'|'fr';
  name: string | null; // ≤40 字符，服务端转义
  text: string;        // 20–1000 字符，服务端转义
  status: 'published'|'hidden';
  source: 'web';
  version: 1;
}
```

- **不收集**邮箱 / 电话 / 地址 / IP；限流用加盐哈希，与信件分离，公开响应永不返回哈希。
- 聊天历史**不落库**：客户端持有最近 20 条，会话 ID 存 `localStorage`；未来需续聊才启用 `chats/<id>.json` 预留方案并补隐私告知。

### 4.3 API 端点（以 `openapi.yaml` 为准）

| 方法 | 路径 | 运行时 | 说明 |
|---|---|---|---|
| GET / POST | `/api/letters` | Cloud Functions | 列表（分页）/ 提交（201 + id） |
| PATCH / DELETE | `/api/letters/{id}` | Cloud Functions | 站长 Bearer 令牌下架 / 删除 |
| POST | `/chat` | Agents | SSE：`ai_response` / `ping` / `error_message`，`[DONE]` 收尾 |
| POST | `/stop` | Agents | body 带 `conversation_id`；**必须同时带 `makers-conversation-id` 头**（实测推翻原文档：agent 运行时在进入 handler 前强制校验该头，缺失直接 400 `AGENT_CONVERSATION_ID_REQUIRED`，停止功能完全不可用） |
| POST | `/api/events` | Cloud Functions | P1 埋点（**不阻塞 P0 三大功能**）；一事件一 key `events/<invertedTs>-<rand>.json`，store `nafisah-events` 避免日聚合并发覆盖；不上报 IP / 信件正文 / 对话原文，失败静默 |
| GET | `/api/analytics-config` | Cloud Functions | EntMesh Browser Key 运行时注入：从平台 env `ENTMESH_BROWSER_KEY` 读 `pk_` publishable key，连同 sdkUrl/endpoint 返回；key 不入库、不进静态产物；缺 key 返回 `data:null` 前端静默跳过 |
| GET / POST | `/api/hearts` | Cloud Functions | 爱心全局计数：GET 读 `{count}`，POST +1 并返回新值；store `nafisah-hearts` 单键 `hearts/count.json`，strong consistency；前端串行排队 POST 避免读改写竞争，计数是累计值不做清理；音效默认静音，开关存浏览器偏好 |

统一错误码：`40001/40002/40003/40301/40401/42901/50001/50002`；SSE 场景 HTTP 恒 200，错误走 `error_message` 事件。

前端**四类错误映射**（`openapi.yaml` 的 `components.schemas.Envelope.x-error-class-mapping`，后端 9 码不变）：

| 类 | 后端 code | UI 表现 |
|---|---|---|
| `network` | fetch 抛错且无 HTTP 响应（**非主动 abort**） | banner：`letter.form.error.network` / `chat.error.network` |
| `rate` | 42901 | banner：`.rate` |
| `server` | 40301 / 40401 / 50001 / 50002 | banner：`.server`，不暴露网关原文 |
| `invalid` | 40001 / 40002 / 40003 | **字段级内联** `.form-error` + `alert` SVG，**不进 banner**；`code` 缺失时按 `server` 兜底 |

**中止契约（两段式）**：前端 `AbortController.abort()` 断流 + fire-and-forget `POST /stop`（body 带 `conversation_id`，**不带** `makers-conversation-id`）；服务端静默收流，前端 `aborted===true` 跳过重试、显示 `chat.stopped`。**中止轮在屏幕上保留**，但下一轮 `POST /chat` 的 `messages` 里必须剔除该轮的 user + partial assistant（否则模型会对着半句话继续接）；该提示只记 UI 状态、不落库。
**语言契约**：`locale` 为请求体顶层字段（不嵌套在 options 里、不放 header），前端传 `ShrineI18n.current()`；缺省 `en`，白名单 `en|zh|fr`；system prompt 要求按该语言回复并保持 shrine 克制语气。**不承诺三语同等质量**——fr 输入抽样评测列为 OPEN 项，不阻塞首版；前端 UI 不展示模型名与质量等级。

**公开同意勾选框（team-lead 裁决，第五处跨文档冲突）**：ARCHITECTURE §3.2 / §10 步骤 6 假设 UI 有显式勾选框并测「不勾 consent → 40001」；UIUX.md v1.1 第 186 行却写「不设独立勾选框、提交时由前端直接附 `consent:true`」——两者互斥，且后者会让架构师的错误路径**无法执行**。裁决：**UI 必须提供显式勾选框**（UGC 公开展示需明确同意，本站受众含未成年人，仅靠隐私提示不足以承担告知），`letter.form.privacy` 首次聚焦提示作为**补充**而非替代；API 层 `consent: true` 必传且 `const:true` 不变；错误路径按 ARCHITECTURE §10 第 6 步执行。**UIUX.md 第 186 行「不设独立勾选框」作废，以本 Spec 为准。**

---

## 5. 存储方案选择（结论 + 证据）

| 判据 | Blob（选中） | KV（排除） |
|---|---|---|
| 平台定位 | 官方「Blob IS your database」，无托管数据库 | 仅 Edge Functions（V8）、≤25 MB、全局变量 |
| 运行时匹配 | Cloud Functions（Node.js + npm SDK），与聊天代理同栈 | 不匹配——聊天端点必须在 Node 侧 |
| 增长型数据 | `setJSON` + key 前缀，官方推荐一文件一记录 | 扁平键值，无原生分组 |
| 并发安全 | 一信一 key，无读改写，并发不覆盖 | 单键读改写易互相覆盖 |
| 一致性 | `getStore({name, consistency:"strong"})` 一处锁定，写完即读可见 | 需逐调用传参 |
| 容量 | 免费层 1 GB | 25 MB |

**硬门禁**：出现 `getStore("nafisah-letters")`（字符串形式 = 默认 eventual）直接退回；只用对象形式 + strong。禁止 `letters/all.json` 单文档数组。
**扩容触发点**：约 2000 封时改游标分页，不在 MVP 提前优化。

---

## 6. 素材处理方式

1. **主题**：手写信笺、摊开的日记、干花、烛台旁的本子、系带纸、两只用过的杯子；禁止角色肖像、影视剧照、商标、**紫→粉渐变**、高饱和甜腻、亮奶油色摆拍。
2. **灰度直方图**：先查中位 / P90 / >30 像素占比（历史反例：中位 1.0、P90 3.9、仅 1.8% >30 = 没有图像数据，不是「氛围暗」）。
3. **暖偏指标**只筛色调，不替代目检（历史反例：暖偏 +35.8 的「壁龛墙角」实为粉刷墙面）。
4. **Contact sheet**：候选缩略图拼一张一次目检（历史：14 张拼 1200×930 排除外景/肖像/教堂）。Commons 缩略图只用白名单宽度 1280 / 1920。
5. **许可**：仅 PD / CC0 / CC BY；**避免 CC BY-SA**（裁切即衍生，SA 有传染性）。CC BY 沿用 `.gallery-credit` 在图注下署名；外链解禁后可加来源链接，但署名文字本身不可删。
6. **工程**：转 webp ≤300 KB；`<img>` 真实 `width`/`height` 逐一比对像素；图库区 `loading="lazy"`，首屏 LCP 图 `fetchpriority="high"`；`data-i18n-alt` 三语齐备。
7. **中文文案**：先查 34 个字体分片 cmap 覆盖，缺字先重裁，否则静默缺字。

---

## 7. 验收要点（Phase 门禁）

> **执行纪律（来自 `AGENTS.md:121` + ARCHITECTURE §3.10）**：架构文档里所有阈值（正文长度、频率、超时、TTFT）都是**默认起点，不是验收阈值**。T0 必须先跑完四组基线校准（A 从现有 9 条日记样本量长度；B 放宽观测 7 天取 p99×1.5；C 20 次请求量 TTFT/total、耐心 = p95(TTFT)+5s；D 合成 100/500/1000 条测 list p95，>500ms 切游标），把校准值回填后再写入验收标准。未校准前把默认数字当断言 = 假绿。

| 门禁 | 判据 |
|---|---|
| **T1-G1** | 三语字典键集合一致（**各 144，已实测 PASS**）；HTML 英文兜底逐字等于英文字典（**已实测 mismatch=0**）；**16 处** `?v=20261126a`；**8 页** header/footer 逐字 diff 为空（**已实测 PASS**）；新图尺寸与像素一致、CC BY 署名保留；320/360/390/1440 × 三语看顶部带与底部框（**CDP 真视口已实测，含 CRLF 一致性坑**） |
| **T2-G1** | 用 `edgeone makers dev` 起服务；Blob 写读 strong 一致性（写完立刻列表可见）；并发两封独立 key；边界值**按 §7 校准回填后的数字**实测（默认起点示例 19/20/1000/1001，未校准不得当断言）；`<script>` 按纯文本显示；蜜罐 `website` 非空返回 `code:0` 但不新增 key；`consent` 缺失 → 40001 |
| **T3-G1** | 表单键盘全流程；错误就近、失败不清空正文、成功焦点转移；UGC 全程 `textContent`、不挂 `data-i18n`；**单链路无 ESA 降级探测**（架构 §6）；显式 `consent` 勾选框必填；无 console error、无布局塌陷 |
| **T4-G1** | `POST /chat` 必需三响应头 `Content-Type: text/event-stream` / `Cache-Control: no-cache` / `Connection: keep-alive` 线上实测齐全；`X-Accel-Buffering: no` 由 handler 设置（`_shared.ts`），**本地 dev** 可见双份（`no, no`）、**EdgeOne 生产运行时会剥离该头**（3 种请求形态实测均无），属平台差异、不影响 SSE，门禁记 advisory 不阻断；`ai_response` 增量 + `[DONE]`（短回复 <5s 时无 ping 属正常，用长回复验证心跳）；请求头带 `makers-conversation-id`；网关错误不伪造回复；NSFW 安全拒答 |
| **T5-G1** | `chat.html` 在 8 页 nav 可达且三语标题正确；IME 守卫（中文输入法 Enter 不误发）；流式期间输出节点 `aria-live="off"`、收尾一次性播报；停止后回焦、不显示网络错误重试；未收 `[DONE]` 才提示重试 |
| **T6-G1** | **源泄漏**：线上 `/agents/chat/index.ts` 与 `/cloud-functions/letters/index.ts` 非 200 源码（若为 200，8 页 + `assets/` 迁 `public/`，`outputDirectory` 改 `public`）；**仅 `origin` 触发部署**，GitHub 只做代码备份；EdgeOne 线上走一遍主路径 |

**通用测量纪律**：用 CDP `Emulation.setDeviceMetricsOverride`（禁 `--window-size=390`，Windows headless 最小视口约 526px）；「单行」用容器高度法或成对元素 top 差 < 2px（心形 `translateY` 会误判）；横溢判据 `scrollWidth === clientWidth`；余量用 `getBoundingClientRect().width`；>1600px 分片截图；`captureBeyondViewport` 不触发懒加载，用去掉 `loading="lazy"` 的探针页。
**回归红线**：零新增 `font-weight ≥ 500`；不得给 `html` 加 `font-size`；新 CSS 基础规则插 `style.css` 第 702–717 行之间，响应式写进既有媒体块，`prefers-reduced-motion: reduce` 块永远最后。

---

## 8. 未决项（Owner 需拍板）

> 本轮已关闭三项：F3 纳入（升 P0）、文案定稿（PRD 附录 A/B）、对话入口（新增 chat.html + 8 页 nav）。余 2 项 OPEN。

| 项 | 当前倾向 | 阻塞 | 状态 |
|---|---|---|---|
| 网关变量名 `AI_GATEWAY_API_KEY` vs `MAKERS_MODELS_KEY` | 双名兼容 + 临时 envprobe 实测键名后回填 | 首次部署实测 | OPEN |
| 源泄漏兜底是否预先迁 `public/` | 先实测再决定（避免无谓大改） | 线上实测 | OPEN |
| F3 是否本轮纳入 | — | — | **RESOLVED**：用户拍板升 P0 本轮必交付 |
| 4 句撒糖 + 3 条提示语定稿 | — | — | **RESOLVED**：PRD 附录 A/B 逐字真相源，已落地 i18n + HTML |
| 对话入口形态 | — | — | **RESOLVED**：用户选独立 `chat.html` + 全站 nav，已落地实测 |

**开工 gate（非延期理由）**：API Key 创建 / CLI ≥1.7.7 / 提示词安全评审——三项具备才启动 T4，但 F3 范围不再可变。

---

## 9. 变更记录

| 日期 | 变更 | 原因 |
|---|---|---|
| 2026-11-26 | 初版 | 基于三份专家文档汇编；交叉验证修正三处冲突：运行时术语（Edge→Cloud Functions）、package.json 表述（现状≠禁令）、流式边界（SSE 协议层必需 / 打字机效果层排除） |
| 2026-11-26 | 补录架构师四项裁决 | 图标冻结为 zero-library inline SVG；接口命名写死（无 `/api/chat`）；埋点走 `POST /api/events` + `nafisah-events` store；ESA 探测四重校验（`res.ok` 不足以判定） |
| 2026-11-26 | 补录第二轮架构裁决 | 图标方案锁定名 `inline-svg-currentColor-24grid`；错误码四类映射（新增 `invalid` 字段级内联，不进 banner）；两段式 abort 与语言契约；阈值校准四组程序前置；新增 ADR-005 记录 SSE 裁决 |
| 2026-11-26 | 补录第三轮 + 第五处冲突裁决 | 中止轮在屏保留但下一轮 POST 剔除；`locale` 顶层字段/缺省 en/fr 评测不阻塞；校准回填作为 T2 前置；**公开同意必须有显式勾选框**（架构 §10 错误路径与 UIUX v1.1「不设勾选框」互斥，以本 Spec 为准，UIUX 第 186 行作废） |
| 2026-11-26 | **本轮调整（用户拍板）** | ① ESA 下线：`esa.jsonc` 删除、GitHub 改代码备份、单链路 EdgeOne；② TS 5.7.3→**6.0.3** + nodenext/ES2022 tsconfig；③ 新增 `chat.html` 第 8 页 + 8 页 nav（用户三选一拍板）；④ F3 升 P0 本轮必交付；⑤ 零外链解除为「允许必要外链」；⑥ 撒糖 4 句 + 聊天 6 键文案定稿并落地（PRD 附录 A/B）。静态层已实测：三语各 144 键一致、兜底零 mismatch、8 页 header/footer PASS、CDP 真视口零溢出。新增 ADR-006 |
| 2026-11-26 | 实现阶段实测回填 | TS 6.0.3 需 @types/node@22 + types:[node]（21 处全局类型错→0）；nodenext 相对导入必须带 .js 扩展名；/stop 必须带 makers-conversation-id 头（运行时强制校验，实测推翻原文档）；HTML 转义契约收敛为服务端单遍解码回原文 + 前端 textContent 零解码；dev server 实测端口 9000(函数)/9002(agent)/8088(总入口)，热重载端口漂移需重启干净实例；源泄漏实测本地与线上均 404 无需迁 public；网关 HTTP 200 + openai-chat 协议实测可用；F2 主/错误/并发/strong/XSS/蜜罐全绿，F3 SSE 四响应头 + 增量 + [DONE] + 错误流全绿。 |
| 2026-11-26 | 对话页改名修复线上路由遮蔽 | 静态页 `chat.html` 遮蔽同名 Agent 路由 `/chat`（POST /chat 返回 HTML 而非 SSE；`/stop` 无同名文件故正常）。用户拍板方案 A：改名 `conversation.html`，8 页 nav 同步、`?v=` 升 20261126b（18 处），Agent 路由与前端 JS 不动。本行之前所有 `chat.html` 表述为历史记录，指同一页面。 |
| 2026-11-26 | 接入 EntMesh 分析 SDK | owner 提供文档/collector/UMD/Browser Key/Origin；选 SDK 默认全开档位 + key 走平台 env 运行时注入。新增 /api/analytics-config 端点、assets/js/entmesh.js、8 页 script（版本串升 20261126c）、dis.analytics 三语披露并修正 dis.3 旧「无第三方外链」表述。门禁新增配置端点校验、JSS 列表纳入 entmesh.js。 |
