import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/ingredients_data.dart';
import '../models/recipe.dart';
import '../services/api_service.dart';
import '../widgets/recipe_card.dart';
import '../widgets/dancing_chef_loader.dart';

// ── AI Camera Coming Soon Modal ──────────────────────────────────────────────

class _CameraModal extends StatefulWidget {
  final VoidCallback onClose;
  const _CameraModal({required this.onClose});

  @override
  State<_CameraModal> createState() => _CameraModalState();
}

class _CameraModalState extends State<_CameraModal> with TickerProviderStateMixin {
  late AnimationController _spinCtrl;
  late AnimationController _scaleCtrl;
  late Animation<double> _spinAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _spinCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 4))
      ..repeat();
    _scaleCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _spinAnim = Tween<double>(begin: 0, end: 1).animate(_spinCtrl);
    _scaleAnim = Tween<double>(begin: 1.0, end: 1.1)
        .animate(CurvedAnimation(parent: _scaleCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _spinCtrl.dispose();
    _scaleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF3d9ee8), Color(0xFF2d6fa3)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(32),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Spinning camera emoji
            AnimatedBuilder(
              animation: Listenable.merge([_spinAnim, _scaleAnim]),
              builder: (_, __) => Transform.rotate(
                angle: _spinAnim.value * 2 * 3.14159,
                child: Transform.scale(
                  scale: _scaleAnim.value,
                  child: const Text('📸', style: TextStyle(fontSize: 80)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('AI Camera Coming Soon!',
                style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            // Feature list
            ...[
              ('🤳', 'Snap a photo of your ingredients'),
              ('🔍', 'AI recognizes what you have'),
              ('🍳', 'Instant recipe matches'),
            ].map((f) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(children: [
                    Text(f.$1, style: const TextStyle(fontSize: 24)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(f.$2,
                          style: const TextStyle(color: Colors.white, fontSize: 14)),
                    ),
                  ]),
                )),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(30),
              ),
              child: const Text('🚧 Under Development',
                  style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: widget.onClose,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: const Text("Can't Wait! 🔥",
                    style: TextStyle(
                        color: Color(0xFF3d9ee8), fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 12),
            const Text("We're cooking up something special...",
                style: TextStyle(color: Colors.white70, fontSize: 12, fontStyle: FontStyle.italic)),
          ],
        ),
      ),
    );
  }
}

// ── Selected Ingredient Chip ──────────────────────────────────────────────────

class _SelectedChip extends StatelessWidget {
  final IngredientItem ingredient;
  final VoidCallback onRemove;
  const _SelectedChip({required this.ingredient, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: kPrimary, borderRadius: BorderRadius.circular(25)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(ingredient.emoji, style: const TextStyle(fontSize: 14)),
        const SizedBox(width: 4),
        Text(ingredient.name,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
        const SizedBox(width: 6),
        GestureDetector(
          onTap: onRemove,
          child: Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.3),
                shape: BoxShape.circle),
            child: const Icon(Icons.close, size: 12, color: Colors.white),
          ),
        ),
      ]),
    );
  }
}

// ── Category Card ─────────────────────────────────────────────────────────────

class _CategoryCard extends StatefulWidget {
  final IngredientCategory category;
  final bool expanded;
  final VoidCallback onToggle;
  final Set<String> selected;
  final ValueChanged<IngredientItem> onSelect;

  const _CategoryCard({
    required this.category,
    required this.expanded,
    required this.onToggle,
    required this.selected,
    required this.onSelect,
  });

  @override
  State<_CategoryCard> createState() => _CategoryCardState();
}

class _CategoryCardState extends State<_CategoryCard> {
  bool _showAll = false;

  @override
  Widget build(BuildContext context) {
    final cat = widget.category;
    final displayed = _showAll ? cat.ingredients : cat.ingredients.take(4).toList();
    final color1 = _hexColor(cat.gradient[0]);
    final color2 = _hexColor(cat.gradient[1]);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [color1, color2],
            begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          // Header
          GestureDetector(
            onTap: widget.onToggle,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Text(cat.icon, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(cat.name,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  Text(widget.expanded ? '▼' : '▶',
                      style: const TextStyle(color: Colors.white, fontSize: 14)),
                ],
              ),
            ),
          ),
          // Expanded content
          if (widget.expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: displayed.map((ing) {
                      final isSelected = widget.selected.contains(ing.name);
                      return GestureDetector(
                        onTap: () => widget.onSelect(ing),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Colors.white
                                : Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(25),
                            border: Border.all(
                              color: isSelected ? kPrimary : Colors.white.withValues(alpha: 0.1),
                            ),
                          ),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Text(ing.emoji, style: const TextStyle(fontSize: 14)),
                            const SizedBox(width: 6),
                            Text(ing.name,
                                style: TextStyle(
                                  color: isSelected ? kPrimary : Colors.white,
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                )),
                          ]),
                        ),
                      );
                    }).toList(),
                  ),
                  if (cat.ingredients.length > 4)
                    GestureDetector(
                      onTap: () => setState(() => _showAll = !_showAll),
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          _showAll
                              ? 'Show Less ▲'
                              : 'Show ${cat.ingredients.length - 4} More ▼',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Color _hexColor(String hex) {
    final h = hex.replaceFirst('#', '');
    return Color(int.parse('FF$h', radix: 16));
  }
}

// ── RecipesScreen ─────────────────────────────────────────────────────────────

class RecipesScreen extends StatefulWidget {
  const RecipesScreen({super.key});

  @override
  State<RecipesScreen> createState() => _RecipesScreenState();
}

class _RecipesScreenState extends State<RecipesScreen> {
  final _textCtrl = TextEditingController();
  final _expandedCategories = <String, bool>{};
  final _selectedIngredients = <IngredientItem>[];
  final _selectedNames = <String>{};

  bool _loading = false;
  bool _hasSearched = false;
  List<Recipe> _recipes = [];
  bool _cameraModal = false;

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  void _toggleCategory(String id) =>
      setState(() => _expandedCategories[id] = !(_expandedCategories[id] ?? false));

  void _toggleIngredient(IngredientItem ing) {
    setState(() {
      if (_selectedNames.contains(ing.name)) {
        _selectedNames.remove(ing.name);
        _selectedIngredients.removeWhere((i) => i.name == ing.name);
      } else {
        _selectedNames.add(ing.name);
        _selectedIngredients.add(ing);
      }
    });
  }

  void _addPopular(IngredientItem ing) {
    if (!_selectedNames.contains(ing.name)) {
      setState(() {
        _selectedNames.add(ing.name);
        _selectedIngredients.add(ing);
      });
    }
  }

  void _clearAll() {
    setState(() {
      _selectedIngredients.clear();
      _selectedNames.clear();
      _textCtrl.clear();
      _hasSearched = false;
      _recipes = [];
    });
  }

  Future<void> _search(String query) async {
    if (query.trim().isEmpty && _selectedIngredients.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please type or select some ingredients')),
      );
      return;
    }
    final q = query.trim().isNotEmpty
        ? query.trim()
        : _selectedIngredients.map((i) => i.name.toLowerCase()).join(',');
    setState(() { _loading = true; _hasSearched = true; });
    try {
      final results = await ApiService.searchByIngredients(q);
      setState(() => _recipes = results);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
        setState(() => _hasSearched = false);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _searchFromSelected() async {
    if (_selectedIngredients.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select some ingredients first')),
      );
      return;
    }
    await _search(_selectedIngredients.map((i) => i.name.toLowerCase()).join(','));
  }

  // ── Widgets ────────────────────────────────────────────────────────────────

  Widget _selectedBar() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [kCard, kBackground],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        border: Border(bottom: BorderSide(color: kBorder)),
      ),
      child: Column(children: [
        // Chips row
        SizedBox(
          height: 52,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            children: _selectedIngredients
                .map((ing) => _SelectedChip(
                      ingredient: ing,
                      onRemove: () => _toggleIngredient(ing),
                    ))
                .toList(),
          ),
        ),
        // Actions row
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Row(children: [
            Expanded(
              child: GestureDetector(
                onTap: _clearAll,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                      color: const Color(0xFF2d2d2d),
                      borderRadius: BorderRadius.circular(12)),
                  child: const Center(
                    child: Text('Clear All',
                        style: TextStyle(color: kTextSecondary, fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: GestureDetector(
                onTap: _searchFromSelected,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [kPrimary, Color(0xFFc45e1e)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Text('Find Recipes',
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12)),
                      child: Text('${_selectedIngredients.length}',
                          style: const TextStyle(color: Colors.white, fontSize: 12)),
                    ),
                  ]),
                ),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _listHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Manual search card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(20)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('🔍 Manual Search',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                  color: const Color(0xFF2d2d2d), borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text('🔍', style: TextStyle(fontSize: 16)),
                ),
                Expanded(
                  child: TextField(
                    controller: _textCtrl,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: const InputDecoration(
                      hintText: 'e.g., chicken, rice, tomatoes',
                      hintStyle: TextStyle(color: kTextSecondary),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                    ),
                    onSubmitted: _search,
                    textInputAction: TextInputAction.search,
                  ),
                ),
                ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _textCtrl,
                  builder: (_, val, __) => val.text.isNotEmpty
                      ? GestureDetector(
                          onTap: () => _textCtrl.clear(),
                          child: const Padding(
                            padding: EdgeInsets.all(12),
                            child: Text('✕', style: TextStyle(color: kTextSecondary, fontSize: 16)),
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
              ]),
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => _search(_textCtrl.text),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [kPrimary, Color(0xFFc45e1e)]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text('Search Manually',
                      style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ]),
        ),

        // OR divider
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Row(children: [
            Expanded(child: Divider(color: kBorder)),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: Text('OR', style: TextStyle(color: kTextSecondary, fontSize: 12)),
            ),
            Expanded(child: Divider(color: kBorder)),
          ]),
        ),

        // AI Camera card
        GestureDetector(
          onTap: () => setState(() => _cameraModal = true),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Color(0xFF3d9ee8), Color(0xFF2d6fa3)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(children: [
              const Text('📸', style: TextStyle(fontSize: 32)),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Snap a Photo',
                      style: TextStyle(
                          color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  Text('AI-powered ingredient recognition',
                      style: TextStyle(color: Colors.white70, fontSize: 11)),
                ]),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20)),
                child: const Text('Coming Soon',
                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 20),

        // Quick Picks
        const Text('⚡ Quick Picks',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: kPopularIngredients.map((ing) {
              final isSelected = _selectedNames.contains(ing.name);
              return GestureDetector(
                onTap: () => _addPopular(ing),
                child: Container(
                  margin: const EdgeInsets.only(right: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? kPrimary : kCard,
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(color: isSelected ? kPrimary : kBorder),
                  ),
                  child: Row(children: [
                    Text(ing.emoji, style: const TextStyle(fontSize: 16)),
                    const SizedBox(width: 6),
                    Text(ing.name,
                        style: TextStyle(
                            color: isSelected ? Colors.white : Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500)),
                  ]),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 20),

        // Categories header
        const Text('📚 Browse Categories',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        const Text('Tap ingredients to add them to your search',
            style: TextStyle(color: kTextSecondary, fontSize: 12)),
        const SizedBox(height: 12),
      ]),
    );
  }

  Widget _resultsView() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              RichText(
                text: TextSpan(
                  style: const TextStyle(
                      color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  children: [
                    const TextSpan(text: 'Found '),
                    TextSpan(text: '${_recipes.length}',
                        style: const TextStyle(color: kPrimary)),
                    const TextSpan(text: ' Recipes'),
                  ],
                ),
              ),
              Text(
                _selectedIngredients.isNotEmpty
                    ? 'with ${_selectedIngredients.length} ingredients'
                    : 'for "${_textCtrl.text}"',
                style: const TextStyle(color: kTextSecondary, fontSize: 13),
              ),
            ]),
            GestureDetector(
              onTap: _clearAll,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(20)),
                child: const Text('← New Search',
                    style: TextStyle(color: Colors.white, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
      Expanded(
        child: _recipes.isEmpty
            ? const Center(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text('🍽️', style: TextStyle(fontSize: 60)),
                  SizedBox(height: 16),
                  Text('No recipes found',
                      style: TextStyle(
                          color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('Try different ingredient combinations',
                      style: TextStyle(color: kTextSecondary, fontSize: 14)),
                ]),
              )
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _recipes.length,
                itemBuilder: (_, i) => RecipeCard(recipe: _recipes[i]),
              ),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const DancingChefLoader(message: 'Finding recipes with your ingredients...');
    }

    return Scaffold(
      backgroundColor: kBackground,
      body: SafeArea(
        child: Stack(
          children: [
            Column(children: [
              // Selected bar (always visible when ingredients selected)
              if (_selectedIngredients.isNotEmpty) _selectedBar(),
              // Main content
              Expanded(
                child: _hasSearched
                    ? _resultsView()
                    : ListView.builder(
                        itemCount: kIngredientCategories.length + 1,
                        itemBuilder: (_, i) {
                          if (i == 0) return _listHeader();
                          final cat = kIngredientCategories[i - 1];
                          return _CategoryCard(
                            category: cat,
                            expanded: _expandedCategories[cat.id] ?? false,
                            onToggle: () => _toggleCategory(cat.id),
                            selected: _selectedNames,
                            onSelect: _toggleIngredient,
                          );
                        },
                      ),
              ),
            ]),
            // Camera modal overlay
            if (_cameraModal)
              GestureDetector(
                onTap: () => setState(() => _cameraModal = false),
                child: Container(
                  color: Colors.black.withValues(alpha: 0.7),
                  child: Center(
                    child: GestureDetector(
                      onTap: () {}, // prevent dismiss on modal tap
                      child: _CameraModal(
                          onClose: () => setState(() => _cameraModal = false)),
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
