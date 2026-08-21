import { NavLink } from 'react-router-dom';
import { UtensilsCrossed, ReceiptText, Wallet } from 'lucide-react';

const TABS = [
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
  { to: '/pay', label: 'Pay', icon: Wallet },
];

/** Fixed bottom tab bar. Active tab takes the hotel's accent color. */
export default function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-30 bg-cream-card border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `tap-shrink flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[44px] text-[11px] font-medium ${
                isActive ? 'text-primary' : 'text-ink-soft'
              }`
            }
          >
            <Icon size={20} strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
