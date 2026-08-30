/**
 * Values the middleware chain attaches to a request. Declared here so every
 * handler sees the same typed surface instead of reaching into `any`.
 */
declare global {
  namespace Express {
    interface Locals {
      /** Correlation id, set by requestId middleware and echoed in every envelope. */
      requestId: string;
    }
  }
}

export {};
