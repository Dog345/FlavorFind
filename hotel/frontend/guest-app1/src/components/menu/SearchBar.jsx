import { Search, X } from 'lucide-react';

/** Controlled search input. Debouncing happens in the parent (useMenu). */
export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search
        size={17}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
        aria-hidden="true"
      />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search dishes..."
        aria-label="Search dishes"
        className="w-full h-11 rounded-xl2 bg-cream-card border border-line pl-10 pr-9 text-[14px] placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="tap-shrink absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-line"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
