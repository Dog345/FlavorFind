/** Horizontal-scroll category tabs. Tapping scrolls the page to that category's section anchor. */
export default function CategoryTabs({ categories, activeId, onSelect }) {
  const handleClick = (id) => {
    onSelect(id);
    const el = document.getElementById(`category-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 108; // offset for sticky header + tabs
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="flex gap-5 overflow-x-auto px-4 -mx-4 md:px-8 md:-mx-8 lg:px-10 lg:-mx-10 border-b border-line"
      role="tablist"
      aria-label="Menu categories"
    >
      {categories.map((cat) => {
        const active = cat.id === activeId;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={active}
            onClick={() => handleClick(cat.id)}
            className="tap-shrink relative pb-2.5 pt-1 shrink-0 text-[14px] font-medium whitespace-nowrap"
            style={{ color: active ? 'var(--color-primary)' : '#8A7A6D' }}
          >
            {cat.name}
            {active && (
              <span
                className="absolute left-0 right-0 -bottom-px h-[2.5px] rounded-full"
                style={{ background: 'var(--color-primary)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
