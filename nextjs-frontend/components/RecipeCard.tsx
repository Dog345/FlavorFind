import Link from 'next/link';
import RecipeImage from './RecipeImage';

interface Recipe {
  id: number; title: string; image: string;
  usedIngredients?: { name: string }[];
  missedIngredients?: { name: string }[];
  readyInMinutes?: number; servings?: number; likes?: number;
  diets?: string[];
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="recipe-card block group">
      <div className="relative overflow-hidden" style={{ height: '180px' }}>
        <RecipeImage src={recipe.image} alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {recipe.readyInMinutes && (
          <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            <i className="fas fa-clock text-orange-400"></i> {recipe.readyInMinutes}m
          </span>
        )}
        {recipe.diets?.[0] && (
          <span className="absolute top-2 left-2 bg-green-900/80 backdrop-blur-sm text-green-300 text-xs px-2 py-1 rounded-lg capitalize">
            {recipe.diets[0]}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug mb-3">{recipe.title}</h3>

        {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Matched</p>
            <div className="flex flex-wrap gap-1">
              {recipe.usedIngredients.slice(0, 3).map(i => (
                <span key={i.name} className="bg-green-900/50 text-green-400 border border-green-800/50 px-2 py-0.5 rounded-md text-[10px]">{i.name}</span>
              ))}
            </div>
          </div>
        )}

        {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Need</p>
            <div className="flex flex-wrap gap-1">
              {recipe.missedIngredients.slice(0, 2).map(i => (
                <span key={i.name} className="bg-[#2a2a2a] text-gray-400 border border-[#333] px-2 py-0.5 rounded-md text-[10px]">{i.name}</span>
              ))}
              {recipe.missedIngredients.length > 2 && (
                <span className="text-[10px] text-gray-600">+{recipe.missedIngredients.length - 2}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {recipe.servings && <span><i className="fas fa-user-friends mr-1"></i>{recipe.servings}</span>}
            {recipe.likes && <span><i className="fas fa-heart mr-1 text-red-500/70"></i>{recipe.likes}</span>}
          </div>
          <span className="text-orange-500 text-xs font-medium group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}
