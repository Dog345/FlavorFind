import 'package:flutter/material.dart';
import '../core/theme.dart';

class DancingChefLoader extends StatefulWidget {
  final String message;
  const DancingChefLoader({super.key, this.message = 'Finding delicious recipes...'});

  @override
  State<DancingChefLoader> createState() => _DancingChefLoaderState();
}

class _DancingChefLoaderState extends State<DancingChefLoader>
    with TickerProviderStateMixin {
  late AnimationController _bounceController;
  late AnimationController _rotateController;
  late AnimationController _fadeController;
  late Animation<double> _bounceAnim;
  late Animation<double> _rotateAnim;
  late Animation<double> _fadeAnim;

  final List<String> _foodEmojis = ['🍕', '🍜', '🥗', '🍔', '🌮', '🍣'];
  int _emojiIndex = 0;

  @override
  void initState() {
    super.initState();

    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _rotateController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _bounceAnim = Tween<double>(begin: 0, end: -20).animate(
      CurvedAnimation(parent: _bounceController, curve: Curves.easeInOut),
    );

    _rotateAnim = Tween<double>(begin: -0.15, end: 0.15).animate(
      CurvedAnimation(parent: _rotateController, curve: Curves.easeInOut),
    );

    _fadeAnim = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );

    // Cycle through food emojis
    _bounceController.addListener(() {
      if (_bounceController.status == AnimationStatus.completed) {
        setState(() {
          _emojiIndex = (_emojiIndex + 1) % _foodEmojis.length;
        });
      }
    });
  }

  @override
  void dispose() {
    _bounceController.dispose();
    _rotateController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Chef hat bouncing
            AnimatedBuilder(
              animation: Listenable.merge([_bounceAnim, _rotateAnim]),
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, _bounceAnim.value),
                  child: Transform.rotate(
                    angle: _rotateAnim.value,
                    child: const Text('👨‍🍳', style: TextStyle(fontSize: 72)),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            // Food emoji cycling
            Text(_foodEmojis[_emojiIndex], style: const TextStyle(fontSize: 36)),
            const SizedBox(height: 24),
            // Message
            FadeTransition(
              opacity: _fadeAnim,
              child: Text(
                widget.message,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Dots indicator
            AnimatedBuilder(
              animation: _fadeAnim,
              builder: (context, child) {
                return Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(3, (i) {
                    final delay = i * 0.33;
                    final opacity = (((_fadeController.value + delay) % 1.0));
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: kPrimary.withValues(alpha: opacity.clamp(0.2, 1.0)),
                        shape: BoxShape.circle,
                      ),
                    );
                  }),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
