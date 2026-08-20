import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveSession, toFriendlyError } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';

/**
 * Resolves the QR token from the URL into hotel/table/session data and
 * writes it into sessionStore. Used once by SplashPage on app entry.
 */
export function useSession(token) {
  const setSession = useSessionStore((s) => s.setSession);
  const setError = useSessionStore((s) => s.setError);
  const setToken = useSessionStore((s) => s.setToken);

  useEffect(() => {
    setToken(token);
  }, [token, setToken]);

  const query = useQuery({
    queryKey: ['session', token],
    queryFn: () => resolveSession(token).then((res) => res.data),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setSession(query.data);
    }
  }, [query.data, setSession]);

  useEffect(() => {
    if (query.error) {
      const status = query.error?.response?.status;
      setError({ status, message: toFriendlyError(query.error) });
    }
  }, [query.error, setError]);

  return query;
}
