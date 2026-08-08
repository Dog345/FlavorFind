export default function Loading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111111' }}>
      {/* Hero skeleton */}
      <div className="w-full bg-[#1a1a1a] animate-pulse" style={{ height: '420px' }}>
        <div className="absolute bottom-10 left-10 space-y-3">
          <div className="h-4 w-48 bg-[#2a2a2a] rounded"></div>
          <div className="h-10 w-96 bg-[#2a2a2a] rounded"></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card p-4 animate-pulse">
              <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg mx-auto mb-2"></div>
              <div className="h-4 bg-[#2a2a2a] rounded w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="grid md:grid-cols-3 gap-10">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
            ))}
          </div>
          <div className="md:col-span-2 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex-shrink-0"></div>
                <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="h-3 bg-[#2a2a2a] rounded w-full mb-2"></div>
                  <div className="h-3 bg-[#2a2a2a] rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
