import { failFromError, ok } from './respond.js';
import { headerValue, parseId, parseModerationBody, readJsonBody } from './schema.js';
import * as service from './service.js';
import type { FunctionContext } from './types.js';

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
    service.assertModerationToken(
      headerValue(context.request.headers, 'authorization'),
      context.env.MODERATION_TOKEN,
    );
    // __TEMP_CLEANUP__ — one-off legacy key removal, remove after use.
    if (context.request.url.indexOf('__cleanup=1') !== -1 && context.params?.id === '__probe__') {
      await service.deleteLetter('__probe__');
      return ok({ id: '__probe__', deleted: true });
    }
    const id = parseId(context.params?.id);
    await service.deleteLetter(id);
    return ok({ id, deleted: true });
  } catch (error) {
    return failFromError(error);
  }
}
