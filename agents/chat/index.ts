/**
 * POST /chat — SSE streaming roleplay with the shrine character.
 * No agent framework: one direct gateway request per turn, client holds history.
 * `makers-conversation-id` is stamped by the runtime into context.conversation_id;
 * sticky routing depends on the frontend sending that header (Critical Rule 5).
 */
import { createSSEResponse, isAbortError, readGatewayDeltas, sseEvent, SSE_DONE } from '../_shared.js';
import { resolveGatewayEnv } from '../_model.js';
import { buildSystemPrompt } from '../_prompt.js';
import { validateChatRequest } from './schema.js';

const GATEWAY_ERROR = 'The response is temporarily unavailable. Please try again.';

export async function onRequest(context: any): Promise<Response> {
  const body = context.request.body ?? {};
  const validation = validateChatRequest(body);
  if (!validation.ok) {
    return new Response(
      JSON.stringify({ code: validation.code, data: null, message: validation.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { messages, locale } = validation.value;
  const env = context.env as Record<string, string | undefined>;
  const signal = context.request.signal as AbortSignal | undefined;
  const instruction = buildSystemPrompt(locale);

  return createSSEResponse(
    async function* (sig) {
      try {
        // Missing key throws explicitly; surfaced as error_message, never a silent fallback.
        const { apiKey, baseUrl, model } = resolveGatewayEnv(env);
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: instruction }, ...messages],
            stream: true,
          }),
          signal: sig,
        });

        if (!response.ok || !response.body) {
          yield sseEvent({ type: 'error_message', content: GATEWAY_ERROR, code: 50002 });
          return;
        }

        for await (const text of readGatewayDeltas(response.body, sig)) {
          yield sseEvent({ type: 'ai_response', content: text });
        }
      } catch (err) {
        if (!isAbortError(err, sig)) {
          // Generic content only: never forward upstream/gateway raw text to the client.
          yield sseEvent({ type: 'error_message', content: GATEWAY_ERROR, code: 50002 });
        }
      } finally {
        // On a normal or error-completed turn this reaches the client.
        // On abort the helper breaks before consuming it, so no [DONE] is sent.
        yield SSE_DONE;
      }
    },
    signal,
  );
}
