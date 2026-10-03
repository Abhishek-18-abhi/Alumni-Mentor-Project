import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, getToken } from '../lib/api';

/**
 * Lightweight, robust hook for API data fetching with retry and focus refetch
 * @template T
 * @param {() => Promise<T>} fetcher
 * @param {Array<any>} [deps=[]]
 * @param {{
 *   enabled?: boolean,
 *   refetchOnFocus?: boolean,
 *   retry?: boolean,
 *   initialData?: T
 * }} [options={}]
 */
export function useApiQuery(fetcher, deps = [], options = {}) {
  const { enabled = true, refetchOnFocus = false, retry = true, initialData = [] } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(
    async (isRetry = false) => {
      if (!enabled) return;
      setLoading(true);
      setError(null);

      try {
        const result = await fetcherRef.current();
        if (isMounted.current) {
          setData(result !== undefined && result !== null ? result : initialData);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted.current) return;
        if (retry && !isRetry) {
          // Automatic 1-time retry after 800ms
          setTimeout(() => {
            if (isMounted.current) {
              execute(true);
            }
          }, 800);
        } else {
          setError(err?.message || 'Failed to fetch data.');
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, retry, ...deps]
  );

  useEffect(() => {
    isMounted.current = true;
    execute();
    return () => {
      isMounted.current = false;
    };
  }, [execute]);

  // Refetch when window regains focus if requested
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;
    const onFocus = () => execute();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchOnFocus, enabled, execute]);

  const safeData = data !== null && data !== undefined ? data : initialData;
  return { data: safeData, loading, error, refetch: execute };
}

// -----------------------------------------------------------------------------
// Domain-specific query hooks
// -----------------------------------------------------------------------------

export function useUsers(options = {}) {
  return useApiQuery(
    async () => {
      const res = await apiGet('/users');
      return (res?.users || []).map((u) => ({ ...u, id: u.id || u._id }));
    },
    [],
    { initialData: [], ...options }
  );
}

export function useMentors(options = {}) {
  return useApiQuery(
    async () => {
      const res = await apiGet('/users');
      const all = (res?.users || []).map((u) => ({ ...u, id: u.id || u._id }));
      return all.filter((u) => u.role === 'mentor' && u.profileComplete);
    },
    [],
    { initialData: [], ...options }
  );
}

export function useMentorshipRequests(options = {}) {
  return useApiQuery(
    async () => {
      const res = await apiGet('/mentorship-requests');
      return res?.requests || [];
    },
    [],
    { initialData: [], ...options }
  );
}

export function useMeetings(options = {}) {
  return useApiQuery(
    async () => {
      const res = await apiGet('/meetings');
      return res?.meetings || [];
    },
    [],
    { initialData: [], ...options }
  );
}

export function useGoals(options = {}) {
  return useApiQuery(
    async () => {
      const res = await apiGet('/goals');
      return res?.goals || [];
    },
    [],
    { initialData: [], ...options }
  );
}

export function useFeedback(arg1 = {}, arg2 = {}) {
  const isParams = Boolean(arg1 && typeof arg1 === 'object' && 'mentorId' in arg1);
  const params = isParams ? arg1 : {};
  const options = isParams ? arg2 : arg1;
  const queryStr = params.mentorId ? `?mentorId=${encodeURIComponent(params.mentorId)}` : '';

  return useApiQuery(
    async () => {
      const res = await apiGet(`/feedback${queryStr}`);
      return res?.feedback || [];
    },
    [params.mentorId],
    { initialData: [], ...options }
  );
}

export function useNotifications(options = {}) {
  return useApiQuery(
    async () => {
      const res = await apiGet('/notifications');
      return res?.notifications || [];
    },
    [],
    { initialData: [], refetchOnFocus: true, ...options }
  );
}

export function useRankedMatches(studentId, options = {}) {
  return useApiQuery(
    async () => {
      if (!studentId) return [];
      const res = await apiGet(`/matches/${studentId}`);
      return res?.matches || [];
    },
    [studentId],
    { initialData: [], enabled: Boolean(studentId), ...options }
  );
}

export function usePublicStats(options = {}) {
  return useApiQuery(
    async () => {
      return apiGet('/stats');
    },
    [],
    { initialData: null, ...options }
  );
}

export function useAuditLogs(options = {}) {
  return useApiQuery(
    async () => {
      const res = await apiGet('/audit-logs');
      return res?.audit || [];
    },
    [],
    { initialData: [], ...options }
  );
}
