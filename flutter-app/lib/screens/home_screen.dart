import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/recipe.dart';
import '../services/api_service.dart';
import '../widgets/recipe_card.dart';
import '../widgets/dancing_chef_loader.dart';
import 'recipe_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  bool _showResults = false;
  bool _loadingSections = true;
  List<Recipe> _recipes = [];
  List<Map<String, dynamic>> _sections = [];

  @override
  void initState() {
    super.initState();
    _loadSections();
  }

  Future<void> _loadSections() async {
    try {
      final sections = await ApiService.getSections();
      if (mounted) {
        setState(() {
          _sections = sections;
          _loadingSections = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _loadingSections = false; });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading sections: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _search(String ingredients) async {
    if (ingredients.trim().isEmpty) return;
    setState(() { _loading = true; _showResults = true; });
    try {
      final results = await ApiService.searchByIngredients(ingredients);
      setState(() { _recipes = results; });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
        setState(() { _showResults = false; });
      }
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  void _clearSearch() {
    setState(() { _showResults = false; _recipes = []; _controller.clear(); });
  }

  Future<void> _onRefresh() async {
    await _loadSections();
  }

  // ── Hero Search Card ──────────────────────────────────────────────────────

  Widget _heroCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [kPrimary.withValues(alpha: 0.5), kCard],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('What are you craving?',
              style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          const Text('Enter ingredients to find perfect recipes',
              style: TextStyle(color: kTextSecondary, fontSize: 14)),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: kBorder,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: TextField(
                    controller: _controller,
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                    decoration: const InputDecoration(
                      hintText: 'e.g., chicken, rice, tomatoes...',
                      hintStyle: TextStyle(color: kTextSecondary),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                    onSubmitted: _search,
                    textInputAction: TextInputAction.search,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () => _search(_controller.text),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [kPrimary, Color(0xFFc45e1e)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Text('Find',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Results view ──────────────────────────────────────────────────────────

  Widget _resultsView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      children: [
                        const TextSpan(text: 'Found '),
                        TextSpan(text: '${_recipes.length}',
                            style: const TextStyle(color: kPrimary)),
                        const TextSpan(text: ' Recipes'),
                      ],
                    ),
                  ),
                  Text('for "${_controller.text}"',
                      style: const TextStyle(color: kTextSecondary, fontSize: 13)),
                ],
              ),
              GestureDetector(
                onTap: _clearSearch,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(20)),
                  child: const Text('✕ Clear', style: TextStyle(color: Colors.white, fontSize: 14)),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _recipes.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('🍽️', style: TextStyle(fontSize: 60)),
                      SizedBox(height: 16),
                      Text('No recipes found',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      SizedBox(height: 8),
                      Text('Try different ingredients',
                          style: TextStyle(color: kTextSecondary, fontSize: 14)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _recipes.length,
                  itemBuilder: (_, i) => RecipeCard(
                    recipe: _recipes[i],
                    onPress: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => RecipeDetailScreen(recipe: _recipes[i]),
                      ),
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _loadingSections) {
      return const DancingChefLoader(message: 'Loading delicious recipes...');
    }

    return Scaffold(
      backgroundColor: kBackground,
      body: SafeArea(
        child: _showResults
            ? _resultsView()
            : RefreshIndicator(
                onRefresh: _onRefresh,
                color: kPrimary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Hero search
                      _heroCard(),

                      // Database-driven sections
                      ..._sections.map((section) => _buildDatabaseSection(section)),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildDatabaseSection(Map<String, dynamic> section) {
    final recipes = (section['recipes'] as List?)
        ?.map((r) => Recipe.fromJson(r as Map<String, dynamic>))
        .toList() ?? [];

    if (recipes.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  section['title'] ?? '',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _getSectionSubtitle(section['slug'] ?? ''),
                  style: const TextStyle(color: kTextSecondary, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: recipes.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => _buildRecipeCard(recipes[i]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecipeCard(Recipe recipe) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => RecipeDetailScreen(recipe: recipe),
        ),
      ),
      child: Container(
        width: 180,
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  Image.network(
                    recipe.image,
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 120,
                      color: kBorder,
                      child: const Icon(Icons.restaurant, color: kTextSecondary, size: 40),
                    ),
                  ),
                  if (recipe.readyInMinutes != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '⏱ ${recipe.readyInMinutes}m',
                          style: const TextStyle(color: Colors.white, fontSize: 11),
                        ),
                      ),
                    ),
                  if (recipe.rating != null && recipe.rating! > 0)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: kPrimary.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '⭐ ${recipe.rating!.toStringAsFixed(1)}',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      recipe.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    if (recipe.cuisines != null && recipe.cuisines!.isNotEmpty)
                      Row(
                        children: [
                          const Text('🌍', style: TextStyle(fontSize: 12)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              recipe.cuisines!.first,
                              style: const TextStyle(color: kPrimary, fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    if (recipe.servings != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          '👥 ${recipe.servings} servings',
                          style: const TextStyle(color: kTextSecondary, fontSize: 10),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getSectionSubtitle(String slug) {
    final subtitles = {
      'trending-now': 'Most popular recipes right now',
      'quick-bites': 'Ready in 30 minutes or less',
      'world-cuisines': 'Explore flavors from around the globe',
      'healthy-heroes': 'Nutritious and delicious meals',
      'dessert-paradise': 'Sweet treats for every occasion',
      'comfort-food': 'Soul-warming classics',
      'breakfast-club': 'Start your day right',
      'vegan-vibes': 'Plant-based perfection',
      'italian-classics': 'Authentic Italian favorites',
    };
    return subtitles[slug] ?? 'Delicious recipes curated for you';
  }

                      // Section 10: Breakfast Club
                      _hSection(
                        title: '☀️ Breakfast Club',
                        subtitle: 'Start your day right',
                        data: kBreakfastClub,
                        cardBuilder: (item) => ContentCard(
                          item: item,
                          labelKey: 'type',
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 11: Vegan Vibes
                      _hSection(
                        title: '🌱 Vegan Vibes',
                        subtitle: '100% plant-based',
                        data: kVeganVibes,
                        cardBuilder: (item) => ContentCard(
                          item: item,
                          labelKey: 'diet',
                          width: 160,
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 12: Drinks & Cocktails
                      _hSection(
                        title: '🍸 Drinks & Cocktails',
                        subtitle: 'Raise your glass',
                        data: kDrinksCocktails,
                        cardBuilder: (item) => ContentCard(
                          item: item,
                          labelKey: 'type',
                          width: 160,
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 13: Budget Meals
                      _hSection(
                        title: '💰 Budget Meals',
                        subtitle: 'Delicious on a dime',
                        data: kBudgetMeals,
                        cardBuilder: (item) => ContentCard(
                          item: item,
                          labelKey: 'cost',
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 14: Kids' Favorites
                      _hSection(
                        title: "👶 Kids' Favorites",
                        subtitle: 'Fun for little ones',
                        data: kKidsFavorites,
                        cardBuilder: (item) => OverlayCard(
                          item: item,
                          labelKey: 'kids',
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 15: Pro Cooking Tips
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SectionHeader(
                              title: '💡 Pro Cooking Tips',
                              subtitle: 'Level up your skills',
                              seeAll: false,
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              height: 50,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: kCookingTips.length,
                                itemBuilder: (_, i) => TipCard(item: kCookingTips[i]),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
