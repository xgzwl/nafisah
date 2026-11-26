/**
 * POST /stop — abort a running chat generation.
 * Never carries the `makers-conversation-id` header (sticky routing would pin
 * this request to the stuck instance). The target id comes only from the body.
 * `context.utils.abortActiveRun` is injected by the agent runtime exclusively.
 */
import { createLogger } from '../_shared.js';

const logger = createLogger('stop');

function jsonResponse(code: number, message: string, data: Record<string, unknown> | null, status: number): Response {
  return new Response(JSON.stringify({ code, data, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context: any): Promise<Response> {
  const body = context.request.body ?? {};
  const raw = body && typeof body === 'object' && !Array.isArray(body) ? body.conversation_id : undefined;

  if (typeof raw !== 'string' || !raw.trim() || raw.trim().length > 100) {
    return jsonResponse(40001, 'conversation_id is required', null, 400);
  }
  // Unknown fields are rejected: the stop endpoint accepts exactly one field.
  const keys = Object.keys(body as Record<string, unknown>);
  if (keys.length !== 1 || keys[0] !== 'conversation_id') {
    return jsonResponse(40001, 'Unknown field in stop request', null, 400);
  }

  const abortActiveRun = context.utils?.abortActiveRun;
  if (typeof abortActiveRun !== 'function') {
    // This runtime does not expose abortActiveRun — fail explicitly, not silently.
    logger.error('abort_unavailable');
    return jsonResponse(50001, 'Abort is unavailable in this runtime', null, 500);
  }

  try {
    await abortActiveRun.call(context.utils, raw.trim());
    return jsonResponse(0, '', { stopped: true }, 200);
  } catch {
    // The frontend fires /stop and ignores the result; its own AbortController
    // already cut the stream. Do not surface a retry prompt for a best-effort stop.
    return jsonResponse(0, '', { stopped: true }, 200);
  }
}
