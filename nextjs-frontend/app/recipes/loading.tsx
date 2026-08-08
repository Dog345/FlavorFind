export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Skeleton search bar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-10 animate-pulse">
        <div className="h-4 w-32 bg-[#2a2a2a] rounded mb-4"></div>
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-[#2a2a2a] rounded-xl"></div>
          <div className="w-24 h-12 bg-[#2a2a2a] rounded-xl"></div>
        </div>
      </div>
      {/* Skeleton grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden animate-pulse">
            <div className="h-44 bg-[#2a2a2a]"></div>
            <div className="p-4 space-y-3">
              <div className="h-3 bg-[#2a2a2a] rounded w-3/4"></div>
              <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
              <div className="h-8 bg-[#2a2a2a] rounded-lg mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
