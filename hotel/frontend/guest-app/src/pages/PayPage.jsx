import { useEffect, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import PaymentSheet from '../components/payment/PaymentSheet';
import PaymentPolling from '../components/payment/PaymentPolling';
import { OrderRowSkeleton } from '../components/ui/Skeleton';
import { useOrdersList } from '../hooks/useOrders';
import { initiateMpesa, pollPayment, toFriendlyError } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';
import { formatKES } from '../hooks/useMenu';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 3000;
const TIMEOUT_MS = 2 * 60 * 1000;

export default function PayPage() {
  const token = useSessionStore((s) => s.token);
  const table = useSessionStore((s) => s.table);
  const { data: orders, isLoading } = useOrdersList();

  const [paymentState, setPaymentState] = useState('idle'); // idle | polling | completed | failed | timeout
  const [receipt, setReceipt] = useState(null);
  const pollRef = useRef(null);
  const timeoutRef = useRef(null);

  const outstanding = (orders || []).reduce((sum, o) => sum + (o.balance ?? o.total), 0);

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const stopPolling = () => {
    clearInterval(pollRef.current);
    clearTimeout(timeoutRef.current);
  };

  const handleSubmitPayment = async ({ phone, amount }) => {
    try {
      const { data } = await initiateMpesa(token, { phone, amount });
      setPaymentState('polling');

      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setPaymentState('timeout');
      }, TIMEOUT_MS);

      pollRef.current = setInterval(async () => {
        try {
          const { data: status } = await pollPayment(token, data.payment_id);
          if (status.status === 'completed') {
            stopPolling();
            setReceipt({ amount, mpesa_code: status.mpesa_code });
            setPaymentState('completed');
          } else if (status.status === 'failed') {
            stopPolling();
            setPaymentState('failed');
          }
        } catch (err) {
          // Transient poll error — keep trying until the 2-minute timeout.
        }
      }, POLL_INTERVAL);
    } catch (err) {
      toast.error(toFriendlyError(err));
    }
  };

  const handleRetry = () => {
    setPaymentState('idle');
  };

  const handleDismiss = () => {
    setPaymentState('idle');
  };

  return (
    <main className="px-4 pt-4 pb-6">
      <h1 className="font-display text-xl font-semibold mb-4">Your Bill</h1>

      {isLoading ? (
        <div className="space-y-3 mb-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl2 bg-cream-card shadow-card p-4 mb-5">
          {(orders || []).map((order) => (
            <div key={order.id} className="flex justify-between py-1.5 text-[14px]">
              <span className="text-ink-soft">Order #{order.order_number}</span>
              <span>{formatKES(order.total)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-2 border-t border-line font-display font-semibold text-[17px]">
            <span>Outstanding balance</span>
            <span style={{ color: 'var(--color-primary)' }}>{formatKES(outstanding)}</span>
          </div>
        </div>
      )}

      {paymentState === 'idle' ? (
        outstanding > 0 ? (
          <PaymentSheet outstanding={outstanding} onSubmit={handleSubmitPayment} loading={false} />
        ) : (
          <div className="rounded-xl2 bg-[#EAF3E6] p-4 text-center text-[14px] text-[#4C7A3D] font-medium">
            You're all paid up. Thank you!
          </div>
        )
      ) : (
        <PaymentPolling
          status={paymentState}
          receipt={receipt}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />
      )}

      <div className="rounded-xl2 border border-line p-4 mt-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-line flex items-center justify-center shrink-0">
          <Phone size={16} className="text-ink-soft" />
        </div>
        <p className="text-[13px] text-ink-soft">
          Prefer to pay cash? Call your waiter or pay at the cashier. Quote your table number:{' '}
          <span className="font-semibold text-ink">{table?.label || '—'}</span>
        </p>
      </div>
    </main>
  );
}
