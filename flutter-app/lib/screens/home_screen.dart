import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/home_data.dart';
import '../models/recipe.dart';
import '../services/api_service.dart';
import '../widgets/recipe_card.dart';
import '../widgets/dancing_chef_loader.dart';
import '../widgets/home_cards.dart';
import 'recipe_detail_screen.dart';
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
  List<Recipe> _recipes = [];
  // ignore: unused_field
  bool _refreshing = false;

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
    setState(() { _refreshing = true; });
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) setState(() { _refreshing = false; });
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

  // ── Horizontal scroll section ─────────────────────────────────────────────

  Widget _hSection({
    required String title,
    String? subtitle,
    required List<Map<String, dynamic>> data,
    required Widget Function(Map<String, dynamic>) cardBuilder,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title, subtitle: subtitle),
          const SizedBox(height: 12),
          SizedBox(
            height: _sectionHeight(title),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: data.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => cardBuilder(data[i]),
            ),
          ),
        ],
      ),
    );
  }

  double _sectionHeight(String title) {
    if (title.contains('Trending')) { return 200; }
    if (title.contains('Chef') || title.contains('Date')) { return 180; }
    if (title.contains('Seasonal') || title.contains('Dessert') ||
        title.contains('Comfort') || title.contains('Kids')) { return 160; }
    return 190;
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
    if (_loading) {
      return const DancingChefLoader(message: 'Finding delicious recipes...');
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

                      // Section 1: Trending Now
                      _hSection(
                        title: '🔥 Trending Now',
                        subtitle: 'Most popular this week',
                        data: kTrendingNow,
                        cardBuilder: (item) => TrendingCard(
                          item: item,
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 2: Quick Bites
                      _hSection(
                        title: '⚡ Quick Bites',
                        subtitle: 'Ready in under 5 minutes',
                        data: kQuickBites,
                        cardBuilder: (item) => QuickBiteCard(
                          item: item,
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 3: World Cuisines (grid)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SectionHeader(
                              title: '🌍 World Cuisines',
                              subtitle: 'Explore global flavors',
                              seeAll: false,
                            ),
                            const SizedBox(height: 12),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Wrap(
                                spacing: 4,
                                runSpacing: 8,
                                children: kWorldCuisines.map((item) => CuisineCircle(
                                  item: item,
                                  onPress: () => _search(item['ingredients'] as String),
                                )).toList(),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Section 4: Seasonal Spotlight
                      _hSection(
                        title: '🌱 Seasonal Spotlight',
                        subtitle: "What's fresh right now",
                        data: kSeasonalSpotlight,
                        cardBuilder: (item) => SeasonalCard(
                          item: item,
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 5: Chef's Signature
                      _hSection(
                        title: "👨‍🍳 Chef's Signature",
                        subtitle: 'Masterchef creations',
                        data: kChefSignature,
                        cardBuilder: (item) => ChefCard(
                          item: item,
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 6: Healthy Heroes
                      _hSection(
                        title: '🥗 Healthy Heroes',
                        subtitle: 'Under 500 calories',
                        data: kHealthyHeroes,
                        cardBuilder: (item) => HealthCard(
                          item: item,
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 7: Dessert Paradise
                      _hSection(
                        title: '🍰 Dessert Paradise',
                        subtitle: 'Sweet indulgence',
                        data: kDessertParadise,
                        cardBuilder: (item) => OverlayCard(
                          item: item,
                          labelKey: 'difficulty',
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 8: Comfort Food
                      _hSection(
                        title: '😌 Comfort Food',
                        subtitle: 'Warm your soul',
                        data: kComfortFood,
                        cardBuilder: (item) => OverlayCard(
                          item: item,
                          labelKey: 'mood',
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

                      // Section 9: Date Night
                      _hSection(
                        title: '💕 Date Night',
                        subtitle: 'Impress someone special',
                        data: kDateNight,
                        cardBuilder: (item) => OverlayCard(
                          item: item,
                          labelKey: 'occasion',
                          width: 220,
                          height: 160,
                          overlayColor: kPrimary.withValues(alpha: 0.9),
                          onPress: () => _search(item['ingredients'] as String),
                        ),
                      ),

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
