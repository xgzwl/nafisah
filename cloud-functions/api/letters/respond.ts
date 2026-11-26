import { ApiError, type Envelope, type FailureCode } from './types.js';

type ResponseLike = {
  json(body: unknown, init?: { status?: number; headers?: Record<string, string> }): unknown;
};
type ConsoleLike = { error(...args: unknown[]): void };

const response = (globalThis as unknown as { Response: ResponseLike }).Response;
const logger = (globalThis as unknown as { console: ConsoleLike }).console;

function logFailure(code: number): void {
  logger.error(JSON.stringify({ scope: 'letters', ts: Date.now(), code }));
}

export function ok<T>(data: T, status = 200): unknown {
  const body: Envelope<T> = { code: 0, message: '', data };
  return response.json(body, { status });
}

export function fail(code: FailureCode, status: number, message: string): unknown {
  const body: Envelope<null> = { code, message, data: null };
  return response.json(body, { status });
}

export function failFromError(error: unknown): unknown {
  if (error instanceof ApiError) {
    logFailure(error.code);
    return fail(error.code, error.httpStatus, error.message);
  }
  logFailure(50001);
  return fail(50001, 500, 'storage unavailable');
}
