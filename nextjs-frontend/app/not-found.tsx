import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-utensils text-4xl text-gray-600"></i>
      </div>
      <h1 className="text-6xl font-extrabold text-orange-500 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-white mb-3">Recipe Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md">This recipe doesn't exist or may have been removed. Try searching for something else.</p>
      <div className="flex gap-3">
        <Link href="/recipes" className="btn-primary px-6 py-3 text-sm flex items-center gap-2">
          <i className="fas fa-search text-xs"></i> Browse Recipes
        </Link>
        <Link href="/" className="btn-ghost px-6 py-3 text-sm">
          Go Home
        </Link>
      </div>
    </div>
  );
}
