import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import CartDrawer from '../cart/CartDrawer';

/**
 * Shell shared by the Menu, Orders, and Pay screens.
 *
 * Responsive behaviour:
 * - Below md (768px): phone layout — sticky header, bottom tab bar, cart as
 *   a bottom sheet. This matches the reference video 1:1.
 * - md and up: the header grows a horizontal nav (see Header.jsx) and takes
 *   over navigation, so the bottom tab bar is hidden. The cart docks to the
 *   right as a side panel instead of covering the screen from the bottom —
 *   see Modal.jsx for how a single component adapts to both.
 */
export default function GuestLayout() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="app-shell flex flex-col">
      <Header onCartClick={() => setCartOpen(true)} />
      <div className="flex-1">
        <Outlet />
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
