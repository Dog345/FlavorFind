import { StarBurst } from './Icons'
import RecipeCard from './RecipeCard'
import { getFeaturedRecipes, type Recipe } from '@/src/lib/api'

export default async function Dishes() {
  let featured: Recipe[] = []
  try {
    featured = await getFeaturedRecipes(8)
  } catch {
    // fall back to empty
  }

  return (
    <section className="px-8 pt-[40px] pb-[70px] lg:pt-[110px] lg:pb-[90px] text-center bg-dark-bg" id="dishes">
      <div className="mx-auto max-w-[1240px]">
        <div className="eyebrow">
          <StarBurst className="h-4 w-4 fill-terracotta" />
          Our Signature Recipes
        </div>
        <h2 className="mb-3 font-display text-[34px] text-dark-text">
          Flavors You&apos;ll Remember
        </h2>
        <p className="mb-[50px] text-[15px] text-dark-muted max-w-[520px] mx-auto leading-[1.7]">
          Discover top-rated recipes from around the world, crafted with ingredients you already have.
        </p>

        {featured.length > 0 && (
          <div className="grid grid-cols-2 gap-[26px] lg:grid-cols-4 text-left">
            {featured.map(r => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
