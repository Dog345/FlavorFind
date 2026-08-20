import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import CartItem from './CartItem';
import OrderSummary from './OrderSummary';
import { useCartStore } from '../../stores/cartStore';
import { useUpsell } from '../../hooks/useUpsell';
import { usePlaceOrder } from '../../hooks/useOrders';
import { formatKES } from '../../hooks/useMenu';

export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const note = useCartStore((s) => s.note);
  const setNote = useCartStore((s) => s.setNote);
  const subtotal = useCartStore((s) => s.subtotal);
  const tax = useCartStore((s) => s.tax);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const itemIds = items.map((i) => i.menuItem.id);
  const { data: upsellItems } = useUpsell(itemIds, open && items.length > 0);
  const placeOrderMutation = usePlaceOrder();

  const handlePlaceOrder = () => {
    const body = {
      notes: note,
      items: items.map((i) => ({
        menu_item_id: i.menuItem.id,
        variant_id: i.variantId,
        modifier_ids: i.modifierIds,
        quantity: i.quantity,
        notes: i.notes,
      })),
    };

    placeOrderMutation.mutate(body, {
      onSuccess: () => {
        clearCart();
        onClose();
        toast.success('Order sent to kitchen! 🎉');
        navigate('/orders');
      },
      onError: (err) => {
        toast.error(err.friendlyMessage);
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Your Order" heightClass="max-h-[88vh]">
      <div className="px-5 pb-6">
        {items.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[15px] text-ink-soft">Your cart is empty.</p>
            <p className="text-[13px] text-ink-soft mt-1">Add a dish from the menu to get started.</p>
          </div>
        ) : (
          <>
            <div>
              {items.map((item, index) => (
                <CartItem key={index} item={item} index={index} />
              ))}
            </div>

            {upsellItems?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  You might also like
                </h3>
                <div className="flex gap-3 overflow-x-auto -mx-5 px-5">
                  {upsellItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="w-28 shrink-0">
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-full aspect-square object-cover rounded-xl"
                        loading="lazy"
                      />
                      <p className="text-[12px] font-medium mt-1 truncate">{item.name}</p>
                      <p className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                        {formatKES(item.base_price ?? item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <OrderSummary subtotal={subtotal} tax={tax} total={total} />

            <div className="mt-2">
              <label htmlFor="kitchen-note" className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide mb-2 block">
                Any requests for the kitchen?
              </label>
              <textarea
                id="kitchen-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Optional"
                className="w-full rounded-xl border border-line p-3 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="mt-4">
              <Button onClick={handlePlaceOrder} fullWidth loading={placeOrderMutation.isPending}>
                Place Order — {formatKES(total)}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
