class Recipe {
  final int id;
  final String title;
  final String image;
  final int? readyInMinutes;
  final int? servings;
  final double? spoonacularScore;
  final List<Ingredient> extendedIngredients;
  final List<Ingredient> usedIngredients;
  final List<Ingredient> missedIngredients;
  final List<AnalyzedInstruction> analyzedInstructions;
  final String? summary;
  final String? cuisines;
  final String? dishTypes;

  Recipe({
    required this.id,
    required this.title,
    required this.image,
    this.readyInMinutes,
    this.servings,
    this.spoonacularScore,
    this.extendedIngredients = const [],
    this.usedIngredients = const [],
    this.missedIngredients = const [],
    this.analyzedInstructions = const [],
    this.summary,
    this.cuisines,
    this.dishTypes,
  });

  factory Recipe.fromJson(Map<String, dynamic> j) => Recipe(
        id: j['id'],
        title: j['title'] ?? '',
        image: j['image'] ?? '',
        readyInMinutes: j['readyInMinutes'],
        servings: j['servings'],
        spoonacularScore: (j['spoonacularScore'] as num?)?.toDouble(),
        extendedIngredients: (j['extendedIngredients'] as List? ?? [])
            .map((e) => Ingredient.fromJson(e))
            .toList(),
        usedIngredients: (j['usedIngredients'] as List? ?? [])
            .map((e) => Ingredient.fromJson(e))
            .toList(),
        missedIngredients: (j['missedIngredients'] as List? ?? [])
            .map((e) => Ingredient.fromJson(e))
            .toList(),
        analyzedInstructions: (j['analyzedInstructions'] as List? ?? [])
            .map((e) => AnalyzedInstruction.fromJson(e))
            .toList(),
        summary: j['summary'],
      );
}

class Ingredient {
  final String original;
  final String name;
  final double amount;
  final String unit;

  Ingredient({required this.original, required this.name, required this.amount, required this.unit});

  factory Ingredient.fromJson(Map<String, dynamic> j) => Ingredient(
        original: j['original'] ?? '',
        name: j['name'] ?? '',
        amount: (j['amount'] as num?)?.toDouble() ?? 0,
        unit: j['unit'] ?? '',
      );
}

class AnalyzedInstruction {
  final List<Step> steps;
  AnalyzedInstruction({required this.steps});
  factory AnalyzedInstruction.fromJson(Map<String, dynamic> j) => AnalyzedInstruction(
        steps: (j['steps'] as List? ?? []).map((e) => Step.fromJson(e)).toList(),
      );
}

class Step {
  final int number;
  final String step;
  Step({required this.number, required this.step});
  factory Step.fromJson(Map<String, dynamic> j) =>
      Step(number: j['number'] ?? 0, step: j['step'] ?? '');
}
