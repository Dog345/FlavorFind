import React, { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../stores/cartStore';

/**
 * HeroPlate
 * Shows the currently selected main dish as a large crossfading image.
 * When the selected hero changes, the old image fades out, the new one fades in.
 */
export default function HeroPlate({ items = [] }) {
  const hero    = useCartStore((s) => s.hero);
  const setHero = useCartStore((s) => s.setHero);

  // Two image slots for crossfade
  const [imgA, setImgA] = useState(hero?.image_url || items[0]?.image_url || '');
  const [imgB, setImgB] = useState('');
  const [active, setActive] = useState('a'); // which slot is visible
  const [fading, setFading] = useState(false);
  const timer = useRef(null);

  // Auto-select first item on load
  useEffect(() => {
    if (!hero && items.length > 0) {
      setHero(items[0]);
      setImgA(items[0].image_url);
    }
  }, [items]);

  // Crossfade when hero changes
  useEffect(() => {
    if (!hero) return;
    const newUrl = hero.image_url;
    clearTimeout(timer.current);

    if (active === 'a') {
      setImgB(newUrl);
    } else {
      setImgA(newUrl);
    }

    setFading(true);
    timer.current = setTimeout(() => {
      setActive((prev) => (prev === 'a' ? 'b' : 'a'));
      setFading(false);
    }, 400);

    return () => clearTimeout(timer.current);
  }, [hero]);

  if (!hero || items.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-[#161616] animate-pulse rounded-2xl" />
    );
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
      {/* Slot A */}
      <img
        src={imgA}
        alt=""
        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        style={{
          opacity:    active === 'a' ? 1 : fading ? 0 : 0,
          transform:  active === 'a' ? 'scale(1)' : fading ? 'scale(0.97)' : 'scale(0.97)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      />
      {/* Slot B */}
      <img
        src={imgB}
        alt=""
        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        style={{
          opacity:    active === 'b' ? 1 : fading ? 1 : 0,
          transform:  active === 'b' ? 'scale(1)' : fading ? 'scale(1.02)' : 'scale(1.02)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      />

      {/* Gradient overlay at bottom for text */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.3) 45%, transparent 100%)',
        }}
      />

      {/* Dish info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-semibold text-white leading-tight truncate">
              {hero.name}
            </h2>
            {hero.description && (
              <p className="text-[#aaa] text-xs mt-0.5 line-clamp-1">
                {hero.description}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[#f5c842] font-semibold text-lg leading-none">
              KES {Number(hero.base_price).toLocaleString()}
            </span>
            {hero.prep_time_min && (
              <p className="text-[#888] text-xs mt-0.5">{hero.prep_time_min} min</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {hero.tags?.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {hero.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wider text-[#888] bg-white/5 px-2 py-0.5 rounded-full border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
