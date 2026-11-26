import * as repo from './repo.js';
import { decodeHtmlEntities, hashClientIp } from './schema.js';
import {
  ApiError,
  type CreateLetterInput,
  type CreateLetterResult,
  type LetterPage,
  type LetterPublic,
  type LetterRecord,
  type LetterStatus,
  type ListQuery,
  type RateWindow,
} from './types.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_PER_HOUR = 5;
const MAX_PER_DAY = 20;
const READ_BATCH = 50;

// 存储层保留 escapeHtml 作为纵深防御；对外 JSON 必须返回原文，
// 否则前端 textContent 会把实体串逐字显示。JSON 里的 <script> 只是字符串。
export function toPublic(record: LetterRecord): LetterPublic {
  return {
    id: record.id,
    createdAt: record.createdAt,
    locale: record.locale,
    name: record.name === null ? null : decodeHtmlEntities(record.name),
    text: decodeHtmlEntities(record.text),
    status: record.status,
  };
}

function newId(): string {
  const inverted = String(9999999999999 - Date.now()).padStart(13, '0');
  let suffix = Math.random().toString(36).slice(2, 8);
  while (suffix.length < 6) suffix += '0';
  return `${inverted}-${suffix}`;
}

function activeWindow(current: RateWindow | null, now: number, span: number): RateWindow {
  if (
    !current ||
    !Number.isFinite(current.count) ||
    !Number.isFinite(current.windowStart) ||
    current.count < 0 ||
    now < current.windowStart ||
    now - current.windowStart >= span
  ) {
    return { count: 0, windowStart: now };
  }
  return current;
}

async function enforceRateLimit(hash: string): Promise<void> {
  const now = Date.now();
  const hourKey = repo.hourKey(hash);
  const dayKey = repo.dayKey(hash);
  const [hourRaw, dayRaw] = await Promise.all([repo.readWindow(hourKey), repo.readWindow(dayKey)]);
  const hour = activeWindow(hourRaw, now, HOUR_MS);
  const day = activeWindow(dayRaw, now, DAY_MS);
  if (hour.count >= MAX_PER_HOUR || day.count >= MAX_PER_DAY) {
    throw new ApiError(42901, 429, 'too many submissions, try later');
  }
  await Promise.all([
    repo.writeWindow(hourKey, { count: hour.count + 1, windowStart: hour.windowStart }),
    repo.writeWindow(dayKey, { count: day.count + 1, windowStart: day.windowStart }),
  ]);
}

export async function createLetter(
  input: CreateLetterInput,
  clientIp: string,
  salt: string | undefined,
): Promise<CreateLetterResult> {
  if (!salt) throw new ApiError(50001, 500, 'storage unavailable');
  const hash = await hashClientIp(clientIp, salt);
  await enforceRateLimit(hash);

  const createdAt = new Date().toISOString();
  const id = newId();
  const record: LetterRecord = {
    id,
    createdAt,
    locale: input.locale,
    name: input.name,
    text: input.text,
    status: 'published',
    source: 'web',
    version: 1,
  };
  await repo.putLetter(record);
  return { id, createdAt, status: 'published' };
}

export async function probeWrite(): Promise<{ letters: string; limits: string }> {
  const result = { letters: 'ok', limits: 'ok' };
  try {
    await repo.putLetter({
      id: '__probe__', createdAt: new Date().toISOString(), locale: 'zh',
      name: null, text: 'probe', status: 'published', source: 'web', version: 1,
    });
  } catch (e) {
    result.letters = ((e as Error)?.name || 'err') + ':' + String((e as Error)?.message).slice(0, 120);
  }
  try {
    await repo.writeWindow('letters/__probe.json', { count: 1, windowStart: Date.now() });
  } catch (e) {
    result.limits = ((e as Error)?.name || 'err') + ':' + String((e as Error)?.message).slice(0, 120);
  }
  return result;
}

export async function honeypotResult(): Promise<CreateLetterResult> {
  return { id: newId(), createdAt: new Date().toISOString(), status: 'published' };
}

export async function listLetters(query: ListQuery): Promise<LetterPage> {
  const keys = await repo.listLetterKeys();
  const needed = query.page * query.limit;
  const matched: LetterPublic[] = [];
  let consumed = 0;

  for (let index = 0; index < keys.length && matched.length < needed; index += READ_BATCH) {
    const batch = keys.slice(index, index + READ_BATCH);
    consumed += batch.length;
    const records = await Promise.all(batch.map((key) => repo.getLetterByKey(key)));
    for (const record of records) {
      if (!record || record.status !== 'published') continue;
      if (query.locale && record.locale !== query.locale) continue;
      matched.push(toPublic(record));
    }
  }

  const start = (query.page - 1) * query.limit;
  const items = matched.slice(start, start + query.limit);
  const exhausted = consumed >= keys.length;
  // 未读完全部 key 时 total 是上界；隐藏信件不计入已匹配数，剩余 key 按可见上限估算。
  const total = exhausted ? matched.length : matched.length + (keys.length - consumed);
  const hasMore = !exhausted || matched.length > start + items.length;
  return { items, total, page: query.page, limit: query.limit, hasMore };
}

export async function moderateLetter(id: string, status: LetterStatus): Promise<LetterPublic> {
  const record = await repo.getLetter(id);
  if (!record) throw new ApiError(40401, 404, 'letter not found');
  record.status = status;
  await repo.putLetter(record);
  return toPublic(record);
}

export async function deleteLetter(id: string): Promise<void> {
  const record = await repo.getLetter(id);
  if (!record) throw new ApiError(40401, 404, 'letter not found');
  await repo.deleteLetter(id);
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function assertModerationToken(provided: string | undefined, expected: string | undefined): void {
  if (!expected || !provided || !provided.startsWith('Bearer ')) {
    throw new ApiError(40301, 403, 'moderation token invalid');
  }
  if (!constantTimeEqual(provided.slice(7).trim(), expected)) {
    throw new ApiError(40301, 403, 'moderation token invalid');
  }
}
