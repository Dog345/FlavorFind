import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMenu, getPopular, searchMenu } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';

/** Formats an integer amount of Kenyan Shillings, e.g. formatKES(1200) -> "KES 1,200". */
export function formatKES(amount) {
  return `KES ${Number(amount || 0).toLocaleString('en-KE')}`;
}

/** Fetches the full categorized menu + the popular-items row, in parallel. */
export function useMenu() {
  const token = useSessionStore((s) => s.token);

  const menuQuery = useQuery({
    queryKey: ['menu', token],
    // Backend returns: { data: [ { id, name, items: [...] }, ... ] }
    queryFn: () => getMenu(token).then((res) => res.data?.data ?? []),
    enabled: !!token,
  });

  const popularQuery = useQuery({
    queryKey: ['popular', token],
    // Backend returns: { data: [ { id, name, base_price, ... }, ... ] }
    queryFn: () => getPopular(token).then((res) => res.data?.data ?? []),
    enabled: !!token,
  });

  return {
    categories: menuQuery.data || [],
    popularItems: popularQuery.data || [],
    isLoading: menuQuery.isLoading || popularQuery.isLoading,
    isError: menuQuery.isError,
    error: menuQuery.error,
  };
}

/** Debounced (400ms) menu search-as-you-type. */
export function useMenuSearch(query) {
  const token = useSessionStore((s) => s.token);
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['menu-search', token, debounced],
    // Backend returns: { data: [...], query: '...', count: N }
    queryFn: () => searchMenu(token, debounced).then((res) => res.data?.data ?? []),
    enabled: !!token && debounced.trim().length > 0,
  });

  return {
    results: searchQuery.data || [],
    isSearching: !!debounced.trim(),
    isLoading: searchQuery.isFetching,
  };
}
