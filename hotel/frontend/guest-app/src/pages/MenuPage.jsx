import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';
import SearchBar from '../components/menu/SearchBar';
import CategoryTabs from '../components/menu/CategoryTabs';
import MenuItemCard from '../components/menu/MenuItemCard';
import ItemDetailSheet from '../components/menu/ItemDetailSheet';
import { MenuCardSkeleton, PopularCardSkeleton } from '../components/ui/Skeleton';
import { useMenu, useMenuSearch, formatKES } from '../hooks/useMenu';
import { useCartStore } from '../stores/cartStore';
import toast from 'react-hot-toast';

export default function MenuPage() {
  const { categories, popularItems, isLoading } = useMenu();
  const [search, setSearch] = useState('');
  const { results, isSearching, isLoading: isSearchLoading } = useMenuSearch(search);
  const [activeCategory, setActiveCategory] = useState(null);
  const [openItem, setOpenItem] = useState(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) setActiveCategory(categories[0].id);
  }, [categories, activeCategory]);

  const handleQuickAdd = (item) => {
    addItem(item, null, [], 1, '', item.base_price ?? item.price);
    toast.success(`${item.name} added to cart`, { icon: '🛒' });
  };

  return (
    <>
      <main className="px-4 pb-6">
        <div className="pt-4 pb-3 sticky top-[60px] z-20 bg-cream">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {isSearching ? (
          <SearchResults results={results} loading={isSearchLoading} onOpen={setOpenItem} onQuickAdd={handleQuickAdd} />
        ) : (
          <>
            <div className="sticky top-[112px] z-20 bg-cream pb-2">
              {!isLoading && categories.length > 0 && (
                <CategoryTabs
                  categories={categories}
                  activeId={activeCategory}
                  onSelect={setActiveCategory}
                />
              )}
            </div>

            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                {popularItems.length > 0 && (
                  <section className="mt-3">
                    <h2 className="font-display text-[16px] font-semibold mb-2.5 flex items-center gap-1.5">
                      🔥 Popular
                    </h2>
                    <div className="flex gap-3 overflow-x-auto -mx-4 px-4">
                      {popularItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setOpenItem(item)}
                          className="tap-shrink w-36 shrink-0 text-left rounded-xl2 bg-cream-card shadow-card overflow-hidden"
                        >
                          <img
                            src={item.image_url}
                            alt=""
                            loading="lazy"
                            className="w-full aspect-video object-cover"
                          />
                          <div className="p-2">
                            <p className="text-[13px] font-medium truncate">{item.name}</p>
                            <p
                              className="text-[12px] font-semibold"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              {formatKES(item.base_price ?? item.price)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {categories.map((cat) => (
                  <section key={cat.id} id={`category-${cat.id}`} className="mt-6 scroll-mt-28">
                    <h2 className="font-display text-[17px] font-semibold mb-3">{cat.name}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {cat.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onOpen={setOpenItem}
                          onQuickAdd={handleQuickAdd}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}
          </>
        )}
      </main>

      <ItemDetailSheet item={openItem} open={!!openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}

function SearchResults({ results, loading, onOpen, onQuickAdd }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center text-center py-16"
      >
        <Utensils size={36} className="text-ink-soft mb-3" />
        <p className="text-[15px] font-medium">No dishes found</p>
        <p className="text-[13px] text-ink-soft mt-1">Try a different search term.</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {results.map((item) => (
        <MenuItemCard key={item.id} item={item} onOpen={onOpen} onQuickAdd={onQuickAdd} />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="mt-3">
        <div className="h-5 w-24 skeleton rounded mb-2.5" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <PopularCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
