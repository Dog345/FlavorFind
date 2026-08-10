import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../models/recipe.dart';
import '../services/api_service.dart';
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

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) return;
    
    setState(() {
      _loading = true;
      _showResults = true;
    });

    try {
      final ingredients = query.split(',').map((e) => e.trim()).toList();
      final recipes = await ApiService.searchByIngredientsDB(ingredients);
      if (mounted) {
        setState(() {
          _recipes = recipes;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _loading = false; });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Search error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _clearSearch() {
    setState(() {
      _showResults = false;
      _recipes = [];
      _controller.clear();
    });
  }

  Future<void> _onRefresh() async {
    await _loadSections();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _loadingSections) {
      return const Scaffold(
        backgroundColor: kBackground,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('🍳', style: TextStyle(fontSize: 60)),
              SizedBox(height: 20),
              Text('Loading delicious recipes...', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
        ),
      );
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
                      _heroCard(),
                      ..._sections.map((section) => _buildDatabaseSection(section)),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _heroCard() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🍽️ Flavor Find',
              style: TextStyle(color: kPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Discover Amazing Recipes',
              style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
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
                ],
              ),
            ),
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
                    if (recipe.servings != null)
                      Text(
                        '👥 ${recipe.servings} servings',
                        style: const TextStyle(color: kTextSecondary, fontSize: 10),
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
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.8,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: _recipes.length,
                  itemBuilder: (_, i) => _buildRecipeCard(_recipes[i]),
                ),
        ),
      ],
    );
  }
}
