import { StarBurst } from './Icons'
import RecipeCard from './RecipeCard'
import { searchRecipes, type Recipe } from '@/src/lib/api'

export default async function Favorites() {
  let recipes: Recipe[] = []
  try {
    const res = await searchRecipes(
      [
        '8bd94446-b88a-492f-95bc-74a44c2204b4', // salt  — matches 47 seeded recipes
        '13ba49f1-6fd7-45b4-989d-f02456efdad5', // sugar — matches 11 seeded recipes
      ],
      { limit: 4 }
    )
    recipes = res.results
  } catch {
    // fail silently
  }

  if (recipes.length === 0) return null

  return (
    <section className="px-8 pb-[90px] text-center bg-dark-bg">
      <div className="mx-auto max-w-[1240px]">
        <div className="eyebrow">
          <StarBurst className="h-4 w-4 fill-terracotta" />
          Customer Favorites
        </div>
        <h2 className="mb-[50px] font-display text-[34px] text-dark-text">
          Loved By Our Guests
        </h2>
        <div className="grid grid-cols-2 gap-[26px] lg:grid-cols-4 text-left">
          {recipes.map(r => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </div>
    </section>
  )
}
