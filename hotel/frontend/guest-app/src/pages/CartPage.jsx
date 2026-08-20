import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore }    from '../stores/cartStore';
import { useSessionStore } from '../stores/sessionStore';
import { placeOrder, friendlyError } from '../api/guest';

export default function CartPage() {
  const navigate     = useNavigate();
  const token        = useSessionStore((s) => s.token);
  const table        = useSessionStore((s) => s.table);
  const hero         = useCartStore((s) => s.hero);
  const addons       = useCartStore((s) => s.addons);
  const setHero      = useCartStore((s) => s.setHero);
  const addAddon     = useCartStore((s) => s.addAddon);
  const removeAddon  = useCartStore((s) => s.removeAddon);
  const clearAddon   = useCartStore((s) => s.clearAddon);
  const clearAll     = useCartStore((s) => s.clearAll);
  const addOrder     = useCartStore((s) => s.addOrder);
  const buildPayload = useCartStore((s) => s.buildPayload);
  const total        = useCartStore((s) => s.total());
  const [placing, setPlacing] = useState(false);
  const [note, setNote] = useState('');

  const addonList = Object.values(addons);

  const handlePlaceOrder = async () => {
    if (!hero) {
      toast.error('Choose a main dish first');
      return;
    }
    setPlacing(true);
    try {
      const payload = buildPayload();
      if (note.trim()) payload.notes = note.trim();
      const { data } = await placeOrder(token, payload);
      addOrder(data.data);
      clearAll();
      navigate(`/order/${data.data.id}`, { replace: true });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setPlacing(false);
    }
  };

  // Nothing in cart
  if (!hero && addonList.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-5 px-6">
        <div className="text-5xl">🛒</div>
        <p className="text-[#f5f5f0] font-semibold text-lg">Your order is empty</p>
        <p className="text-[#888] text-sm text-center">
          Go back to the menu and pick something delicious
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="px-8 py-3 bg-[#f5c842] text-[#0a0a0a] rounded-xl font-semibold text-sm tap"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-40">

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center tap"
          >
            <ArrowLeft size={16} className="text-[#f5f5f0]" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-[#f5f5f0] leading-none">
              Your Order
            </h1>
            {table && (
              <p className="text-[#888] text-xs mt-0.5">{table.label}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3">

        {/* ── Main dish ── */}
        {hero && (
          <div className="fade-in">
            <p className="text-[#888] text-xs uppercase tracking-widest mb-2">Main Dish</p>
            <div className="bg-[#1e1e1e] rounded-2xl p-3 flex items-center gap-3 border border-[#2a2a2a]">
              <img
                src={hero.image_url}
                alt={hero.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[#f5f5f0] font-semibold text-sm leading-tight">{hero.name}</p>
                <p className="text-[#888] text-xs mt-0.5 line-clamp-1">{hero.description}</p>
                <p className="text-[#f5c842] font-semibold text-sm mt-1">
                  KES {Number(hero.base_price).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => { setHero(null); navigate('/menu'); }}
                className="shrink-0 w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center tap"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>
        )}

        {/* ── Add-ons ── */}
        {addonList.length > 0 && (
          <div className="fade-in">
            <p className="text-[#888] text-xs uppercase tracking-widest mb-2 mt-4">Add-ons</p>
            <div className="space-y-2">
              {addonList.map(({ item, qty }) => (
                <div
                  key={item.id}
                  className="bg-[#1e1e1e] rounded-2xl p-3 flex items-center gap-3 border border-[#2a2a2a]"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f5f5f0] font-medium text-sm leading-tight">{item.name}</p>
                    <p className="text-[#f5c842] font-semibold text-sm mt-0.5">
                      KES {(Number(item.base_price) * qty).toLocaleString()}
                    </p>
                  </div>
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => removeAddon(item.id)}
                      className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center tap"
                    >
                      {qty === 1
                        ? <Trash2 size={12} className="text-red-400" />
                        : <Minus size={12} className="text-[#f5f5f0]" />
                      }
                    </button>
                    <span className="text-[#f5f5f0] text-sm font-semibold w-4 text-center">{qty}</span>
                    <button
                      onClick={() => addAddon(item)}
                      className="w-7 h-7 rounded-full bg-[#f5c842] flex items-center justify-center tap"
                    >
                      <Plus size={12} className="text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Add more ── */}
        <button
          onClick={() => navigate('/menu')}
          className="w-full flex items-center justify-between bg-[#1e1e1e] border border-dashed border-[#3a3a3a]
                     rounded-2xl px-4 py-3 text-[#888] text-sm tap mt-2"
        >
          <span>+ Add more items</span>
          <ChevronRight size={16} />
        </button>

        {/* ── Special note ── */}
        <div className="mt-4">
          <p className="text-[#888] text-xs uppercase tracking-widest mb-2">Special Instructions</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Allergies, spice level, no onions… anything for the chef"
            maxLength={200}
            rows={3}
            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl px-4 py-3
                       text-[#f5f5f0] text-sm placeholder-[#555] resize-none
                       focus:outline-none focus:border-[#f5c842]/50"
          />
        </div>

        {/* ── Order summary ── */}
        <div className="bg-[#1e1e1e] rounded-2xl p-4 border border-[#2a2a2a] mt-4 space-y-2">
          <div className="flex justify-between text-[#888] text-sm">
            <span>Subtotal</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#888] text-sm">
            <span>Service charge</span>
            <span>Included</span>
          </div>
          <div className="border-t border-[#2a2a2a] pt-2 mt-2 flex justify-between">
            <span className="text-[#f5f5f0] font-semibold">Total</span>
            <span className="text-[#f5c842] font-bold text-lg">
              KES {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Place order button (fixed) ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#0a0a0a] to-transparent">
        <button
          onClick={handlePlaceOrder}
          disabled={placing || !hero}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                     font-bold text-base tap disabled:opacity-50"
          style={{
            background: hero ? '#f5c842' : '#2a2a2a',
            color:      hero ? '#0a0a0a' : '#888',
            boxShadow:  hero ? '0 8px 32px rgba(245,200,66,0.35)' : 'none',
          }}
        >
          {placing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Placing order…
            </>
          ) : (
            <>
              Place Order · KES {total.toLocaleString()}
            </>
          )}
        </button>
        {!hero && (
          <p className="text-center text-[#888] text-xs mt-2">
            Go back and select a main dish
          </p>
        )}
      </div>
    </div>
  );
}
