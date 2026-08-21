import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Clock } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatKES } from '../../hooks/useMenu';
import { useCartStore } from '../../stores/cartStore';
import toast from 'react-hot-toast';

export default function ItemDetailSheet({ item, open, onClose }) {
  const addItem = useCartStore((s) => s.addItem);

  const [variantId, setVariantId] = useState(null);
  const [modifierIds, setModifierIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Reset local selection whenever a new item is opened.
  useEffect(() => {
    if (item) {
      setVariantId(item.variants?.[0]?.id ?? null);
      setModifierIds([]);
      setNotes('');
      setQuantity(1);
    }
  }, [item]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const variant = item.variants?.find((v) => v.id === variantId);
    const base = variant ? variant.price : item.price;
    const modsTotal = (item.modifiers || [])
      .filter((m) => modifierIds.includes(m.id))
      .reduce((sum, m) => sum + m.price, 0);
    return base + modsTotal;
  }, [item, variantId, modifierIds]);

  if (!item) return null;

  const toggleModifier = (id) =>
    setModifierIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const handleAddToCart = () => {
    addItem(item, variantId, modifierIds, quantity, notes, unitPrice);
    toast.success(`${item.name} added — KES ${(unitPrice * quantity).toLocaleString()}`, {
      icon: '🛒',
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="dialog"
      footer={
        <Button onClick={handleAddToCart} fullWidth>
          Add to cart — {formatKES(unitPrice * quantity)}
        </Button>
      }
    >
      <div className="w-full">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-[42vh] md:h-[280px] object-cover md:rounded-t-[28px]"
        />
      </div>

      <div className="px-5 pt-4 pb-6">
        <h2 className="font-display text-2xl font-semibold leading-tight">{item.name}</h2>

        <div className="flex items-center gap-2 mt-2">
          {item.prep_time_minutes && (
            <span className="flex items-center gap-1 text-[12px] text-ink-soft">
              <Clock size={13} /> {item.prep_time_minutes} min
            </span>
          )}
        </div>

        {item.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {item.tags.map((tag) => (
              <Badge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {item.description && (
          <p className="text-[14px] text-ink-soft leading-relaxed mt-3">{item.description}</p>
        )}

        {item.variants?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
              Size
            </h3>
            <div className="flex gap-2">
              {item.variants.map((v) => {
                const active = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    aria-pressed={active}
                    className="tap-shrink h-11 min-w-[44px] px-4 rounded-full border text-[13px] font-semibold"
                    style={
                      active
                        ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }
                        : { borderColor: '#EAE2D8', color: '#2B2119' }
                    }
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {item.modifiers?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
              Add-ons
            </h3>
            <div className="space-y-2">
              {item.modifiers.map((m) => {
                const checked = modifierIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center justify-between py-2 px-3 rounded-xl border border-line cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 text-[14px]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModifier(m.id)}
                        className="h-[18px] w-[18px] accent-[var(--color-primary)]"
                        aria-label={m.name}
                      />
                      {m.name}
                    </span>
                    <span className="text-[13px] text-ink-soft">+{formatKES(m.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="notes" className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide mb-2 block">
            Special instructions
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. no onions, extra spicy..."
            rows={2}
            className="w-full rounded-xl border border-line p-3 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center justify-between mt-5">
          <span className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide">
            Quantity
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="tap-shrink h-9 w-9 rounded-full border border-line flex items-center justify-center"
            >
              <Minus size={15} />
            </button>
            <span className="w-5 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="tap-shrink h-9 w-9 rounded-full border border-line flex items-center justify-center"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
