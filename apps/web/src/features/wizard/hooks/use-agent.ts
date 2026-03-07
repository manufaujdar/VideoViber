'use client';

import { useCallback, useRef, useState } from 'react';

interface UseAgentOptions<T> {
  endpoint: string;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseAgentReturn<TInput, TOutput> {
  loading: boolean;
  error: string | null;
  data: TOutput | null;
  call: (input: TInput) => Promise<TOutput | null>;
  reset: () => void;
}

export function useAgent<TInput, TOutput>(
  options: UseAgentOptions<TOutput>
): UseAgentReturn<TInput, TOutput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | null>(null);

  // Store options in a ref to avoid re-creating the callback on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const call = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(optionsRef.current.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          let message = `Agent request failed (${response.status})`;
          try {
            const errBody = await response.json();
            message = errBody?.error || errBody?.message || message;
          } catch { /* keep default */ }
          throw new Error(message);
        }

        const result = (await response.json()) as TOutput;
        setData(result);
        optionsRef.current.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Agent call failed';
        setError(message);
        optionsRef.current.onError?.(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [] // stable — no deps, uses ref internally
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { loading, error, data, call, reset };
}
