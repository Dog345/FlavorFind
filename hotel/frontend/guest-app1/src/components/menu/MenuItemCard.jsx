import { Plus, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatKES } from '../../hooks/useMenu';

/**
 * Full-width menu card: image, name, price, prep time, tags, quick-add.
 * Tapping the body opens the detail sheet; tapping [+] adds instantly
 * ONLY when the item has no variants/modifiers to choose from.
 */
export default function MenuItemCard({ item, onOpen, onQuickAdd }) {
  const hasChoices = (item.variants?.length > 0) || (item.modifiers?.length > 0);

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (hasChoices) {
      onOpen(item);
    } else {
      onQuickAdd(item);
    }
  };

  return (
    <div
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
      className="tap-shrink rounded-xl2 bg-cream-card shadow-card overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-[4/3] bg-line">
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {item.tags?.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[85%]">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold leading-tight truncate">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--color-primary)' }}>
              {formatKES(item.price)}
            </span>
            {item.prep_time_minutes && (
              <span className="flex items-center gap-0.5 text-[11px] text-ink-soft">
                <Clock size={11} /> {item.prep_time_minutes} min
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddClick}
          aria-label={`Add ${item.name} to cart`}
          className="tap-shrink shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white shadow-tap mt-0.5"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
