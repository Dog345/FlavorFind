import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import CartDrawer from '../cart/CartDrawer';

/** Shell shared by the Menu, Orders, and Pay screens: sticky header (with
 * cart access), the routed page content, a bottom tab bar, and the cart
 * drawer itself (openable from the header on any of the three tabs). */
export default function GuestLayout() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="app-shell flex flex-col">
      <Header onCartClick={() => setCartOpen(true)} />
      <div className="flex-1">
        <Outlet />
      </div>
      <BottomNav />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
