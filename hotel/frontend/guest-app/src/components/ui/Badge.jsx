const TAG_STYLES = {
  spicy: { emoji: '🌶️', className: 'bg-[#FBEAE4] text-[#B84324]' },
  vegan: { emoji: '🌿', className: 'bg-[#EAF3E6] text-[#4C7A3D]' },
  popular: { emoji: '🔥', className: 'bg-[#FDF0DC] text-[#B8752B]' },
  seafood: { emoji: '🐟', className: 'bg-[#E6F0F5] text-[#33718F]' },
  premium: { emoji: '⭐', className: 'bg-[#F6EEDD] text-[#8A6A1F]' },
};

/** Small pill used for menu item tags (spicy, vegan…) and status chips. */
export default function Badge({ tag, children, tone }) {
  if (tag && TAG_STYLES[tag]) {
    const { emoji, className } = TAG_STYLES[tag];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      >
        <span aria-hidden="true">{emoji}</span>
        {tag}
      </span>
    );
  }

  const tones = {
    neutral: 'bg-line text-ink-soft',
    primary: 'bg-primary-light text-primary-dark',
    dark: 'bg-ink text-cream',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        tones[tone] || tones.neutral
      }`}
    >
      {children}
    </span>
  );
}
