import { failFromError, ok } from './respond.js';
import { clientIpFromHeaders, parseCreateBody, parseListQuery, readJsonBody } from './schema.js';
import * as service from './service.js';
import type { FunctionContext } from './types.js';

export async function onRequestGet(context: FunctionContext): Promise<unknown> {
  try {
    if (context.request.url.indexOf('__envprobe=1') !== -1) {
      return ok({ keys: Object.keys(context.env || {}) });
    }
    const question = context.request.url.indexOf('?');
    const rawQuery = question === -1 ? '' : context.request.url.slice(question + 1);
    const page = await service.listLetters(parseListQuery(rawQuery));
    return ok(page);
  } catch (error) {
    return failFromError(error);
  }
}

export async function onRequestPost(context: FunctionContext): Promise<unknown> {
  try {
    const parsed = parseCreateBody(await readJsonBody(context.request));
    if (parsed.honeypot) return ok(await service.honeypotResult(), 201);
    const result = await service.createLetter(
      parsed.input,
      clientIpFromHeaders(context.request.headers),
      context.env.RATE_LIMIT_SALT,
    );
    return ok(result, 201);
  } catch (error) {
    return failFromError(error);
  }
}
