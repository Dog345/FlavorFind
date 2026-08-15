import { StarBurst } from './Icons'
import RecipeCard from './RecipeCard'
import { searchRecipes, type Recipe } from '@/src/lib/api'

export default async function Favorites() {
  let recipes: Recipe[] = []
  try {
    const res = await searchRecipes(
      [
        '534a9433-12e5-4c11-97aa-9c07d43d02d8', // egg
        'fe46a694-59fc-41e2-bb62-9642c346e896', // tomato
      ],
      { limit: 4 }
    )
    recipes = res.results
  } catch {
    // fail silently
  }

  if (recipes.length === 0) return null

  return (
    <section className="px-8 pb-[90px] text-center">
      <div className="mx-auto max-w-[1240px]">
        <div className="eyebrow">
          <StarBurst className="h-4 w-4 fill-terracotta" />
          Customer Favorites
        </div>
        <h2 className="mb-[50px] font-display text-[34px] text-green-deep">
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
