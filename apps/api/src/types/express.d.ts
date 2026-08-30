/**
 * Values the middleware chain attaches to a request. Declared here so every
 * handler sees the same typed surface instead of reaching into `any`.
 */
declare global {
  namespace Express {
    interface Locals {
      /** Correlation id, set by requestId middleware and echoed in every envelope. */
      requestId: string;

      /**
       * The authenticated administrator, set by requireAuth. Present only on
       * routes that carry that middleware — absent on every public route.
       */
      actor?: {
        /** users.id — the application-side row, not the identity provider's id. */
        id: string;
        authUserId: string;
        email: string | undefined;
      };
    }
  }
}

export {};
