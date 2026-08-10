import 'package:dio/dio.dart';
import '../core/theme.dart';
import '../models/recipe.dart';

class ApiService {
  static final _dio = Dio(BaseOptions(
    baseUrl: kApiBase,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
  ));

  static Future<List<Recipe>> searchByIngredients(String ingredients, {int number = 12}) async {
    final r = await _dio.get('/api/recipes', queryParameters: {'ingredients': ingredients, 'number': number});
    return (r.data as List).map((e) => Recipe.fromJson(e)).toList();
  }

  static Future<List<Recipe>> searchRecipes({required Map<String, String> params}) async {
    final r = await _dio.get('/api/recipes/search', queryParameters: params);
    final results = r.data['results'] as List? ?? [];
    return results.map((e) => Recipe.fromJson(e)).toList();
  }

  static Future<List<Recipe>> randomRecipes({int number = 10, String? tags}) async {
    final r = await _dio.get('/api/recipes/random', queryParameters: {
      'number': number,
      if (tags != null) 'tags': tags,
    });
    return ((r.data['recipes'] ?? r.data) as List).map((e) => Recipe.fromJson(e)).toList();
  }

  static Future<Recipe> recipeById(int id) async {
    final r = await _dio.get('/api/recipes/$id');
    return Recipe.fromJson(r.data);
  }

  static Future<List<Map<String, dynamic>>> autocomplete(String query) async {
    final r = await _dio.get('/api/ingredients/autocomplete', queryParameters: {'query': query});
    return List<Map<String, dynamic>>.from(r.data);
  }

  static Future<Map<String, dynamic>> health() async {
    final r = await _dio.get('/api/health');
    return Map<String, dynamic>.from(r.data);
  }

  static Future<Map<String, dynamic>> categories() async {
    final r = await _dio.get('/api/categories');
    return Map<String, dynamic>.from(r.data);
  }

  static Future<List<Recipe>> byCuisine(String cuisine, {int number = 12}) async {
    final r = await _dio.get('/api/categories/cuisine/$cuisine', queryParameters: {'number': number});
    final results = r.data['results'] as List? ?? [];
    return results.map((e) => Recipe.fromJson(e)).toList();
  }

  static Future<List<Recipe>> byDiet(String diet, {int number = 12}) async {
    final r = await _dio.get('/api/categories/diet/$diet', queryParameters: {'number': number});
    final results = r.data['results'] as List? ?? [];
    return results.map((e) => Recipe.fromJson(e)).toList();
  }

  static Future<List<Recipe>> byType(String type, {int number = 12}) async {
    final r = await _dio.get('/api/categories/type/$type', queryParameters: {'number': number});
    final results = r.data['results'] as List? ?? [];
    return results.map((e) => Recipe.fromJson(e)).toList();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATABASE ENDPOINTS (Supabase via Laravel)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Get all home sections with recipes from database
  static Future<List<Map<String, dynamic>>> getSections() async {
    final r = await _dio.get('/api/sections');
    return List<Map<String, dynamic>>.from(r.data['data'] ?? []);
  }

  /// Get all ingredient categories with ingredients from database
  static Future<List<Map<String, dynamic>>> getIngredientCategories() async {
    final r = await _dio.get('/api/ingredient-categories');
    return List<Map<String, dynamic>>.from(r.data['data'] ?? []);
  }

  /// Search recipes by ingredients from database
  static Future<List<Recipe>> searchByIngredientsDB(List<String> ingredients) async {
    final r = await _dio.post('/api/recipes/search-by-ingredients', data: {
      'ingredients': ingredients,
    });
    return (r.data['data'] as List? ?? []).map((e) => Recipe.fromJson(e)).toList();
  }

  /// Get recipe by ID from database
  static Future<Recipe> recipeByIdDB(int id) async {
    final r = await _dio.get('/api/recipes/db/$id');
    return Recipe.fromJson(r.data['data']);
  }
}
