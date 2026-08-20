import React from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';

/**
 * Single item card used inside a category row.
 * - For "Mains" category: tapping selects it as the hero plate
 * - For everything else: tapping adds/removes as an addon
 */
function ItemCard({ item, isMainCategory }) {
  const hero       = useCartStore((s) => s.hero);
  const setHero    = useCartStore((s) => s.setHero);
  const addons     = useCartStore((s) => s.addons);
  const addAddon   = useCartStore((s) => s.addAddon);
  const removeAddon = useCartStore((s) => s.removeAddon);

  const isSelected = isMainCategory
    ? hero?.id === item.id
    : !!addons[item.id];

  const addonQty = addons[item.id]?.qty || 0;

  const handleTap = () => {
    if (isMainCategory) {
      setHero(item);
    } else {
      addAddon(item);
    }
  };

  return (
    <div
      className="relative shrink-0 w-36 rounded-xl overflow-hidden bg-[#1e1e1e] border tap"
      style={{
        borderColor: isSelected ? '#f5c842' : '#2a2a2a',
        boxShadow:   isSelected ? '0 0 0 1.5px #f5c842' : 'none',
      }}
      onClick={handleTap}
    >
      {/* Image */}
      <div className="w-full h-24 relative overflow-hidden">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Dim overlay when not selected for mains */}
        {isMainCategory && !isSelected && (
          <div className="absolute inset-0 bg-black/30" />
        )}
        {/* Selected tick for mains */}
        {isMainCategory && isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#f5c842] flex items-center justify-center">
            <Check size={11} strokeWidth={3} className="text-black" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-[#f5f5f0] text-xs font-medium leading-tight line-clamp-2">
          {item.name}
        </p>
        <p className="text-[#f5c842] text-xs font-semibold mt-1">
          KES {Number(item.base_price).toLocaleString()}
        </p>

        {/* Addon qty controls */}
        {!isMainCategory && isSelected && (
          <div
            className="flex items-center justify-between mt-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center tap"
              onClick={() => removeAddon(item.id)}
            >
              <Minus size={10} className="text-[#f5f5f0]" />
            </button>
            <span className="text-[#f5f5f0] text-xs font-semibold">{addonQty}</span>
            <button
              className="w-5 h-5 rounded-full bg-[#f5c842] flex items-center justify-center tap"
              onClick={() => addAddon(item)}
            >
              <Plus size={10} className="text-black" />
            </button>
          </div>
        )}

        {/* Add button when not selected addon */}
        {!isMainCategory && !isSelected && (
          <div className="flex items-center justify-end mt-1.5">
            <div className="w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <Plus size={10} className="text-[#888]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CategoryRow
 * A labelled horizontal scroll row of ItemCards.
 */
export default function CategoryRow({ category }) {
  const items = category.items || [];
  if (items.length === 0) return null;

  // Treat the "Mains" category as the hero-selector; others are addons
  const isMainCategory = category.name === 'Mains';

  return (
    <div className="mb-6">
      {/* Label */}
      <div className="flex items-center justify-between mb-3 px-4">
        <h3 className="text-[#f5f5f0] font-semibold text-sm tracking-wide">
          {category.name}
        </h3>
        <span className="text-[#888] text-xs">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scroll */}
      <div className="scroll-row px-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isMainCategory={isMainCategory}
          />
        ))}
      </div>
    </div>
  );
}
