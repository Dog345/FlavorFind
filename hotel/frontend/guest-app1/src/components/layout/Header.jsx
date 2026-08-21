import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, ReceiptText, Wallet } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { useCartStore } from '../../stores/cartStore';

const TABS = [
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
  { to: '/pay', label: 'Pay', icon: Wallet },
];

/**
 * Dark sticky header: hotel branding on the left, cart icon on the right.
 * On phones this is the whole nav surface (BottomNav handles tabs below).
 * From md up, it also carries the Menu/Orders/Pay tabs itself — the bottom
 * tab bar is hidden at that point, matching how a desktop site would
 * actually be navigated rather than leaving a phone-only control floating
 * at the bottom of a wide screen.
 */
export default function Header({ onCartClick }) {
  const hotel = useSessionStore((s) => s.hotel);
  const totalItems = useCartStore((s) => s.totalItems);

  return (
    <header className="sticky top-0 z-30 bg-ink text-cream">
      <div className="page-container flex items-center justify-between py-3">
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

        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-cream' : 'text-cream/60 hover:text-cream'
                }`
              }
            >
              <Icon size={15} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </nav>

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
