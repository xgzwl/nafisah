export type Locale = 'en' | 'zh' | 'fr';
export type LetterStatus = 'published' | 'hidden';

export interface LetterRecord {
  id: string;
  createdAt: string;
  locale: Locale;
  name: string | null;
  text: string;
  status: LetterStatus;
  source: 'web';
  version: 1;
}

export interface LetterPublic {
  id: string;
  createdAt: string;
  locale: Locale;
  name: string | null;
  text: string;
  status: LetterStatus;
}

export interface CreateLetterInput {
  name: string | null;
  text: string;
  locale: Locale;
  consent: true;
}

export type CreateParseResult =
  | { honeypot: true; input: null }
  | { honeypot: false; input: CreateLetterInput };

export interface ListQuery {
  page: number;
  limit: number;
  locale?: Locale;
}

export interface LetterPage {
  items: LetterPublic[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateLetterResult {
  id: string;
  createdAt: string;
  status: 'published';
}

export interface RateWindow {
  count: number;
  windowStart: number;
}

export type ApiErrorCode = 0 | 40001 | 40002 | 40003 | 40301 | 40401 | 42901 | 50001;
export type FailureCode = Exclude<ApiErrorCode, 0>;

export interface Envelope<T> {
  code: ApiErrorCode;
  message: string;
  data: T | null;
}

export class ApiError extends Error {
  constructor(
    readonly code: FailureCode,
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface FunctionRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  json(): Promise<unknown>;
}

export interface FunctionContext {
  request: FunctionRequest;
  env: Record<string, string | undefined>;
  params?: Record<string, string | undefined>;
  clientIp?: string;
}
