export default function Loading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="hero-bg relative" style={{ minHeight: '88vh' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center justify-center text-center py-36 animate-pulse">
          <div className="h-4 w-48 bg-white/10 rounded-full mb-6"></div>
          <div className="h-16 w-2/3 bg-white/10 rounded-xl mb-4"></div>
          <div className="h-16 w-1/2 bg-white/10 rounded-xl mb-10"></div>
          <div className="w-full max-w-2xl h-14 bg-white/10 rounded-xl"></div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card p-5 text-center animate-pulse">
              <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg mx-auto mb-2"></div>
              <div className="h-6 bg-[#2a2a2a] rounded w-1/2 mx-auto mb-1"></div>
              <div className="h-3 bg-[#2a2a2a] rounded w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
        <div className="h-6 w-40 bg-[#2a2a2a] rounded mb-8 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-[#2a2a2a]"></div>
              <div className="p-4 space-y-3">
                <div className="h-3 bg-[#2a2a2a] rounded w-3/4"></div>
                <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
