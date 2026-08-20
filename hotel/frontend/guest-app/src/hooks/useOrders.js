import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getOrders, placeOrder, toFriendlyError, trackOrder } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';

/** All orders placed this session, most recent first. */
export function useOrdersList() {
  const token = useSessionStore((s) => s.token);

  return useQuery({
    queryKey: ['orders', token],
    queryFn: () =>
      getOrders(token).then((res) =>
        [...res.data.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      ),
    enabled: !!token,
  });
}

/** Places an order, wrapping raw axios errors with a friendly message and invalidating the orders list. */
export function usePlaceOrder() {
  const token = useSessionStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => placeOrder(token, body).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', token] });
    },
    onError: (error) => {
      // Attach a friendly message so callers don't need to import toFriendlyError themselves.
      error.friendlyMessage = toFriendlyError(error);
    },
  });
}

/** Polls a single order's status every 15s. Fires a toast the moment it flips to "ready". */
export function useOrderTracking(orderId) {
  const token = useSessionStore((s) => s.token);
  const wasReady = useRef(false);

  const query = useQuery({
    queryKey: ['order', token, orderId],
    queryFn: () => trackOrder(token, orderId).then((res) => res.data),
    enabled: !!token && !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling once the order is served — nothing left to track.
      return status === 'served' ? false : 15000;
    },
  });

  useEffect(() => {
    if (query.data?.status === 'ready' && !wasReady.current) {
      wasReady.current = true;
      toast.success('Your order is ready! 🍽️');
    }
  }, [query.data?.status]);

  return query;
}
