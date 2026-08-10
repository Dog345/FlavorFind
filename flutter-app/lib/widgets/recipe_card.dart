import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/theme.dart';
import '../models/recipe.dart';

class RecipeCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback? onPress;

  const RecipeCard({super.key, required this.recipe, this.onPress});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPress,
      child: Container(
        height: 120,
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(12),
        ),
        clipBehavior: Clip.hardEdge,
        child: Row(
          children: [
            // Image
            SizedBox(
              width: 100,
              height: 120,
              child: CachedNetworkImage(
                imageUrl: recipe.image.isNotEmpty
                    ? recipe.image
                    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(color: kBorder),
                errorWidget: (context, url, error) =>
                    Container(color: kBorder, child: const Icon(Icons.broken_image, color: kTextSecondary)),
              ),
            ),
            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      recipe.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    if (recipe.usedIngredients.isNotEmpty) ...[
                      const Text('You have:', style: TextStyle(color: kTextSecondary, fontSize: 10)),
                      const SizedBox(height: 2),
                      Wrap(
                        spacing: 4,
                        runSpacing: 2,
                        children: recipe.usedIngredients.take(2).map((ing) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1a4731),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(ing.name,
                                style: const TextStyle(color: Color(0xFF4ade80), fontSize: 9)),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 4),
                    ],
                    if (recipe.missedIngredients.isNotEmpty) ...[
                      const Text('Missing:', style: TextStyle(color: kTextSecondary, fontSize: 10)),
                      const SizedBox(height: 2),
                      Wrap(
                        spacing: 4,
                        runSpacing: 2,
                        children: [
                          ...recipe.missedIngredients.take(2).map((ing) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: kBorder,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(ing.name,
                                  style: const TextStyle(color: kTextSecondary, fontSize: 9)),
                            );
                          }),
                          if (recipe.missedIngredients.length > 2)
                            Text('+${recipe.missedIngredients.length - 2} more',
                                style: const TextStyle(color: kTextSecondary, fontSize: 9)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
