import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatKES } from '../../hooks/useMenu';
import { useCartStore } from '../../stores/cartStore';

export default function CartItem({ item, index }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const variant = item.menuItem.variants?.find((v) => v.id === item.variantId);
  const modifierNames = (item.menuItem.modifiers || [])
    .filter((m) => item.modifierIds.includes(m.id))
    .map((m) => m.name);

  return (
    <div className="flex gap-3 py-3 border-b border-line last:border-0">
      <img
        src={item.menuItem.image_url}
        alt=""
        className="h-16 w-16 rounded-xl object-cover shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display text-[14px] font-semibold leading-tight truncate">
            {item.menuItem.name}
          </h4>
          <button
            onClick={() => removeItem(index)}
            aria-label={`Remove ${item.menuItem.name} from cart`}
            className="tap-shrink shrink-0 text-ink-soft"
          >
            <Trash2 size={15} />
          </button>
        </div>
        {(variant || modifierNames.length > 0) && (
          <p className="text-[12px] text-ink-soft truncate mt-0.5">
            {[variant?.label, ...modifierNames].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => updateQuantity(index, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="tap-shrink h-7 w-7 rounded-full border border-line flex items-center justify-center"
            >
              <Minus size={12} />
            </button>
            <span className="w-4 text-center text-[13px] font-semibold">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(index, item.quantity + 1)}
              aria-label="Increase quantity"
              className="tap-shrink h-7 w-7 rounded-full border border-line flex items-center justify-center"
            >
              <Plus size={12} />
            </button>
          </div>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--color-primary)' }}>
            {formatKES(item.unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
