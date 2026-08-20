import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';

export default function CartFAB() {
  const navigate = useNavigate();
  const count    = useCartStore((s) => s.count());
  const total    = useCartStore((s) => s.total());
  const badgeRef = useRef(null);
  const [prevCount, setPrevCount] = useState(count);

  // Bounce badge when count increases
  useEffect(() => {
    if (count > prevCount && badgeRef.current) {
      badgeRef.current.classList.remove('badge-pop');
      // Force reflow
      void badgeRef.current.offsetWidth;
      badgeRef.current.classList.add('badge-pop');
    }
    setPrevCount(count);
  }, [count]);

  if (count === 0) return null;

  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between
                 bg-[#f5c842] text-[#0a0a0a] rounded-2xl px-5 py-4 shadow-xl tap"
      style={{ boxShadow: '0 8px 32px rgba(245,200,66,0.35)' }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingBag size={20} strokeWidth={2} />
          <span
            ref={badgeRef}
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#0a0a0a] text-[#f5c842]
                       text-[9px] font-bold flex items-center justify-center"
          >
            {count}
          </span>
        </div>
        <span className="font-semibold text-sm">View Order</span>
      </div>
      <span className="font-bold text-sm">
        KES {total.toLocaleString()}
      </span>
    </button>
  );
}
