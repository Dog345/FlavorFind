import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/theme.dart';

// ── Shared helpers ──────────────────────────────────────────────────────────

Widget _netImage(String url, {double? width, double? height, BoxFit fit = BoxFit.cover}) =>
    CachedNetworkImage(
      imageUrl: url,
      width: width,
      height: height,
      fit: fit,
      placeholder: (_, __) => Container(color: kBorder),
      errorWidget: (_, __, ___) => Container(color: kBorder, child: const Icon(Icons.broken_image, color: kTextSecondary)),
    );

Widget _gradientOverlay({required Widget child, required List<Color> colors}) =>
    Stack(children: [
      child,
      Positioned.fill(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: colors,
            ),
          ),
        ),
      ),
    ]);

// ── Section Header ───────────────────────────────────────────────────────────

class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool seeAll;
  final VoidCallback? onSeeAll;

  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.seeAll = true,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                      color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              if (subtitle != null)
                Text(subtitle!,
                    style: const TextStyle(color: kTextSecondary, fontSize: 12)),
            ],
          ),
          if (seeAll)
            GestureDetector(
              onTap: onSeeAll,
              child: const Text('See All →',
                  style: TextStyle(color: kPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
    );
  }
}

// ── Trending Card ─────────────────────────────────────────────────────────────

class TrendingCard extends StatefulWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  const TrendingCard({super.key, required this.item, required this.onPress});

  @override
  State<TrendingCard> createState() => _TrendingCardState();
}

class _TrendingCardState extends State<TrendingCard> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 120));
    _scale = Tween<double>(begin: 1, end: 0.95).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) { _ctrl.reverse(); widget.onPress(); },
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: SizedBox(
            width: 260,
            height: 200,
            child: Stack(
              fit: StackFit.expand,
              children: [
                _netImage(item['image'] as String),
                _gradientOverlay(
                  child: const SizedBox.expand(),
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.9)],
                ),
                Positioned(
                  top: 12, right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: kPrimary, borderRadius: BorderRadius.circular(12)),
                    child: Text('⭐ ${item['rating']}',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
                Positioned(
                  bottom: 0, left: 0, right: 0,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['title'] as String,
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('👨‍🍳 ${item['chef']}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                            Text('⏱ ${item['time']}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                        Text('❤️ ${item['likes']}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Quick Bite Card ───────────────────────────────────────────────────────────

class QuickBiteCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  const QuickBiteCard({super.key, required this.item, required this.onPress});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: Container(
        width: 180,
        decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(16)),
        clipBehavior: Clip.hardEdge,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _netImage(item['image'] as String, height: 120, width: 180),
                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['title'] as String,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('⏱ ${item['time']}', style: const TextStyle(color: kTextSecondary, fontSize: 10)),
                          Text('🔥 ${item['calories']} cal', style: const TextStyle(color: kTextSecondary, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Positioned(
              top: 8, left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: kPrimary, borderRadius: BorderRadius.circular(12)),
                child: Text(item['badge'] as String,
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Cuisine Circle ────────────────────────────────────────────────────────────

class CuisineCircle extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  const CuisineCircle({super.key, required this.item, required this.onPress});

  @override
  Widget build(BuildContext context) {
    final color = Color(item['color'] as int);
    return GestureDetector(
      onTap: onPress,
      child: Container(
        width: (MediaQuery.of(context).size.width - 48) / 5,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          children: [
            Text(item['flag'] as String, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 4),
            Text(item['name'] as String,
                style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

// ── Seasonal Card ─────────────────────────────────────────────────────────────

class SeasonalCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  const SeasonalCard({super.key, required this.item, required this.onPress});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          width: 200, height: 160,
          child: Stack(
            fit: StackFit.expand,
            children: [
              _netImage(item['image'] as String),
              _gradientOverlay(child: const SizedBox.expand(),
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.8)]),
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: kPrimary, borderRadius: BorderRadius.circular(12)),
                        child: Text(item['season'] as String,
                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 4),
                      Text(item['title'] as String,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Chef Card ─────────────────────────────────────────────────────────────────

class ChefCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  const ChefCard({super.key, required this.item, required this.onPress});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          width: 240, height: 180,
          child: Stack(
            fit: StackFit.expand,
            children: [
              _netImage(item['image'] as String),
              _gradientOverlay(child: const SizedBox.expand(),
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.9)]),
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['title'] as String,
                          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                      Text('by ${item['chef']}',
                          style: const TextStyle(color: Colors.white70, fontSize: 11)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(4)),
                            child: Text(item['difficulty'] as String,
                                style: const TextStyle(color: Colors.white, fontSize: 10)),
                          ),
                          const SizedBox(width: 8),
                          Text('⏱ ${item['time']}', style: const TextStyle(color: Colors.white, fontSize: 10)),
                          const SizedBox(width: 8),
                          Text('⭐ ${item['rating']}', style: const TextStyle(color: Colors.white, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Health Card ───────────────────────────────────────────────────────────────

class HealthCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  const HealthCard({super.key, required this.item, required this.onPress});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: Container(
        width: 200,
        decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(16)),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _netImage(item['image'] as String, height: 100, width: 200),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['title'] as String,
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('🔥 ${item['calories']} cal', style: const TextStyle(color: kTextSecondary, fontSize: 10)),
                      Text('💪 ${item['protein']}', style: const TextStyle(color: kTextSecondary, fontSize: 10)),
                      Text('⏱ ${item['time']}', style: const TextStyle(color: kTextSecondary, fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Generic Overlay Card (Dessert, Comfort, Date Night, Kids) ────────────────

class OverlayCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  final String labelKey;
  final double width;
  final double height;
  final Color overlayColor;

  const OverlayCard({
    super.key,
    required this.item,
    required this.onPress,
    required this.labelKey,
    this.width = 200,
    this.height = 160,
    this.overlayColor = Colors.transparent,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          width: width, height: height,
          child: Stack(
            fit: StackFit.expand,
            children: [
              _netImage(item['image'] as String),
              _gradientOverlay(
                child: const SizedBox.expand(),
                colors: [Colors.transparent, overlayColor == Colors.transparent
                    ? Colors.black.withValues(alpha: 0.7)
                    : overlayColor],
              ),
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (item[labelKey] != null)
                        Text(item[labelKey] as String,
                            style: const TextStyle(color: kPrimary, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(item['title'] as String,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      Text('⏱ ${item['time']}',
                          style: const TextStyle(color: Colors.white70, fontSize: 10)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Simple Content Card (Breakfast, Drink, Budget, Vegan) ────────────────────

class ContentCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onPress;
  final String labelKey;
  final double width;

  const ContentCard({
    super.key,
    required this.item,
    required this.onPress,
    required this.labelKey,
    this.width = 180,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: Container(
        width: width,
        decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(16)),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _netImage(item['image'] as String, height: 100, width: width),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item[labelKey] != null)
                    Text(item[labelKey] as String,
                        style: const TextStyle(color: kPrimary, fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(item['title'] as String,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text('⏱ ${item['time']}', style: const TextStyle(color: kTextSecondary, fontSize: 10)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Tip Card ──────────────────────────────────────────────────────────────────

class TipCard extends StatelessWidget {
  final Map<String, dynamic> item;
  const TipCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      margin: const EdgeInsets.only(right: 10),
      decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(25)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(item['emoji'] as String, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8),
          Text(item['tip'] as String, style: const TextStyle(color: Colors.white, fontSize: 13)),
        ],
      ),
    );
  }
}
