'use client';

interface NutritionData {
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  cholesterol?: number;
  sodium?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  protein?: number;
}

interface NutritionFactsProps {
  nutrition: NutritionData;
}

export default function NutritionFacts({ nutrition }: NutritionFactsProps) {
  if (!nutrition || Object.keys(nutrition).length === 0) {
    return null;
  }

  const nutrients = [
    { label: 'Calories', value: nutrition.calories, unit: '' },
    { label: 'Total Fat', value: nutrition.fat, unit: 'g' },
    { label: 'Saturated Fat', value: nutrition.saturatedFat, unit: 'g' },
    { label: 'Cholesterol', value: nutrition.cholesterol, unit: 'mg' },
    { label: 'Sodium', value: nutrition.sodium, unit: 'mg' },
    { label: 'Carbohydrates', value: nutrition.carbs, unit: 'g' },
    { label: 'Fiber', value: nutrition.fiber, unit: 'g' },
    { label: 'Sugar', value: nutrition.sugar, unit: 'g' },
    { label: 'Protein', value: nutrition.protein, unit: 'g' },
  ];

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
      <h3 className="section-title mb-6">Nutrition Facts (per serving)</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {nutrients.map(
          (nutrient) =>
            nutrient.value !== undefined &&
            nutrient.value !== null && (
              <div key={nutrient.label} className="bg-[#111] border border-[#2a2a2a] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{nutrient.label}</p>
                <p className="text-lg font-bold text-white">
                  {nutrient.value.toFixed(1)}
                  <span className="text-xs text-gray-400 ml-1">{nutrient.unit}</span>
                </p>
              </div>
            )
        )}
      </div>
    </div>
  );
}
