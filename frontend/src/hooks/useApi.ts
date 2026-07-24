import { useState, useCallback } from 'react';
import { apiClient, ApiClientError } from '../services/apiClient';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiClientError) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/** API呼び出しの状態管理フック */
export function useApi<T>(
  fetcher: (...args: unknown[]) => Promise<T>,
  options?: UseApiOptions<T>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcher(...args);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : '通信エラーが発生しました';
        setError(message);
        if (err instanceof ApiClientError) options?.onError?.(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [fetcher, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}
