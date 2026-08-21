/** Shimmering placeholder block. Compose these so lists never show blank space while loading. */
export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function MenuCardSkeleton() {
  return (
    <div className="rounded-xl2 bg-cream-card shadow-card overflow-hidden">
      <SkeletonBlock className="w-full aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function PopularCardSkeleton() {
  return (
    <div className="w-36 md:w-full shrink-0 rounded-xl2 bg-cream-card shadow-card overflow-hidden">
      <SkeletonBlock className="w-full aspect-video" />
      <div className="p-2 space-y-2">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="rounded-xl2 bg-cream-card shadow-card p-4 space-y-2">
      <SkeletonBlock className="h-4 w-1/2" />
      <SkeletonBlock className="h-3 w-1/3" />
    </div>
  );
}
