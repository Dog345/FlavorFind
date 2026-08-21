import { formatKES } from '../../hooks/useMenu';

export default function OrderSummary({ subtotal, tax, total }) {
  return (
    <div className="space-y-1.5 py-3 border-t border-line text-[14px]">
      <div className="flex justify-between text-ink-soft">
        <span>Subtotal</span>
        <span>{formatKES(subtotal)}</span>
      </div>
      <div className="flex justify-between text-ink-soft">
        <span>VAT (16%)</span>
        <span>{formatKES(tax)}</span>
      </div>
      <div className="flex justify-between font-display font-semibold text-[17px] pt-1">
        <span>Total</span>
        <span style={{ color: 'var(--color-primary)' }}>{formatKES(total)}</span>
      </div>
    </div>
  );
}
