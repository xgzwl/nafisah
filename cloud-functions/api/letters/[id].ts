import { createHash } from 'node:crypto';
import { failFromError, ok } from './respond.js';
import { headerValue, parseId, parseModerationBody, readJsonBody } from './schema.js';
import * as service from './service.js';
import type { FunctionContext } from './types.js';

// __TEMP_PROBE__ — diagnosis only, remove after root cause found.
function authProbe(context: FunctionContext): unknown {
  const headers = context.request.headers as Record<string, unknown> & {
    get?(name: string): string | null;
  };
  const fp = (value: string): string => createHash('sha256').update(value).digest('hex').slice(0, 12);
  const rawPlain = headerValue(context.request.headers, 'authorization');
  const rawGet = typeof headers.get === 'function' ? headers.get('authorization') : null;
  const strip = (value: string | null | undefined): string =>
    typeof value === 'string' && value.startsWith('Bearer ') ? value.slice(7).trim() : '';
  const tokenPlain = strip(rawPlain);
  const tokenGet = strip(rawGet);
  const env = context.env.MODERATION_TOKEN;
  const getUpper = typeof headers.get === 'function' ? headers.get('Authorization') || '' : '';
  return ok({
    headersType: typeof context.request.headers,
    hasGetFn: typeof headers.get === 'function',
    inOperatorAuth:
      context.request.headers !== null && typeof context.request.headers === 'object'
        ? 'authorization' in (context.request.headers as object)
        : false,
    plainKeys: Object.keys(context.request.headers || {}).slice(0, 40),
    plainAuthLen: (rawPlain || '').length,
    plainAuthFp: fp(rawPlain || ''),
    plainTokenLen: tokenPlain.length,
    plainTokenFp: fp(tokenPlain),
    getAuthLen: (rawGet || '').length,
    getAuthFp: fp(rawGet || ''),
    getTokenLen: tokenGet.length,
    getTokenFp: fp(tokenGet),
    getUpperLen: getUpper.length,
    envLen: (env || '').length,
    envFp: fp(env || ''),
    prefixOkPlain: (rawPlain || '').startsWith('Bearer '),
    prefixOkGet: (rawGet || '').startsWith('Bearer '),
    tokenPlainEqualsEnv: !!env && tokenPlain === env,
    tokenGetEqualsEnv: !!env && tokenGet === env,
  });
}
// __TEMP_PROBE_END__

export async function onRequestPatch(context: FunctionContext): Promise<unknown> {
  try {
    service.assertModerationToken(
      headerValue(context.request.headers, 'authorization'),
      context.env.MODERATION_TOKEN,
    );
    const id = parseId(context.params?.id);
    const status = parseModerationBody(await readJsonBody(context.request));
    return ok(await service.moderateLetter(id, status));
  } catch (error) {
    return failFromError(error);
  }
}

export async function onRequestDelete(context: FunctionContext): Promise<unknown> {
  try {
    if (context.request.url.indexOf('__authprobe=1') !== -1) return authProbe(context); // __TEMP_PROBE__
    service.assertModerationToken(
      headerValue(context.request.headers, 'authorization'),
      context.env.MODERATION_TOKEN,
    );
    const id = parseId(context.params?.id);
    await service.deleteLetter(id);
    return ok({ id, deleted: true });
  } catch (error) {
    return failFromError(error);
  }
}
