import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import Button from '../ui/Button';
import { formatKES } from '../../hooks/useMenu';

/** M-Pesa phone + amount form. Phone pre-fills from localStorage; amount pre-fills
 * with the outstanding balance but stays editable for partial payment. */
export default function PaymentSheet({ outstanding, onSubmit, loading }) {
  const [phone, setPhone] = useState(() => localStorage.getItem('mamba_last_phone') || '');
  const [amount, setAmount] = useState(outstanding);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('mamba_last_phone', phone);
    onSubmit({ phone, amount: Number(amount) });
  };

  const validPhone = /^0[71]\d{8}$/.test(phone) || /^254[71]\d{8}$/.test(phone);
  const validAmount = Number(amount) > 0 && Number(amount) <= outstanding;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl2 bg-cream-card shadow-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <Smartphone size={17} style={{ color: 'var(--color-primary-dark)' }} />
        </div>
        <h3 className="font-display font-semibold text-[15px]">Pay with M-Pesa</h3>
      </div>

      <label htmlFor="phone" className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide mb-1.5 block">
        Phone number
      </label>
      <input
        id="phone"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="07XX XXX XXX"
        aria-label="M-Pesa phone number"
        className="w-full h-11 rounded-xl border border-line px-3.5 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <label htmlFor="amount" className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide mb-1.5 block">
        Amount (KES)
      </label>
      <input
        id="amount"
        type="number"
        inputMode="decimal"
        min="1"
        max={outstanding}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label="Payment amount in KES"
        className="w-full h-11 rounded-xl border border-line px-3.5 text-[14px] mb-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <p className="text-[12px] text-ink-soft mb-4">
        Outstanding balance: {formatKES(outstanding)}. Edit to pay part of the bill.
      </p>

      <Button type="submit" fullWidth disabled={!validPhone || !validAmount} loading={loading}>
        Send Payment Request
      </Button>
    </form>
  );
}
