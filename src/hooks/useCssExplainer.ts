import { useState, useCallback } from 'react';
import type { ApiResponse, ExplainResponse } from '../types/index.js';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface State {
  status: Status;
  data: ExplainResponse | null;
  error: string | null;
}

export function useCssExplainer() {
  const [state, setState] = useState<State>({ status: 'idle', data: null, error: null });

  const explain = useCallback(async (css: string) => {
    setState({ status: 'loading', data: null, error: null });

    try {
      const res = await fetch('/.netlify/functions/explain-css', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css }),
      });

      const json = (await res.json()) as ApiResponse;

      if (json.ok) {
        setState({ status: 'success', data: json.data, error: null });
      } else {
        setState({ status: 'error', data: null, error: json.error });
      }
    } catch {
      setState({ status: 'error', data: null, error: 'Network error. Please check your connection and try again.' });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return { ...state, explain, reset };
}
