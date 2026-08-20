import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { formatKES } from '../../hooks/useMenu';

const CONFETTI_COLORS = ['#D9642E', '#F3DDCE', '#2B2119', '#EAF3E6', '#4C7A3D'];

function Confetti() {
  const pieces = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((_, i) => (
        <motion.span
          key={i}
          initial={{ y: -20, x: `${Math.random() * 100}%`, opacity: 1, rotate: 0 }}
          animate={{ y: '110%', opacity: 0, rotate: 360 }}
          transition={{ duration: 1.6 + Math.random(), delay: Math.random() * 0.3, ease: 'easeIn' }}
          className="absolute top-0 h-2 w-2 rounded-sm"
          style={{ background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
        />
      ))}
    </div>
  );
}

/**
 * Shows the "check your phone" waiting animation while polling, then
 * resolves into a success (confetti + receipt), failure, or timeout state.
 */
export default function PaymentPolling({ status, receipt, onRetry, onDismiss }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== 'polling') return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'polling') {
    return (
      <div className="rounded-xl2 bg-cream-card shadow-card p-6 flex flex-col items-center text-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <Smartphone size={26} style={{ color: 'var(--color-primary-dark)' }} />
        </motion.div>
        <h3 className="font-display font-semibold text-[16px]">Check your phone</h3>
        <p className="text-[13px] text-ink-soft mt-1.5 max-w-[240px]">
          Enter your M-Pesa PIN on your phone to complete payment.
        </p>
        <div className="flex items-center gap-1 mt-4 text-[12px] text-ink-soft">
          <Clock size={12} />
          {Math.max(0, 120 - elapsed)}s remaining
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="relative rounded-xl2 bg-cream-card shadow-card p-6 flex flex-col items-center text-center overflow-hidden">
        <Confetti />
        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4 bg-[#EAF3E6]">
          <CheckCircle2 size={30} className="text-[#4C7A3D]" />
        </div>
        <h3 className="font-display font-semibold text-[17px]">Payment confirmed! Thank you 🎉</h3>
        {receipt && (
          <div className="w-full mt-4 pt-4 border-t border-line text-left text-[13px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-soft">Amount paid</span>
              <span className="font-semibold">{formatKES(receipt.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">M-Pesa code</span>
              <span className="font-semibold">{receipt.mpesa_code}</span>
            </div>
          </div>
        )}
        <div className="w-full mt-4">
          <Button onClick={onDismiss} fullWidth>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'failed' || status === 'timeout') {
    return (
      <div className="rounded-xl2 bg-cream-card shadow-card p-6 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4 bg-[#FBEAE4]">
          <XCircle size={28} className="text-[#B84324]" />
        </div>
        <h3 className="font-display font-semibold text-[16px]">
          {status === 'timeout' ? 'Payment request expired' : 'Payment failed'}
        </h3>
        <p className="text-[13px] text-ink-soft mt-1.5 max-w-[240px]">
          {status === 'timeout'
            ? 'Please try again.'
            : 'The payment could not be completed. Please try again.'}
        </p>
        <div className="w-full mt-4">
          <Button onClick={onRetry} fullWidth>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
