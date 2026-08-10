import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/theme.dart';
import '../models/recipe.dart';

class RecipeDetailScreen extends StatefulWidget {
  final Recipe recipe;
  const RecipeDetailScreen({super.key, required this.recipe});

  @override
  State<RecipeDetailScreen> createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends State<RecipeDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  int _servings = 2;
  bool _saved = false;
  final Set<int> _checkedSteps = {};
  final Set<String> _checkedIngredients = {};

  // Timer state
  int _timerMinutes = 0;
  int _timerSeconds = 0;
  int _timerTotal = 0;
  bool _timerRunning = false;
  Timer? _timer;
  final _timerInputCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _servings = widget.recipe.servings ?? 2;
    _checkIfSaved();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _timer?.cancel();
    _timerInputCtrl.dispose();
    super.dispose();
  }

  Future<void> _checkIfSaved() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList('saved_recipe_ids') ?? [];
    if (mounted) {
      setState(() => _saved = saved.contains(widget.recipe.id.toString()));
    }
  }

  Future<void> _toggleSave() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList('saved_recipe_ids') ?? [];
    final idStr = widget.recipe.id.toString();
    if (_saved) {
      saved.remove(idStr);
    } else {
      saved.add(idStr);
    }
    await prefs.setStringList('saved_recipe_ids', saved);
    setState(() => _saved = !_saved);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_saved ? '❤️ Recipe saved!' : 'Recipe removed from saved'),
        backgroundColor: _saved ? const Color(0xFF1a4731) : kCard,
        duration: const Duration(seconds: 2),
      ));
    }
  }

  // ── Timer logic ───────────────────────────────────────────────────────────

  void _startTimer() {
    final mins = int.tryParse(_timerInputCtrl.text) ?? 0;
    if (mins <= 0) return;
    setState(() {
      _timerTotal = mins * 60;
      _timerMinutes = mins;
      _timerSeconds = 0;
      _timerRunning = true;
    });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      final remaining = _timerTotal - t.tick;
      if (remaining <= 0) {
        t.cancel();
        setState(() {
          _timerRunning = false;
          _timerMinutes = 0;
          _timerSeconds = 0;
        });
        _showTimerDone();
      } else {
        setState(() {
          _timerMinutes = remaining ~/ 60;
          _timerSeconds = remaining % 60;
        });
      }
    });
  }

  void _pauseTimer() {
    _timer?.cancel();
    setState(() => _timerRunning = false);
  }

  void _resetTimer() {
    _timer?.cancel();
    setState(() {
      _timerRunning = false;
      _timerMinutes = 0;
      _timerSeconds = 0;
      _timerTotal = 0;
      _timerInputCtrl.clear();
    });
  }

  void _showTimerDone() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('⏰ Time\'s Up!',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Your ${widget.recipe.title} is ready!',
            style: const TextStyle(color: kTextSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: kPrimary)),
          ),
        ],
      ),
    );
  }

  // ── Scale ingredient amounts by servings ──────────────────────────────────

  String _scaleAmount(Ingredient ing) {
    final base = widget.recipe.servings ?? 2;
    if (base == 0) return ing.original;
    final scaled = ing.amount * _servings / base;
    final display = scaled == scaled.toInt()
        ? scaled.toInt().toString()
        : scaled.toStringAsFixed(1);
    return '$display ${ing.unit}'.trim();
  }

  // ── Hero image ────────────────────────────────────────────────────────────

  Widget _heroImage() {
    return Stack(
      children: [
        SizedBox(
          height: 280,
          width: double.infinity,
          child: CachedNetworkImage(
            imageUrl: widget.recipe.image.isNotEmpty
                ? widget.recipe.image
                : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(color: kCard),
            errorWidget: (_, __, ___) =>
                Container(color: kCard, child: const Icon(Icons.broken_image, color: kTextSecondary, size: 48)),
          ),
        ),
        // Gradient overlay
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  kBackground.withValues(alpha: 0.85),
                ],
              ),
            ),
          ),
        ),
        // Back button
        Positioned(
          top: 12,
          left: 12,
          child: SafeArea(
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
              ),
            ),
          ),
        ),
        // Save button
        Positioned(
          top: 12,
          right: 12,
          child: SafeArea(
            child: GestureDetector(
              onTap: _toggleSave,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _saved ? Icons.favorite : Icons.favorite_border,
                  color: _saved ? Colors.red : Colors.white,
                  size: 22,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Recipe meta row ───────────────────────────────────────────────────────

  Widget _metaRow() {
    final time = widget.recipe.readyInMinutes;
    final score = widget.recipe.spoonacularScore;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          if (time != null) ...[
            _metaChip(Icons.access_time, '$time min', kPrimary),
            const SizedBox(width: 10),
          ],
          if (score != null) ...[
            _metaChip(Icons.star, '${(score / 20).toStringAsFixed(1)}/5', const Color(0xFFe8e83d)),
            const SizedBox(width: 10),
          ],
          _metaChip(Icons.people, '$_servings servings', const Color(0xFF3d9ee8)),
        ],
      ),
    );
  }

  Widget _metaChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    );
  }

  // ── Servings adjuster ─────────────────────────────────────────────────────

  Widget _servingsAdjuster() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Servings',
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          Row(children: [
            _adjBtn(Icons.remove, () {
              if (_servings > 1) setState(() => _servings--);
            }),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('$_servings',
                  style: const TextStyle(
                      color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            ),
            _adjBtn(Icons.add, () => setState(() => _servings++)),
          ]),
        ],
      ),
    );
  }

  Widget _adjBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [kPrimary, Color(0xFFc45e1e)]),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }

  // ── Ingredients tab ───────────────────────────────────────────────────────

  Widget _ingredientsTab() {
    final ings = widget.recipe.extendedIngredients.isNotEmpty
        ? widget.recipe.extendedIngredients
        : [
            ...widget.recipe.usedIngredients,
            ...widget.recipe.missedIngredients,
          ];

    if (ings.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text('No ingredient data available',
              style: TextStyle(color: kTextSecondary, fontSize: 14)),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: ings.length,
      itemBuilder: (_, i) {
        final ing = ings[i];
        final checked = _checkedIngredients.contains(ing.name);
        return GestureDetector(
          onTap: () => setState(() {
            if (checked) {
              _checkedIngredients.remove(ing.name);
            } else {
              _checkedIngredients.add(ing.name);
            }
          }),
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: checked ? const Color(0xFF1a4731) : kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: checked ? const Color(0xFF4ade80) : kBorder,
              ),
            ),
            child: Row(children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: checked ? const Color(0xFF4ade80) : kBorder,
                  shape: BoxShape.circle,
                ),
                child: checked
                    ? const Icon(Icons.check, color: Colors.white, size: 14)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(ing.name,
                    style: TextStyle(
                      color: checked ? const Color(0xFF4ade80) : Colors.white,
                      fontSize: 14,
                      decoration: checked ? TextDecoration.lineThrough : null,
                    )),
              ),
              Text(_scaleAmount(ing),
                  style: const TextStyle(color: kTextSecondary, fontSize: 12)),
            ]),
          ),
        );
      },
    );
  }

  // ── Instructions tab ──────────────────────────────────────────────────────

  Widget _instructionsTab() {
    final instructions = widget.recipe.analyzedInstructions;
    if (instructions.isEmpty || instructions.first.steps.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text('No instructions available for this recipe',
              style: TextStyle(color: kTextSecondary, fontSize: 14)),
        ),
      );
    }

    final steps = instructions.first.steps;
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: steps.length,
      itemBuilder: (_, i) {
        final step = steps[i];
        final done = _checkedSteps.contains(step.number);
        return GestureDetector(
          onTap: () => setState(() {
            if (done) {
              _checkedSteps.remove(step.number);
            } else {
              _checkedSteps.add(step.number);
            }
          }),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: done ? const Color(0xFF1a2a1a) : kCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: done ? const Color(0xFF4ade80).withValues(alpha: 0.4) : kBorder,
              ),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: done
                      ? const LinearGradient(
                          colors: [Color(0xFF4ade80), Color(0xFF2d9e5a)])
                      : const LinearGradient(colors: [kPrimary, Color(0xFFc45e1e)]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: done
                      ? const Icon(Icons.check, color: Colors.white, size: 16)
                      : Text('${step.number}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(step.step,
                    style: TextStyle(
                      color: done ? const Color(0xFF4ade80) : Colors.white,
                      fontSize: 14,
                      height: 1.5,
                      decoration: done ? TextDecoration.lineThrough : null,
                    )),
              ),
            ]),
          ),
        );
      },
    );
  }

  // ── Cook Timer ────────────────────────────────────────────────────────────

  Widget _cookTimer() {
    final hasTime = _timerTotal > 0;
    final progress = hasTime
        ? (_timerMinutes * 60 + _timerSeconds) / _timerTotal
        : 0.0;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [
            Text('⏱️', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text('Cook Timer',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 12),
          if (!_timerRunning && _timerTotal == 0) ...[
            Row(children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: kBorder,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TextField(
                    controller: _timerInputCtrl,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 15),
                    decoration: const InputDecoration(
                      hintText: 'Minutes',
                      hintStyle: TextStyle(color: kTextSecondary),
                      border: InputBorder.none,
                      isDense: true,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: _startTimer,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [kPrimary, Color(0xFFc45e1e)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('Start',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold)),
                ),
              ),
            ]),
          ] else ...[
            // Timer display
            Center(
              child: Text(
                '${_timerMinutes.toString().padLeft(2, '0')}:${_timerSeconds.toString().padLeft(2, '0')}',
                style: const TextStyle(
                    color: kPrimary,
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 4),
              ),
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: kBorder,
              color: kPrimary,
              minHeight: 6,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 16),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              GestureDetector(
                onTap: _timerRunning ? _pauseTimer : _startTimer,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [kPrimary, Color(0xFFc45e1e)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(_timerRunning ? '⏸ Pause' : '▶ Resume',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _resetTimer,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 10),
                  decoration: BoxDecoration(
                    color: kBorder,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('↺ Reset',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold)),
                ),
              ),
            ]),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero image
            _heroImage(),

            const SizedBox(height: 12),

            // Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                widget.recipe.title,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    height: 1.3),
              ),
            ),

            const SizedBox(height: 10),

            // Meta chips
            _metaRow(),

            // Servings adjuster
            _servingsAdjuster(),

            // Tabs
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(14),
              ),
              child: TabBar(
                controller: _tabCtrl,
                indicator: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [kPrimary, Color(0xFFc45e1e)]),
                  borderRadius: BorderRadius.circular(12),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: Colors.white,
                unselectedLabelColor: kTextSecondary,
                labelStyle: const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w600),
                tabs: const [
                  Tab(text: '🧂 Ingredients'),
                  Tab(text: '📋 Instructions'),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Tab content (non-scrollable inside scroll)
            AnimatedBuilder(
              animation: _tabCtrl,
              builder: (_, __) {
                if (_tabCtrl.index == 0) {
                  return _ingredientsTab();
                } else {
                  return _instructionsTab();
                }
              },
            ),

            // Cook timer
            _cookTimer(),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
