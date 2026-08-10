import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/theme.dart';
import '../models/recipe.dart';
import '../services/api_service.dart';
import '../widgets/recipe_card.dart';
import '../widgets/dancing_chef_loader.dart';
import 'recipe_detail_screen.dart';

// ── Coming Soon Modal ─────────────────────────────────────────────────────────

class _ComingSoonModal extends StatefulWidget {
  final String categoryName;
  final VoidCallback onClose;
  const _ComingSoonModal({required this.categoryName, required this.onClose});

  @override
  State<_ComingSoonModal> createState() => _ComingSoonModalState();
}

class _ComingSoonModalState extends State<_ComingSoonModal>
    with TickerProviderStateMixin {
  late AnimationController _spinCtrl;
  late AnimationController _bounceCtrl;
  late AnimationController _fadeCtrl;
  late Animation<double> _spinAnim;
  late Animation<double> _bounceAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _spinCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 3))
      ..repeat();
    _bounceCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500))
      ..repeat(reverse: true);
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..repeat(reverse: true);
    _spinAnim = Tween<double>(begin: 0, end: 1).animate(_spinCtrl);
    _bounceAnim = Tween<double>(begin: 0, end: -15).animate(
      CurvedAnimation(parent: _bounceCtrl, curve: Curves.easeInOut),
    );
    _fadeAnim = Tween<double>(begin: 0.2, end: 1.0).animate(_fadeCtrl);
  }

  @override
  void dispose() {
    _spinCtrl.dispose();
    _bounceCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [kPrimary, Color(0xFFb55d2f)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(32),
        ),
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animated emojis row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedBuilder(
                  animation: _spinAnim,
                  builder: (_, __) => Transform.rotate(
                    angle: _spinAnim.value * 2 * 3.14159,
                    child: const Text('👨‍🍳', style: TextStyle(fontSize: 48)),
                  ),
                ),
                const SizedBox(width: 12),
                AnimatedBuilder(
                  animation: _bounceAnim,
                  builder: (_, __) => Transform.translate(
                    offset: Offset(0, _bounceAnim.value),
                    child: const Text('🍳', style: TextStyle(fontSize: 40)),
                  ),
                ),
                const SizedBox(width: 12),
                AnimatedBuilder(
                  animation: _fadeAnim,
                  builder: (_, __) => Opacity(
                    opacity: _fadeAnim.value,
                    child: const Text('✨', style: TextStyle(fontSize: 36)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Coming Soon!',
                style: TextStyle(
                    color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(widget.categoryName,
                style: const TextStyle(
                    color: Colors.white70, fontSize: 16, fontStyle: FontStyle.italic),
                textAlign: TextAlign.center),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(color: Colors.white30),
            ),
            const Text(
              "We're working with local chefs to bring you authentic recipes from this region.",
              style: TextStyle(color: Colors.white70, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ...[
              ('👩‍🍳', 'Traditional recipes'),
              ('📖', 'Cultural stories'),
              ('🎥', 'Cooking videos'),
            ].map((f) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(children: [
                    Text(f.$1, style: const TextStyle(fontSize: 22)),
                    const SizedBox(width: 12),
                    Text(f.$2,
                        style: const TextStyle(color: Colors.white, fontSize: 14)),
                  ]),
                )),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: widget.onClose,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: const Text('Notify Me When Ready',
                    style: TextStyle(
                        color: kPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 12),
            const Text("We'll notify you as soon as it's available!",
                style: TextStyle(color: Colors.white54, fontSize: 11,
                    fontStyle: FontStyle.italic)),
          ],
        ),
      ),
    );
  }
}

// ── Category card data ────────────────────────────────────────────────────────

class _CatItem {
  final String id;
  final String name;
  final String icon;
  final List<Color> gradient;
  final String? apiValue; // null = coming soon
  final String description;

  const _CatItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.gradient,
    this.apiValue,
    required this.description,
  });
}

const _kCuisines = [
  _CatItem(id: 'italian', name: 'Italian', icon: '🇮🇹', apiValue: 'Italian',
      gradient: [Color(0xFFe87a3d), Color(0xFFb55d2f)],
      description: 'Pasta, pizza & more'),
  _CatItem(id: 'asian', name: 'Asian', icon: '🥢', apiValue: 'Asian',
      gradient: [Color(0xFFe83d8c), Color(0xFFb02f6f)],
      description: 'Flavors of the East'),
  _CatItem(id: 'mexican', name: 'Mexican', icon: '🇲🇽', apiValue: 'Mexican',
      gradient: [Color(0xFFe83d3d), Color(0xFFb02f2f)],
      description: 'Bold & spicy'),
  _CatItem(id: 'indian', name: 'Indian', icon: '🇮🇳', apiValue: 'Indian',
      gradient: [Color(0xFFe8a63d), Color(0xFFb57f2f)],
      description: 'Rich spices & curries'),
  _CatItem(id: 'mediterranean', name: 'Mediterranean', icon: '🫒', apiValue: 'Mediterranean',
      gradient: [Color(0xFF3d9ee8), Color(0xFF2d6fa3)],
      description: 'Fresh & healthy'),
  _CatItem(id: 'french', name: 'French', icon: '🇫🇷', apiValue: 'French',
      gradient: [Color(0xFF4ade80), Color(0xFF2d9e5a)],
      description: 'Classic elegance'),
  _CatItem(id: 'japanese', name: 'Japanese', icon: '🇯🇵', apiValue: 'Japanese',
      gradient: [Color(0xFFe83d5e), Color(0xFFb02f45)],
      description: 'Precision & umami'),
  _CatItem(id: 'chinese', name: 'Chinese', icon: '🇨🇳', apiValue: 'Chinese',
      gradient: [Color(0xFFe8e83d), Color(0xFFc9b02a)],
      description: 'Wok-fired wonders'),
  _CatItem(id: 'greek', name: 'Greek', icon: '🇬🇷', apiValue: 'Greek',
      gradient: [Color(0xFF3de8b0), Color(0xFF2da37a)],
      description: 'Olive oil & herbs'),
  _CatItem(id: 'thai', name: 'Thai', icon: '🇹🇭', apiValue: 'Thai',
      gradient: [Color(0xFF3de87a), Color(0xFF2da357)],
      description: 'Sweet, sour & spicy'),
  _CatItem(id: 'middle-eastern', name: 'Middle Eastern', icon: '🕌', apiValue: 'Middle Eastern',
      gradient: [Color(0xFFe88a3d), Color(0xFFb5672f)],
      description: 'Aromatic & hearty'),
  _CatItem(id: 'african', name: 'African', icon: '🌍',
      gradient: [Color(0xFFe87a3d), Color(0xFFb55d2f)],
      description: 'Coming soon'),
  _CatItem(id: 'korean', name: 'Korean', icon: '🇰🇷', apiValue: 'Korean',
      gradient: [Color(0xFFe83d5e), Color(0xFFb02f45)],
      description: 'K-food sensation'),
  _CatItem(id: 'american', name: 'American', icon: '🇺🇸', apiValue: 'American',
      gradient: [Color(0xFF3d9ee8), Color(0xFF2d6fa3)],
      description: 'Comfort classics'),
];

const _kDiets = [
  _CatItem(id: 'vegetarian', name: 'Vegetarian', icon: '🥗', apiValue: 'vegetarian',
      gradient: [Color(0xFF4ade80), Color(0xFF2d9e5a)],
      description: 'Plant-powered goodness'),
  _CatItem(id: 'vegan', name: 'Vegan', icon: '🌱', apiValue: 'vegan',
      gradient: [Color(0xFF3de87a), Color(0xFF2da357)],
      description: '100% plant-based'),
  _CatItem(id: 'gluten-free', name: 'Gluten Free', icon: '🌾', apiValue: 'gluten free',
      gradient: [Color(0xFFe8a63d), Color(0xFFb57f2f)],
      description: 'No gluten, full flavor'),
  _CatItem(id: 'ketogenic', name: 'Keto', icon: '🥑', apiValue: 'ketogenic',
      gradient: [Color(0xFFe87a3d), Color(0xFFb55d2f)],
      description: 'Low carb, high fat'),
  _CatItem(id: 'paleo', name: 'Paleo', icon: '🦴', apiValue: 'paleo',
      gradient: [Color(0xFFe8e83d), Color(0xFFc9b02a)],
      description: 'Back to basics'),
  _CatItem(id: 'dairy-free', name: 'Dairy Free', icon: '🥛', apiValue: 'dairy free',
      gradient: [Color(0xFF3d9ee8), Color(0xFF2d6fa3)],
      description: 'No dairy, all delicious'),
  _CatItem(id: 'low-fodmap', name: 'Low-FODMAP', icon: '🫁',
      gradient: [Color(0xFFe83d8c), Color(0xFFb02f6f)],
      description: 'Coming soon'),
  _CatItem(id: 'whole30', name: 'Whole30', icon: '💪',
      gradient: [Color(0xFF4ade80), Color(0xFF2d9e5a)],
      description: 'Coming soon'),
];

const _kMealTypes = [
  _CatItem(id: 'main-course', name: 'Main Course', icon: '🍽️', apiValue: 'main course',
      gradient: [Color(0xFFe87a3d), Color(0xFFb55d2f)],
      description: 'Hearty mains'),
  _CatItem(id: 'breakfast', name: 'Breakfast', icon: '☀️', apiValue: 'breakfast',
      gradient: [Color(0xFFe8e83d), Color(0xFFc9b02a)],
      description: 'Start your day right'),
  _CatItem(id: 'dessert', name: 'Dessert', icon: '🍰', apiValue: 'dessert',
      gradient: [Color(0xFFe83d8c), Color(0xFFb02f6f)],
      description: 'Sweet indulgence'),
  _CatItem(id: 'appetizer', name: 'Appetizer', icon: '🥗', apiValue: 'appetizer',
      gradient: [Color(0xFF4ade80), Color(0xFF2d9e5a)],
      description: 'Start the meal right'),
  _CatItem(id: 'soup', name: 'Soup', icon: '🥣', apiValue: 'soup',
      gradient: [Color(0xFF3d9ee8), Color(0xFF2d6fa3)],
      description: 'Warm your soul'),
  _CatItem(id: 'salad', name: 'Salad', icon: '🥙', apiValue: 'salad',
      gradient: [Color(0xFF3de87a), Color(0xFF2da357)],
      description: 'Fresh & crisp'),
  _CatItem(id: 'snack', name: 'Snack', icon: '🍿', apiValue: 'snack',
      gradient: [Color(0xFFe8a63d), Color(0xFFb57f2f)],
      description: 'Bite-sized bites'),
  _CatItem(id: 'drink', name: 'Drinks', icon: '🍹', apiValue: 'drink',
      gradient: [Color(0xFFe83d5e), Color(0xFFb02f45)],
      description: 'Sip & enjoy'),
  _CatItem(id: 'bread', name: 'Bread', icon: '🍞', apiValue: 'bread',
      gradient: [Color(0xFFe8e83d), Color(0xFFc9b02a)],
      description: 'Baked fresh'),
  _CatItem(id: 'sauce', name: 'Sauce', icon: '🫙',
      gradient: [Color(0xFFe87a3d), Color(0xFFb55d2f)],
      description: 'Coming soon'),
];

// ── Single category card widget ───────────────────────────────────────────────

class _CategoryCard extends StatelessWidget {
  final _CatItem item;
  final VoidCallback onTap;

  const _CategoryCard({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isAvailable = item.apiValue != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: item.gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(item.icon, style: const TextStyle(fontSize: 32)),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.name,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(item.description,
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 10),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ],
              ),
            ),
            if (!isAvailable)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('🔒',
                      style: TextStyle(fontSize: 10)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Results header ────────────────────────────────────────────────────────────

class _ResultsHeader extends StatelessWidget {
  final _CatItem category;
  final int count;
  final VoidCallback onBack;

  const _ResultsHeader(
      {required this.category, required this.count, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: category.gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: onBack,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Text(category.icon, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(category.name,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold)),
                Text('$count recipes found',
                    style: const TextStyle(color: Colors.white70, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── CategoriesScreen ──────────────────────────────────────────────────────────

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  bool _loading = false;
  bool _showResults = false;
  _CatItem? _activeCategory;
  List<Recipe> _recipes = [];
  bool _comingSoonVisible = false;
  String _comingSoonName = '';

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchCategory(_CatItem item) async {
    if (item.apiValue == null) {
      setState(() {
        _comingSoonName = item.name;
        _comingSoonVisible = true;
      });
      return;
    }
    setState(() {
      _loading = true;
      _activeCategory = item;
    });

    try {
      List<Recipe> results;
      final tabIndex = _tabCtrl.index;
      if (tabIndex == 0) {
        results = await ApiService.byCuisine(item.apiValue!);
      } else if (tabIndex == 1) {
        results = await ApiService.byDiet(item.apiValue!);
      } else {
        results = await ApiService.byType(item.apiValue!);
      }
      setState(() {
        _recipes = results;
        _showResults = true;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Error loading recipes: $e'),
              backgroundColor: Colors.red),
        );
        setState(() => _activeCategory = null);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goBack() {
    setState(() {
      _showResults = false;
      _activeCategory = null;
      _recipes = [];
    });
  }

  Widget _grid(List<_CatItem> items) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.1,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) => _CategoryCard(
        item: items[i],
        onTap: () => _fetchCategory(items[i]),
      ),
    );
  }

  Widget _resultsView() {
    return Column(
      children: [
        _ResultsHeader(
          category: _activeCategory!,
          count: _recipes.length,
          onBack: _goBack,
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
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold)),
                      SizedBox(height: 8),
                      Text('Try a different category',
                          style: TextStyle(
                              color: kTextSecondary, fontSize: 14)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
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
      return DancingChefLoader(
          message:
              'Loading ${_activeCategory?.name ?? 'recipes'}...');
    }

    return Scaffold(
      backgroundColor: kBackground,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                // Header
                if (!_showResults)
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('🗂️ Categories',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        const Text('Browse recipes by cuisine, diet, or meal type',
                            style: TextStyle(
                                color: kTextSecondary, fontSize: 13)),
                        const SizedBox(height: 16),
                        // TabBar
                        Container(
                          decoration: BoxDecoration(
                            color: kCard,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: TabBar(
                            controller: _tabCtrl,
                            indicator: BoxDecoration(
                              gradient: const LinearGradient(
                                  colors: [kPrimary, Color(0xFFc45e1e)]),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            indicatorSize: TabBarIndicatorSize.tab,
                            dividerColor: Colors.transparent,
                            labelColor: Colors.white,
                            unselectedLabelColor: kTextSecondary,
                            labelStyle: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600),
                            tabs: const [
                              Tab(text: '🌍 Cuisines'),
                              Tab(text: '🥗 Diets'),
                              Tab(text: '🍽️ Meals'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),

                // Content
                Expanded(
                  child: _showResults
                      ? _resultsView()
                      : TabBarView(
                          controller: _tabCtrl,
                          children: [
                            _grid(_kCuisines),
                            _grid(_kDiets),
                            _grid(_kMealTypes),
                          ],
                        ),
                ),
              ],
            ),

            // Coming Soon Modal overlay
            if (_comingSoonVisible)
              GestureDetector(
                onTap: () => setState(() => _comingSoonVisible = false),
                child: Container(
                  color: Colors.black.withValues(alpha: 0.75),
                  child: Center(
                    child: GestureDetector(
                      onTap: () {}, // prevent dismiss on card tap
                      child: _ComingSoonModal(
                        categoryName: _comingSoonName,
                        onClose: () =>
                            setState(() => _comingSoonVisible = false),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
