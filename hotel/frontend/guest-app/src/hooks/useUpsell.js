import { useQuery } from '@tanstack/react-query';
import { getUpsell } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';

/** Fetches "you might also like" suggestions. Only enabled when `active` (i.e. cart drawer is open). */
export function useUpsell(itemIds, active) {
  const token = useSessionStore((s) => s.token);

  return useQuery({
    queryKey: ['upsell', token, itemIds],
    // Backend returns: { data: [...] }
    queryFn: () => getUpsell(token, itemIds).then((res) => res.data?.data ?? []),
    enabled: !!token && active && itemIds.length > 0,
    staleTime: 60 * 1000,
  });
}
