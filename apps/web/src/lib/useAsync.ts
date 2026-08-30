import { useCallback, useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  /** Lets an error state offer a retry rather than stranding the visitor (C3). */
  retry: () => void;
}

/**
 * Runs an async read and exposes the four states every surface must handle
 * (D12): loading, empty, error and success. Empty is the caller's job, since
 * only the caller knows whether an empty array is a problem.
 *
 * `deps` controls when the fetch re-runs, exactly like useEffect. The fetcher
 * itself is intentionally not a dependency — callers pass inline closures, and
 * requiring them to memoise every one would be a footgun with no benefit.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    // Guards against a slow response landing after the inputs changed.
    let active = true;

    setIsLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause : new Error('Request failed'));
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [...deps, attempt]);

  return { data, isLoading, error, retry };
}
