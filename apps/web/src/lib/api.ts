/**
 * The one typed API client. No component issues a raw fetch (D8.2).
 *
 * It knows exactly one thing beyond fetching: how to unwrap the standard
 * response envelope (C2). Callers receive `data` directly and never see `meta`.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

/** Mirrors the error codes the API can return (D4.3). */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fields: Record<string, string> | undefined;
  /** The correlation id, so a reported failure can be found in the server log. */
  readonly requestId: string | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    fields?: Record<string, string>,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.requestId = requestId;
  }

  /** True when retrying stands a real chance — a cold backend, or a blip. */
  get isRetryable(): boolean {
    return this.code === 'NETWORK_ERROR' || this.status >= 500;
  }
}

interface SuccessEnvelope<T> {
  data: T;
  meta: { requestId: string };
}

interface ErrorEnvelope {
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string> };
  meta: { requestId: string };
}

export interface RequestOptions {
  /** Query parameters. Undefined and empty values are dropped. */
  query?: Record<string, string | number | boolean | undefined>;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (cause) {
    // The API is unreachable — cold, restarting, or the visitor is offline.
    // Rethrow an AbortError untouched so callers can ignore a cancelled request.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;

    throw new ApiError('NETWORK_ERROR', 'Could not reach the server.', 0);
  }

  // 204 carries no body, so there is nothing to parse.
  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const envelope = payload as ErrorEnvelope | null;

    throw new ApiError(
      envelope?.error?.code ?? 'INTERNAL_ERROR',
      envelope?.error?.message ?? 'Something went wrong.',
      response.status,
      envelope?.error?.fields,
      envelope?.meta?.requestId,
    );
  }

  return (payload as SuccessEnvelope<T>).data;
}
