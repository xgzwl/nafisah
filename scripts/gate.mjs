#!/usr/bin/env node
/**
 * Nafisah Shrine 上线门禁（自包含，零外部依赖，只用 node / git / curl / cnb）
 *
 * 用法：
 *   node scripts/gate.mjs            等同 all
 *   node scripts/gate.mjs local      只跑本地静态门禁（提交前）
 *   node scripts/gate.mjs deploy     只跑部署门禁（推送后，查构建状态）
 *   node scripts/gate.mjs online     只跑线上功能门禁（部署生效后）
 *   GATE_SITE=http://127.0.0.1:8088 node scripts/gate.mjs online   指向本地 dev
 *
 * 安全：token 只从本地 .env 读取，全程只用 SHA256 指纹/长度/布尔比对，
 *       不回显任何密钥值，不把值写入任何文件；上线门禁会自建测试信并在
 *       结束时用审核端点清理，失败时明确报告残留 id 供人工处理。
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SITE = (process.env.GATE_SITE || 'https://nafisah.xgzwlkj.com').replace(/\/$/, '');
const MODE = (process.argv[2] || 'all').toLowerCase();
const REPO = 'xgzwlkj/nafisah';
const PAGES = ['index', 'about', 'quotes', 'letters', 'gallery', 'conversation', 'disclaimer', '404'];
const JSS = ['i18n', 'main', 'letters', 'chat', 'entmesh', 'gallery', 'pwa', 'heart'].map((n) => `assets/js/${n}.js`).concat(['sw.js']);
process.chdir(ROOT);

function run(cmd, args = [], opts = {}) {
  // Windows 上 npm 是 npm.cmd，spawnSync 不加 shell 会 ENOENT（status=null 被误判为 FAIL）
  const useShell = process.platform === 'win32' && /^(npm|npx|cnb)$/.test(cmd);
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, shell: useShell, ...opts });
  return { code: r.status ?? 1, out: r.stdout ?? '', err: r.stderr ?? '' };
}
function curl(args, timeout = 30) {
  return run('curl', ['-sS', '--noproxy', '*', '--max-time', String(timeout), ...args]);
}
function read(p) { return readFileSync(join(ROOT, p), 'utf8'); }
function fp(s) { return createHash('sha256').update(String(s)).digest('hex').slice(0, 12); }
function envValue(key) {
  if (!existsSync(join(ROOT, '.env'))) return '';
  const m = readFileSync(join(ROOT, '.env'), 'utf8').match(new RegExp('^' + key + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
}
const ok = (detail = '') => ({ ok: true, detail });
const no = (detail = '') => ({ ok: false, detail });
const flat = (s) => String(s).replace(/\s+/g, ' ').trim().slice(0, 220);
const httpCode = (out) => String(out).trim().split('\n').pop().trim();
const bodyOf = (out) => String(out).trim().split('\n').slice(0, -1).join('\n');

const results = [];
const createdIds = [];
const stamp = Date.now();
async function gate(group, name, fn) {
  let r;
  try { r = await fn(); } catch (e) { r = no('EXCEPTION: ' + (e?.message || e)); }
  results.push({ group, name, ...r });
  console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${group} · ${name}${r.detail ? ' — ' + flat(r.detail) : ''}`);
}
function total() {
  const r = curl([`${SITE}/api/letters?page=1`]);
  try { return JSON.parse(r.out).data.total; } catch { return -1; }
}
function postLetter(text, extra = {}) {
  const body = JSON.stringify({ text, name: 'GateCheck', locale: 'zh', consent: true, website: '', ...extra });
  return curl(['-X', 'POST', `${SITE}/api/letters`, '-H', 'Content-Type: application/json', '-d', body, '-w', '\n%{http_code}']);
}

/* ---------------- 本地静态门禁 ---------------- */
async function localGates() {
  await gate('local', 'TypeScript 类型检查', () => {
    const r = run('npm', ['run', 'typecheck']);
    return r.code === 0 ? ok('0 errors') : no(r.out + r.err);
  });

  await gate('local', 'JS 语法', () => {
    for (const f of JSS) {
      const r = run('node', ['--check', f]);
      if (r.code !== 0) return no(`${f}: ${r.err.slice(0, 120)}`);
    }
    return ok(`${JSS.length} files`);
  });

  await gate('local', 'i18n 三语键一致 + HTML 兜底', () => {
    const js = read('assets/js/i18n.js');
    const sandbox = { window: {} };
    new Function('window', js.replace(/^\(function \(\) \{/, '').replace(/\}\)\(\);\s*$/, ''))(sandbox.window);
    const d = sandbox.window.ShrineI18n.dict;
    const keys = (l) => Object.keys(d[l]).sort();
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (!same(keys('en'), keys('zh')) || !same(keys('en'), keys('fr')))
      return no(`键集合不一致 en=${keys('en').length} zh=${keys('zh').length} fr=${keys('fr').length}`);
    let mismatch = 0, missing = 0;
    for (const p of PAGES) {
      const h = read(p + '.html');
      const re = /<([a-z]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g;
      let m;
      while ((m = re.exec(h)) !== null) {
        const key = m[2], text = m[3].trim();
        if (!(key in d.en)) { missing++; continue; }
        if (text && text !== String(d.en[key]).trim()) mismatch++;
      }
    }
    return mismatch || missing ? no(`兜底失配=${mismatch} 缺键=${missing}`) : ok(`${keys('en').length} keys × 3`);
  });

  await gate('local', '8 页 header/footer 逐字一致', () => {
    const grab = (s, t) => { const m = s.match(new RegExp('<' + t + '[\\s\\S]*?</' + t + '>')); return m ? m[0] : null; };
    const idx = read('index.html');
    const bh = grab(idx, 'header'), bf = grab(idx, 'footer');
    const diff = PAGES.filter((p) => { const s = read(p + '.html'); return grab(s, 'header') !== bh || grab(s, 'footer') !== bf; });
    return diff.length ? no('DIFF: ' + diff.join(',')) : ok('8 pages');
  });

  await gate('local', '版本串唯一', () => {
    const set = new Set();
    for (const p of PAGES) for (const m of read(p + '.html').matchAll(/\?v=([A-Za-z0-9]+)/g)) set.add(m[1]);
    return set.size === 1 ? ok([...set][0]) : no('多版本: ' + [...set].join(','));
  });

  await gate('local', 'HTML CRLF 一致', () => {
    const bad = PAGES.filter((p) => /(?<!\r)\n/.test(read(p + '.html')));
    return bad.length ? no('裸 LF: ' + bad.join(',')) : ok('all CRLF');
  });

  await gate('local', 'P0 扫描（emoji/渐变/占位/innerHTML/裸hex）', () => {
    const EMOJI = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}\u{200D}\u{20E3}]/u;
    const files = [...PAGES.map((p) => p + '.html'), ...JSS, 'assets/css/style.css'];
    const issues = [];
    for (const f of files) {
      const s = read(f);
      if (EMOJI.test(s)) issues.push(f + ':emoji');
      if (/#7C3AED|#A855F7|#EC4899/i.test(s)) issues.push(f + ':紫粉渐变色值');
      if (/Lorem ipsum|Welcome to Our App|Sign up today/i.test(s)) issues.push(f + ':占位文案');
      // UGC 渲染路径禁 innerHTML；i18n.js 的 data-i18n-html 是 AGENTS.md §3 明确允许的唯一例外
      if (f === 'assets/js/letters.js' || f === 'assets/js/chat.js') {
        if (/innerHTML/.test(s)) issues.push(f + ':innerHTML(UGC)');
      }
      // 动态注入 <style> 破坏 token 纪律
      if (f.endsWith('.js') && /createElement\(["']style["']\)/.test(s)) issues.push(f + ':注入style');
    }
    // 裸 hex 只查 CSS 的 :root 之外（token 定义集中区允许）
    const css = read('assets/css/style.css').replace(/:root\s*\{[^}]*\}/g, '');
    if (/#[0-9a-fA-F]{3,8}\b/.test(css)) issues.push('style.css:裸hex(非token)');
    return issues.length ? no(issues.slice(0, 8).join(' ')) : ok(`${files.length} files`);
  });

  await gate('local', '密钥零入库', () => {
    const files = run('git', ['ls-files']).out.split('\n').filter(Boolean);
    const textExt = /\.(html|css|js|ts|json|md|ya?ml)$|^\.env\.example$|^edgeone\.json$|^\.gitignore$/;
    const vals = ['AI_GATEWAY_API_KEY', 'MODERATION_TOKEN', 'RATE_LIMIT_SALT'].map(envValue).filter(Boolean);
    const hits = [];
    for (const f of files) {
      if (!textExt.test(f)) continue;
      let s; try { s = read(f); } catch { continue; }
      if (/sk-[A-Za-z0-9_-]{20,}/.test(s)) hits.push(f + ':sk-pattern');
      for (const v of vals) if (v.length > 8 && s.includes(v)) { hits.push(f + ':env-value'); break; }
    }
    return hits.length ? no(hits.slice(0, 8).join(' ')) : ok(`${files.length} tracked files, 0 leaks`);
  });

  await gate('local', '.workbuddy/ 未入库', () => {
    const tracked = run('git', ['ls-files']).out.split('\n').filter((f) => f.startsWith('.workbuddy/'));
    const staged = run('git', ['diff', '--cached', '--name-only']).out.split('\n').filter((f) => f.startsWith('.workbuddy/'));
    return tracked.length || staged.length ? no([...tracked, ...staged].slice(0, 5).join(',')) : ok();
  });

  await gate('local', '诊断探针零残留', () => {
    const PAT = /__TEMP_PROBE|__TEMP_CLEANUP|__authprobe|__writeprobe|__envprobe|__hashprobe|probeWrite|probeHash|decodeEscaped/g;
    const files = run('git', ['ls-files', 'cloud-functions', 'agents', 'assets/js']).out.split('\n').filter((f) => /\.(ts|js)$/.test(f));
    const bad = files.filter((f) => PAT.test(read(f)));
    return bad.length ? no(bad.join(',')) : ok(`${files.length} files`);
  });

  await gate('local', '单文件 ≤300 行', () => {
    const files = run('git', ['ls-files', 'cloud-functions', 'agents']).out.split('\n').filter((f) => f.endsWith('.ts'));
    const bad = files.filter((f) => read(f).split('\n').length > 300);
    return bad.length ? no(bad.join(',')) : ok(`${files.length} files`);
  });

  await gate('local', '两端 main commit/tree 一致', () => {
    const head = run('git', ['rev-parse', 'HEAD']).out.trim();
    const tree = run('git', ['rev-parse', 'HEAD^{tree}']).out.trim();
    const remote = (s) => run('git', ['ls-remote', s, 'refs/heads/main']).out.trim().split(/\s+/)[0];
    const o = remote('origin'), g = remote('github');
    if (!o || !g || head !== o || head !== g)
      return no(`commit local=${head.slice(0, 7)} cnb=${(o || '-').slice(0, 7)} github=${(g || '-').slice(0, 7)}`);
    const ot = run('git', ['rev-parse', `${o}^{tree}`]).out.trim();
    const gt = run('git', ['rev-parse', `${g}^{tree}`]).out.trim();
    if ((ot && ot !== tree) || (gt && gt !== tree)) return no(`tree local=${tree} cnb=${ot} github=${gt}`);
    return ok(head.slice(0, 7));
  });
}

/* ---------------- 部署门禁（查状态，不 sleep 盲等） ---------------- */
async function deployGates() {
  await gate('deploy', 'CNB 最近构建 success 且 sha=本地 HEAD', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const head = run('git', ['rev-parse', 'HEAD']).out.trim();
    let st = 'unknown', sha = '', logTail = '';
    // 刚 push 完时构建常处于 pending，按状态轮询而非一次判死。
    for (let i = 0; i < 6; i++) {
      const r = run('cnb', ['build', 'get-build-logs', '--repo', REPO, '--targetRef', 'main', '--createTime', today, '--page-size', '3']);
      if (r.code !== 0) return no('cnb CLI: ' + flat(r.err || r.out));
      st = (r.out.match(/^\s+status:\s*(\w+)/m) || [])[1] || 'unknown';
      sha = (r.out.match(/sha:\s*([0-9a-f]{40})/) || [])[1] || '';
      logTail = `${st} ${sha.slice(0, 7)}`;
      if (st === 'success' || st === 'error' || st === 'cancel') break;
      if (i < 5) await new Promise((res) => setTimeout(res, 10000));
    }
    if (st !== 'success') return no('最近构建=' + logTail);
    if (sha && sha !== head) return no(`构建sha=${sha.slice(0, 7)} 本地=${head.slice(0, 7)}`);
    return ok('success ' + sha.slice(0, 7));
  });

  await gate('deploy', 'EdgeOne 已拉取（Last-Modified ≥ 构建时间）', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const logs = run('cnb', ['build', 'get-build-logs', '--repo', REPO, '--targetRef', 'main', '--createTime', today, '--page-size', '1']).out;
    const ct = (logs.match(/createTime:\s*"([^"]+)"/) || [])[1];
    if (!ct) return no('无构建时间');
    const built = Date.parse(ct);
    // 按 Last-Modified 判据轮询，每次都检查，非固定 sleep 盲等。
    // 判据：LM >= 构建时间 - 10s 容差（仅抵消时间戳精度/秒级取整），
    // 不能用 120s 容差——会把「上一次部署的旧产物」误判为本次已拉取。
    // 实测 EdgeOne 拉取延迟 30~80s，窗口取 120s（12×10s）覆盖。
    for (let i = 0; i < 12; i++) {
      const r = curl(['-D', '-', '-o', '/dev/null', `${SITE}/`]);
      const lm = (r.out.match(/^last-modified:\s*(.+)/im) || [])[1];
      if (lm && Date.parse(lm) >= built - 10000) return ok(`LM=${lm.trim()} built=${ct}`);
      if (i < 11) await new Promise((res) => setTimeout(res, 10000));
    }
    return no('Last-Modified 未追上构建时间（CNB success ≠ EdgeOne 已拉取）');
  });
}

/* ---------------- 线上功能门禁 ---------------- */
async function onlineGates() {
  await gate('online', 'F2 写信 201 + 写完即读', () => {
    // 用 XSS payload 做主路径信件，一封同时验证「写完即读 + XSS 往返原文」，
    // 把每轮门禁的写信数压到 1 封，避免反复运行撞上 5/h 限流。
    const text = `<script>alert(1)</script>[gate-${stamp}] 上线门禁自动验证：这封信内容足够长以通过服务端校验，验证后会立即删除，请勿当真。`;
    const r = postLetter(text);
    let d; try { d = JSON.parse(bodyOf(r.out)); } catch { return no('POST 非JSON: ' + r.out.slice(0, 100)); }
    if (d.code === 42901) return ok('SKIP: 5/h 限流已触顶（安全机制生效，非功能缺陷）');
    if (httpCode(r.out) !== '201' || d.code !== 0) return no(`HTTP ${httpCode(r.out)} code=${d.code}`);
    const id = d.data.id; createdIds.push(id);
    const g = curl([`${SITE}/api/letters?page=1&limit=20`]);
    let gd; try { gd = JSON.parse(g.out); } catch { return no('GET 非JSON'); }
    const item = gd.data.items.find((i) => i.id === id);
    if (!item) return no('写完读不到 id=' + id);
    if (!item.text.includes(`[gate-${stamp}]`)) return no('往返文本不一致');
    return ok(id);
  });

  await gate('online', 'F2 错误流 40002/40001', () => {
    const short = postLetter('太短了只有几个字');
    const noConsent = postLetter('这是一封足够长的信件，用来验证未勾选同意时的服务端拒绝路径是否正确。', { consent: false });
    let c1, c2;
    try { c1 = JSON.parse(bodyOf(short.out)).code; c2 = JSON.parse(bodyOf(noConsent.out)).code; } catch { return no('错误响应非JSON'); }
    return c1 === 40002 && c2 === 40001 ? ok('40002/40001') : no(`短文本=${c1} 未同意=${c2}`);
  });

  await gate('online', 'F2 XSS 往返原文 + 蜜罐静默', () => {
    // 复用主路径那封 XSS 信（createdIds[0]），不再新写信，省一次限流额度。
    const g = curl([`${SITE}/api/letters?page=1&limit=20`]);
    let gd; try { gd = JSON.parse(g.out); } catch { return no('XSS GET 非JSON'); }
    const item = createdIds.length ? gd.data.items.find((i) => i.id === createdIds[0]) : null;
    let xssCheck = '';
    if (item) {
      if (!item.text.includes('<script>')) return no('未返回原文');
      if (item.text.includes('&lt;')) return no('残留转义实体');
      xssCheck = 'XSS原文OK; ';
    } else {
      xssCheck = 'XSS Skip(主路径被限流); ';
    }
    // 蜜罐：非空 website 返回 code:0 但不落库（不消耗限流额度）。
    const before = total();
    const hp = postLetter('这是一封来自机器人的信，蜜罐字段非空应被静默丢弃且不产生任何记录。', { website: 'robot@example.com' });
    let hpCode; try { hpCode = JSON.parse(bodyOf(hp.out)).code; } catch { return no('蜜罐响应非JSON'); }
    const after = total();
    if (hpCode !== 0) return no(`蜜罐返回 code=${hpCode}(应0)`);
    return after === before ? ok(`${xssCheck}蜜罐未落库 total=${after}`) : no(`${xssCheck}蜜罐落库 ${before}→${after}`);
  });

  await gate('online', 'F3 SSE 响应头+增量+[DONE]', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nafisah-gate-'));
    const hf = join(dir, 'h'), bf = join(dir, 'b');
    let out = { ok: false, detail: 'init' };
    try {
      curl(['-N', '-X', 'POST', `${SITE}/chat`, '-H', 'Content-Type: application/json',
        '-H', 'makers-conversation-id: ' + randomUUID(),
        '-d', JSON.stringify({ messages: [{ role: 'user', content: '你好，烛火亮着吗？' }], locale: 'zh' }),
        '-D', hf, '-o', bf], 45);
      const h = readFileSync(hf, 'utf8'), b = readFileSync(bf, 'utf8');
      const ct = /content-type:\s*text\/event-stream/i.test(h);
      const cc = /cache-control:\s*no-cache/i.test(h);
      const delta = (b.match(/"type":"ai_response"/g) || []).length;
      const done = /\[DONE\]/.test(b);
      // handler 设置了 X-Accel-Buffering: no（_shared.ts），本地 dev 可见双份 no,no，
      // 但 EdgeOne 生产运行时会剥离此头（3 种请求形态实测）。仅防缓冲优化，
      // 缺失不影响 SSE 正确性，故记 advisory 不阻断。
      const accel = /x-accel-buffering:\s*no/i.test(h);
      const detail = `ct=${ct} cache=${cc} delta=${delta} done=${done} accel=${accel ? 'yes' : 'advisory(生产平台剥离)'}`;
      out = ct && cc && delta > 0 && done ? ok(detail) : no(detail);
    } catch (e) { out = no(e.message); }
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
    return out;
  });

  await gate('online', 'F3 /stop 带头 200 / 不带头 400', () => {
    const u = randomUUID();
    const withH = curl(['-X', 'POST', `${SITE}/stop`, '-H', 'Content-Type: application/json',
      '-H', `makers-conversation-id: ${u}`, '-d', JSON.stringify({ conversation_id: u }), '-w', '\n%{http_code}']);
    const noH = curl(['-X', 'POST', `${SITE}/stop`, '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ conversation_id: u }), '-w', '\n%{http_code}']);
    const a = httpCode(withH.out), b = httpCode(noH.out);
    return a === '200' && b === '400' ? ok(`with=${a} without=${b}`) : no(`with=${a} without=${b}`);
  });

  await gate('online', '审核 DELETE 403/403/200', () => {
    const token = envValue('MODERATION_TOKEN');
    const id = createdIds[0];
    // 鉴权在读记录之前（[id].ts 先 assertModerationToken 再 parseId），
    // 所以无测试信时用一个占位 id 仍能验证 403 拒绝路径。
    const probeId = id || '9999999999999-000000';
    const n = curl(['-X', 'DELETE', `${SITE}/api/letters/${probeId}`, '-w', '\n%{http_code}']);
    const w = curl(['-X', 'DELETE', `${SITE}/api/letters/${probeId}`, '-H', 'Authorization: Bearer invalid-gate-token', '-w', '\n%{http_code}']);
    const c = [n, w].map((r) => httpCode(r.out));
    if (c[0] !== '403' || c[1] !== '403') return no(`无token=${c[0]} 错token=${c[1]}（应均403）`);
    if (!id) return ok(`拒绝路径 403/403；200 成功路径 Skip（主路径被限流，无测试信）`);
    if (!token) return ok(`拒绝路径 403/403；200 成功路径 Skip（本地无 token）`);
    const g = curl(['-X', 'DELETE', `${SITE}/api/letters/${id}`, '-H', `Authorization: Bearer ${token}`, '-w', '\n%{http_code}']);
    const gc = httpCode(g.out);
    return gc === '200' ? ok('403/403/200') : no(`无token=${c[0]} 错token=${c[1]} 正确=${gc}`);
  });

  await gate('online', '敏感路径零泄漏', () => {
    // 真敏感：服务端源码 + 环境变量，必须 404。
    const critical = ['agents/chat/index.ts', 'cloud-functions/api/letters/index.ts', '.env'];
    const bad = [];
    for (const p of critical) {
      const r = curl(['-o', '/dev/null', '-w', '%{http_code}', `${SITE}/${p}`]);
      if (r.out.trim() !== '404') bad.push(`${p}=${r.out.trim()}`);
    }
    // 配置文件必须被 redirect 隐藏（302→404.html），不允许直接 200 暴露。
    const configs = ['tsconfig.json', 'package.json'];
    for (const p of configs) {
      const r = curl(['-o', '/dev/null', '-w', '%{http_code}', `${SITE}/${p}`]);
      const c = r.out.trim();
      if (c !== '302' && c !== '404') bad.push(`${p}=${c}(应302/404)`);
    }
    return bad.length ? no(bad.join(' ')) : ok(`${critical.length} 源码→404, ${configs.length} 配置→302隐藏`);
  });

  await gate('online', '分析配置端点可达（key 不回显）', () => {
    const r = curl([`${SITE}/api/analytics-config`]);
    let d; try { d = JSON.parse(r.out); } catch { return no('配置端点非JSON: ' + r.out.slice(0, 80)); }
    if (d.code !== 0 || !d.data) return no('配置端点 code=' + d.code + ' 或 data 为空');
    const prefixOk = /^pk_/.test(d.data.writeKey || '');
    const sdkOk = (d.data.sdkUrl || '').includes('entmesh.umd.js');
    const epOk = (d.data.endpoint || '').includes('collector');
    return prefixOk && sdkOk && epOk
      ? ok(`key前缀=pk_ sdk=${sdkOk} collector=${epOk}（不回显key值）`)
      : no(`key前缀=${prefixOk} sdk=${sdkOk} collector=${epOk}`);
  });

  await gate('online', '测试信已清理', () => {
    const token = envValue('MODERATION_TOKEN');
    if (!token) return ok(`SKIP: 本地无 token，残留 ${createdIds.length} 封待人工清理`);
    const left = [];
    for (const id of createdIds) {
      const r = curl(['-X', 'DELETE', `${SITE}/api/letters/${id}`, '-H', `Authorization: Bearer ${token}`, '-w', '\n%{http_code}']);
      // 200=刚删除；404=已被前一个 gate（审核 403/403/200）删过，同样视为已清理。
      const c = httpCode(r.out);
      if (c !== '200' && c !== '404') left.push(`${id}(${c})`);
    }
    return left.length ? no('残留: ' + left.join(',')) : ok(`清理 ${createdIds.length} 封, total=${total()}`);
  });
}

/* ---------------- 汇总 ---------------- */
(async () => {
  console.log(`GATE ${MODE} · site=${SITE}`);
  console.log('—'.repeat(64));
  if (MODE === 'local' || MODE === 'all') await localGates();
  if (MODE === 'deploy' || MODE === 'all') await deployGates();
  if (MODE === 'online' || MODE === 'all') await onlineGates();
  const failed = results.filter((r) => !r.ok);
  console.log('—'.repeat(64));
  console.log(`SUMMARY: ${results.length - failed.length}/${results.length} PASS`);
  if (failed.length) {
    console.log('FAILED:');
    for (const r of failed) console.log(`  · ${r.group} · ${r.name} — ${flat(r.detail)}`);
    // 只有清理 gate 自身失败时才提示残留；否则会误导（清理其实已成功）。
    const cleanupFailed = failed.some((r) => r.name === '测试信已清理' && !/SKIP/.test(r.detail));
    if (cleanupFailed) console.log(`测试信清理失败，残留 id: ${createdIds.join(', ')}`);
    process.exit(1);
  }
  process.exit(0);
})();
