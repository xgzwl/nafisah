/**
 * Validation for POST /chat. Pure functions only — no Response construction,
 * no env, no business logic. Keeps the endpoint entry thin (<=80 lines).
 * Rejects unknown fields (additionalProperties: false) with code 40001,
 * and over-limit values with code 40002.
 */

export type Locale = 'en' | 'zh' | 'fr';
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ValidChatRequest {
  messages: ChatMessage[];
  locale: Locale;
}

export type ValidationResult =
  | { ok: true; value: ValidChatRequest }
  | { ok: false; code: number; message: string };

const MAX_MESSAGES = 20;
const MAX_CONTENT = 500;
const LOCALES: Locale[] = ['en', 'zh', 'fr'];
const TOP_LEVEL_KEYS = new Set(['messages', 'locale']);
const MESSAGE_KEYS = new Set(['role', 'content']);

function fail(code: number, message: string): ValidationResult {
  return { ok: false, code, message };
}

export function validateChatRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(40001, 'Request body must be a JSON object');
  }
  const obj = body as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!TOP_LEVEL_KEYS.has(key)) return fail(40001, `Unknown field: ${key}`);
  }

  const raw = obj.messages;
  if (!Array.isArray(raw)) return fail(40001, 'messages is required and must be an array');
  if (raw.length < 1 || raw.length > MAX_MESSAGES) {
    return fail(40002, `messages must contain between 1 and ${MAX_MESSAGES} items`);
  }

  const messages: ChatMessage[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return fail(40001, `messages[${i}] must be an object`);
    }
    const m = item as Record<string, unknown>;
    for (const key of Object.keys(m)) {
      if (!MESSAGE_KEYS.has(key)) return fail(40001, `Unknown field in messages[${i}]: ${key}`);
    }
    if (m.role !== 'user' && m.role !== 'assistant') {
      return fail(40001, `messages[${i}].role must be "user" or "assistant"`);
    }
    if (typeof m.content !== 'string') {
      return fail(40001, `messages[${i}].content must be a string`);
    }
    if (m.content.length > MAX_CONTENT) {
      return fail(40002, `messages[${i}].content exceeds ${MAX_CONTENT} characters`);
    }
    if (!m.content.trim()) {
      return fail(40001, `messages[${i}].content must not be empty`);
    }
    messages.push({ role: m.role, content: m.content });
  }

  if (messages[messages.length - 1].role !== 'user') {
    return fail(40001, 'messages must end with exactly one user message');
  }
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].role === 'user' && messages[i - 1].role === 'user') {
      return fail(40001, 'messages must not contain two consecutive user messages');
    }
  }

  let locale: Locale = 'en';
  if (obj.locale !== undefined) {
    if (typeof obj.locale !== 'string' || !LOCALES.includes(obj.locale as Locale)) {
      return fail(40001, 'locale must be one of en, zh, fr');
    }
    locale = obj.locale as Locale;
  }

  return { ok: true, value: { messages, locale } };
}
