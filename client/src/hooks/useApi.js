import { useState, useEffect, useCallback } from 'react';
import { getApiError } from '../services/api';

/**
 * Generic data-fetching hook.
 * fetcher: async function returning the API response body { success, data, pagination }.
 * The body is stored verbatim in `data` — pages read result.data / result.pagination.
 */
export default function useApi(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(...args);
      setData(res);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { data, loading, error, refetch: execute, setData };
}
