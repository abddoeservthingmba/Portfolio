/**
 * The error codes that may appear in a response envelope (D4.3). Services throw
 * these; the error handler is the only place that turns one into a response.
 */
export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeName = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_BY_CODE: Record<ErrorCodeName, number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  VALIDATION_FAILED: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

/** Field name -> human-readable reason, as carried by a 422 response. */
export type FieldErrors = Record<string, string>;

export class AppError extends Error {
  readonly code: ErrorCodeName;
  readonly status: number;
  readonly fields: FieldErrors | undefined;

  constructor(code: ErrorCodeName, message: string, fields?: FieldErrors) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fields = fields;
  }
}

export const notFound = (message = 'Resource not found') =>
  new AppError(ErrorCode.NOT_FOUND, message);

export const unauthenticated = (message = 'Authentication is required') =>
  new AppError(ErrorCode.UNAUTHENTICATED, message);

export const forbidden = (message = 'You do not have access to this resource') =>
  new AppError(ErrorCode.FORBIDDEN, message);

export const conflict = (message: string, fields?: FieldErrors) =>
  new AppError(ErrorCode.CONFLICT, message, fields);

export const validationFailed = (fields: FieldErrors, message = 'Some fields need attention') =>
  new AppError(ErrorCode.VALIDATION_FAILED, message, fields);
