import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMenu } from '../api/guest';
import { useSessionStore } from '../stores/sessionStore';
import { useCartStore } from '../stores/cartStore';
import HeroPlate   from '../components/HeroPlate';
import CategoryRow from '../components/CategoryRow';
import CartFAB     from '../components/CartFAB';

function SkeletonRow() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="h-4 w-24 bg-[#1e1e1e] rounded animate-pulse" />
        <div className="h-3 w-12 bg-[#1e1e1e] rounded animate-pulse" />
      </div>
      <div className="scroll-row px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shrink-0 w-36 h-[148px] bg-[#1e1e1e] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function MenuPage() {
  const navigate   = useNavigate();
  const token      = useSessionStore((s) => s.token);
  const hotel      = useSessionStore((s) => s.hotel);
  const table      = useSessionStore((s) => s.table);
  const clearAll   = useCartStore((s) => s.clearAll);

  // If no token in store (e.g. direct navigation), redirect to root
  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [token]);

  // Clear previous order selections when menu loads fresh
  useEffect(() => {
    clearAll();
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['menu', token],
    queryFn:  () => getMenu(token).then((r) => r.data),
    enabled:  !!token,
  });

  const categories = data?.data || [];

  // Separate mains from addons for the hero
  const mainsCategory  = categories.find((c) => c.name === 'Mains') || categories[0];
  const mainItems      = mainsCategory?.items || [];

  if (isError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 gap-4 text-center">
        <div className="text-3xl">😕</div>
        <p className="text-[#f5f5f0] font-semibold">Couldn't load the menu</p>
        <p className="text-[#888] text-sm">{error?.message || 'Check your connection'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2.5 bg-[#f5c842] text-[#0a0a0a] rounded-xl font-semibold text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-28">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-semibold text-[#f5f5f0] leading-none">
              {hotel?.name || 'Menu'}
            </h1>
            {table && (
              <p className="text-[#888] text-xs mt-0.5">{table.label}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[#888] text-xs">Open</span>
          </div>
        </div>
      </div>

      {/* ── Hero plate ── */}
      <div className="px-4 pt-4 pb-2">
        {isLoading ? (
          <div className="w-full aspect-[4/3] bg-[#1e1e1e] rounded-2xl animate-pulse" />
        ) : (
          <HeroPlate items={mainItems} />
        )}

        {/* "Select your main" hint, only shown when loading is done */}
        {!isLoading && categories.length > 0 && (
          <p className="text-center text-[#888] text-xs mt-3">
            Tap a dish below to change ↓
          </p>
        )}
      </div>

      {/* ── Category rows ── */}
      <div className="mt-4">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : categories.length === 0 ? (
          <div className="text-center text-[#888] text-sm py-12">
            No menu items available right now
          </div>
        ) : (
          categories.map((cat) => (
            <CategoryRow key={cat.id} category={cat} />
          ))
        )}
      </div>

      {/* ── Floating cart button ── */}
      <CartFAB />
    </div>
  );
}
