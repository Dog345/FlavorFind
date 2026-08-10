'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Common ingredients as UX shortcuts — not recipe data, just search helpers
const QUICK = [
  'chicken', 'pasta', 'tomato', 'cheese', 'rice',
  'beef', 'fish', 'eggs', 'mushrooms', 'spinach',
];

interface Props { large?: boolean; onSearch?: () => void; }

export default function SearchBar({ large = false, onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const base = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(timer.current ?? undefined);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${base}/api/ingredients/autocomplete?query=${encodeURIComponent(query)}`);
        const d = await r.json();
        setSuggestions(Array.isArray(d) ? d.slice(0, 6) : []);
        setOpen(true);
      } catch (_e) { setSuggestions([]); }
    }, 300);
  }, [query, base]);

  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (v: string) => {
    setQuery(q => q ? `${q}, ${v}` : v);
    inputRef.current?.focus();
  };

  const search = (val?: string) => {
    const q = (val || query).trim();
    if (!q) return;
    setOpen(false);
    onSearch?.();
    router.push(`/recipes?ingredients=${encodeURIComponent(q)}`);
  };

  return (
    <div>
      <div className={`flex gap-3 ${large ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"></i>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            onFocus={() => suggestions.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Enter ingredients (e.g., chicken, rice, garlic...)"
            className={`w-full pl-10 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
              large
                ? 'bg-black/40 backdrop-blur-sm text-white placeholder-gray-400 border border-white/20 text-base md:text-lg md:py-5 md:pl-14 md:text-xl'
                : 'bg-[#111] text-white placeholder-gray-500 border border-[#2a2a2a] text-sm'
            }`}
          />
          {open && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl overflow-hidden z-50 shadow-2xl">
              {suggestions.map(s => (
                <button key={s.name} onMouseDown={() => { setQuery(s.name); setOpen(false); inputRef.current?.focus(); }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-orange-400 transition-colors flex items-center gap-2 md:text-base md:py-4">
                  <i className="fas fa-leaf text-orange-500 text-xs"></i> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onPointerDown={e => { e.preventDefault(); search(); }}
          className={`btn-primary px-6 py-3.5 text-sm whitespace-nowrap flex items-center justify-center gap-2 ${
            large ? 'md:px-10 md:py-5 md:text-base md:text-lg' : ''
          }`}>
          <i className="fas fa-fire text-xs"></i>
          {large ? 'Find Recipes' : 'Search'}
        </button>
      </div>

      <div className={`mt-3 flex flex-wrap gap-2 ${large ? 'md:gap-3' : ''}`}>
        {QUICK.map(v => (
          <button key={v} type="button"
            onPointerDown={e => { e.preventDefault(); addTag(v); }}
            className={`ingredient-tag capitalize ${large ? 'md:text-base md:px-4 md:py-2' : ''}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
