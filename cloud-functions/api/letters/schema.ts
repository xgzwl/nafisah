import { createHmac } from 'node:crypto';
import {
  ApiError,
  type CreateLetterInput,
  type CreateParseResult,
  type ListQuery,
  type Locale,
  type LetterStatus,
} from './types.js';

const TEXT_MIN = 20;
const TEXT_MAX = 1000;
const NAME_MAX = 40;
const LOCALES: readonly Locale[] = ['en', 'zh', 'fr'];


function objectOf(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(40001, 400, 'request body must be a JSON object');
  }
  return value as Record<string, unknown>;
}

function assertKnownKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new ApiError(40001, 400, `unknown field: ${key}`);
  }
}

function stripControls(value: string): string {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 10 || code === 9) {
      out += char;
    } else if (code >= 32 && code !== 127) {
      out += char;
    }
  }
  return out;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 只反转义 escapeHtml 自身产生的 5 个实体；单遍替换，顺序固定。
// &amp; 必须最后处理，否则用户输入的字面量 &lt; 会被误解码成 <。
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function parseText(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(40001, 400, 'text is required');
  const normalized = stripControls(value).trim();
  if (normalized.length < TEXT_MIN) throw new ApiError(40002, 400, `text must be at least ${TEXT_MIN} characters`);
  if (normalized.length > TEXT_MAX) throw new ApiError(40002, 400, `text exceeds ${TEXT_MAX} characters`);
  if (/(\n[ \t]*){5,}/.test(normalized)) throw new ApiError(40002, 400, 'text contains too many blank lines');
  // F2-AC5：信件正文不接受外链（含裸 www 链接与 HTML 锚点）。
  if (/(https?:\/\/|www\.[^\s]+|<\s*a\b)/i.test(normalized)) {
    throw new ApiError(40003, 400, 'content rejected');
  }
  return escapeHtml(normalized);
}

function parseName(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new ApiError(40001, 400, 'name must be a string or null');
  const trimmed = value.trim();
  if (trimmed.length > NAME_MAX) throw new ApiError(40002, 400, `name exceeds ${NAME_MAX} characters`);
  return trimmed ? escapeHtml(trimmed) : null;
}

function parseLocaleValue(value: unknown): Locale {
  if (typeof value !== 'string' || !LOCALES.includes(value as Locale)) {
    throw new ApiError(40001, 400, 'locale must be en, zh, or fr');
  }
  return value as Locale;
}

export function parseCreateBody(value: unknown): CreateParseResult {
  const body = objectOf(value);
  assertKnownKeys(body, ['name', 'text', 'locale', 'consent', 'website']);

  const website = body.website;
  if (website !== undefined && website !== null && website !== '') {
    return { honeypot: true, input: null };
  }

  if (body.consent !== true) throw new ApiError(40001, 400, 'consent is required');
  const input: CreateLetterInput = {
    name: parseName(body.name),
    text: parseText(body.text),
    locale: parseLocaleValue(body.locale),
    consent: true,
  };
  return { honeypot: false, input };
}

export async function readJsonBody(request: { json(): Promise<unknown> }): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(40001, 400, 'invalid JSON body');
  }
}

export function parseListQuery(rawQuery: string): ListQuery {
  const pairs = new Map<string, string>();
  if (rawQuery) {
    for (const part of rawQuery.split('&')) {
      if (!part) continue;
      const separator = part.indexOf('=');
      const key = separator === -1 ? part : part.slice(0, separator);
      const value = separator === -1 ? '' : part.slice(separator + 1);
      try {
        pairs.set(decodeURIComponent(key), decodeURIComponent(value));
      } catch {
        throw new ApiError(40001, 400, 'invalid query string');
      }
    }
  }

  const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
    if (raw === undefined) return fallback;
    if (!/^\d+$/.test(raw)) throw new ApiError(40001, 400, 'page and limit must be integers');
    return Number(raw);
  };

  const page = parsePositiveInt(pairs.get('page'), 1);
  const limit = parsePositiveInt(pairs.get('limit'), 20);
  if (page < 1) throw new ApiError(40001, 400, 'page must be at least 1');
  if (limit < 1) throw new ApiError(40001, 400, 'limit must be at least 1');
  if (limit > 50) throw new ApiError(40002, 400, 'limit exceeds 50');

  const rawLocale = pairs.get('locale');
  const query: ListQuery = { page, limit };
  if (rawLocale !== undefined) query.locale = parseLocaleValue(rawLocale);
  return query;
}

export function parseModerationBody(value: unknown): LetterStatus {
  const body = objectOf(value);
  assertKnownKeys(body, ['status']);
  if (body.status !== 'hidden' && body.status !== 'published') {
    throw new ApiError(40001, 400, 'status must be hidden or published');
  }
  return body.status;
}

export function parseId(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{13}-[a-z0-9]{6}$/.test(value)) {
    throw new ApiError(40001, 400, 'invalid letter id');
  }
  return value;
}

export function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export function clientIpFromHeaders(headers: Record<string, string | string[] | undefined>): string {
  const direct = headerValue(headers, 'cf-connecting-ip');
  if (direct) return direct.trim();
  const forwarded = headerValue(headers, 'x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? '';
  return '';
}

export async function hashClientIp(ip: string, salt: string): Promise<string> {
  // 用 Node 内置 createHmac，不依赖 Web Crypto 的 subtle——后者在 EdgeOne
  // Cloud Functions 运行时不保证暴露，曾导致线上限流哈希抛错被兜底成 50001。
  return createHmac('sha256', salt).update(ip).digest('hex').slice(0, 16);
}
