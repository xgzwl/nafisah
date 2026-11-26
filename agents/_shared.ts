/**
 * Internal SSE helpers for the agents runtime.
 * `_`-prefixed => not routed. Only imported by sibling endpoints.
 * Environment is never read here; callers pass values in explicitly.
 */

export function createLogger(name: string) {
  return {
    log(...args: unknown[]): void {
      console.log(`[${name}][${new Date().toISOString()}]`, ...args);
    },
    error(...args: unknown[]): void {
      console.error(`[${name}][${new Date().toISOString()}]`, ...args);
    },
  };
}

/** Encode one SSE frame: `data: <JSON>\n\n`. */
export function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** Heartbeat frame emitted every 5 seconds while the stream is open. */
export function pingEvent(): string {
  return sseEvent({ type: 'ping', ts: Date.now() });
}

/** Completion sentinel. The reader uses this to distinguish a finished turn from a cut-off. */
export const SSE_DONE = 'data: [DONE]\n\n';

/**
 * A client disconnect or an upstream termination is not an error to surface.
 * Never logs request bodies, IPs or keys — only the error class name is used by callers.
 */
export function isAbortError(err: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  const e = err as { name?: string; message?: string } | null;
  if (!e) return false;
  if (e.name === 'AbortError') return true;
  return typeof e.message === 'string' && /terminated|aborted/i.test(e.message);
}

/**
 * Parse an OpenAI-compatible SSE body from the gateway and yield only the
 * text deltas. `[DONE]` ends the loop; malformed frames are skipped rather
 * than crashing the turn. The reader is always released in `finally`.
 */
export async function* readGatewayDeltas(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal?.aborted) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      let upstreamDone = false;
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') {
          upstreamDone = true;
          break;
        }
        try {
          const parsed = JSON.parse(payload);
          const text = parsed?.choices?.[0]?.delta?.content;
          if (typeof text === 'string' && text) yield text;
        } catch {
          // malformed upstream frame — skip, do not crash the stream
        }
      }
      if (upstreamDone) break;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Wrap an async string generator into a text/event-stream Response.
 *
 * - four mandatory response headers (incl. X-Accel-Buffering: no)
 * - 5-second ping heartbeat
 * - honours the client-disconnect signal; on abort it breaks silently, so the
 *   generator's trailing [DONE] is NOT delivered and the frontend's
 *   `aborted === true` branch suppresses the retry prompt
 * - an unexpected generator failure becomes an error_message frame; the
 *   response itself is never crashed
 */
export function createSSEResponse(
  generator: (signal?: AbortSignal) => AsyncGenerator<string>,
  signal?: AbortSignal,
): Response {
  const encoder = new TextEncoder();
  const logger = createLogger('sse');
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(pingEvent()));
        } catch {
          // stream already closed — heartbeat is best-effort
        }
      }, 5_000);

      try {
        for await (const chunk of generator(signal)) {
          if (signal?.aborted) break;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const e = err as Error;
        if (!isAbortError(e, signal)) {
          logger.error('stream_failure', e?.name);
          try {
            controller.enqueue(
              encoder.encode(
                sseEvent({
                  type: 'error_message',
                  content: 'The response stream was interrupted.',
                  code: 50002,
                }),
              ),
            );
          } catch {
            // client already gone
          }
        }
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      // Client disconnected. The generator's finally still runs and releases
      // the upstream reader, so no token cost continues after /stop.
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
