import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { useCartStore } from '../../stores/cartStore';

/** Dark sticky header: hotel branding on the left, cart icon + item-count badge on the right. */
export default function Header({ onCartClick }) {
  const hotel = useSessionStore((s) => s.hotel);
  const totalItems = useCartStore((s) => s.totalItems);

  return (
    <header className="sticky top-0 z-30 bg-ink text-cream">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {hotel?.logo_url ? (
            <img
              src={hotel.logo_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary shrink-0 flex items-center justify-center font-display text-sm">
              {hotel?.name?.[0] || 'M'}
            </div>
          )}
          <span className="font-display text-[17px] font-semibold truncate">
            {hotel?.name || 'Mamba Hotel'}
          </span>
        </div>

        <button
          onClick={onCartClick}
          aria-label={`Open cart, ${totalItems} item${totalItems === 1 ? '' : 's'}`}
          className="tap-shrink relative h-10 w-10 flex items-center justify-center rounded-full bg-white/10"
        >
          <ShoppingCart size={19} />
          {totalItems > 0 && (
            <motion.span
              key={totalItems}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center"
            >
              {totalItems}
            </motion.span>
          )}
        </button>
      </div>
    </header>
  );
}
