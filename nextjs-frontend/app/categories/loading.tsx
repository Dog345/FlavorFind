export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 animate-pulse">
      <div className="h-6 w-48 bg-[#2a2a2a] rounded mb-10"></div>
      {[1, 2, 3].map(s => (
        <div key={s} className="mb-12">
          <div className="h-5 w-32 bg-[#2a2a2a] rounded mb-6"></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg"></div>
                <div className="h-2 w-12 bg-[#2a2a2a] rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
